"use client";

import { formatShortDate } from "@repo/date";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { DataTableSortableHeader } from "@repo/design-system/components/ui/data-table/data-table-column-header";
import { createAppColumnHelper } from "@repo/design-system/components/ui/data-table/table";
import type { PaymentMethod, PaymentStatus } from "@repo/schemas/enums";
import {
  BanknoteIcon,
  Building2Icon,
  CreditCardIcon,
  EllipsisIcon,
  EyeIcon,
  LandmarkIcon,
  QrCodeIcon,
} from "lucide-react";
import Link from "next/link";
import { METHOD_LABELS, STATUS_LABELS } from "./payments-labels";

export interface Payment {
  allocations: Array<{ invoice: { invoiceNumber: string } }>;
  amountSen: number;
  id: string;
  method: PaymentMethod;
  notes: string | null;
  paidAt: Date | string;
  receiptNumber: string;
  recordedBy: { firstName: string | null; lastName: string | null } | null;
  reference: string | null;
  status: PaymentStatus;
  student: {
    id: string;
    fullName: string;
    level: { name: string } | null;
    guardians: Array<{ guardian: { fullName: string | null } }>;
  };
}

export interface FilterOption {
  label: string;
  value: string;
}

const toDate = (value: Date | string) =>
  value instanceof Date ? value : new Date(value);

export const recordedByName = (payment: Payment) =>
  payment.recordedBy
    ? [payment.recordedBy.firstName, payment.recordedBy.lastName]
        .filter(Boolean)
        .join(" ") || "—"
    : "—";

const METHOD_ICONS: Record<PaymentMethod, typeof BanknoteIcon> = {
  CASH: BanknoteIcon,
  BANK_TRANSFER: LandmarkIcon,
  DUITNOW: QrCodeIcon,
  FPX: Building2Icon,
  CARD: CreditCardIcon,
  OTHER: EllipsisIcon,
};

const METHOD_VARIANTS: Record<
  PaymentMethod,
  Parameters<typeof Badge>[0]["variant"]
> = {
  CASH: "default",
  BANK_TRANSFER: "secondary",
  DUITNOW: "success",
  FPX: "info",
  CARD: "warning",
  OTHER: "outline",
};

export function MethodBadge({ method }: { method: PaymentMethod }) {
  const Icon = METHOD_ICONS[method];
  const variant = METHOD_VARIANTS[method];

  return (
    <Badge variant={variant}>
      <Icon />
      {METHOD_LABELS[method]}
    </Badge>
  );
}

const STATUS_VARIANTS: Record<
  PaymentStatus,
  "warning" | "success" | "secondary"
> = {
  RECORDED: "warning",
  VERIFIED: "success",
  REVERSED: "secondary",
};

export function StatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>
  );
}

interface PaymentColumnOptions {
  methods: FilterOption[];
}

export const createColumns = (
  formatMoney: (amountSen: number) => string,
  { methods }: PaymentColumnOptions
) => {
  const columnHelper = createAppColumnHelper<Payment>();

  return columnHelper.columns([
    columnHelper.accessor((row) => row.student.fullName, {
      id: "studentName",
      header: ({ header }) => <DataTableSortableHeader header={header} />,
      cell: ({ row }) => (
        <div className="flex max-w-full items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-xs">
            {row.original.student.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <Link
              className="block truncate font-medium hover:underline"
              href={`/students/${row.original.student.id}`}
            >
              {row.original.student.fullName}
            </Link>
            <span className="block truncate text-muted-foreground text-xs">
              {row.original.student.level?.name ?? "—"}
            </span>
          </div>
        </div>
      ),
      meta: { label: "Student" },
      enableColumnFilter: false,
      enableHiding: false,
    }),
    columnHelper.accessor("receiptNumber", {
      id: "receipt",
      header: "Receipt",
      cell: ({ row }) => (
        <Link
          className="font-mono text-xs underline-offset-4 hover:underline"
          href={`/payments/${row.original.id}`}
        >
          {row.original.receiptNumber}
        </Link>
      ),
      meta: { label: "Receipt" },
      enableColumnFilter: false,
      enableSorting: false,
      enableHiding: false,
    }),
    columnHelper.display({
      id: "invoices",
      header: "Invoice",
      cell: ({ row }) => (
        <span className="font-mono text-muted-foreground text-xs">
          {row.original.allocations
            .map((allocation) => allocation.invoice.invoiceNumber)
            .join(", ") || "—"}
        </span>
      ),
      enableSorting: false,
      enableHiding: false,
    }),
    columnHelper.accessor("amountSen", {
      id: "amount",
      header: ({ header }) => <DataTableSortableHeader header={header} />,
      cell: ({ row }) => (
        <span className="font-semibold">
          {formatMoney(row.original.amountSen)}
        </span>
      ),
      meta: { label: "Amount" },
      enableColumnFilter: false,
      enableHiding: false,
    }),
    columnHelper.accessor("method", {
      id: "method",
      header: "Method",
      cell: ({ row }) => <MethodBadge method={row.original.method} />,
      meta: {
        label: "Method",
        variant: "multi-select",
        options: methods,
      },
      enableColumnFilter: true,
      enableSorting: false,
      enableHiding: false,
    }),
    columnHelper.accessor("paidAt", {
      id: "date",
      header: ({ header }) => <DataTableSortableHeader header={header} />,
      cell: ({ row }) => (
        <span>{formatShortDate(toDate(row.original.paidAt))}</span>
      ),
      meta: { label: "Date" },
      enableColumnFilter: false,
      enableHiding: false,
    }),
    columnHelper.accessor("status", {
      id: "status",
      header: ({ header }) => <DataTableSortableHeader header={header} />,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      meta: { label: "Status" },
      enableColumnFilter: false,
      enableHiding: false,
    }),
    columnHelper.display({
      id: "recordedBy",
      header: "Recorded by",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {recordedByName(row.original)}
        </span>
      ),
      enableSorting: false,
      enableHiding: false,
    }),
    columnHelper.display({
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: () => (
        <div className="flex justify-end">
          <Button aria-label="View payment" size="icon" variant="ghost">
            <EyeIcon className="size-4" />
          </Button>
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    }),
  ]);
};
