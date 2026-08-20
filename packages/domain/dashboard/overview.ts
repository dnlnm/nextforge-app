import "server-only";

import type { AuditAction, PrismaClient } from "@repo/database";
import {
  formatMonthShort,
  getMalaysiaCalendarDate,
  getMalaysiaToday,
} from "@repo/date";
import { timeToMinutes } from "../metrics";

const MALAYSIA_TIME_ZONE = "Asia/Kuala_Lumpur";

/**
 * First instant of the Malaysia calendar month containing `now`. Malaysia is
 * UTC+8, so month boundaries cannot be taken from the UTC calendar date.
 */
const malaysiaMonthStart = (now: Date): Date =>
  new Date(`${getMalaysiaCalendarDate(now).slice(0, 7)}-01T00:00:00+08:00`);

/** First instant of the month following the Malaysia calendar month of `now`. */
const nextMalaysiaMonthStart = (now: Date): Date => {
  const [year] = getMalaysiaCalendarDate(now).split("-").map(Number);
  const monthKey = getMalaysiaCalendarDate(now).slice(0, 7);
  const [, month] = monthKey.split("-").map(Number);
  const nextKey =
    month === 12
      ? `${year + 1}-01`
      : `${year}-${String(month + 1).padStart(2, "0")}`;

  return new Date(`${nextKey}-01T00:00:00+08:00`);
};

/** "yyyy-MM" key of the Malaysia calendar month containing `now`. */
const malaysiaMonthKey = (now: Date): string =>
  getMalaysiaCalendarDate(now).slice(0, 7);

/** Bounds of the Malaysia month before the one containing `now`. */
const previousMalaysiaMonthBounds = (now: Date): { start: Date; end: Date } => {
  const end = malaysiaMonthStart(now);
  const monthKey = getMalaysiaCalendarDate(now).slice(0, 7);
  const [year, month] = monthKey.split("-").map(Number);
  const previousKey =
    month === 1
      ? `${year - 1}-12`
      : `${year}-${String(month - 1).padStart(2, "0")}`;

  return { start: new Date(`${previousKey}-01T00:00:00+08:00`), end };
};

/** Minutes since midnight of the current Malaysia wall clock. */
const malaysiaWallClockMinutes = (now: Date): number => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    timeZone: MALAYSIA_TIME_ZONE,
  }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? 0
  );

  return hour * 60 + minute;
};

const attendanceRateFromCounts = (
  present: number,
  late: number,
  absent: number
): number | null => {
  // Same contract as `attendanceRate` in packages/domain/metrics.ts:
  // (PRESENT + LATE) / all non-EXCUSED marked records.
  const denominator = present + late + absent;

  if (denominator === 0) {
    return null;
  }

  return Math.round(((present + late) / denominator) * 100);
};

export type SessionDisplayStatus =
  | "CANCELLED"
  | "COMPLETED"
  | "IN_PROGRESS"
  | "STARTING_SOON"
  | "UPCOMING";

export interface SessionStatusInfo {
  readonly minutesUntilStart: number | null;
  readonly status: SessionDisplayStatus;
}

/**
 * Derives the dashboard's display status for a session from its DB status plus
 * the Malaysia wall clock. "In progress" and "Starting soon" are time-derived,
 * never stored values.
 */
export const sessionStatusInfo = (
  session: {
    readonly endsAt: string;
    readonly startsAt: string;
    readonly status: string;
  },
  now: Date
): SessionStatusInfo => {
  if (session.status === "CANCELLED") {
    return { minutesUntilStart: null, status: "CANCELLED" };
  }

  if (session.status === "COMPLETED") {
    return { minutesUntilStart: null, status: "COMPLETED" };
  }

  const start = timeToMinutes(session.startsAt);
  const end = timeToMinutes(session.endsAt);

  if (start === null || end === null) {
    return { minutesUntilStart: null, status: "UPCOMING" };
  }

  const nowMinutes = malaysiaWallClockMinutes(now);

  if (nowMinutes < start) {
    const minutesUntilStart = start - nowMinutes;

    return {
      minutesUntilStart,
      status: minutesUntilStart <= 30 ? "STARTING_SOON" : "UPCOMING",
    };
  }

  if (nowMinutes < end) {
    return { minutesUntilStart: null, status: "IN_PROGRESS" };
  }

  return { minutesUntilStart: null, status: "UPCOMING" };
};

