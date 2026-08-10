"use server";

import { requireTenantRole } from "@repo/auth/authorization";
import { database } from "@repo/database";
import { getTeacherProfileId } from "@/lib/teacher-profile";
import { revalidatePath } from "next/cache";
import { getMalaysiaDateParts } from "./date";

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
