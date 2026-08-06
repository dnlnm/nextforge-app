"use server";

import { requireTenantRole } from "@repo/auth/authorization";
import { database } from "@repo/database";
import { revalidatePath } from "next/cache";
import { assertWithinPlanLimit } from "../billing/limits";

const getString = (formData: FormData, key: string) => {
  const value = formData.get(key);

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const billingMonthRegex = /^\d{4}-\d{2}$/;

const parseBillingMonth = (value?: string) => {
  if (!value) {
    return null;
  }

  if (!billingMonthRegex.test(value)) {
    return null;
  }

  return value;
};

const getDueDate = (billingMonth: string, dueDay: number) => {
  const [year, month] = billingMonth.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, Math.min(Math.max(dueDay, 1), 28)));
};

const nextInvoiceNumber = async (organizationId: string, prefix: string) => {
  const count = await database.invoice.count({ where: { organizationId } });

  return `${prefix}-${String(count + 1).padStart(5, "0")}`;
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

  await assertWithinPlanLimit({
    increment: newInvoiceCount,
    organizationId: tenant.organizationId,
    resource: "invoicesPerMonth",
    userId: tenant.authUserId,
  });

  for (const [studentId, studentEnrollments] of enrollmentsByStudent) {
    const existing = await database.invoice.findUnique({
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

    await database.invoice.create({
      data: {
        organizationId: tenant.organizationId,
        billingMonth,
        dueDate: getDueDate(billingMonth, settings?.defaultInvoiceDueDay ?? 7),
        invoiceNumber: await nextInvoiceNumber(
          tenant.organizationId,
          settings?.invoicePrefix ?? "INV"
        ),
        lineItems: { create: lineItems },
        status: "ISSUED",
        studentId,
        subtotalSen: totalSen,
        totalSen,
      },
    });
  }

  revalidatePath("/invoices");
  revalidatePath("/payments");
};
