"use server";

import { requireTenantRole } from "@repo/auth/authorization";
import { type AttendanceStatus, database } from "@repo/database";
import { revalidatePath } from "next/cache";

const statuses = new Set<AttendanceStatus>([
  "PRESENT",
  "ABSENT",
  "LATE",
  "EXCUSED",
]);

const getTeacherProfileId = async (tenant: {
  readonly organizationId: string;
  readonly role: string;
  readonly userId: string;
}) => {
  if (tenant.role !== "TEACHER") {
    return;
  }

  const user = await database.user.findUnique({
    where: { id: tenant.userId },
    select: { email: true },
  });

  if (!user?.email) {
    return "__unassigned_teacher__";
  }

  const teacher = await database.teacherProfile.findFirst({
    where: {
      archivedAt: null,
      email: { equals: user.email, mode: "insensitive" },
      organizationId: tenant.organizationId,
    },
    select: { id: true },
  });

  return teacher?.id ?? "__unassigned_teacher__";
};

const getString = (formData: FormData, key: string) => {
  const value = formData.get(key);

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const parseSessionDate = (value?: string) => {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) ? null : date;
};

export const createClassSession = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const classId = getString(formData, "classId");
  const sessionDate = parseSessionDate(getString(formData, "sessionDate"));

  if (!(classId && sessionDate)) {
    throw new Error("Class and session date are required.");
  }

  const learningClass = await database.learningClass.findFirst({
    where: { id: classId, organizationId: tenant.organizationId },
    select: { endsAt: true, id: true, startsAt: true },
  });

  if (!learningClass) {
    throw new Error("Class not found.");
  }

  await database.classSession.upsert({
    where: { classId_sessionDate: { classId: learningClass.id, sessionDate } },
    create: {
      organizationId: tenant.organizationId,
      classId: learningClass.id,
      endsAt: learningClass.endsAt,
      sessionDate,
      startsAt: learningClass.startsAt,
    },
    update: {
      endsAt: learningClass.endsAt,
      startsAt: learningClass.startsAt,
    },
  });

  revalidatePath("/attendance");
};

export const markAttendance = async (formData: FormData) => {
  const tenant = await requireTenantRole(["TEACHER"]);
  const sessionId = getString(formData, "sessionId");
  const teacherProfileId = await getTeacherProfileId(tenant);

  if (!sessionId) {
    throw new Error("Session is required.");
  }

  const session = await database.classSession.findFirst({
    where: {
      id: sessionId,
      organizationId: tenant.organizationId,
      ...(teacherProfileId ? { class: { teacherId: teacherProfileId } } : {}),
    },
    include: {
      class: {
        include: {
          enrollments: {
            where: { status: "ACTIVE" },
            select: { studentId: true },
          },
        },
      },
    },
  });

  if (!session) {
    throw new Error("Session not found.");
  }

  const enrolledStudentIds = new Set(
    session.class.enrollments.map((enrollment) => enrollment.studentId)
  );
  const records = Array.from(formData.entries())
    .filter(([key]) => key.startsWith("status:"))
    .map(([key, value]) => ({
      status: typeof value === "string" ? value : undefined,
      studentId: key.replace("status:", ""),
    }))
    .filter(
      (record): record is { status: AttendanceStatus; studentId: string } =>
        Boolean(record.status) &&
        statuses.has(record.status as AttendanceStatus) &&
        enrolledStudentIds.has(record.studentId)
    );

  await database.$transaction(async (tx) => {
    for (const record of records) {
      await tx.attendanceRecord.upsert({
        where: {
          sessionId_studentId: {
            sessionId: session.id,
            studentId: record.studentId,
          },
        },
        create: {
          organizationId: tenant.organizationId,
          markedByUserId: tenant.userId,
          sessionId: session.id,
          status: record.status,
          studentId: record.studentId,
        },
        update: {
          markedAt: new Date(),
          markedByUserId: tenant.userId,
          status: record.status,
        },
      });
    }

    await tx.classSession.update({
      where: { id: session.id },
      data: { status: "COMPLETED" },
    });
  });

  revalidatePath("/attendance");
  revalidatePath("/today");
};

export const markSessionAttendanceStatus = async (formData: FormData) => {
  const tenant = await requireTenantRole(["TEACHER"]);
  const sessionId = getString(formData, "sessionId");
  const status = getString(formData, "status");
  const teacherProfileId = await getTeacherProfileId(tenant);

  if (!(sessionId && status && statuses.has(status as AttendanceStatus))) {
    throw new Error("Session and valid attendance status are required.");
  }

  const session = await database.classSession.findFirst({
    where: {
      id: sessionId,
      organizationId: tenant.organizationId,
      ...(teacherProfileId ? { class: { teacherId: teacherProfileId } } : {}),
    },
    include: {
      class: {
        include: {
          enrollments: {
            where: { status: "ACTIVE" },
            select: { studentId: true },
          },
        },
      },
    },
  });

  if (!session) {
    throw new Error("Session not found.");
  }

  await database.$transaction(async (tx) => {
    for (const enrollment of session.class.enrollments) {
      await tx.attendanceRecord.upsert({
        where: {
          sessionId_studentId: {
            sessionId: session.id,
            studentId: enrollment.studentId,
          },
        },
        create: {
          organizationId: tenant.organizationId,
          markedByUserId: tenant.userId,
          sessionId: session.id,
          status: status as AttendanceStatus,
          studentId: enrollment.studentId,
        },
        update: {
          markedAt: new Date(),
          markedByUserId: tenant.userId,
          status: status as AttendanceStatus,
        },
      });
    }

    await tx.classSession.update({
      where: { id: session.id },
      data: { status: "COMPLETED" },
    });
  });

  revalidatePath("/attendance");
  revalidatePath("/today");
};
