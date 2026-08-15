import "server-only";

import type { PrismaClient } from "@repo/database";
import { getAcademicYearStart } from "@repo/date";
import { attendanceRate, capacityInfo, invoiceBalanceSen } from "../metrics";

export interface ClassDashboardInput {
  readonly classId: string;
  readonly organizationId: string;
}

/** Aggregates class health: capacity, attendance, billed revenue, outstanding. */
export const getClassDashboard = async (
  db: PrismaClient,
  { classId, organizationId }: ClassDashboardInput
) => {
  const learningClass = await db.learningClass.findFirst({
    where: { archivedAt: null, id: classId, organizationId },
    select: { capacity: true },
  });

  if (!learningClass) {
    return null;
  }

  const [activeEnrollmentCount, attendanceStatuses, billedLines, invoiceIds] =
    await Promise.all([
      db.enrollment.count({
        where: {
          archivedAt: null,
          classId,
          organizationId,
          status: "ACTIVE",
        },
      }),
      db.attendanceRecord.findMany({
        where: {
          organizationId,
          session: {
            classId,
            sessionDate: { gte: getAcademicYearStart() },
          },
        },
        select: { status: true },
      }),
      db.invoiceLineItem.findMany({
        where: {
          classId,
          invoice: { voidedAt: null },
        },
        select: { totalSen: true },
      }),
      db.invoiceLineItem.findMany({
        where: { classId, invoice: { voidedAt: null } },
        distinct: ["invoiceId"],
        select: { invoiceId: true },
      }),
    ]);

  const billedRevenueSen = billedLines.reduce(
    (total, line) => total + line.totalSen,
    0
  );

  const invoices = await db.invoice.findMany({
    where: {
      id: { in: invoiceIds.map((item) => item.invoiceId) },
      organizationId,
      voidedAt: null,
    },
    select: { amountPaidSen: true, totalSen: true },
  });

  const outstandingSen = invoices.reduce(
    (total, invoice) => total + invoiceBalanceSen(invoice),
    0
  );

  return {
    activeEnrollmentCount,
    attendanceRate: attendanceRate(attendanceStatuses.map((r) => r.status)),
    billedRevenueSen,
    capacity: capacityInfo(activeEnrollmentCount, learningClass.capacity),
    outstandingSen,
  };
};
