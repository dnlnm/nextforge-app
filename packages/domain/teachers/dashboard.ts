import "server-only";

import type { PrismaClient } from "@repo/database";
import { weeklyTeachingHours, workloadCategory } from "../metrics";

export interface TeacherDashboardInput {
  readonly organizationId: string;
  readonly teacherId: string;
}

/** Aggregates a teacher's teaching load and distinct student count. */
export const getTeacherDashboard = async (
  db: PrismaClient,
  { organizationId, teacherId }: TeacherDashboardInput
) => {
  const teacher = await db.teacherProfile.findFirst({
    where: { archivedAt: null, id: teacherId, organizationId },
    select: { id: true },
  });

  if (!teacher) {
    return null;
  }

  const classes = await db.learningClass.findMany({
    where: {
      archivedAt: null,
      organizationId,
      status: "ACTIVE",
      teacherId,
    },
    include: {
      schedules: {
        select: { dayOfWeek: true, endsAt: true, startsAt: true },
      },
      subject: { select: { name: true } },
      enrollments: {
        where: { archivedAt: null, status: "ACTIVE" },
        select: { studentId: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const distinctStudentIds = new Set<string>();
  const subjects = new Set<string>();

  for (const learningClass of classes) {
    subjects.add(learningClass.subject.name);

    for (const enrollment of learningClass.enrollments) {
      distinctStudentIds.add(enrollment.studentId);
    }
  }

  const schedules = classes.flatMap((c) => c.schedules);
  const hours = weeklyTeachingHours(schedules);

  return {
    activeClassCount: classes.length,
    distinctStudentCount: distinctStudentIds.size,
    distinctSubjectCount: subjects.size,
    weeklyTeachingHours: Math.round(hours * 100) / 100,
    workloadCategory: workloadCategory(classes.length),
  };
};
