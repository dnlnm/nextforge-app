"use server";

import { requireTenantRole } from "@repo/auth/authorization";
import { type DayOfWeek, database } from "@repo/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  buildClassCode,
  isValidClassCode,
  normalizeClassCode,
} from "@/lib/codes";
import { assertWithinPlanLimit } from "../billing/limits";

const days = new Set<DayOfWeek>([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);

const getString = (formData: FormData, key: string) => {
  const value = formData.get(key);

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const getInt = (formData: FormData, key: string) => {
  const value = getString(formData, key);

  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isNaN(parsed) ? undefined : parsed;
};

const getDate = (formData: FormData, key: string) => {
  const value = getString(formData, key);

  if (!value) {
    return undefined;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) ? undefined : date;
};

const getMoneySen = (formData: FormData, key: string) => {
  const value = getString(formData, key);

  if (!value) {
    return undefined;
  }

  const parsed = Number.parseFloat(value);

  return Number.isNaN(parsed) ? undefined : Math.round(parsed * 100);
};

const getAcademicYear = (formData: FormData) => {
  const value = getInt(formData, "academicYear");

  if (!value || value < 2000 || value > 2100) {
    throw new Error("A valid academic year is required.");
  }

  return value;
};

// Resolve a unique class code for an organization. Prefers a user-supplied
// code; otherwise builds one from subject/level/year and appends a numeric
// suffix (e.g. PHY-SPM-26-2) until it is unique.
const resolveClassCode = async (
  organizationId: string,
  {
    academicYear,
    levelCode,
    submittedCode,
    subjectCode,
  }: {
    academicYear: number;
    levelCode: string;
    submittedCode?: string;
    subjectCode: string;
  }
) => {
  if (submittedCode) {
    const code = normalizeClassCode(submittedCode);

    if (!isValidClassCode(code)) {
      throw new Error(
        "Class code can only contain letters, numbers, and dashes."
      );
    }

    const clash = await database.learningClass.findFirst({
      where: { organizationId, code },
      select: { id: true },
    });

    if (clash) {
      throw new Error("A class with this code already exists.");
    }

    return code;
  }

  const base = buildClassCode({ academicYear, levelCode, subjectCode });
  let suffix = 1;
  let code = base;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const clash = await database.learningClass.findFirst({
      where: { organizationId, code },
      select: { id: true },
    });

    if (!clash) {
      return code;
    }

    suffix += 1;
    code = buildClassCode({
      academicYear,
      levelCode,
      subjectCode,
      suffix,
    });
  }
};

export const createClass = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const name = getString(formData, "name");
  const subjectId = getString(formData, "subjectId");
  const levelId = getString(formData, "levelId");
  const dayOfWeek = getString(formData, "dayOfWeek") as DayOfWeek | undefined;
  const startsAt = getString(formData, "startsAt");
  const endsAt = getString(formData, "endsAt");
  const academicYear = getAcademicYear(formData);

  if (!(name && subjectId && levelId && dayOfWeek && startsAt && endsAt)) {
    throw new Error(
      "Class name, subject, level, day, start time, and end time are required."
    );
  }

  if (!days.has(dayOfWeek)) {
    throw new Error("Invalid class day.");
  }

  const [subject, level] = await Promise.all([
    database.subject.findFirst({
      where: { id: subjectId, organizationId: tenant.organizationId },
      select: { code: true, id: true },
    }),
    database.level.findFirst({
      where: {
        id: levelId,
        organizationId: tenant.organizationId,
        archivedAt: null,
      },
      select: { code: true, id: true },
    }),
  ]);

  if (!subject) {
    throw new Error("Subject not found.");
  }

  if (!level) {
    throw new Error("Level not found.");
  }

  await assertWithinPlanLimit({
    organizationId: tenant.organizationId,
    resource: "classes",
    userId: tenant.authUserId,
  });

  const teacherId = getString(formData, "teacherId");
  const teacher = teacherId
    ? await database.teacherProfile.findFirst({
        where: {
          id: teacherId,
          organizationId: tenant.organizationId,
          archivedAt: null,
        },
        select: { id: true },
      })
    : null;

  const code = await resolveClassCode(tenant.organizationId, {
    academicYear,
    levelCode: level.code,
    subjectCode: subject.code,
    submittedCode: getString(formData, "code"),
  });

  await database.learningClass.create({
    data: {
      academicYear,
      capacity: getInt(formData, "capacity"),
      code,
      dayOfWeek,
      endsAt,
      levelId: level.id,
      monthlyFeeSen: getMoneySen(formData, "monthlyFee") ?? 0,
      name,
      organizationId: tenant.organizationId,
      room: getString(formData, "room"),
      startsAt,
      subjectId: subject.id,
      teacherId: teacher?.id,
    },
  });

  revalidatePath("/classes");
};

