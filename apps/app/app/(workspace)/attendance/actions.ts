"use server";

import { requireTenantRole } from "@repo/auth/authorization";
import { database } from "@repo/database";
import { attendanceMarkedEvent } from "@repo/domain/students/activity";
import {
  type AttendanceStatus,
  attendanceStatuses,
  type DayOfWeek,
} from "@repo/schemas/enums";
import { revalidatePath } from "next/cache";
import { getTeacherProfileId } from "@/lib/teacher-profile";

const statuses = new Set<AttendanceStatus>(attendanceStatuses);

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

const getMalaysiaDayOfWeek = (date: Date): DayOfWeek => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    weekday: "long",
  }).formatToParts(date);

  return (parts.find((part) => part.type === "weekday")?.value.toUpperCase() ??
    "MONDAY") as DayOfWeek;
};

const getScheduleForDate = async (
  tenant: { readonly organizationId: string },
  classId: string,
  sessionDate: Date
) => {
  const schedule = await database.classSchedule.findFirst({
    where: {
      classId,
      dayOfWeek: getMalaysiaDayOfWeek(sessionDate),
      class: { organizationId: tenant.organizationId },
    },
    select: { endsAt: true, startsAt: true },
  });

  return schedule;
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
    select: { id: true },
  });

  if (!learningClass) {
    throw new Error("Class not found.");
  }

  const schedule = await getScheduleForDate(
    tenant,
    learningClass.id,
    sessionDate
  );

  if (!schedule) {
    throw new Error(
      "No class schedule found for the selected date. Create a session for a day this class is scheduled."
    );
  }

  await database.classSession.upsert({
    where: { classId_sessionDate: { classId: learningClass.id, sessionDate } },
    create: {
      organizationId: tenant.organizationId,
      classId: learningClass.id,
      endsAt: schedule.endsAt,
      sessionDate,
      startsAt: schedule.startsAt,
    },
    update: {
      endsAt: schedule.endsAt,
      startsAt: schedule.startsAt,
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

      const studentName = await tx.student
        .findFirst({
          where: {
            id: record.studentId,
            organizationId: tenant.organizationId,
          },
          select: { fullName: true },
        })
        .then((student) => student?.fullName ?? "student");

      const event = attendanceMarkedEvent(
        tenant.organizationId,
        record.studentId,
        studentName,
        session.class.name,
        session.sessionDate,
        session.id,
        tenant.userId
      );

      await tx.auditEvent.create({ data: event });
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

      const studentName = await tx.student
        .findFirst({
          where: {
            id: enrollment.studentId,
            organizationId: tenant.organizationId,
          },
          select: { fullName: true },
        })
        .then((student) => student?.fullName ?? "student");

      const event = attendanceMarkedEvent(
        tenant.organizationId,
        enrollment.studentId,
        studentName,
        session.class.name,
        session.sessionDate,
        session.id,
        tenant.userId
      );

      await tx.auditEvent.create({ data: event });
    }

    await tx.classSession.update({
      where: { id: session.id },
      data: { status: "COMPLETED" },
    });
  });

  revalidatePath("/attendance");
  revalidatePath("/today");
};
