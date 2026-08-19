"use server";

import { requireTenant, requireTenantRole } from "@repo/auth/authorization";
import { database, type Prisma } from "@repo/database";
import { addMalaysiaCalendarDays, tryParseCalendarDate } from "@repo/date";
import {
  paymentRecordedEvent,
  paymentReversedEvent,
  paymentVerifiedEvent,
  writeActivityEvent,
} from "@repo/domain/students/activity";
import { parseMoneyToSen } from "@repo/money";
import {
  type PaymentMethod,
  type PaymentStatus,
  paymentMethods,
  paymentStatuses,
} from "@repo/schemas/enums";
import type { PaymentsQueryParams } from "@repo/schemas/payments";
import { revalidatePath } from "next/cache";
import {
  formatSequenceNumber,
  reserveNextSequence,
} from "../billing/sequences";
import { METHOD_LABELS, STATUS_LABELS } from "./payments-labels";

export type { PaymentsQueryParams } from "@repo/schemas/payments";

const methods = new Set<PaymentMethod>(paymentMethods);
const statuses = new Set<PaymentStatus>(paymentStatuses);

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
  const paidAtValue = getString(formData, "paidAt");
  const paidAt = paidAtValue ? tryParseCalendarDate(paidAtValue) : undefined;

  if (!(invoiceId && amountSen && method && methods.has(method))) {
    throw new Error("Invoice, amount, and payment method are required.");
  }

  if (paidAtValue && !paidAt) {
    throw new Error("Payment date is invalid.");
  }

  const attachmentsValue = getString(formData, "attachments");
  let attachments: Array<{
    key: string;
    name: string;
    size: number;
    type: string;
  }> = [];

  if (attachmentsValue) {
    try {
      const parsed = JSON.parse(attachmentsValue) as unknown;

      if (
        !Array.isArray(parsed) ||
        parsed.length > 3 ||
        !parsed.every(
          (attachment) =>
            typeof attachment === "object" &&
            attachment !== null &&
            typeof (attachment as Record<string, unknown>).key === "string" &&
            typeof (attachment as Record<string, unknown>).name === "string" &&
            typeof (attachment as Record<string, unknown>).type === "string" &&
            typeof (attachment as Record<string, unknown>).size === "number"
        )
      ) {
        throw new Error("Invalid attachment data.");
      }

      attachments = parsed as typeof attachments;
    } catch {
      throw new Error("Invalid attachment data.");
    }
  }

  const settings = await database.organizationSettings.findUnique({
    where: { organizationId: tenant.organizationId },
    select: { receiptPrefix: true },
  });

  const { paymentId, receiptNumber } = await database.$transaction(
    async (tx) => {
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
          paidAt,
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

      if (attachments.length > 0) {
        await tx.paymentAttachment.createMany({
          data: attachments.map((attachment) => ({
            fileName: attachment.name,
            fileSize: attachment.size,
            fileType: attachment.type,
            objectKey: attachment.key,
            paymentId: payment.id,
          })),
        });
      }

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
            updated.amountPaidSen >= updated.totalSen
              ? "PAID"
              : "PARTIALLY_PAID",
        },
      });

      const studentName = await tx.student
        .findFirst({
          where: {
            id: invoice.studentId,
            organizationId: tenant.organizationId,
          },
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

      await writeActivityEvent(tx, event);

      return { paymentId: payment.id, receiptNumber };
    }
  );

  revalidatePath("/invoices");
  revalidatePath("/payments");

  return { paymentId, receiptNumber };
};

