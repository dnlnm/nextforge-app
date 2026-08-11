import "server-only";

import type { PrismaClient } from "@repo/database";

export interface AcademicHierarchy {
  readonly id: string;
  readonly name: string;
  readonly subjects: AcademicHierarchySubject[];
}

export interface AcademicHierarchySubject {
  readonly classes: AcademicHierarchyClass[];
  readonly id: string;
  readonly name: string;
}

export interface AcademicHierarchyClass {
  readonly code: string;
  readonly id: string;
  readonly name: string;
  readonly studentCount: number;
  readonly teacherName: string | null;
}

/**
 * Builds the Level -> Subject -> Class hierarchy from existing active classes.
 * Subjects without an operational class do not appear under a level.
 */
export const getAcademicHierarchy = async (
  db: PrismaClient,
  organizationId: string
): Promise<AcademicHierarchy[]> => {
  const levels = await db.level.findMany({
    where: { archivedAt: null, organizationId },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: {
      classes: {
        where: { archivedAt: null, status: "ACTIVE" },
        include: {
          _count: {
            select: {
              enrollments: {
                where: { archivedAt: null, status: "ACTIVE" },
              },
            },
          },
          subject: { select: { id: true, name: true } },
          teacher: { select: { fullName: true } },
        },
        orderBy: { name: "asc" },
      },
      id: true,
      name: true,
    },
  });

  return levels.map((level) => {
    const subjects = new Map<string, AcademicHierarchySubject>();

    for (const learningClass of level.classes) {
      let subject = subjects.get(learningClass.subject.id);

      if (!subject) {
        subject = {
          classes: [],
          id: learningClass.subject.id,
          name: learningClass.subject.name,
        };
        subjects.set(subject.id, subject);
      }

      subject.classes.push({
        code: learningClass.code,
        id: learningClass.id,
        name: learningClass.name,
        studentCount: learningClass._count.enrollments,
        teacherName: learningClass.teacher?.fullName ?? null,
      });
    }

    return {
      id: level.id,
      name: level.name,
      subjects: Array.from(subjects.values()),
    };
  });
};
