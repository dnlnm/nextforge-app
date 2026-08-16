"use server";

import { requireTenant, requireTenantRole } from "@repo/auth/authorization";
import { database, type Prisma } from "@repo/database";
import { invoiceGeneratedEvent } from "@repo/domain/students/activity";
import { type InvoiceStatus, invoiceStatuses } from "@repo/schemas/enums";
import {
  billingMonthSchema,
  type InvoicesQueryParams,
  voidInvoicesInputSchema,
} from "@repo/schemas/invoices";
import { revalidatePath } from "next/cache";
import { assertWithinPlanLimitTx } from "../billing/limits";
import {
  formatSequenceNumber,
  reserveNextSequence,
} from "../billing/sequences";
import { formatBillingMonthLabel, STATUS_LABELS } from "./invoices-labels";

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

// ─── Invoices table (server-side pagination, filtering, sorting) ─────────────

const invoiceStatusSet = new Set<InvoiceStatus>(invoiceStatuses);

// Build the Prisma where clause for the table: global search (student, guardian,
// invoice number), status tab, and billing-month filter.
const invoiceWhereInput = (
  params: InvoicesQueryParams,
  organizationId: string
): Prisma.InvoiceWhereInput => {
  const where: Prisma.InvoiceWhereInput = { organizationId };

  if (params.search) {
    where.OR = [
      { invoiceNumber: { contains: params.search, mode: "insensitive" } },
      {
        student: { fullName: { contains: params.search, mode: "insensitive" } },
      },
      {
        student: {
          guardians: {
            some: {
              guardian: {
                fullName: { contains: params.search, mode: "insensitive" },
              },
            },
          },
        },
      },
    ];
  }

  if (params.filters && params.filters.length > 0) {
    const values = (filterId: string) => {
      const filter = params.filters?.find((f) => f.id === filterId);
      return Array.isArray(filter?.value) ? filter.value : [filter?.value];
    };

    const statusValues = values("status").filter(
      (v): v is InvoiceStatus =>
        typeof v === "string" && invoiceStatusSet.has(v as InvoiceStatus)
    );
    if (statusValues.length > 0) {
      where.status = { in: statusValues };
    }

    const monthValues = values("billingMonth").filter(
      (v): v is string => typeof v === "string"
    );
    if (monthValues.length > 0) {
      where.billingMonth = { in: monthValues };
    }
  }

  return where;
};

const SORT_BUILDERS: Record<
  string,
  (sort: {
    id: string;
    desc: boolean;
  }) => Prisma.InvoiceOrderByWithRelationInput
> = {
  issuedDate: (sort) => ({ issueDate: sort.desc ? "desc" : "asc" }),
  dueDate: (sort) => ({ dueDate: sort.desc ? "desc" : "asc" }),
  total: (sort) => ({ totalSen: sort.desc ? "desc" : "asc" }),
  studentName: (sort) => ({
    student: { fullName: sort.desc ? "desc" : "asc" },
  }),
  status: (sort) => ({ status: sort.desc ? "desc" : "asc" }),
};

const invoiceOrderByInput = (
  params: InvoicesQueryParams
): Prisma.InvoiceOrderByWithRelationInput[] => {
  if (!params.sorting || params.sorting.length === 0) {
    // Default: newest billing month first, then invoice number.
    return [{ billingMonth: "desc" }, { invoiceNumber: "desc" }];
  }

  return params.sorting.flatMap((sort) => {
    const build = SORT_BUILDERS[sort.id];
    return build ? [build(sort)] : [];
  });
};

export async function getInvoicesForTable(params: InvoicesQueryParams) {
  const tenant = await requireTenant();

  const where = invoiceWhereInput(params, tenant.organizationId);
  const orderBy = invoiceOrderByInput(params);

  const [invoices, totalCount] = await Promise.all([
    database.invoice.findMany({
      where,
      orderBy,
      skip: params.page * params.pageSize,
      take: params.pageSize,
      include: {
        lineItems: true,
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
    database.invoice.count({ where }),
  ]);

  return {
    data: invoices,
    totalCount,
  };
}

// Distinct billing months for the table's month filter (newest first).
export async function getInvoiceFilterOptions() {
  const tenant = await requireTenant();

  const months = await database.invoice.findMany({
    where: { organizationId: tenant.organizationId },
    distinct: ["billingMonth"],
    select: { billingMonth: true },
    orderBy: { billingMonth: "desc" },
  });

  return {
    months: months.map((month) => ({
      label: formatBillingMonthLabel(month.billingMonth),
      value: month.billingMonth,
    })),
    statuses: invoiceStatuses.map((status) => ({
      label: STATUS_LABELS[status],
      value: status,
    })),
  };
}

// Void one or more invoices (bulk action from the table or the detail sheet).
export const voidInvoices = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const raw = getString(formData, "invoiceIds");

  if (!raw) {
    throw new Error("Select at least one invoice to void.");
  }

  let invoiceIds: unknown;

  try {
    invoiceIds = JSON.parse(raw);
  } catch {
    throw new Error("Invalid invoice selection.");
  }

  const parsed = voidInvoicesInputSchema.safeParse({ invoiceIds });

  if (!parsed.success) {
    throw new Error("Invalid invoice selection.");
  }

  const result = await database.invoice.updateMany({
    where: {
      organizationId: tenant.organizationId,
      id: { in: parsed.data.invoiceIds },
      status: { notIn: ["VOID", "PAID"] },
    },
    data: { status: "VOID", voidedAt: new Date() },
  });

  revalidatePath("/invoices");
  revalidatePath("/payments");

  return { count: result.count };
};
