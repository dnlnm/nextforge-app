"use server";

import { requireTenantRole } from "@repo/auth/authorization";
import { type DayOfWeek, database } from "@repo/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

const getMoneySen = (formData: FormData, key: string) => {
  const value = getString(formData, key);

  if (!value) {
    return undefined;
  }

  const parsed = Number.parseFloat(value);

  return Number.isNaN(parsed) ? undefined : Math.round(parsed * 100);
};

export const createClass = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const name = getString(formData, "name");
  const subjectId = getString(formData, "subjectId");
  const dayOfWeek = getString(formData, "dayOfWeek") as DayOfWeek | undefined;
  const startsAt = getString(formData, "startsAt");
  const endsAt = getString(formData, "endsAt");

  if (!(name && subjectId && dayOfWeek && startsAt && endsAt)) {
    throw new Error(
      "Class name, subject, day, start time, and end time are required."
    );
  }

  if (!days.has(dayOfWeek)) {
    throw new Error("Invalid class day.");
  }

  const subject = await database.subject.findFirst({
    where: { id: subjectId, organizationId: tenant.organizationId },
    select: { id: true },
  });

  if (!subject) {
    throw new Error("Subject not found.");
  }

  await assertWithinPlanLimit({
    organizationId: tenant.organizationId,
    resource: "classes",
    userId: tenant.authUserId,
  });

  const teacherId = getString(formData, "teacherId");
  const levelId = getString(formData, "levelId");
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

  const level = levelId
    ? await database.level.findFirst({
        where: {
          id: levelId,
          organizationId: tenant.organizationId,
          archivedAt: null,
        },
        select: { id: true },
      })
    : null;

  await database.learningClass.create({
    data: {
      organizationId: tenant.organizationId,
      capacity: getInt(formData, "capacity"),
      dayOfWeek,
      endsAt,
      levelId: level?.id,
      monthlyFeeSen: getMoneySen(formData, "monthlyFee") ?? 0,
      name,
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

  await database.learningClass.updateMany({
    where: { id: classId, organizationId: tenant.organizationId },
    data: {
      capacity: getInt(formData, "capacity"),
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
    data: { customFeeSen: getMoneySen(formData, "customFee") },
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
