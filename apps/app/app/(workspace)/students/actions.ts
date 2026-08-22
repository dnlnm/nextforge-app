"use server";

import { requireTenant, requireTenantRole } from "@repo/auth/authorization";
import { database, type Prisma } from "@repo/database";
import { tryParseCalendarDate } from "@repo/date";
import {
  EnrollmentValidationError,
  enrollStudentInTransaction,
} from "@repo/domain/classes/enrollment";
import {
  studentArchivedEvent,
  studentCreatedEvent,
  studentRestoredEvent,
  writeActivityEvent,
} from "@repo/domain/students/activity";
import {
  type Gender,
  type GuardianRelationship,
  genders,
  guardianRelationships,
  type StudentStatus,
  studentStatuses,
} from "@repo/schemas/enums";
import {
  type EnrollmentRequest,
  enrollmentRequestSchema,
  guardianInputSchema,
  type StudentsQueryParams,
} from "@repo/schemas/students";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTeacherProfileId } from "@/lib/teacher-profile";
import { assertWithinPlanLimit } from "../billing/limits";
import {
  deriveDateOfBirthFromIc,
  deriveGenderFromIc,
  isValidIcNumber,
  normalizeIcNumber,
} from "./lib/ic-number";
import { reserveStudentCode } from "./lib/student-code";

export type { StudentsQueryParams } from "@repo/schemas/students";

