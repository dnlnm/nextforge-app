"use server";

import { requireTenant, requireTenantRole } from "@repo/auth/authorization";
import {
  database,
  type Gender,
  type GuardianRelationship,
  type Prisma,
  type StudentStatus,
} from "@repo/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertWithinPlanLimit } from "../billing/limits";

const getString = (formData: FormData, key: string) => {
  const value = formData.get(key);

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const genders = new Set<Gender>(["MALE", "FEMALE", "OTHER"]);

const getGender = (formData: FormData, key: string) => {
  const value = getString(formData, key);

  return value && genders.has(value as Gender) ? (value as Gender) : undefined;
};

const getDate = (formData: FormData, key: string) => {
  const value = getString(formData, key);

  if (!value) {
    return undefined;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) ? undefined : date;
};

const getAddressLines = (formData: FormData, key: string) => {
  const [line1, line2] = (getString(formData, key) ?? "")
    .split(csvLineRegex)
    .map((line) => line.trim());

  return {
    addressLine1: line1 || undefined,
    addressLine2: line2 || undefined,
  };
};

const relationships = new Set<GuardianRelationship>([
  "FATHER",
  "MOTHER",
  "GUARDIAN",
  "OTHER",
]);

const csvLineRegex = /\r?\n/;
const csvDateRegex = /^\d{4}-\d{2}-\d{2}$/;

const parseCsvDate = (value: string | undefined) => {
  if (!(value && csvDateRegex.test(value))) {
    return undefined;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) ? undefined : date;
};

const formatCode = (prefix: string, sequence: number) =>
  `${prefix}${String(sequence).padStart(4, "0")}`;

// Next sequential student code is derived from the highest existing code
// (e.g. STU0007 -> 8) rather than the row count, so codes are never reused
// when students are archived or deleted, keeping them permanent.
const getNextStudentSequence = async (
  tx: Prisma.TransactionClient,
  organizationId: string
) => {
  const students = await tx.student.findMany({
    where: { organizationId },
    select: { code: true },
  });

  const maxSequence = students.reduce((max, student) => {
    const sequence = Number.parseInt(student.code.replace("STU", ""), 10);

    return Number.isNaN(sequence) ? max : Math.max(max, sequence);
  }, 0);

  return maxSequence + 1;
};

export const getNextStudentCode = async () => {
  const tenant = await requireTenant();

  return database.$transaction(async (tx) => {
    const sequence = await getNextStudentSequence(
      tx,
      tenant.organizationId
    );

    return formatCode("STU", sequence);
  });
};

const resolveLevel = async (levelId: string | undefined) => {
  const tenant = await requireTenant();

  if (!levelId) {
    return undefined;
  }

  if (levelId === "none") {
    return null;
  }

  const level = await database.level.findFirst({
    where: {
      id: levelId,
      organizationId: tenant.organizationId,
      archivedAt: null,
    },
    select: { id: true },
  });

  return level?.id ?? null;
};

export const createStudent = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const fullName = getString(formData, "fullName");
  const guardianName = getString(formData, "guardianName");

  if (!(fullName && guardianName)) {
    throw new Error("Student and guardian names are required.");
  }

  await assertWithinPlanLimit({
    organizationId: tenant.organizationId,
    resource: "students",
    userId: tenant.authUserId,
  });

  const relationship = getString(formData, "relationship") as
    | GuardianRelationship
    | undefined;
  const levelId = await resolveLevel(getString(formData, "levelId"));
  const address = getAddressLines(formData, "studentAddress");
  const sameAsStudentAddress =
    getString(formData, "sameAsStudentAddress") === "on";

  await database.$transaction(async (tx) => {
    const sequence = await getNextStudentSequence(
      tx,
      tenant.organizationId
    );
    const student = await tx.student.create({
      data: {
        organizationId: tenant.organizationId,
        fullName,
        code: formatCode("STU", sequence),
        levelId,
        dateOfBirth: getDate(formData, "dateOfBirth"),
        enrolledAt: getDate(formData, "enrolledAt") ?? new Date(),
        gender: getGender(formData, "gender"),
        phone: getString(formData, "studentPhone"),
        email: getString(formData, "studentEmail"),
        ...address,
        city: getString(formData, "city"),
        state: getString(formData, "state"),
        postcode: getString(formData, "postcode"),
        preferredName: getString(formData, "preferredName"),
        schoolName: getString(formData, "schoolName"),
        photoUrl: getString(formData, "photoUrl"),
        notes: getString(formData, "notes"),
      },
      select: { id: true },
    });

    const guardianAddress = sameAsStudentAddress
      ? address
      : getAddressLines(formData, "guardianAddress");
    const guardian = await tx.guardian.create({
      data: {
        organizationId: tenant.organizationId,
        email: getString(formData, "guardianEmail"),
        fullName: guardianName,
        phone: getString(formData, "guardianPhone"),
        ...guardianAddress,
        city: sameAsStudentAddress ? getString(formData, "city") : undefined,
        state: sameAsStudentAddress ? getString(formData, "state") : undefined,
        postcode: sameAsStudentAddress
          ? getString(formData, "postcode")
          : undefined,
      },
      select: { id: true },
    });

    await tx.studentGuardian.create({
      data: {
        guardianId: guardian.id,
        isPrimary: true,
        receivesBilling: true,
        relationship:
          relationship && relationships.has(relationship)
            ? relationship
            : "GUARDIAN",
        studentId: student.id,
      },
    });
  });

  revalidatePath("/students");
};

