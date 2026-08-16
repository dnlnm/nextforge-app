"use client";

import {
  differenceInMalaysiaCalendarDays,
  formatShortDate,
  getMalaysiaToday,
} from "@repo/date";
import { DataTableColumnHeader } from "@repo/design-system/components/niko-table/components/data-table-column-header";
import { DataTableColumnTitle } from "@repo/design-system/components/niko-table/components/data-table-column-title";
import type { DataTableColumnDef } from "@repo/design-system/components/niko-table/types";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Checkbox } from "@repo/design-system/components/ui/checkbox";
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from "@repo/design-system/components/ui/progress";
import type { InvoiceStatus } from "@repo/schemas/enums";
import type { Column } from "@tanstack/react-table";
import {
  ArrowUpDownIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { STATUS_BADGE_VARIANTS, STATUS_LABELS } from "./invoices-labels";

export interface Invoice {
  amountPaidSen: number;
  billingMonth: string;
  dueDate: Date | string;
  id: string;
  invoiceNumber: string;
  issueDate: Date | string;
  lineItems: Array<{
    description: string;
    id: string;
    quantity: number;
    totalSen: number;
    unitPriceSen: number;
  }>;
  notes: string | null;
  status: InvoiceStatus;
  student: {
    fullName: string;
    guardians: Array<{ guardian: { fullName: string | null } }>;
    id: string;
    level: { name: string } | null;
    phone: string | null;
  };
  totalSen: number;
}

const toDate = (value: Date | string) =>
  value instanceof Date ? value : new Date(value);

export const outstandingSen = (invoice: Invoice) =>
  Math.max(0, invoice.totalSen - invoice.amountPaidSen);

export const daysOverdue = (invoice: Invoice) => {
  if (invoice.status !== "OVERDUE") {
    return 0;
  }

  return Math.max(
    0,
    differenceInMalaysiaCalendarDays(
      getMalaysiaToday(),
      toDate(invoice.dueDate)
    )
  );
};

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <Badge variant={STATUS_BADGE_VARIANTS[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

// Progress bar color by invoice status (mirrors the reference page's colors).
const BAR_COLORS: Partial<Record<InvoiceStatus, string>> = {
  OVERDUE: "bg-destructive",
  PAID: "bg-success",
  PARTIALLY_PAID: "bg-warning",
};

function PaymentProgress({ invoice }: { invoice: Invoice }) {
  const total = invoice.totalSen;
  const paid = invoice.amountPaidSen;
  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const barColor = BAR_COLORS[invoice.status] ?? "bg-primary";

  return (
    <div className="flex min-w-0 items-center gap-2">
      <Progress aria-label="Payment progress" className="w-24" value={pct}>
        <ProgressTrack>
          <ProgressIndicator
            className={barColor}
            style={{ width: `${pct}%` }}
          />
        </ProgressTrack>
      </Progress>
      <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
        {pct}%
      </span>
    </div>
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
  column: Column<Invoice, unknown>;
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
  formatMoney: (amountSen: number) => string,
  onViewInvoice: (invoice: Invoice) => void
): DataTableColumnDef<Invoice>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all invoices on this page"
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={table.getToggleAllPageRowsSelectedHandler()}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label={`Select invoice ${row.original.invoiceNumber}`}
        checked={row.getIsSelected()}
        onCheckedChange={row.getToggleSelectedHandler()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    meta: { label: "Select" },
    size: 40,
  },
  {
    // Anchor for the toolbar's Month faceted filter; hidden from the table.
    id: "billingMonth",
    accessorKey: "billingMonth",
    header: Header,
    cell: () => null,
    enableSorting: false,
    enableHiding: false,
    meta: { label: "Month" },
  },
  {
    id: "invoiceNumber",
    accessorKey: "invoiceNumber",
    header: Header,
    cell: ({ row }) => (
      <Link
        className="font-mono text-xs underline-offset-4 hover:underline"
        href={`/invoices/${row.original.id}`}
      >
        {row.original.invoiceNumber}
      </Link>
    ),
    meta: { label: "Invoice" },
    enableSorting: false,
    enableHiding: false,
    size: 130,
  },
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
    id: "issuedDate",
    accessorKey: "issueDate",
    header: ({ column }) => (
      <SortableHeader column={column}>Issued</SortableHeader>
    ),
    cell: ({ row }) => (
      <span>{formatShortDate(toDate(row.original.issueDate))}</span>
    ),
    meta: { label: "Issued" },
    enableHiding: false,
    size: 120,
  },
  {
    id: "dueDate",
    accessorKey: "dueDate",
    header: ({ column }) => (
      <SortableHeader column={column}>Due</SortableHeader>
    ),
    cell: ({ row }) => {
      const overdue = row.original.status === "OVERDUE";

      return (
        <div>
          <span
            className={overdue ? "font-medium text-destructive" : undefined}
          >
            {formatShortDate(toDate(row.original.dueDate))}
          </span>
          {overdue && (
            <p className="text-destructive text-xs">
              {daysOverdue(row.original)}d overdue
            </p>
          )}
        </div>
      );
    },
    meta: { label: "Due" },
    enableHiding: false,
    size: 120,
  },
  {
    id: "total",
    accessorKey: "totalSen",
    header: ({ column }) => (
      <SortableHeader column={column}>Total</SortableHeader>
    ),
    cell: ({ row }) => (
      <span className="font-semibold">
        {formatMoney(row.original.totalSen)}
      </span>
    ),
    meta: { label: "Total" },
    enableHiding: false,
    size: 110,
  },
  {
    id: "balance",
    accessorKey: "balanceSen",
    header: Header,
    cell: ({ row }) => {
      const balance = outstandingSen(row.original);

      if (balance <= 0) {
        return <span className="font-semibold text-success">—</span>;
      }

      return (
        <span
          className={
            row.original.status === "OVERDUE"
              ? "font-semibold text-destructive"
              : "font-semibold"
          }
        >
          {formatMoney(balance)}
        </span>
      );
    },
    meta: { label: "Balance" },
    enableSorting: false,
    enableHiding: false,
    size: 110,
  },
  {
    id: "paid",
    accessorKey: "paid",
    header: Header,
    cell: ({ row }) => <PaymentProgress invoice={row.original} />,
    meta: { label: "Paid" },
    enableSorting: false,
    enableHiding: false,
    size: 160,
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
    size: 100,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <Button
          aria-label={`View invoice ${row.original.invoiceNumber}`}
          onClick={() => onViewInvoice(row.original)}
          size="icon"
          variant="ghost"
        >
          <EyeIcon className="size-4" />
        </Button>
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 48,
  },
];