export const enrollStudent = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const classId = getString(formData, "classId");
  const studentId = getString(formData, "studentId");

  if (!(classId && studentId)) {
    throw new Error("Class and student are required.");
  }

  const [learningClass, student] = await Promise.all([
    database.learningClass.findFirst({
      where: { id: classId, organizationId: tenant.organizationId },
      select: { id: true },
    }),
    database.student.findFirst({
      where: { id: studentId, organizationId: tenant.organizationId },
      select: { id: true },
    }),
  ]);

  if (!(learningClass && student)) {
    throw new Error("Class or student not found.");
  }

  await database.enrollment.create({
    data: {
      organizationId: tenant.organizationId,
      classId: learningClass.id,
      customFeeSen: getMoneySen(formData, "customFee"),
      startsOn: getDate(formData, "startsOn") ?? new Date(),
      studentId: student.id,
    },
  });

  revalidatePath("/classes");
};

export const archiveClass = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const classId = getString(formData, "classId");

  if (!classId) {
    throw new Error("Class is required.");
  }

  const archivedAt = new Date();

  await database.$transaction(async (tx) => {
    await tx.learningClass.updateMany({
      where: { id: classId, organizationId: tenant.organizationId },
      data: { archivedAt, status: "ARCHIVED" },
    });
    await tx.enrollment.updateMany({
      where: { classId, organizationId: tenant.organizationId },
      data: { archivedAt, status: "ARCHIVED" },
    });
  });

  revalidatePath("/classes");
  revalidatePath("/attendance");
};

export const updateClass = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const classId = getString(formData, "classId");
  const name = getString(formData, "name");
  const subjectId = getString(formData, "subjectId");
  const dayOfWeek = getString(formData, "dayOfWeek") as DayOfWeek | undefined;
  const startsAt = getString(formData, "startsAt");
  const endsAt = getString(formData, "endsAt");

  if (!(classId && name && subjectId && dayOfWeek && startsAt && endsAt)) {
    throw new Error("Class details are required.");
  }

  if (!days.has(dayOfWeek)) {
    throw new Error("Invalid class day.");
  }

  const teacherId = getString(formData, "teacherId");
  const levelId = getString(formData, "levelId");
  const submittedCode = getString(formData, "code");
  const academicYear = getAcademicYear(formData);

  if (submittedCode) {
    const code = normalizeClassCode(submittedCode);

    if (!isValidClassCode(code)) {
      throw new Error(
        "Class code can only contain letters, numbers, and dashes."
      );
    }

    const clash = await database.learningClass.findFirst({
      where: {
        organizationId: tenant.organizationId,
        code,
        NOT: { id: classId },
      },
      select: { id: true },
    });

    if (clash) {
      throw new Error("A class with this code already exists.");
    }
  }

  await database.learningClass.updateMany({
    where: { id: classId, organizationId: tenant.organizationId },
    data: {
      academicYear,
      capacity: getInt(formData, "capacity"),
      code: submittedCode ? normalizeClassCode(submittedCode) : undefined,
      dayOfWeek,
      endsAt,
      levelId: levelId === "none" ? null : levelId,
      monthlyFeeSen: getMoneySen(formData, "monthlyFee") ?? 0,
      name,
      room: getString(formData, "room"),
      startsAt,
      subjectId,
      teacherId: teacherId === "none" ? null : teacherId,
    },
  });

  revalidatePath("/classes");
  redirect("/classes");
};

export const updateEnrollment = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const enrollmentId = getString(formData, "enrollmentId");

  if (!enrollmentId) {
    throw new Error("Enrollment is required.");
  }

  await database.enrollment.updateMany({
    where: { id: enrollmentId, organizationId: tenant.organizationId },
    data: {
      customFeeSen: getMoneySen(formData, "customFee"),
      startsOn: getDate(formData, "startsOn"),
    },
  });

  revalidatePath("/classes");
};

export const endEnrollment = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const enrollmentId = getString(formData, "enrollmentId");

  if (!enrollmentId) {
    throw new Error("Enrollment is required.");
  }

  await database.enrollment.updateMany({
    where: { id: enrollmentId, organizationId: tenant.organizationId },
    data: { endsOn: new Date(), status: "ENDED" },
  });

  revalidatePath("/classes");
};
