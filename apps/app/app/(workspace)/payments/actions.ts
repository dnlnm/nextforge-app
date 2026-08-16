"use server";

import { requireTenantRole } from "@repo/auth/authorization";
import { database } from "@repo/database";
import {
  paymentRecordedEvent,
  paymentReversedEvent,
} from "@repo/domain/students/activity";
import { parseMoneyToSen } from "@repo/money";
import { type PaymentMethod, paymentMethods } from "@repo/schemas/enums";
import { revalidatePath } from "next/cache";
import {
  formatSequenceNumber,
  reserveNextSequence,
} from "../billing/sequences";

const methods = new Set<PaymentMethod>(paymentMethods);

const getString = (formData: FormData, key: string) => {
  const value = formData.get(key);

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const getMoneySen = (formData: FormData, key: string) =>
  parseMoneyToSen(getString(formData, key));

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

  const settings = await database.organizationSettings.findUnique({
    where: { organizationId: tenant.organizationId },
    select: { receiptPrefix: true },
  });

  await database.$transaction(async (tx) => {
    // Reserve the receipt number inside the transaction so two simultaneous
    // payments never produce the same number (count(...) + 1 was both racy and
    // non-monotonic).
    const receiptNumberValue = await reserveNextSequence(
      tx,
      tenant.organizationId,
      "RECEIPT"
    );
    const receiptNumber = formatSequenceNumber(
      settings?.receiptPrefix ?? "RCP",
      receiptNumberValue
    );
    // Read the invoice inside the transaction so `outstandingSen` reflects the
    // latest committed state. Reading it before the tx (and reusing the value
    // here) allowed two concurrent payments to the same invoice to both apply
    // against the same stale `amountPaidSen`, silently dropping one allocation.
    const invoice = await tx.invoice.findFirst({
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

    await tx.paymentAllocation.create({
      data: {
        amountSen: allocationSen,
        invoiceId: invoice.id,
        paymentId: payment.id,
      },
    });

    // Use an atomic increment so a concurrent payment against the same invoice
    // accumulates rather than losing an allocation to a lost update.
    const updated = await tx.invoice.update({
      where: { id: invoice.id },
      data: { amountPaidSen: { increment: allocationSen } },
      select: { amountPaidSen: true, totalSen: true },
    });

    if (updated.amountPaidSen > updated.totalSen) {
      throw new Error("Payment would overpay this invoice.");
    }

    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        status:
          updated.amountPaidSen >= updated.totalSen ? "PAID" : "PARTIALLY_PAID",
      },
    });

    const studentName = await tx.student
      .findFirst({
        where: { id: invoice.studentId, organizationId: tenant.organizationId },
        select: { fullName: true },
      })
      .then((student) => student?.fullName ?? "student");

    const event = paymentRecordedEvent(
      tenant.organizationId,
      invoice.studentId,
      studentName,
      payment.id,
      amountSen,
      tenant.userId
    );

    await tx.auditEvent.create({ data: event });
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
    select: {
      allocations: {
        select: {
          amountSen: true,
          invoice: { select: { amountPaidSen: true, id: true, totalSen: true } },
          invoiceId: true,
        },
      },
      amountSen: true,
      id: true,
      studentId: true,
    },
  });

  if (!payment) {
    throw new Error("Payment not found or already reversed.");
  }

  await database.$transaction(async (tx) => {
    for (const allocation of payment.allocations) {
      // Read the current balance inside the transaction, then decrement
      // atomically. Pre-fetching `amountPaidSen` and writing an absolute value
      // allowed a concurrent `recordPayment` against the same invoice to be
      // overwritten during a reversal.
      const invoice = await tx.invoice.findUnique({
        where: { id: allocation.invoiceId },
        select: { amountPaidSen: true, id: true, totalSen: true },
      });

      if (!invoice) {
        throw new Error("Invoice not found.");
      }

      const nextPaidSen = Math.max(
        invoice.amountPaidSen - allocation.amountSen,
        0
      );

      await tx.invoice.update({
        where: { id: allocation.invoiceId },
        data: {
          amountPaidSen: nextPaidSen,
          status: getInvoiceStatusAfterPaymentChange(
            nextPaidSen,
            invoice.totalSen
          ),
        },
      });
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: { reversedAt: new Date(), status: "REVERSED" },
    });

    const studentName = await tx.student
      .findFirst({
        where: { id: payment.studentId, organizationId: tenant.organizationId },
        select: { fullName: true },
      })
      .then((student) => student?.fullName ?? "student");

    const event = paymentReversedEvent(
      tenant.organizationId,
      payment.studentId,
      studentName,
      payment.id,
      payment.amountSen,
      tenant.userId
    );

    await tx.auditEvent.create({ data: event });
  });

  revalidatePath("/invoices");
  revalidatePath("/payments");
};