export interface DashboardSessionRow {
  readonly displayStatus: SessionStatusInfo;
  readonly endsAt: string;
  readonly id: string;
  readonly roomName: string | null;
  readonly startsAt: string;
  readonly studentCount: number;
  readonly subjectName: string;
  readonly teacherImageUrl: string | null;
  readonly teacherName: string | null;
  readonly title: string;
}

export interface DashboardKpiData {
  readonly classes: {
    readonly addedThisMonth: number;
    readonly total: number;
  };
  readonly fees: {
    readonly collectedSen: number;
    readonly invoicedSen: number;
    readonly outstandingSen: number;
    readonly overdueCount: number;
    readonly targetPercent: number;
  };
  readonly students: {
    readonly addedThisMonth: number;
    readonly total: number;
  };
  readonly teachers: {
    readonly addedThisMonth: number;
    readonly total: number;
  };
}

/** KPI counts and fee summary for the dashboard KPI row. */
export const getDashboardKpiData = async (
  db: PrismaClient,
  organizationId: string,
  now = new Date()
): Promise<DashboardKpiData> => {
  const monthStart = malaysiaMonthStart(now);
  const nextMonthStart = nextMalaysiaMonthStart(now);

  const [
    totalStudents,
    studentsAddedThisMonth,
    totalClasses,
    classesAddedThisMonth,
    totalTeachers,
    teachersAddedThisMonth,
    monthPayments,
    monthInvoices,
    openInvoices,
    overdueInvoiceCount,
  ] = await Promise.all([
    db.student.count({ where: { organizationId, status: "ACTIVE" } }),
    db.student.count({
      where: {
        createdAt: { gte: monthStart, lt: nextMonthStart },
        organizationId,
        status: "ACTIVE",
      },
    }),
    db.learningClass.count({
      where: { archivedAt: null, organizationId, status: "ACTIVE" },
    }),
    db.learningClass.count({
      where: {
        archivedAt: null,
        createdAt: { gte: monthStart, lt: nextMonthStart },
        organizationId,
        status: "ACTIVE",
      },
    }),
    db.teacherProfile.count({ where: { archivedAt: null, organizationId } }),
    db.teacherProfile.count({
      where: {
        archivedAt: null,
        createdAt: { gte: monthStart, lt: nextMonthStart },
        organizationId,
      },
    }),
    db.payment.findMany({
      select: { amountSen: true },
      where: {
        organizationId,
        paidAt: { gte: monthStart, lt: nextMonthStart },
        status: { in: ["RECORDED", "VERIFIED"] },
      },
    }),
    db.invoice.aggregate({
      _sum: { totalSen: true },
      where: {
        billingMonth: malaysiaMonthKey(now),
        organizationId,
        voidedAt: null,
      },
    }),
    db.invoice.findMany({
      select: { amountPaidSen: true, totalSen: true },
      where: {
        organizationId,
        status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] },
      },
    }),
    db.invoice.count({ where: { organizationId, status: "OVERDUE" } }),
  ]);

  const collectedSen = monthPayments.reduce(
    (sum, payment) => sum + payment.amountSen,
    0
  );
  const invoicedSen = monthInvoices._sum.totalSen ?? 0;
  const outstandingSen = openInvoices.reduce(
    (sum, invoice) =>
      sum + Math.max(0, invoice.totalSen - invoice.amountPaidSen),
    0
  );

  return {
    classes: { addedThisMonth: classesAddedThisMonth, total: totalClasses },
    fees: {
      collectedSen,
      invoicedSen,
      outstandingSen,
      overdueCount: overdueInvoiceCount,
      targetPercent:
        invoicedSen > 0 ? Math.round((collectedSen / invoicedSen) * 100) : 0,
    },
    students: { addedThisMonth: studentsAddedThisMonth, total: totalStudents },
    teachers: { addedThisMonth: teachersAddedThisMonth, total: totalTeachers },
  };
};

