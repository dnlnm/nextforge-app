import "server-only";

import type { PrismaClient } from "@repo/database";
import { getAcademicYearStart } from "@repo/date";
import { attendanceRate, summarizeInvoices } from "../metrics";

export { listStudentActivity } from "./activity";

export interface StudentDashboardInput {
  readonly organizationId: string;
  readonly studentId: string;
}

/**
 * Aggregates a student's overview totals from full histories rather than the
 * latest few records, then loads limited recent lists for display.
 */
export const getStudentDashboard = async (
  db: PrismaClient,
  { organizationId, studentId }: StudentDashboardInput
) => {
  const student = await db.student.findFirst({
    where: { archivedAt: null, id: studentId, organizationId },
    select: { id: true },
  });

  if (!student) {
    return null;
  }

  const [activeEnrollmentCount, invoices, attendanceStatuses] =
    await Promise.all([
      db.enrollment.count({
        where: {
          archivedAt: null,
          organizationId,
          status: "ACTIVE",
          studentId,
          class: { archivedAt: null, status: "ACTIVE" },
        },
      }),
      db.invoice.findMany({
        where: {
          organizationId,
          studentId,
          voidedAt: null,
        },
        select: { amountPaidSen: true, totalSen: true },
      }),
      db.attendanceRecord.findMany({
        where: {
          organizationId,
          studentId,
          session: {
            sessionDate: {
              gte: getAcademicYearStart(),
            },
          },
        },
        select: { status: true },
      }),
    ]);

  const money = summarizeInvoices(invoices);
  const rate = attendanceRate(
    attendanceStatuses.map((record) => record.status)
  );

  return {
    activeEnrollmentCount,
    attendanceRate: rate,
    outstandingSen: money.outstandingSen,
    totalBilledSen: money.totalBilledSen,
    totalPaidSen: money.totalPaidSen,
  };
};

export interface StudentOverview {
  readonly activeClasses: number;
  readonly attendanceRate: number | null;
  readonly outstandingSen: number;
  readonly primaryGuardian?: {
    readonly email: string | null;
    readonly fullName: string;
    readonly phone: string | null;
  } | null;
}

/** Overview fields used by the student profile header. */
export const getStudentOverview = async (
  db: PrismaClient,
  { organizationId, studentId }: StudentDashboardInput
): Promise<StudentOverview | null> => {
  const student = await db.student.findFirst({
    where: { archivedAt: null, id: studentId, organizationId },
    select: {
      guardians: {
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        take: 1,
        select: {
          guardian: {
            select: { email: true, fullName: true, phone: true },
          },
        },
      },
      id: true,
    },
  });

  if (!student) {
    return null;
  }

  const dashboard = await getStudentDashboard(db, {
    organizationId,
    studentId,
  });

  if (!dashboard) {
    return null;
  }

  return {
    activeClasses: dashboard.activeEnrollmentCount,
    attendanceRate: dashboard.attendanceRate,
    outstandingSen: dashboard.outstandingSen,
    primaryGuardian: student.guardians[0]?.guardian ?? null,
  };
};
