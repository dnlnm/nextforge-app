import "server-only";

import type { PrismaClient } from "@repo/database";

export interface LevelDashboardInput {
  readonly levelId: string;
  readonly organizationId: string;
}

/** Aggregates level counts including distinct subjects and teachers. */
export const getLevelDashboard = async (
  db: PrismaClient,
  { levelId, organizationId }: LevelDashboardInput
) => {
  const level = await db.level.findFirst({
    where: { archivedAt: null, id: levelId, organizationId },
    select: { id: true },
  });

  if (!level) {
    return null;
  }

  const classes = await db.learningClass.findMany({
    where: {
      archivedAt: null,
      levelId,
      organizationId,
      status: "ACTIVE",
    },
    select: {
      subjectId: true,
      teacherId: true,
    },
  });

  const [studentCount, distinctSubjectCount, distinctTeacherCount] =
    await Promise.all([
      db.student.count({
        where: { archivedAt: null, levelId, organizationId, status: "ACTIVE" },
      }),
      Promise.resolve(new Set(classes.map((c) => c.subjectId)).size),
      Promise.resolve(
        new Set(classes.map((c) => c.teacherId).filter(Boolean)).size
      ),
    ]);

  return {
    activeClassCount: classes.length,
    distinctSubjectCount,
    distinctTeacherCount,
    studentCount,
  };
};
