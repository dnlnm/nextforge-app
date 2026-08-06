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
  const classes = await database.learningClass.findMany({
    where: {
      organizationId: tenant.organizationId,
      dayOfWeek: today.dayOfWeek,
      status: "ACTIVE",
      ...(teacherProfileId ? { teacherId: teacherProfileId } : {}),
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
