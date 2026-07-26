"use server";

import { requireTenantRole } from "@repo/auth/authorization";
import { database, type PaymentMethod } from "@repo/database";
import { revalidatePath } from "next/cache";

const methods = new Set<PaymentMethod>([
  "CASH",
  "BANK_TRANSFER",
  "DUITNOW",
  "FPX",
  "CARD",
  "OTHER",
]);

const getString = (formData: FormData, key: string) => {
  const value = formData.get(key);

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const getMoneySen = (formData: FormData, key: string) => {
  const value = getString(formData, key);

  if (!value) {
    return undefined;
  }

  const parsed = Number.parseFloat(value);

  return Number.isNaN(parsed) ? undefined : Math.round(parsed * 100);
};

const nextReceiptNumber = async (organizationId: string, prefix: string) => {
  const count = await database.payment.count({ where: { organizationId } });

  return `${prefix}-${String(count + 1).padStart(5, "0")}`;
};

const getInvoiceStatusAfterPaymentChange = (
  amountPaidSen: number,
  totalSen: number
) => {
  if (amountPaidSen <= 0) {
    return "ISSUED";
  }

  return amountPaidSen >= totalSen ? "PAID" : "PARTIALLY_PAID";
};

export const recordPayment = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const invoiceId = getString(formData, "invoiceId");
  const amountSen = getMoneySen(formData, "amount");
  const method = getString(formData, "method") as PaymentMethod | undefined;

  if (!(invoiceId && amountSen && method && methods.has(method))) {
    throw new Error("Invoice, amount, and payment method are required.");
  }

  const invoice = await database.invoice.findFirst({
    where: { id: invoiceId, organizationId: tenant.organizationId },
    select: {
      amountPaidSen: true,
      id: true,
      studentId: true,
      totalSen: true,
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found.");
  }

  const outstandingSen = invoice.totalSen - invoice.amountPaidSen;
  const allocationSen = Math.min(amountSen, outstandingSen);

  if (allocationSen <= 0) {
    throw new Error("Invoice is already paid.");
  }

  const settings = await database.organizationSettings.findUnique({
    where: { organizationId: tenant.organizationId },
    select: { receiptPrefix: true },
  });
  const receiptNumber = await nextReceiptNumber(
    tenant.organizationId,
    settings?.receiptPrefix ?? "RCP"
  );

  await database.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        organizationId: tenant.organizationId,
        amountSen,
        method,
        notes: getString(formData, "notes"),
        receiptNumber,
        recordedByUserId: tenant.userId,
        reference: getString(formData, "reference"),
        studentId: invoice.studentId,
      },
      select: { id: true },
    });
    const nextPaidSen = invoice.amountPaidSen + allocationSen;

    await tx.paymentAllocation.create({
      data: {
        amountSen: allocationSen,
        invoiceId: invoice.id,
        paymentId: payment.id,
      },
    });
    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        amountPaidSen: nextPaidSen,
        status: nextPaidSen >= invoice.totalSen ? "PAID" : "PARTIALLY_PAID",
      },
    });
  });

  revalidatePath("/invoices");
  revalidatePath("/payments");
};

export const reversePayment = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const paymentId = getString(formData, "paymentId");

  if (!paymentId) {
    throw new Error("Payment is required.");
  }

  const payment = await database.payment.findFirst({
    where: {
      id: paymentId,
      organizationId: tenant.organizationId,
      status: "RECORDED",
    },
    include: { allocations: { include: { invoice: true } } },
  });

  if (!payment) {
    throw new Error("Payment not found or already reversed.");
  }

  await database.$transaction(async (tx) => {
    for (const allocation of payment.allocations) {
      const nextPaidSen = Math.max(
        allocation.invoice.amountPaidSen - allocation.amountSen,
        0
      );

      await tx.invoice.update({
        where: { id: allocation.invoiceId },
        data: {
          amountPaidSen: nextPaidSen,
          status: getInvoiceStatusAfterPaymentChange(
            nextPaidSen,
            allocation.invoice.totalSen
          ),
        },
      });
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: { reversedAt: new Date(), status: "REVERSED" },
    });
  });

  revalidatePath("/invoices");
  revalidatePath("/payments");
};