export const archiveStudent = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const studentId = getString(formData, "studentId");

  if (!studentId) {
    throw new Error("Student is required.");
  }

  const archivedAt = new Date();

  await database.$transaction(async (tx) => {
    await tx.student.updateMany({
      where: { id: studentId, organizationId: tenant.organizationId },
      data: { archivedAt, status: "ARCHIVED" },
    });
    await tx.enrollment.updateMany({
      where: { studentId, organizationId: tenant.organizationId },
      data: { archivedAt, status: "ARCHIVED" },
    });
  });

  revalidatePath("/students");
  revalidatePath("/classes");
  revalidatePath("/attendance");
};

export const restoreStudent = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const studentId = getString(formData, "studentId");

  if (!studentId) {
    throw new Error("Student is required.");
  }

  await database.$transaction(async (tx) => {
    const student = await tx.student.findFirst({
      where: { id: studentId, organizationId: tenant.organizationId },
      select: { id: true },
    });

    if (!student) {
      throw new Error("Student not found.");
    }

    await tx.student.update({
      where: { id: student.id },
      data: { archivedAt: null, status: "ACTIVE" },
    });

    // Restore enrollments archived with the student, skipping any class that
    // already has an active enrollment (unique per student/class/status).
    const archivedEnrollments = await tx.enrollment.findMany({
      where: {
        studentId: student.id,
        organizationId: tenant.organizationId,
        status: "ARCHIVED",
      },
      select: { id: true, classId: true },
    });
    const activeClassIds = new Set(
      (
        await tx.enrollment.findMany({
          where: {
            studentId: student.id,
            organizationId: tenant.organizationId,
            status: "ACTIVE",
          },
          select: { classId: true },
        })
      ).map((enrollment) => enrollment.classId)
    );

    await tx.enrollment.updateMany({
      where: {
        id: {
          in: archivedEnrollments
            .filter((enrollment) => !activeClassIds.has(enrollment.classId))
            .map((enrollment) => enrollment.id),
        },
        organizationId: tenant.organizationId,
      },
      data: { archivedAt: null, status: "ACTIVE" },
    });
  });

  revalidatePath("/students");
  revalidatePath("/classes");
  revalidatePath("/attendance");
};

export const deleteStudent = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const studentId = getString(formData, "studentId");

  if (!studentId) {
    throw new Error("Student is required.");
  }

  await database.$transaction(async (tx) => {
    const student = await tx.student.findFirst({
      where: { id: studentId, organizationId: tenant.organizationId },
      select: {
        id: true,
        _count: {
          select: { invoices: true, payments: true },
        },
      },
    });

    if (!student) {
      throw new Error("Student not found.");
    }

    if (student._count.invoices > 0 || student._count.payments > 0) {
      throw new Error(
        "This student has billing records and cannot be deleted. Archive instead."
      );
    }

    await tx.student.delete({
      where: { id: student.id },
    });
  });

  revalidatePath("/students");
  revalidatePath("/classes");
  revalidatePath("/attendance");
};