// Students with an open (partially paid) invoice, matched by name, guardian,
// or invoice number. Each result carries the student's oldest outstanding
// invoice, which the record-payment page allocates payments to.
export async function searchStudentsForPayment(query: string) {
  const tenant = await requireTenant();
  const search = query.trim();

  if (!search) {
    return [];
  }

  const students = await database.student.findMany({
    where: {
      archivedAt: null,
      organizationId: tenant.organizationId,
      status: "ACTIVE",
      OR: [
        { fullName: { contains: search, mode: "insensitive" } },
        {
          guardians: {
            some: {
              guardian: { fullName: { contains: search, mode: "insensitive" } },
            },
          },
        },
        {
          guardians: {
            some: {
              guardian: { phone: { contains: search, mode: "insensitive" } },
            },
          },
        },
        {
          invoices: {
            some: {
              invoiceNumber: { contains: search, mode: "insensitive" },
            },
          },
        },
      ],
    },
    select: {
      fullName: true,
      guardians: {
        include: { guardian: { select: { fullName: true, phone: true } } },
        take: 1,
        where: { isPrimary: true },
      },
      id: true,
      invoices: {
        orderBy: { billingMonth: "asc" },
        select: {
          amountPaidSen: true,
          billingMonth: true,
          id: true,
          invoiceNumber: true,
          totalSen: true,
        },
        take: 1,
        where: { status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] } },
      },
      level: { select: { name: true } },
    },
    orderBy: { fullName: "asc" },
    take: 20,
  });

  return students
    .map((student) => {
      const invoice = student.invoices[0];

      if (!invoice) {
        return null;
      }

      const outstandingSen = invoice.totalSen - invoice.amountPaidSen;

      if (outstandingSen <= 0) {
        return null;
      }

      return {
        fullName: student.fullName,
        guardian: student.guardians[0]?.guardian ?? null,
        id: student.id,
        invoice: {
          billingMonth: invoice.billingMonth,
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          outstandingSen,
        },
        level: student.level?.name ?? null,
      };
    })
    .filter(
      (student): student is NonNullable<typeof student> => student !== null
    );
}

// Most recent payments for a student, shown in the record-payment page's
// "Recent Payments" panel.
export async function getStudentPaymentHistory(studentId: string) {
  const tenant = await requireTenant();

  const payments = await database.payment.findMany({
    where: { organizationId: tenant.organizationId, studentId },
    orderBy: { paidAt: "desc" },
    take: 5,
    include: {
      allocations: {
        include: { invoice: { select: { invoiceNumber: true } } },
      },
      recordedBy: { select: { firstName: true, lastName: true } },
    },
  });

  return payments.map((payment) => ({
    amountSen: payment.amountSen,
    id: payment.id,
    invoiceNumbers: payment.allocations.map(
      (allocation) => allocation.invoice.invoiceNumber
    ),
    method: payment.method,
    paidAt: payment.paidAt,
    receiptNumber: payment.receiptNumber,
    recordedByName: [
      payment.recordedBy?.firstName,
      payment.recordedBy?.lastName,
    ]
      .filter(Boolean)
      .join(" "),
    reference: payment.reference,
    status: payment.status,
  }));
}

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
          invoice: {
            select: { amountPaidSen: true, id: true, totalSen: true },
          },
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

    await writeActivityEvent(tx, event);
  });

  revalidatePath("/invoices");
  revalidatePath("/payments");
};

export const verifyPayment = async (formData: FormData) => {
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
      amountSen: true,
      id: true,
      studentId: true,
    },
  });

  if (!payment) {
    throw new Error("Payment not found or already processed.");
  }

  await database.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "VERIFIED" },
    });

    const studentName = await tx.student
      .findFirst({
        where: { id: payment.studentId, organizationId: tenant.organizationId },
        select: { fullName: true },
      })
      .then((student) => student?.fullName ?? "student");

    const event = paymentVerifiedEvent(
      tenant.organizationId,
      payment.studentId,
      studentName,
      payment.id,
      payment.amountSen,
      tenant.userId
    );

    await writeActivityEvent(tx, event);
  });

  revalidatePath("/payments");
};

// Fetch payments for the table with server-side pagination, filtering, and
// sorting, mirroring the students table pattern.
const paymentWhereInput = (
  params: PaymentsQueryParams,
  organizationId: string
): Prisma.PaymentWhereInput => {
  const where: Prisma.PaymentWhereInput = {
    organizationId,
  };

  // Apply global search (student, receipt, reference, or invoice number).
  if (params.search) {
    where.OR = [
      { receiptNumber: { contains: params.search, mode: "insensitive" } },
      { reference: { contains: params.search, mode: "insensitive" } },
      {
        student: {
          fullName: { contains: params.search, mode: "insensitive" },
        },
      },
      {
        allocations: {
          some: {
            invoice: {
              invoiceNumber: { contains: params.search, mode: "insensitive" },
            },
          },
        },
      },
    ];
  }

  if (params.filters && params.filters.length > 0) {
    applyPaymentFilters(where, params.filters);
  }

  return where;
};

