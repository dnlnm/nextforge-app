"use client";

import { formatShortDate } from "@repo/date";
import { DataTableColumnHeader } from "@repo/design-system/components/niko-table/components/data-table-column-header";
import { DataTableColumnTitle } from "@repo/design-system/components/niko-table/components/data-table-column-title";
import type { DataTableColumnDef } from "@repo/design-system/components/niko-table/types";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import type { PaymentMethod, PaymentStatus } from "@repo/schemas/enums";
import type { Column } from "@tanstack/react-table";
import {
  ArrowUpDownIcon,
  BanknoteIcon,
  Building2Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  CreditCardIcon,
  EllipsisIcon,
  EyeIcon,
  LandmarkIcon,
  QrCodeIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
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

const sortIcon = (sorted: false | "asc" | "desc") => {
  if (sorted === "asc") {
    return <ChevronUpIcon className="size-3.5 text-primary" />;
  }
  if (sorted === "desc") {
    return <ChevronDownIcon className="size-3.5 text-primary" />;
  }
  return <ArrowUpDownIcon className="size-3.5 opacity-40" />;
};

function SortableHeader({
  column,
  children,
}: {
  column: Column<Payment, unknown>;
  children: ReactNode;
}) {
  const sorted = column.getIsSorted();

  return (
    <DataTableColumnHeader>
      <button
        className="flex w-full cursor-pointer select-none items-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => column.toggleSorting(sorted === "asc")}
        type="button"
      >
        <DataTableColumnTitle />
        {children}
        {sortIcon(sorted)}
      </button>
    </DataTableColumnHeader>
  );
}

const Header = () => (
  <DataTableColumnHeader>
    <DataTableColumnTitle />
  </DataTableColumnHeader>
);

export const createColumns = (
  formatMoney: (amountSen: number) => string
): DataTableColumnDef<Payment>[] => [
  {
    id: "studentName",
    accessorKey: "studentName",
    header: ({ column }) => (
      <SortableHeader column={column}>Student</SortableHeader>
    ),
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
    enableHiding: false,
  },
  {
    id: "receipt",
    accessorKey: "receiptNumber",
    header: Header,
    cell: ({ row }) => (
      <Link
        className="font-mono text-xs underline-offset-4 hover:underline"
        href={`/payments/${row.original.id}`}
      >
        {row.original.receiptNumber}
      </Link>
    ),
    meta: { label: "Receipt" },
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "invoices",
    accessorKey: "invoices",
    header: Header,
    cell: ({ row }) => (
      <span className="font-mono text-muted-foreground text-xs">
        {row.original.allocations
          .map((allocation) => allocation.invoice.invoiceNumber)
          .join(", ") || "—"}
      </span>
    ),
    meta: { label: "Invoice" },
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "amount",
    accessorKey: "amountSen",
    header: ({ column }) => (
      <SortableHeader column={column}>Amount</SortableHeader>
    ),
    cell: ({ row }) => (
      <span className="font-semibold">
        {formatMoney(row.original.amountSen)}
      </span>
    ),
    meta: { label: "Amount" },
    enableHiding: false,
  },
  {
    id: "method",
    accessorKey: "method",
    header: Header,
    cell: ({ row }) => <MethodBadge method={row.original.method} />,
    meta: {
      label: "Method",
      options: [
        { label: METHOD_LABELS.CASH, value: "CASH" },
        { label: METHOD_LABELS.BANK_TRANSFER, value: "BANK_TRANSFER" },
        { label: METHOD_LABELS.DUITNOW, value: "DUITNOW" },
        { label: METHOD_LABELS.FPX, value: "FPX" },
        { label: METHOD_LABELS.CARD, value: "CARD" },
        { label: METHOD_LABELS.OTHER, value: "OTHER" },
      ],
    },
    enableColumnFilter: true,
    enableHiding: false,
  },
  {
    id: "date",
    accessorKey: "paidAt",
    header: ({ column }) => (
      <SortableHeader column={column}>Date</SortableHeader>
    ),
    cell: ({ row }) => (
      <span>{formatShortDate(toDate(row.original.paidAt))}</span>
    ),
    meta: { label: "Date" },
    enableHiding: false,
  },
  {
    id: "status",
    accessorKey: "status",
    header: ({ column }) => (
      <SortableHeader column={column}>Status</SortableHeader>
    ),
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
    meta: { label: "Status" },
    enableHiding: false,
  },
  {
    id: "recordedBy",
    accessorKey: "recordedBy",
    header: Header,
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs">
        {recordedByName(row.original)}
      </span>
    ),
    meta: { label: "Recorded by" },
    enableSorting: false,
    enableHiding: false,
  },
  {
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
  },
];