export const updateStudent = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const studentId = getString(formData, "studentId");
  const fullName = getString(formData, "fullName");
  const guardianId = getString(formData, "guardianId");
  const guardianName = getString(formData, "guardianName");

  if (!(studentId && fullName && guardianId && guardianName)) {
    throw new Error("Student and guardian details are required.");
  }

  const levelId = await resolveLevel(getString(formData, "levelId"));
  const address = getAddressLines(formData, "studentAddress");
  const sameAsStudentAddress =
    getString(formData, "sameAsStudentAddress") === "on";

  await database.$transaction(async (tx) => {
    await tx.student.updateMany({
      where: { id: studentId, organizationId: tenant.organizationId },
      data: {
        fullName,
        levelId,
        dateOfBirth: getDate(formData, "dateOfBirth"),
        enrolledAt: getDate(formData, "enrolledAt"),
        gender: getGender(formData, "gender"),
        phone: getString(formData, "studentPhone"),
        email: getString(formData, "studentEmail"),
        ...address,
        city: getString(formData, "city"),
        state: getString(formData, "state"),
        postcode: getString(formData, "postcode"),
        preferredName: getString(formData, "preferredName"),
        schoolName: getString(formData, "schoolName"),
        photoUrl: getString(formData, "photoUrl"),
        notes: getString(formData, "notes"),
      },
    });
    const guardianAddress = sameAsStudentAddress
      ? address
      : getAddressLines(formData, "guardianAddress");
    await tx.guardian.updateMany({
      where: { id: guardianId, organizationId: tenant.organizationId },
      data: {
        email: getString(formData, "guardianEmail"),
        fullName: guardianName,
        phone: getString(formData, "guardianPhone"),
        ...guardianAddress,
        city: sameAsStudentAddress ? getString(formData, "city") : undefined,
        state: sameAsStudentAddress ? getString(formData, "state") : undefined,
        postcode: sameAsStudentAddress
          ? getString(formData, "postcode")
          : undefined,
      },
    });
  });

  revalidatePath("/students");
  redirect(`/students/${studentId}`);
};

const parseCsvLine = (line: string) => {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const next = line[index + 1];

    if (character === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }

  cells.push(current.trim());

  return cells;
};

export const importStudents = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const file = formData.get("csv");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("CSV file is required.");
  }

  const text = await file.text();
  const [headerLine, ...dataLines] = text
    .split(csvLineRegex)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!headerLine) {
    throw new Error("CSV file is empty.");
  }

  const headers = parseCsvLine(headerLine).map((header) =>
    header.toLowerCase()
  );
  const rows = dataLines.map((line) => {
    const values = parseCsvLine(line);

    return Object.fromEntries(
      headers.map((header, index) => [header, values[index]])
    );
  });
  const importableRows = rows.filter((row) => row.fullname && row.guardianname);

  await assertWithinPlanLimit({
    increment: importableRows.length,
    organizationId: tenant.organizationId,
    resource: "students",
    userId: tenant.authUserId,
  });

  const levels = await database.level.findMany({
    where: { organizationId: tenant.organizationId, archivedAt: null },
    select: { id: true, name: true },
  });
  const levelByName = new Map(levels.map((level) => [level.name, level.id]));

  await database.$transaction(async (tx) => {
    const startSequence = await getNextStudentSequence(
      tx,
      tenant.organizationId
    );

    for (let index = 0; index < importableRows.length; index += 1) {
      const row = importableRows[index];
      const fullName = row.fullname;
      const guardianName = row.guardianname;

      const student = await tx.student.create({
        data: {
          organizationId: tenant.organizationId,
          fullName,
          code: formatCode("STU", startSequence + index),
          levelId: levelByName.get(row.academiclevel),
          enrolledAt: parseCsvDate(row.enrolledat),
          preferredName: row.preferredname,
          schoolName: row.schoolname,
        },
        select: { id: true },
      });
      const guardian = await tx.guardian.create({
        data: {
          organizationId: tenant.organizationId,
          email: row.guardianemail,
          fullName: guardianName,
          phone: row.guardianphone,
        },
        select: { id: true },
      });

      await tx.studentGuardian.create({
        data: {
          guardianId: guardian.id,
          isPrimary: true,
          receivesBilling: true,
          studentId: student.id,
        },
      });
    }
  });

  revalidatePath("/students");
};

// Types for table queries
export type StudentsQueryParams = {
  page: number;
  pageSize: number;
  search?: string;
  sorting?: Array<{ id: string; desc: boolean }>;
  filters?: Array<{ id: string; value: unknown }>;
};