export interface TodaysClassesData {
  readonly sessions: DashboardSessionRow[];
}

export const getTodaysClassesData = async (
  db: PrismaClient,
  organizationId: string,
  now = new Date()
): Promise<TodaysClassesData> => {
  const today = getMalaysiaToday(now);
  const sessions = await db.classSession.findMany({
    include: {
      class: {
        include: {
          schedules: {
            orderBy: { dayOfWeek: "asc" },
            select: { room: { select: { name: true } } },
          },
          subject: { select: { name: true } },
          teacher: {
            select: {
              fullName: true,
              User: { select: { imageUrl: true } },
            },
          },
          _count: {
            select: {
              enrollments: { where: { status: "ACTIVE" } },
            },
          },
        },
      },
    },
    orderBy: { startsAt: "asc" },
    where: { organizationId, sessionDate: today },
  });

  return {
    sessions: sessions.map((session) => ({
      displayStatus: sessionStatusInfo(session, now),
      endsAt: session.endsAt,
      id: session.id,
      roomName: session.class.schedules.at(0)?.room?.name ?? null,
      startsAt: session.startsAt,
      studentCount: session.class._count.enrollments,
      subjectName: session.class.subject.name,
      teacherImageUrl: session.class.teacher?.User?.imageUrl ?? null,
      teacherName: session.class.teacher?.fullName ?? null,
      title: session.class.name,
    })),
  };
};

export type AttentionSeverity = "INFO" | "URGENT" | "WARNING";

export type AttentionIconKey = "BANKNOTE" | "CHALKBOARD" | "CLOCK" | "STUDENTS";

export interface AttentionItem {
  readonly count?: number;
  readonly description: string;
  readonly href: string;
  readonly icon: AttentionIconKey;
  readonly id: string;
  readonly severity: AttentionSeverity;
  readonly title: string;
}

export interface NeedsAttentionData {
  readonly items: AttentionItem[];
}

const LOW_ATTENDANCE_THRESHOLD = 75;
const LOW_ATTENDANCE_MIN_RECORDS = 5;

const countLowAttendanceStudents = (
  records: readonly {
    readonly _count: { readonly id: number };
    readonly status: string;
    readonly studentId: string;
  }[]
): number => {
  const recordCountByStudent = new Map<
    string,
    { absent: number; late: number; present: number; total: number }
  >();

  for (const record of records) {
    const entry = recordCountByStudent.get(record.studentId) ?? {
      absent: 0,
      late: 0,
      present: 0,
      total: 0,
    };

    entry.total += record._count.id;

    if (record.status === "ABSENT") {
      entry.absent += record._count.id;
    } else if (record.status === "LATE") {
      entry.late += record._count.id;
    } else if (record.status === "PRESENT") {
      entry.present += record._count.id;
    }

    recordCountByStudent.set(record.studentId, entry);
  }

  return [...recordCountByStudent.values()].filter((entry) => {
    const percentage = attendanceRateFromCounts(
      entry.present,
      entry.late,
      entry.absent
    );

    return (
      entry.total >= LOW_ATTENDANCE_MIN_RECORDS &&
      (percentage ?? 100) < LOW_ATTENDANCE_THRESHOLD
    );
  }).length;
};

