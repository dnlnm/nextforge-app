import "server-only";

import type { PrismaClient } from "@repo/database";
import { attendanceRate } from "../metrics";
import { academicYearStart } from "../students/dashboard";

export interface SubjectDashboardInput {
  readonly organizationId: string;
  readonly subjectId: string;
}

/** Aggregates subject-level counts and attendance rate from active classes. */
export const getSubjectDashboard = async (
  db: PrismaClient,
  { organizationId, subjectId }: SubjectDashboardInput
) => {
  const subject = await db.subject.findFirst({
    where: {
      archivedAt: null,
      id: subjectId,
      organizationId,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  if (!subject) {
    return null;
  }

  const classes = await db.learningClass.findMany({
    where: {
      archivedAt: null,
      organizationId,
      status: "ACTIVE",
      subjectId,
    },
    select: {
      id: true,
      teacherId: true,
    },
  });

  const classIds = classes.map((c) => c.id);
  const distinctTeacherIds = new Set(
    classes.map((c) => c.teacherId).filter((id): id is string => Boolean(id))
  );

  const [enrolledStudents, attendanceStatuses] = await Promise.all([
    db.enrollment.findMany({
      where: {
        archivedAt: null,
        classId: { in: classIds },
        organizationId,
        status: "ACTIVE",
      },
      distinct: ["studentId"],
      select: { studentId: true },
    }),
    classIds.length > 0
      ? db.attendanceRecord.findMany({
          where: {
            organizationId,
            session: {
              classId: { in: classIds },
              sessionDate: { gte: academicYearStart(new Date()) },
            },
          },
          select: { status: true },
        })
      : Promise.resolve([]),
  ]);

  return {
    activeClassCount: classes.length,
    distinctStudentCount: enrolledStudents.length,
    distinctTeacherCount: distinctTeacherIds.size,
    attendanceRate: attendanceRate(attendanceStatuses.map((r) => r.status)),
  };
};
