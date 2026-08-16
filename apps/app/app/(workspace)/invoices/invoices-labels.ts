import { formatMonthLabel } from "@repo/date";
import type { Badge } from "@repo/design-system/components/ui/badge";
import type { InvoiceStatus } from "@repo/schemas/enums";

export const STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: "Draft",
  ISSUED: "Issued",
  PARTIALLY_PAID: "Partial",
  PAID: "Paid",
  OVERDUE: "Overdue",
  VOID: "Void",
};

export const STATUS_BADGE_VARIANTS: Record<
  InvoiceStatus,
  Parameters<typeof Badge>[0]["variant"]
> = {
  DRAFT: "secondary",
  ISSUED: "info",
  PARTIALLY_PAID: "warning",
  PAID: "success",
  OVERDUE: "error",
  VOID: "outline",
};

// Tabs shown above the table, in the same order as the reference page.
export const STATUS_TABS: Array<{
  value: InvoiceStatus | "all";
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "PARTIALLY_PAID", label: "Partial" },
  { value: "ISSUED", label: "Issued" },
  { value: "DRAFT", label: "Draft" },
  { value: "PAID", label: "Paid" },
  { value: "VOID", label: "Void" },
];

// "2026-08" -> "Aug 26" (used by the month filter options and KPI subtitles).
export const formatBillingMonthLabel = (billingMonth: string): string => {
  const [year, month] = billingMonth.split("-").map(Number);

  if (!(year && month) || month < 1 || month > 12) {
    return billingMonth;
  }

  return formatMonthLabel(new Date(Date.UTC(year, month - 1, 1)));
};