export const getNeedsAttentionData = async (
  db: PrismaClient,
  organizationId: string,
  now = new Date()
): Promise<NeedsAttentionData> => {
  const today = getMalaysiaToday(now);
  const monthStart = malaysiaMonthStart(now);
  const nextMonthStart = nextMalaysiaMonthStart(now);

  const [
    todaySessions,
    overdueInvoiceCount,
    overdueInvoiceStudents,
    unassignedClasses,
    monthlyAttendance,
  ] = await Promise.all([
    db.classSession.findMany({
      select: {
        class: { select: { name: true } },
        endsAt: true,
        startsAt: true,
        status: true,
      },
      orderBy: { startsAt: "asc" },
      where: { organizationId, sessionDate: today },
    }),
    db.invoice.count({ where: { organizationId, status: "OVERDUE" } }),
    db.invoice.groupBy({
      _count: { id: true },
      by: ["studentId"],
      where: { organizationId, status: "OVERDUE" },
    }),
    db.learningClass.count({
      where: {
        archivedAt: null,
        organizationId,
        status: "ACTIVE",
        teacherId: null,
      },
    }),
    db.attendanceRecord.groupBy({
      _count: { id: true },
      by: ["status", "studentId"],
      where: {
        markedAt: { gte: monthStart, lt: nextMonthStart },
        organizationId,
      },
    }),
  ]);

  const items: AttentionItem[] = [];

  const nextSession = todaySessions
    .map((session) => ({
      displayStatus: sessionStatusInfo(session, now),
      session,
    }))
    .find(({ displayStatus }) => displayStatus.status === "STARTING_SOON");

  if (nextSession) {
    const minutes = Math.max(
      1,
      Math.round(nextSession.displayStatus.minutesUntilStart ?? 0)
    );

    items.push({
      description: `${nextSession.session.class.name} starts in ${minutes} ${minutes === 1 ? "minute" : "minutes"}`,
      href: "/today",
      icon: "CLOCK",
      id: "upcoming-class",
      severity: "URGENT",
      title: "Upcoming Class",
    });
  }

  if (overdueInvoiceCount > 0) {
    items.push({
      count: overdueInvoiceCount,
      description: `${overdueInvoiceCount} ${overdueInvoiceCount === 1 ? "invoice" : "invoices"} from ${overdueInvoiceStudents.length} ${overdueInvoiceStudents.length === 1 ? "student" : "students"}`,
      href: "/invoices",
      icon: "BANKNOTE",
      id: "overdue-invoices",
      severity: "WARNING",
      title: "Overdue Invoices",
    });
  }

  if (unassignedClasses > 0) {
    items.push({
      count: unassignedClasses,
      description: `Assign a teacher to ${unassignedClasses} ${unassignedClasses === 1 ? "class" : "classes"}`,
      href: "/classes",
      icon: "CHALKBOARD",
      id: "classes-without-teacher",
      severity: "INFO",
      title: "Classes Without Teacher",
    });
  }

  const lowAttendanceCount = countLowAttendanceStudents(monthlyAttendance);

  if (lowAttendanceCount > 0) {
    items.push({
      count: lowAttendanceCount,
      description: `${lowAttendanceCount} ${lowAttendanceCount === 1 ? "student" : "students"} below ${LOW_ATTENDANCE_THRESHOLD}% attendance`,
      href: "/attendance",
      icon: "STUDENTS",
      id: "low-attendance-students",
      severity: "WARNING",
      title: "Low Attendance Students",
    });
  }

  return { items };
};

export interface FeeCollectionPoint {
  readonly collected: number;
  readonly day: string;
  readonly target: number;
}

export interface FeeCollectionData {
  readonly collectedSen: number;
  readonly invoicedSen: number;
  readonly outstandingSen: number;
  readonly overdueCount: number;
  readonly targetPercent: number;
  readonly trend: FeeCollectionPoint[];
}