// Fetch students for table with server-side pagination, filtering, and sorting
export async function getStudentsForTable(params: StudentsQueryParams) {
  const tenant = await requireTenant();

  // Build where clause
  const where: Prisma.StudentWhereInput = {
    organizationId: tenant.organizationId,
    archivedAt: null,
  };

  // Apply global search
  if (params.search) {
    where.OR = [
      { fullName: { contains: params.search, mode: "insensitive" } },
      { preferredName: { contains: params.search, mode: "insensitive" } },
      { schoolName: { contains: params.search, mode: "insensitive" } },
    ];
  }

  // Apply column filters
  if (params.filters && params.filters.length > 0) {
    for (const filter of params.filters) {
      switch (filter.id) {
        case "status": {
          const values = Array.isArray(filter.value)
            ? filter.value
            : [filter.value];
          const validStatuses = values.filter(
            (v): v is StudentStatus =>
              typeof v === "string" &&
              ["ACTIVE", "ARCHIVED"].includes(v)
          );
          if (validStatuses.length > 0) {
            where.status = { in: validStatuses };
            // Toggle the archivedAt filter based on the selected statuses.
            // Selecting both Active and Archived shows all students.
            const hasArchived = validStatuses.includes("ARCHIVED");
            const hasActive = validStatuses.includes("ACTIVE");

            if (hasArchived && hasActive) {
              where.archivedAt = undefined;
            } else if (hasArchived) {
              where.archivedAt = { not: null };
            } else {
              where.archivedAt = null;
            }
          }
          break;
        }
        case "class": {
          const values = Array.isArray(filter.value)
            ? filter.value
            : [filter.value];
          where.enrollments = {
            some: {
              classId: { in: values as string[] },
              status: "ACTIVE",
              archivedAt: null,
            },
          };
          break;
        }
        case "tutor": {
          const values = Array.isArray(filter.value)
            ? filter.value
            : [filter.value];
          where.enrollments = {
            some: {
              class: {
                teacherId: { in: values as string[] },
              },
              status: "ACTIVE",
              archivedAt: null,
            },
          };
          break;
        }
        case "academicLevel": {
          const values = Array.isArray(filter.value)
            ? filter.value
            : [filter.value];
          if (values.length > 0) {
            where.level = {
              name: { in: values as string[] },
            };
          }
          break;
        }
      }
    }
  }

  // Build orderBy
  const orderBy: Prisma.StudentOrderByWithRelationInput[] = [];
  if (params.sorting && params.sorting.length > 0) {
    for (const sort of params.sorting) {
      switch (sort.id) {
        case "fullName":
          orderBy.push({ fullName: sort.desc ? "desc" : "asc" });
          break;
        case "status":
          orderBy.push({ status: sort.desc ? "desc" : "asc" });
          break;
        case "academicLevel":
          orderBy.push({
            level: { name: sort.desc ? "desc" : "asc" },
          });
          break;
      }
    }
  } else {
    // Default sorting
    orderBy.push({ fullName: "asc" });
  }

  // Execute query with pagination
  const [students, totalCount] = await Promise.all([
    database.student.findMany({
      where,
      orderBy,
      skip: params.page * params.pageSize,
      take: params.pageSize,
      include: {
        branch: true,
        level: true,
        enrollments: {
          where: { status: "ACTIVE", archivedAt: null },
          include: {
            class: {
              include: {
                subject: true,
                teacher: true,
              },
            },
          },
        },
        guardians: {
          where: { isPrimary: true },
          include: { guardian: true },
          take: 1,
        },
      },
    }),
    database.student.count({ where }),
  ]);

  return {
    data: students,
    totalCount,
  };
}

// Get filter options for classes, tutors, and statuses
export async function getStudentFilterOptions() {
  const tenant = await requireTenant();

  const [classes, teachers, levels] = await Promise.all([
    database.learningClass.findMany({
      where: { organizationId: tenant.organizationId, archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    database.teacherProfile.findMany({
      where: { organizationId: tenant.organizationId, archivedAt: null },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
    database.level.findMany({
      where: { organizationId: tenant.organizationId, archivedAt: null },
      select: { id: true, name: true, order: true },
      orderBy: { order: "asc" },
    }),
  ]);

  return {
    classes: classes.map((c) => ({ label: c.name, value: c.id })),
    levels: levels.map((l) => ({ label: l.name, value: l.name })),
    tutors: teachers.map((t) => ({ label: t.fullName, value: t.id })),
    statuses: [
      { label: "Active", value: "ACTIVE" },
      { label: "Archived", value: "ARCHIVED" },
    ],
  };
}
