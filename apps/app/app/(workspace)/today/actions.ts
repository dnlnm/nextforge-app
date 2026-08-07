"use server";

import { requireTenantRole } from "@repo/auth/authorization";
import { database } from "@repo/database";
import { revalidatePath } from "next/cache";
import { getMalaysiaDateParts } from "./date";

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

export const createTodaySessions = async () => {
  const tenant = await requireTenantRole(["TEACHER"]);
  const today = getMalaysiaDateParts();
  const teacherProfileId = await getTeacherProfileId(tenant);
  const schedules = await database.classSchedule.findMany({
    where: {
      dayOfWeek: today.dayOfWeek,
      class: {
        organizationId: tenant.organizationId,
        status: "ACTIVE",
        ...(teacherProfileId ? { teacherId: teacherProfileId } : {}),
      },
    },
    select: {
      classId: true,
      endsAt: true,
      startsAt: true,
    },
  });

  for (const schedule of schedules) {
    await database.classSession.upsert({
      where: {
        classId_sessionDate: {
          classId: schedule.classId,
          sessionDate: today.date,
        },
      },
      create: {
        organizationId: tenant.organizationId,
        classId: schedule.classId,
        endsAt: schedule.endsAt,
        sessionDate: today.date,
        startsAt: schedule.startsAt,
      },
      update: {
        endsAt: schedule.endsAt,
        startsAt: schedule.startsAt,
      },
    });
  }

  revalidatePath("/today");
  revalidatePath("/attendance");
};