export const getFeeCollectionData = async (
  db: PrismaClient,
  organizationId: string,
  now = new Date()
): Promise<FeeCollectionData> => {
  const monthStart = malaysiaMonthStart(now);
  const nextMonthStart = nextMalaysiaMonthStart(now);

  const [monthPayments, monthInvoices, openInvoices, overdueInvoiceCount] =
    await Promise.all([
      db.payment.findMany({
        select: { amountSen: true, paidAt: true },
        orderBy: { paidAt: "asc" },
        where: {
          organizationId,
          paidAt: { gte: monthStart, lt: nextMonthStart },
          status: { in: ["RECORDED", "VERIFIED"] },
        },
      }),
      db.invoice.aggregate({
        _sum: { totalSen: true },
        where: {
          billingMonth: malaysiaMonthKey(now),
          organizationId,
          voidedAt: null,
        },
      }),
      db.invoice.findMany({
        select: { amountPaidSen: true, totalSen: true },
        where: {
          organizationId,
          status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] },
        },
      }),
      db.invoice.count({ where: { organizationId, status: "OVERDUE" } }),
    ]);

  const collectedSen = monthPayments.reduce(
    (sum, payment) => sum + payment.amountSen,
    0
  );
  const invoicedSen = monthInvoices._sum.totalSen ?? 0;
  const outstandingSen = openInvoices.reduce(
    (sum, invoice) =>
      sum + Math.max(0, invoice.totalSen - invoice.amountPaidSen),
    0
  );
  const daysInMonth =
    (nextMonthStart.getTime() - monthStart.getTime()) / 86_400_000;
  const targetMajor = Math.round(invoicedSen / 100);
  const dayBreakdown = new Map<number, number>();

  for (const payment of monthPayments) {
    const day = new Date(payment.paidAt.getTime() + 8 * 3_600_000).getUTCDate();
    dayBreakdown.set(day, (dayBreakdown.get(day) ?? 0) + payment.amountSen);
  }

  const monthShort = formatMonthShort(monthStart);
  let cumulativeSen = 0;
  const trend: FeeCollectionPoint[] = Array.from(
    { length: daysInMonth },
    (_, index) => {
      const day = index + 1;
      cumulativeSen += dayBreakdown.get(day) ?? 0;

      return {
        collected: Math.round(cumulativeSen / 100),
        day: `${day} ${monthShort}`,
        target: targetMajor,
      };
    }
  );

  return {
    collectedSen,
    invoicedSen,
    outstandingSen,
    overdueCount: overdueInvoiceCount,
    targetPercent:
      invoicedSen > 0 ? Math.round((collectedSen / invoicedSen) * 100) : 0,
    trend,
  };
};

export interface AttendancePoint {
  readonly label: string;
  readonly value: number;
}

export interface AttendanceData {
  readonly absentToday: {
    readonly gender: string | null;
    readonly id: string;
    readonly name: string;
    readonly photoKey: string | null;
  }[];
  readonly absentTodayTotal: number;
  readonly monthlyPercentage: number | null;
  readonly vsLastMonthPp: number;
  readonly weeklyTrend: AttendancePoint[];
}