// Apply column filters (status, method, date range). Filter values arrive
// untyped from the URL, so validate them against the enum sets before use.
const applyPaymentFilters = (
  where: Prisma.PaymentWhereInput,
  filters: NonNullable<PaymentsQueryParams["filters"]>
) => {
  const values = (filterId: string) => {
    const filter = filters.find((f) => f.id === filterId);
    return Array.isArray(filter?.value) ? filter.value : [filter?.value];
  };

  const statusValues = values("status").filter(
    (v): v is PaymentStatus =>
      typeof v === "string" && statuses.has(v as PaymentStatus)
  );
  if (statusValues.length > 0) {
    where.status = { in: statusValues };
  }

  const methodValues = values("method").filter(
    (v): v is PaymentMethod =>
      typeof v === "string" && methods.has(v as PaymentMethod)
  );
  if (methodValues.length > 0) {
    where.method = { in: methodValues };
  }

  // Calendar date range (paidAt). The calendar dates are parsed to
  // UTC-midnight instants; the upper bound is exclusive and "to" is
  // inclusive, so add one Malaysia calendar day to it.
  const dateFilter = filters.find((f) => f.id === "date");
  if (
    dateFilter &&
    typeof dateFilter.value === "object" &&
    dateFilter.value !== null
  ) {
    const range = dateFilter.value as { from?: unknown; to?: unknown };
    const fromDate =
      typeof range.from === "string"
        ? tryParseCalendarDate(range.from)
        : undefined;
    const toDate =
      typeof range.to === "string" ? tryParseCalendarDate(range.to) : undefined;

    if (fromDate || toDate) {
      where.paidAt = {
        ...(fromDate ? { gte: fromDate } : {}),
        ...(toDate ? { lt: addMalaysiaCalendarDays(toDate, 1) } : {}),
      };
    }
  }
};

// Build orderBy from the URL sorting state (date, amount, student, status).
const SORT_BUILDERS: Record<
  string,
  (sort: {
    id: string;
    desc: boolean;
  }) => Prisma.PaymentOrderByWithRelationInput
> = {
  amount: (sort) => ({ amountSen: sort.desc ? "desc" : "asc" }),
  date: (sort) => ({ paidAt: sort.desc ? "desc" : "asc" }),
  studentName: (sort) => ({
    student: { fullName: sort.desc ? "desc" : "asc" },
  }),
  status: (sort) => ({ status: sort.desc ? "desc" : "asc" }),
};

const paymentOrderByInput = (
  params: PaymentsQueryParams
): Prisma.PaymentOrderByWithRelationInput[] => {
  if (!params.sorting || params.sorting.length === 0) {
    // Default: newest payments first.
    return [{ paidAt: "desc" }];
  }

  return params.sorting.flatMap((sort) => {
    const build = SORT_BUILDERS[sort.id];
    return build ? [build(sort)] : [];
  });
};

export async function getPaymentsForTable(params: PaymentsQueryParams) {
  const tenant = await requireTenant();

  const where = paymentWhereInput(params, tenant.organizationId);
  const orderBy = paymentOrderByInput(params);

  const [payments, totalCount] = await Promise.all([
    database.payment.findMany({
      where,
      orderBy,
      skip: params.page * params.pageSize,
      take: params.pageSize,
      include: {
        allocations: { include: { invoice: true } },
        recordedBy: { select: { firstName: true, lastName: true } },
        student: {
          include: {
            guardians: {
              where: { isPrimary: true },
              include: { guardian: true },
              take: 1,
            },
            level: { select: { name: true } },
          },
        },
      },
    }),
    database.payment.count({ where }),
  ]);

  return {
    data: payments,
    totalCount,
  };
}

// Display labels for payment methods and statuses (shared with the client
// via payments-labels.ts).

// Static filter options for the payments table toolbar. Exported from a
// "use server" module, so it must stay async even though it is static.
export async function getPaymentFilterOptions() {
  await Promise.resolve();

  return {
    methods: paymentMethods.map((method) => ({
      label: METHOD_LABELS[method],
      value: method,
    })),
    statuses: paymentStatuses.map((status) => ({
      label: STATUS_LABELS[status],
      value: status,
    })),
  };
}