const getString = (formData: FormData, key: string) => {
  const value = formData.get(key);

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const genderSet = new Set<Gender>(genders);

const getGender = (formData: FormData, key: string) => {
  const value = getString(formData, key);

  return value && genderSet.has(value as Gender)
    ? (value as Gender)
    : undefined;
};

const getDate = (formData: FormData, key: string) => {
  const value = getString(formData, key);

  if (!value) {
    return undefined;
  }

  return tryParseCalendarDate(value);
};

const phoneStripRegex = /[-\s]/g;
const phoneRegex = /^01\d{8,10}$/;
const postcodeRegex = /^\d{5}$/;

const isValidPhone = (phone: string) =>
  phoneRegex.test(phone.replace(phoneStripRegex, ""));

const isValidPostcode = (postcode: string) => postcodeRegex.test(postcode);

const relationships = new Set<GuardianRelationship>(guardianRelationships);
const statuses = new Set<StudentStatus>(studentStatuses);

/** Parses a hidden JSON array input posted by a dynamic client collection. */
const parseJsonArray = (
  formData: FormData,
  key: string
): unknown[] | undefined => {
  const raw = getString(formData, key);

  if (!raw) {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
};

export const getNextStudentCode = async () => {
  const tenant = await requireTenant();
  const organization = await database.organization.findUniqueOrThrow({
    where: { id: tenant.organizationId },
    select: { studentCodeSequence: true },
  });
  return `STU${String(organization.studentCodeSequence + 1).padStart(4, "0")}`;
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

interface GuardianContact {
  readonly email?: string;
  readonly fullName: string;
  readonly icNumber?: string;
  readonly phone: string;
  readonly relationship?: GuardianRelationship;
  readonly whatsapp?: string;
}

interface GuardianAddress {
  readonly addressLine1?: string;
  readonly addressLine2?: string;
  readonly city?: string;
  readonly postcode?: string;
  readonly state?: string;
}

interface ParsedGuardians {
  readonly error?: string;
  readonly guardians: GuardianContact[];
  readonly primaryGuardianAddress?: GuardianAddress;
}

/**
 * Guardians (1–3). The Add Student UI posts a `guardiansJson` array; legacy
 * callers still post single-guardian fields, which also copy student address
 * details onto the primary guardian.
 */
const parseGuardianInputs = (formData: FormData): ParsedGuardians => {
  const payloads = parseJsonArray(formData, "guardiansJson");

  if (!payloads) {
    const legacyName = getString(formData, "guardianName");
    const legacyPhone = getString(formData, "guardianPhone");

    if (!(legacyName && legacyPhone)) {
      return {
        error: "Student and guardian names are required.",
        guardians: [],
      };
    }

    const sameAsStudentAddress =
      getString(formData, "sameAsStudentAddress") === "on";

    return {
      guardians: [
        {
          email: getString(formData, "guardianEmail"),
          fullName: legacyName,
          phone: legacyPhone,
          relationship: getString(formData, "relationship") as
            | GuardianRelationship
            | undefined,
        },
      ],
      primaryGuardianAddress: sameAsStudentAddress
        ? {
            addressLine1: getString(formData, "addressLine1"),
            addressLine2: getString(formData, "addressLine2"),
            city: getString(formData, "city"),
            postcode: getString(formData, "postcode"),
            state: getString(formData, "state"),
          }
        : {
            addressLine1: getString(formData, "guardianAddressLine1"),
            addressLine2: getString(formData, "guardianAddressLine2"),
          },
    };
  }

  if (payloads.length < 1 || payloads.length > 3) {
    return {
      error: "Add between one and three parent/guardian contacts.",
      guardians: [],
    };
  }

  const guardians: GuardianContact[] = [];

  for (const payload of payloads) {
    const result = guardianInputSchema.safeParse(payload);

    if (!result.success) {
      return {
        error:
          "Complete every guardian contact — name, Malaysian phone number and (for the primary) an email address are required.",
        guardians: [],
      };
    }

    guardians.push(result.data);
  }

  return { guardians };
};

interface StudentIdentity {
  readonly dateOfBirth?: Date;
  readonly error?: string;
  readonly gender?: Gender;
  readonly icNumber?: string;
}

/** IC / MyKid normalization plus DOB & gender derivation. */
const resolveStudentIdentity = (formData: FormData): StudentIdentity => {
  const rawValue = getString(formData, "icNumber");

  if (!rawValue) {
    const gender = getGender(formData, "gender");

    return gender
      ? { dateOfBirth: getDate(formData, "dateOfBirth"), gender }
      : {
          dateOfBirth: getDate(formData, "dateOfBirth"),
          error: "Gender is required.",
        };
  }

  const icNumber = normalizeIcNumber(rawValue);

  if (!isValidIcNumber(rawValue)) {
    return {
      error: "IC / MyKid number must be exactly 12 digits.",
    };
  }

  const derivedDate = tryParseCalendarDate(
    deriveDateOfBirthFromIc(icNumber) ?? ""
  );

  return {
    dateOfBirth: getDate(formData, "dateOfBirth") ?? derivedDate,
    gender:
      getGender(formData, "gender") ??
      deriveGenderFromIc(icNumber) ??
      undefined,
    icNumber,
  };
};

const parseInvoiceDueDay = (
  formData: FormData
): { error?: string; invoiceDueDay?: number } => {
  const rawValue = getString(formData, "invoiceDueDay");

  if (!rawValue) {
    return {};
  }

  const dueDay = Number.parseInt(rawValue, 10);

  if (dueDay < 1 || dueDay > 28) {
    return { error: "Fee due day must be a day between 1 and 28." };
  }

  return { invoiceDueDay: dueDay };
};

const parseEnrollmentRequests = (
  formData: FormData
): { error?: string; requests: EnrollmentRequest[] } => {
  const requests: EnrollmentRequest[] = [];

  for (const payload of parseJsonArray(formData, "enrollmentsJson") ?? []) {
    const result = enrollmentRequestSchema.safeParse(payload);

    if (!result.success) {
      return { error: "One of the selected classes is invalid.", requests: [] };
    }

    requests.push(result.data);
  }

  return { requests };
};

/** Phone/email/postcode rules shared by the student and guardian blocks. */
const validateStudentContact = (
  formData: FormData,
  guardians: readonly GuardianContact[]
): string | undefined => {
  for (const guardianInput of guardians) {
    if (!isValidPhone(guardianInput.phone)) {
      return `Enter a valid Malaysian phone number for ${guardianInput.fullName} (e.g. 012-3456789).`;
    }
  }

  const studentEmail = getString(formData, "studentEmail");

  if (!(studentEmail || guardians.some((guardian) => guardian.email))) {
    return "At least one email address is required for the student or primary guardian.";
  }

  const phone = getString(formData, "studentPhone");

  if (phone && !isValidPhone(phone)) {
    return "Enter a valid student phone number (e.g. 012-3456789).";
  }

  const postcode = getString(formData, "postcode");

  if (postcode && !isValidPostcode(postcode)) {
    return "Enter a 5-digit postcode.";
  }

  return undefined;
};

export const createStudent = async (
  formData: FormData
): Promise<{ error?: string }> => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const address = {
    addressLine1: getString(formData, "addressLine1"),
    addressLine2: getString(formData, "addressLine2"),
  };

  const firstName = getString(formData, "firstName");
  const lastName = getString(formData, "lastName");
  const fullName =
    [firstName, lastName].filter(Boolean).join(" ").trim() ||
    getString(formData, "fullName");

  if (!fullName) {
    return { error: "Student name is required." };
  }

  // ── Guardians (1–3).
  const parsedGuardians = parseGuardianInputs(formData);

  if (parsedGuardians.error) {
    return { error: parsedGuardians.error };
  }

  const guardiansInput = parsedGuardians.guardians;
  const contactError = validateStudentContact(formData, guardiansInput);

  if (contactError) {
    return { error: contactError };
  }

  const phone = getString(formData, "studentPhone");
  const studentEmail = getString(formData, "studentEmail");
  const postcode = getString(formData, "postcode");

  // ── IC / MyKid with DOB + gender derivation.
  const identity = resolveStudentIdentity(formData);

  if (identity.error || !identity.gender) {
    return { error: identity.error ?? "Gender is required." };
  }

  // ── Fee due day (1–28).
  const dueDayResult = parseInvoiceDueDay(formData);

  if (dueDayResult.error) {
    return { error: dueDayResult.error };
  }

  try {
    await assertWithinPlanLimit({
      organizationId: tenant.organizationId,
      resource: "students",
      userId: tenant.authUserId,
    });
  } catch {
    return { error: "Student limit reached for your plan." };
  }

  // ── Class enrollments requested at creation time.
  const enrollmentResult = parseEnrollmentRequests(formData);

  if (enrollmentResult.error) {
    return { error: enrollmentResult.error };
  }

  const levelId = await resolveLevel(getString(formData, "levelId"));

  let createdStudentId: string;

  try {
    createdStudentId = await database.$transaction(async (tx) => {
      const code = await reserveStudentCode(tx, tenant.organizationId);
      const created = await tx.student.create({
        data: {
          organizationId: tenant.organizationId,
          fullName,
          code,
          levelId,
          dateOfBirth: identity.dateOfBirth,
          enrolledAt: getDate(formData, "enrolledAt") ?? new Date(),
          gender: identity.gender,
          phone,
          email: studentEmail,
          ...address,
          city: getString(formData, "city"),
          state: getString(formData, "state"),
          postcode,
          schoolName: getString(formData, "schoolName"),
          schoolType: getString(formData, "schoolType"),
          icNumber: identity.icNumber,
          invoiceDueDay: dueDayResult.invoiceDueDay,
          emergencyContactName: getString(formData, "emergencyContactName"),
          emergencyContactPhone: getString(formData, "emergencyContactPhone"),
          medicalNotes: getString(formData, "medicalNotes"),
          referralSource: getString(formData, "referralSource"),
          photoKey: getString(formData, "photoKey"),
          notes: getString(formData, "notes"),
        },
        select: { id: true },
      });

      for (const [index, guardianInput] of guardiansInput.entries()) {
        const isPrimary = index === 0;
        const guardian = await tx.guardian.create({
          data: {
            organizationId: tenant.organizationId,
            email: guardianInput.email,
            fullName: guardianInput.fullName,
            phone: guardianInput.phone,
            whatsapp: guardianInput.whatsapp,
            icNumber: guardianInput.icNumber
              ? normalizeIcNumber(guardianInput.icNumber) || undefined
              : undefined,
            ...(isPrimary && parsedGuardians.primaryGuardianAddress
              ? parsedGuardians.primaryGuardianAddress
              : {}),
          },
          select: { id: true },
        });

        await tx.studentGuardian.create({
          data: {
            guardianId: guardian.id,
            isPrimary,
            receivesBilling: isPrimary,
            relationship:
              guardianInput.relationship &&
              relationships.has(guardianInput.relationship)
                ? guardianInput.relationship
                : "GUARDIAN",
            studentId: created.id,
          },
        });
      }

      for (const request of enrollmentResult.requests) {
        await enrollStudentInTransaction(
          tx,
          { organizationId: tenant.organizationId, userId: tenant.userId },
          {
            classId: request.classId,
            customFeeSen: request.customFeeSen ?? null,
            startsOn: getString(formData, "enrolledAt") || null,
            studentId: created.id,
          }
        );
      }

      const event = studentCreatedEvent(
        tenant.organizationId,
        created.id,
        fullName,
        tenant.userId
      );

      await writeActivityEvent(tx, event);

      return created.id;
    });
  } catch (error) {
    if (error instanceof EnrollmentValidationError) {
      return { error: error.message };
    }

    throw error;
  }

  revalidatePath("/students");
  redirect(`/students/${createdStudentId}`);
};

export const archiveStudent = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const studentId = getString(formData, "studentId");

  if (!studentId) {
    throw new Error("Student is required.");
  }

  const archivedAt = new Date();

  await database.$transaction(async (tx) => {
    const student = await tx.student.findFirst({
      where: { id: studentId, organizationId: tenant.organizationId },
      select: { fullName: true },
    });

    if (!student) {
      throw new Error("Student not found.");
    }

    await tx.student.updateMany({
      where: { id: studentId, organizationId: tenant.organizationId },
      data: { archivedAt, status: "ARCHIVED" },
    });
    await tx.enrollment.updateMany({
      where: { studentId, organizationId: tenant.organizationId },
      data: { archivedAt, status: "ARCHIVED" },
    });

    const event = studentArchivedEvent(
      tenant.organizationId,
      studentId,
      student.fullName,
      tenant.userId
    );

    await writeActivityEvent(tx, event);
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
      select: { fullName: true, id: true },
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

    const event = studentRestoredEvent(
      tenant.organizationId,
      student.id,
      student.fullName,
      tenant.userId
    );

    await writeActivityEvent(tx, event);
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
  const sameAsStudentAddress =
    getString(formData, "sameAsStudentAddress") === "on";
  const address = {
    addressLine1: getString(formData, "addressLine1"),
    addressLine2: getString(formData, "addressLine2"),
  };

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
        photoKey: getString(formData, "photoKey"),
        notes: getString(formData, "notes"),
      },
    });
    const guardianAddress = sameAsStudentAddress
      ? address
      : {
          addressLine1: getString(formData, "guardianAddressLine1"),
          addressLine2: getString(formData, "guardianAddressLine2"),
        };
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
  revalidatePath(`/students/${studentId}`);
  revalidatePath(`/students/${studentId}/edit`);
  redirect(`/students/${studentId}`);
};

