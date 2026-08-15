import "server-only";

import type { PrismaClient } from "@repo/database";
import { formatMonthLabel, getAcademicYearStart } from "@repo/date";

export interface MonthBucket {
  readonly key: string;
  readonly label: string;
  readonly value: number;
}

const monthKey = (date: Date): string =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

export const monthLabel = (key: string): string => {
  const [year, month] = key.split("-").map(Number);
  return formatMonthLabel(new Date(Date.UTC(year, (month ?? 1) - 1, 1)));
};

const lastSixMonthKeys = (now: Date): string[] => {
  const keys: string[] = [];

  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - index, 1)
    );
    keys.push(monthKey(date));
  }

  return keys;
};

const toMonthBuckets = (keys: string[], values: Map<string, number>) =>
  keys.map((key) => ({
    key,
    label: monthLabel(key),
    value: values.get(key) ?? 0,
  }));

const groupByMonth = <T>(
  rows: readonly T[],
  getDate: (row: T) => Date,
  getValue: (row: T) => number
): Map<string, number> => {
  const map = new Map<string, number>();

  for (const row of rows) {
    const key = monthKey(getDate(row));
    map.set(key, (map.get(key) ?? 0) + getValue(row));
  }

  return map;
};

export interface StudentTrends {
  readonly attendanceByMonth: MonthBucket[];
  readonly attendanceRateByMonth: MonthBucket[];
  readonly paymentByMonth: MonthBucket[];
}

/** Six-month attendance and payment trends for a student. */
export const getStudentTrends = async (
  db: PrismaClient,
  organizationId: string,
  studentId: string,
  now = new Date()
): Promise<StudentTrends | null> => {
  const student = await db.student.findFirst({
    where: { id: studentId, organizationId },
    select: { id: true },
  });

  if (!student) {
    return null;
  }

  const keys = lastSixMonthKeys(now);

  const [attendanceRecords, payments] = await Promise.all([
    db.attendanceRecord.findMany({
      where: {
        organizationId,
        studentId,
        session: { sessionDate: { gte: getAcademicYearStart(now) } },
      },
      select: {
        session: { select: { sessionDate: true } },
        status: true,
      },
    }),
    db.payment.findMany({
      where: {
        organizationId,
        studentId,
        reversedAt: null,
        paidAt: { gte: getAcademicYearStart(now) },
      },
      select: { amountSen: true, paidAt: true },
    }),
  ]);

  const markedByMonth = new Map<string, { present: number; total: number }>();

  for (const record of attendanceRecords) {
    if (record.status === "EXCUSED") {
      continue;
    }

    const key = monthKey(record.session.sessionDate);
    const current = markedByMonth.get(key) ?? { present: 0, total: 0 };
    current.total += 1;

    if (record.status === "PRESENT" || record.status === "LATE") {
      current.present += 1;
    }

    markedByMonth.set(key, current);
  }

  return {
    attendanceByMonth: toMonthBuckets(
      keys,
      groupByMonth(
        attendanceRecords,
        (record) => record.session.sessionDate,
        () => 1
      )
    ),
    attendanceRateByMonth: keys.map((key) => {
      const bucket = markedByMonth.get(key);

      return {
        key,
        label: monthLabel(key),
        value:
          bucket && bucket.total > 0
            ? Math.round((bucket.present / bucket.total) * 100)
            : 0,
      };
    }),
    paymentByMonth: toMonthBuckets(
      keys,
      groupByMonth(
        payments,
        (payment) => payment.paidAt,
        (payment) => payment.amountSen
      )
    ),
  };
};

export interface TeacherTrends {
  readonly attendanceCompletionRate: number | null;
  readonly distinctStudentCount: number;
}

/**
 * Attendance completion is completion for created sessions: completed sessions
 * divided by non-cancelled sessions that exist in ClassSession.
 */
export const getTeacherTrends = async (
  db: PrismaClient,
  organizationId: string,
  teacherId: string
): Promise<TeacherTrends | null> => {
  const teacher = await db.teacherProfile.findFirst({
    where: { id: teacherId, organizationId, archivedAt: null },
    select: { id: true },
  });

  if (!teacher) {
    return null;
  }

  const [sessions, enrolledStudentIds] = await Promise.all([
    db.classSession.findMany({
      where: {
        class: { archivedAt: null, organizationId, teacherId },
        cancelledAt: null,
      },
      select: {
        id: true,
        status: true,
        _count: {
          select: {
            attendance: { where: { status: { not: "EXCUSED" } } },
          },
        },
      },
    }),
    db.enrollment.findMany({
      where: {
        archivedAt: null,
        organizationId,
        status: "ACTIVE",
        class: { archivedAt: null, status: "ACTIVE", teacherId },
      },
      distinct: ["studentId"],
      select: { studentId: true },
    }),
  ]);

  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(
    (session) => session.status === "COMPLETED"
  ).length;

  return {
    attendanceCompletionRate:
      totalSessions > 0
        ? Math.round((completedSessions / totalSessions) * 100)
        : null,
    distinctStudentCount: enrolledStudentIds.length,
  };
};

export interface ClassTrends {
  readonly attendanceByMonth: MonthBucket[];
  readonly enrollmentEndsByMonth: MonthBucket[];
  readonly enrollmentStartsByMonth: MonthBucket[];
}

/** Six-month attendance and enrollment trends for a class. */
export const getClassTrends = async (
  db: PrismaClient,
  organizationId: string,
  classId: string,
  now = new Date()
): Promise<ClassTrends | null> => {
  const learningClass = await db.learningClass.findFirst({
    where: { id: classId, organizationId },
    select: { id: true },
  });

  if (!learningClass) {
    return null;
  }

  const keys = lastSixMonthKeys(now);

  const [attendanceRecords, enrollments] = await Promise.all([
    db.attendanceRecord.findMany({
      where: {
        organizationId,
        session: {
          classId,
          sessionDate: { gte: getAcademicYearStart(now) },
        },
      },
      select: {
        session: { select: { sessionDate: true } },
      },
    }),
    db.enrollment.findMany({
      where: {
        classId,
        organizationId,
        archivedAt: null,
      },
      select: { endsOn: true, startsOn: true },
    }),
  ]);

  return {
    attendanceByMonth: toMonthBuckets(
      keys,
      groupByMonth(
        attendanceRecords,
        (record) => record.session.sessionDate,
        () => 1
      )
    ),
    enrollmentEndsByMonth: toMonthBuckets(
      keys,
      groupByMonth(
        enrollments.filter(
          (enrollment): enrollment is typeof enrollment & { endsOn: Date } =>
            enrollment.endsOn !== null
        ),
        (enrollment) => enrollment.endsOn,
        () => 1
      )
    ),
    enrollmentStartsByMonth: toMonthBuckets(
      keys,
      groupByMonth(
        enrollments,
        (enrollment) => enrollment.startsOn,
        () => 1
      )
    ),
  };
};