export const getAttendanceData = async (
  db: PrismaClient,
  organizationId: string,
  now = new Date()
): Promise<AttendanceData> => {
  const today = getMalaysiaToday(now);
  const monthStart = malaysiaMonthStart(now);
  const nextMonthStart = nextMalaysiaMonthStart(now);
  const previousMonth = previousMalaysiaMonthBounds(now);

  const [monthlyRecords, previousMonthRecords, absentToday, absentTodayTotal] =
    await Promise.all([
      db.attendanceRecord.findMany({
        select: { markedAt: true, status: true },
        where: {
          markedAt: { gte: monthStart, lt: nextMonthStart },
          organizationId,
        },
      }),
      db.attendanceRecord.findMany({
        select: { status: true },
        where: {
          markedAt: { gte: previousMonth.start, lt: previousMonth.end },
          organizationId,
        },
      }),
      db.attendanceRecord.findMany({
        distinct: ["studentId"],
        select: {
          student: {
            select: {
              fullName: true,
              gender: true,
              id: true,
              photoKey: true,
            },
          },
        },
        orderBy: { markedAt: "desc" },
        take: 6,
        where: {
          organizationId,
          session: { sessionDate: today },
          status: "ABSENT",
        },
      }),
      db.attendanceRecord.groupBy({
        _count: { id: true },
        by: ["studentId"],
        where: {
          organizationId,
          session: { sessionDate: today },
          status: "ABSENT",
        },
      }),
    ]);

  const applyStatus = (
    counts: { absent: number; late: number; present: number },
    status: string
  ): { absent: number; late: number; present: number } => {
    if (status === "ABSENT") {
      return { ...counts, absent: counts.absent + 1 };
    }

    if (status === "LATE") {
      return { ...counts, late: counts.late + 1 };
    }

    if (status === "PRESENT") {
      return { ...counts, present: counts.present + 1 };
    }

    return counts;
  };

  let monthlyCounts = { absent: 0, late: 0, present: 0 };
  let previousCounts = { absent: 0, late: 0, present: 0 };

  for (const record of monthlyRecords) {
    monthlyCounts = applyStatus(monthlyCounts, record.status);
  }

  for (const record of previousMonthRecords) {
    previousCounts = applyStatus(previousCounts, record.status);
  }

  const monthlyPercentage = attendanceRateFromCounts(
    monthlyCounts.present,
    monthlyCounts.late,
    monthlyCounts.absent
  );
  const previousPercentage = attendanceRateFromCounts(
    previousCounts.present,
    previousCounts.late,
    previousCounts.absent
  );
  const vsLastMonthPp =
    monthlyPercentage === null || previousPercentage === null
      ? 0
      : monthlyPercentage - previousPercentage;

  const weeks = new Map<
    number,
    { absent: number; late: number; present: number }
  >();

  for (const record of monthlyRecords) {
    const weekIndex = Math.floor(
      (new Date(record.markedAt.getTime() + 8 * 3_600_000).getUTCDate() - 1) / 7
    );
    const entry = weeks.get(weekIndex) ?? { absent: 0, late: 0, present: 0 };

    weeks.set(weekIndex, applyStatus(entry, record.status));
  }

  const weeklyTrend = [...weeks.entries()]
    .sort(([left], [right]) => left - right)
    .map(([weekIndex, counts]) => ({
      label: `Week ${weekIndex + 1}`,
      value:
        attendanceRateFromCounts(counts.present, counts.late, counts.absent) ??
        0,
    }));

  return {
    absentToday: absentToday.map((record) => ({
      gender: record.student.gender,
      id: record.student.id,
      name: record.student.fullName,
      photoKey: record.student.photoKey,
    })),
    absentTodayTotal: absentTodayTotal.length,
    monthlyPercentage,
    vsLastMonthPp,
    weeklyTrend,
  };
};

export type ActivityIconKey =
  | "ACTIVITY"
  | "ATTENDANCE"
  | "ENROLLMENT"
  | "INVOICE"
  | "PAYMENT"
  | "STUDENT";

export interface ActivityItem {
  readonly createdAt: Date;
  readonly icon: ActivityIconKey;
  readonly id: string;
  readonly summary: string;
}

const activityIconByEventType: Record<string, ActivityIconKey> = {
  "attendance.marked": "ATTENDANCE",
  "enrollment.created": "ENROLLMENT",
  "enrollment.ended": "ENROLLMENT",
  "enrollment.transferred": "ENROLLMENT",
  "invoice.generated": "INVOICE",
  "payment.recorded": "PAYMENT",
  "payment.reversed": "PAYMENT",
  "payment.verified": "PAYMENT",
  "student.archived": "STUDENT",
  "student.created": "STUDENT",
  "student.restored": "STUDENT",
};

export interface RecentActivityData {
  readonly items: ActivityItem[];
}

/** Low-value system events that should never appear on the dashboard feed. */
const HIDDEN_ACTIVITY_ACTIONS: readonly AuditAction[] = ["ACCESS", "SYSTEM"];

export const getRecentActivityData = async (
  db: PrismaClient,
  organizationId: string
): Promise<RecentActivityData> => {
  const events = await db.auditEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    where: {
      action: { notIn: [...HIDDEN_ACTIVITY_ACTIONS] },
      organizationId,
    },
  });

  return {
    items: events.map((event) => {
      const eventType =
        event.metadata !== null &&
        typeof event.metadata === "object" &&
        "eventType" in event.metadata
          ? String(event.metadata.eventType)
          : undefined;

      return {
        createdAt: event.createdAt,
        icon: eventType
          ? (activityIconByEventType[eventType] ?? "ACTIVITY")
          : "ACTIVITY",
        id: event.id,
        summary: event.summary,
      };
    }),
  };
};