// Fetch students for table with server-side pagination, filtering, and sorting
export async function getStudentsForTable(params: StudentsQueryParams) {
  const tenant = await requireTenant();

  // Build where clause
  const where: Prisma.StudentWhereInput = {
    organizationId: tenant.organizationId,
    archivedAt: null,
  };

  // Teachers only see students in the classes they teach (spec §5).
  const teacherProfileId = await getTeacherProfileId(tenant);

  if (teacherProfileId !== undefined) {
    where.enrollments = {
      some: {
        status: "ACTIVE",
        archivedAt: null,
        class: {
          teacherId: teacherProfileId,
        },
      },
    };
  }

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
              typeof v === "string" && statuses.has(v as StudentStatus)
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
        case "gender": {
          const values = Array.isArray(filter.value)
            ? filter.value
            : [filter.value];
          const validGenders = values.filter(
            (v): v is Gender =>
              typeof v === "string" && genderSet.has(v as Gender)
          );
          if (validGenders.length > 0) {
            where.gender = { in: validGenders };
          }
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
        default:
          break;
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
        default:
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
    genders: genders.map((value) => ({
      label: value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(),
      value,
    })),
  };
}

/**
 * Full detail for a single student's aside panel (primary guardian + open
 * invoices), tenant-scoped. Loaded on demand instead of the page prefetching
 * every student's invoices to render one panel.
 */
export async function getStudentDetail(studentId: string) {
  const tenant = await requireTenant();

  return database.student.findFirst({
    where: { id: studentId, organizationId: tenant.organizationId },
    select: {
      code: true,
      createdAt: true,
      dateOfBirth: true,
      email: true,
      enrolledAt: true,
      fullName: true,
      gender: true,
      id: true,
      phone: true,
      photoKey: true,
      status: true,
      guardians: {
        where: { isPrimary: true },
        select: {
          guardian: {
            select: {
              addressLine1: true,
              addressLine2: true,
              city: true,
              email: true,
              fullName: true,
              phone: true,
              state: true,
            },
          },
        },
        take: 1,
      },
      invoices: {
        where: {
          status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] },
        },
        select: { amountPaidSen: true, totalSen: true },
      },
      level: { select: { name: true } },
    },
  });
}
