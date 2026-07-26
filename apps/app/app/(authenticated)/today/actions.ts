"use server";

import { requireTenantRole } from "@repo/auth/authorization";
import { database } from "@repo/database";
import { revalidatePath } from "next/cache";
import { getMalaysiaDateParts } from "./date";

export const createTodaySessions = async () => {
  const tenant = await requireTenantRole(["TEACHER"]);
  const today = getMalaysiaDateParts();
  const classes = await database.learningClass.findMany({
    where: {
      organizationId: tenant.organizationId,
      dayOfWeek: today.dayOfWeek,
      status: "ACTIVE",
    },
    select: { endsAt: true, id: true, startsAt: true },
  });

  for (const learningClass of classes) {
    await database.classSession.upsert({
      where: {
        classId_sessionDate: {
          classId: learningClass.id,
          sessionDate: today.date,
        },
      },
      create: {
        organizationId: tenant.organizationId,
        classId: learningClass.id,
        endsAt: learningClass.endsAt,
        sessionDate: today.date,
        startsAt: learningClass.startsAt,
      },
      update: {
        endsAt: learningClass.endsAt,
        startsAt: learningClass.startsAt,
      },
    });
  }

  revalidatePath("/today");
  revalidatePath("/attendance");
};
