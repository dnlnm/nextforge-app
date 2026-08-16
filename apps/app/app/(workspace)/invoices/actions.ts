"use server";

import { requireTenantRole } from "@repo/auth/authorization";
import { database } from "@repo/database";
import { invoiceGeneratedEvent } from "@repo/domain/students/activity";
import { billingMonthSchema } from "@repo/schemas/invoices";
import { revalidatePath } from "next/cache";
import { assertWithinPlanLimitTx } from "../billing/limits";
import {
  formatSequenceNumber,
  reserveNextSequence,
} from "../billing/sequences";

const getString = (formData: FormData, key: string) => {
  const value = formData.get(key);

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const parseBillingMonth = (value?: string) => {
  const parsed = billingMonthSchema.safeParse(value);

  return parsed.success ? parsed.data : null;
};

const getDueDate = (billingMonth: string, dueDay: number) => {
  const [year, month] = billingMonth.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, Math.min(Math.max(dueDay, 1), 28)));
};

export const generateMonthlyInvoices = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const billingMonth = parseBillingMonth(getString(formData, "billingMonth"));

  if (!billingMonth) {
    throw new Error("Billing month is required.");
  }

  const settings = await database.organizationSettings.findUnique({
    where: { organizationId: tenant.organizationId },
  });
  // Only bill students whose enrollment date and class start date are in or
  // before the billing month, so students who register early but start later
  // are not invoiced before they actually begin.
  const [year, month] = billingMonth.split("-").map(Number);
  const endOfBillingMonth = new Date(Date.UTC(year, month, 1));
  const enrollments = await database.enrollment.findMany({
    where: {
      organizationId: tenant.organizationId,
      status: "ACTIVE",
      startsOn: { lte: endOfBillingMonth },
      student: { status: "ACTIVE", enrolledAt: { lte: endOfBillingMonth } },
      class: { status: "ACTIVE" },
    },
    include: {
      class: { include: { subject: true } },
      student: true,
    },
    orderBy: [{ student: { fullName: "asc" } }, { class: { name: "asc" } }],
  });
  const enrollmentsByStudent = new Map<string, typeof enrollments>();

  for (const enrollment of enrollments) {
    const current = enrollmentsByStudent.get(enrollment.studentId) ?? [];
    current.push(enrollment);
    enrollmentsByStudent.set(enrollment.studentId, current);
  }

  const existingInvoices = await database.invoice.findMany({
    where: {
      billingMonth,
      organizationId: tenant.organizationId,
      studentId: { in: Array.from(enrollmentsByStudent.keys()) },
    },
    select: { studentId: true },
  });
  const newInvoiceCount =
    enrollmentsByStudent.size -
    new Set(existingInvoices.map((invoice) => invoice.studentId)).size;

  // Run the whole batch inside one transaction so invoice numbers are reserved
  // atomically, the plan-limit check and creates commit (or roll back)
  // together, and a mid-batch failure no longer leaves a partial set of
  // students invoiced.
  await database.$transaction(async (tx) => {
    await assertWithinPlanLimitTx(tx, {
      increment: newInvoiceCount,
      organizationId: tenant.organizationId,
      resource: "invoicesPerMonth",
      userId: tenant.authUserId,
    });

    for (const [studentId, studentEnrollments] of enrollmentsByStudent) {
      const existing = await tx.invoice.findUnique({
        where: {
          organizationId_studentId_billingMonth: {
            billingMonth,
            organizationId: tenant.organizationId,
            studentId,
          },
        },
        select: { id: true },
      });

      if (existing) {
        continue;
      }

      const lineItems = studentEnrollments.map((enrollment) => {
        const amountSen =
          enrollment.customFeeSen ?? enrollment.class.monthlyFeeSen ?? 0;

        return {
          classId: enrollment.classId,
          description: `${enrollment.class.subject.name} - ${enrollment.class.name}`,
          quantity: 1,
          totalSen: amountSen,
          unitPriceSen: amountSen,
        };
      });
      const totalSen = lineItems.reduce((sum, item) => sum + item.totalSen, 0);

      const invoiceNumberValue = await reserveNextSequence(
        tx,
        tenant.organizationId,
        "INVOICE"
      );
      const invoiceNumber = formatSequenceNumber(
        settings?.invoicePrefix ?? "INV",
        invoiceNumberValue
      );

      const invoice = await tx.invoice.create({
        data: {
          organizationId: tenant.organizationId,
          billingMonth,
          dueDate: getDueDate(
            billingMonth,
            settings?.defaultInvoiceDueDay ?? 7
          ),
          invoiceNumber,
          lineItems: { create: lineItems },
          status: "ISSUED",
          studentId,
          subtotalSen: totalSen,
          totalSen,
        },
        select: { id: true },
      });

      const student = studentEnrollments[0]?.student;

      const event = invoiceGeneratedEvent(
        tenant.organizationId,
        studentId,
        student?.fullName ?? "student",
        invoice.id,
        invoiceNumber,
        tenant.userId
      );

      await tx.auditEvent.create({ data: event });
    }
  });

  revalidatePath("/invoices");
  revalidatePath("/payments");
};
