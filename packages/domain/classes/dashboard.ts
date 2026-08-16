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

  const [activeEnrollmentCount, attendanceStatuses, lineItems] =
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
      // One query covers both billed revenue (sum of line totals) and the
      // distinct invoiced set (for the outstanding balance) instead of three
      // scans over the same line items.
      db.invoiceLineItem.findMany({
        where: {
          classId,
          invoice: { voidedAt: null },
        },
        select: {
          invoice: {
            select: { amountPaidSen: true, id: true, totalSen: true },
          },
          totalSen: true,
        },
      }),
    ]);

  const billedRevenueSen = lineItems.reduce(
    (total, line) => total + line.totalSen,
    0
  );

  // Outstanding is the sum of each distinct invoice's balance (a class can
  // have several line items per invoice, so dedup by invoice id).
  const outstandingInvoiceIds = new Set(lineItems.map((line) => line.invoice.id));
  const outstandingSen = Array.from(outstandingInvoiceIds).reduce((total, id) => {
    const invoice = lineItems.find((line) => line.invoice.id === id)?.invoice;

    return invoice ? total + invoiceBalanceSen(invoice) : total;
  }, 0);

  return {
    activeEnrollmentCount,
    attendanceRate: attendanceRate(attendanceStatuses.map((r) => r.status)),
    billedRevenueSen,
    capacity: capacityInfo(activeEnrollmentCount, learningClass.capacity),
    outstandingSen,
  };
};
