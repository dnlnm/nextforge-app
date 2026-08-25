"use client";

import {
  differenceInMalaysiaCalendarDays,
  formatShortDate,
  getMalaysiaToday,
} from "@repo/date";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Checkbox } from "@repo/design-system/components/ui/checkbox";
import { DataTableSortableHeader } from "@repo/design-system/components/ui/data-table/data-table-column-header";
import { createAppColumnHelper } from "@repo/design-system/components/ui/data-table/table";
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from "@repo/design-system/components/ui/progress";
import type { InvoiceStatus } from "@repo/schemas/enums";
import { EyeIcon } from "lucide-react";
import Link from "next/link";
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

export interface FilterOption {
  label: string;
  value: string;
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

interface InvoiceColumnOptions {
  months: FilterOption[];
}

export const createColumns = (
  formatMoney: (amountSen: number) => string,
  onViewInvoice: (invoice: Invoice) => void,
  { months }: InvoiceColumnOptions
) => {
  const columnHelper = createAppColumnHelper<Invoice>();

  return columnHelper.columns([
    columnHelper.display({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all invoices on this page"
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={`Select invoice ${row.original.invoiceNumber}`}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      meta: { label: "Select" },
      size: 40,
    }),
    // Anchor for the Month filter; hidden from the table.
    columnHelper.accessor("billingMonth", {
      id: "billingMonth",
      header: "Month",
      cell: () => null,
      enableColumnFilter: true,
      enableSorting: false,
      enableHiding: false,
      meta: {
        label: "Month",
        variant: "select",
        options: months,
      },
    }),
    columnHelper.accessor("invoiceNumber", {
      id: "invoiceNumber",
      header: "Invoice",
      cell: ({ row }) => (
        <Link
          className="font-mono text-xs underline-offset-4 hover:underline"
          href={`/invoices/${row.original.id}`}
        >
          {row.original.invoiceNumber}
        </Link>
      ),
      meta: { label: "Invoice" },
      enableColumnFilter: false,
      enableSorting: false,
      enableHiding: false,
      size: 130,
    }),
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
    columnHelper.accessor("issueDate", {
      id: "issuedDate",
      header: ({ header }) => <DataTableSortableHeader header={header} />,
      cell: ({ row }) => (
        <span>{formatShortDate(toDate(row.original.issueDate))}</span>
      ),
      meta: { label: "Issued" },
      enableColumnFilter: false,
      enableHiding: false,
      size: 120,
    }),
    columnHelper.accessor("dueDate", {
      id: "dueDate",
      header: ({ header }) => <DataTableSortableHeader header={header} />,
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
      enableColumnFilter: false,
      enableHiding: false,
      size: 120,
    }),
    columnHelper.accessor("totalSen", {
      id: "total",
      header: ({ header }) => <DataTableSortableHeader header={header} />,
      cell: ({ row }) => (
        <span className="font-semibold">
          {formatMoney(row.original.totalSen)}
        </span>
      ),
      meta: { label: "Total" },
      enableColumnFilter: false,
      enableHiding: false,
      size: 110,
    }),
    columnHelper.display({
      id: "balance",
      header: "Balance",
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
      enableSorting: false,
      enableHiding: false,
      size: 110,
    }),
    columnHelper.display({
      id: "paid",
      header: "Paid",
      cell: ({ row }) => <PaymentProgress invoice={row.original} />,
      enableSorting: false,
      enableHiding: false,
      size: 160,
    }),
    columnHelper.accessor("status", {
      id: "status",
      header: ({ header }) => <DataTableSortableHeader header={header} />,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      meta: { label: "Status" },
      enableColumnFilter: false,
      enableHiding: false,
      size: 100,
    }),
    columnHelper.display({
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
    }),
  ]);
};
