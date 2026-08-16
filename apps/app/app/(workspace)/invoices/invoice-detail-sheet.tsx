"use client";

import { formatShortDate } from "@repo/date";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from "@repo/design-system/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetTitle,
} from "@repo/design-system/components/ui/sheet";
import { formatMoney as formatMoneyShared } from "@repo/money";
import { BanIcon, CircleDollarSignIcon, ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { voidInvoices } from "./actions";
import {
  daysOverdue,
  type Invoice,
  outstandingSen,
  StatusBadge,
} from "./columns";
import { formatBillingMonthLabel } from "./invoices-labels";

const toDate = (value: Date | string) =>
  value instanceof Date ? value : new Date(value);

export function InvoiceDetailSheet({
  currency,
  invoice,
  onClose,
}: {
  currency: string;
  invoice: Invoice | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const formatMoney = (amountSen: number) =>
    formatMoneyShared(amountSen, { currency });

  return (
    <Sheet onOpenChange={(open) => !open && onClose()} open={invoice !== null}>
      <SheetContent side="right">
        {invoice ? (
          <>
            <SheetHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <SheetTitle className="font-mono text-xs">
                    {invoice.invoiceNumber}
                  </SheetTitle>
                  <p className="font-medium text-sm">
                    {invoice.student.fullName}
                  </p>
                </div>
                <StatusBadge status={invoice.status} />
              </div>
            </SheetHeader>
            <SheetPanel className="grid gap-6">
              <AmountHero formatMoney={formatMoney} invoice={invoice} />

              {/* Dates */}
              <section className="grid gap-3">
                <h2 className="font-semibold text-sm">Dates</h2>
                <DetailRow
                  label="Billing month"
                  value={formatBillingMonthLabel(invoice.billingMonth)}
                />
                <DetailRow
                  label="Issued"
                  value={formatShortDate(toDate(invoice.issueDate))}
                />
                <DetailRow
                  label="Due"
                  value={formatShortDate(toDate(invoice.dueDate))}
                />
              </section>

              {/* Student */}
              <section className="grid gap-3">
                <h2 className="font-semibold text-sm">Student</h2>
                <DetailRow label="Name" value={invoice.student.fullName} />
                <DetailRow
                  label="Level"
                  value={invoice.student.level?.name ?? "—"}
                />
                <DetailRow
                  label="Guardian"
                  value={invoice.student.guardians[0]?.guardian.fullName ?? "—"}
                />
                <DetailRow label="Phone" value={invoice.student.phone ?? "—"} />
              </section>

              {/* Line items */}
              <section className="grid gap-3">
                <h2 className="font-semibold text-sm">Items</h2>
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/60 text-muted-foreground text-xs">
                        <th className="px-3 py-2 text-left font-medium">
                          Description
                        </th>
                        <th className="w-12 px-3 py-2 text-right font-medium">
                          Qty
                        </th>
                        <th className="px-3 py-2 text-right font-medium">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.lineItems.map((item) => (
                        <tr className="border-t text-sm" key={item.id}>
                          <td className="px-3 py-2.5">{item.description}</td>
                          <td className="px-3 py-2.5 text-right text-muted-foreground">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-2.5 text-right font-medium">
                            {formatMoney(item.totalSen)}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t bg-muted/60">
                        <td
                          className="px-3 py-2 text-right font-bold"
                          colSpan={2}
                        >
                          Total
                        </td>
                        <td className="px-3 py-2 text-right font-bold">
                          {formatMoney(invoice.totalSen)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {invoice.notes ? (
                <section className="grid gap-2">
                  <h2 className="font-semibold text-sm">Notes</h2>
                  <p className="rounded-lg bg-muted p-3 text-sm">
                    {invoice.notes}
                  </p>
                </section>
              ) : null}
            </SheetPanel>
            <SheetFooter>
              {canRecordPayment(invoice) && (
                <Button render={<Link href="/payments/new" />}>
                  <CircleDollarSignIcon className="size-4" />
                  Record payment
                </Button>
              )}
              {canVoid(invoice) && (
                <form
                  action={async (formData) => {
                    await voidInvoices(formData);
                    router.refresh();
                    onClose();
                  }}
                >
                  <input
                    name="invoiceIds"
                    type="hidden"
                    value={JSON.stringify([invoice.id])}
                  />
                  <Button className="w-full" type="submit" variant="outline">
                    <BanIcon className="size-4" />
                    Void invoice
                  </Button>
                </form>
              )}
              <Button
                render={<Link href={`/invoices/${invoice.id}`} />}
                variant="ghost"
              >
                <ExternalLinkIcon className="size-4" />
                View full invoice
              </Button>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function AmountHero({
  formatMoney,
  invoice,
}: {
  formatMoney: (amountSen: number) => string;
  invoice: Invoice;
}) {
  const overdue = invoice.status === "OVERDUE";
  const balance = outstandingSen(invoice);
  const pct =
    invoice.totalSen > 0
      ? Math.min(
          100,
          Math.round((invoice.amountPaidSen / invoice.totalSen) * 100)
        )
      : 0;
  const daysOver = overdue ? daysOverdue(invoice) : 0;

  return (
    <section
      className={`rounded-lg p-5 ${overdue ? "bg-destructive/8" : "bg-muted"}`}
    >
      <p
        className={`font-semibold text-xs uppercase tracking-widest ${overdue ? "text-destructive" : "text-muted-foreground"}`}
      >
        {overdue
          ? `Overdue by ${daysOver}${daysOver !== 1 ? " days" : " day"}`
          : "Invoice total"}
      </p>
      <p className="mt-1 font-bold text-3xl">{formatMoney(invoice.totalSen)}</p>
      <div className="mt-4 grid gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Paid</span>
          <span className="font-semibold text-success">
            {formatMoney(invoice.amountPaidSen)}
          </span>
        </div>
        <Progress aria-label="Payment progress" value={pct}>
          <ProgressTrack>
            <ProgressIndicator
              className={overdue ? "bg-destructive" : "bg-primary"}
              style={{ width: `${pct}%` }}
            />
          </ProgressTrack>
        </Progress>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Balance due</span>
          <span
            className={
              balance > 0
                ? `font-bold ${overdue ? "text-destructive" : "text-foreground"}`
                : "font-bold text-success"
            }
          >
            {balance > 0 ? formatMoney(balance) : "Settled"}
          </span>
        </div>
      </div>
    </section>
  );
}

const canRecordPayment = (invoice: Invoice) =>
  outstandingSen(invoice) > 0 && invoice.status !== "DRAFT";

const canVoid = (invoice: Invoice) =>
  invoice.status !== "VOID" && invoice.status !== "PAID";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[6rem_1fr] gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
