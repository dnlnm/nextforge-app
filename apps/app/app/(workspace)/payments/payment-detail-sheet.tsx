"use client";

import { formatShortDate } from "@repo/date";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetTitle,
} from "@repo/design-system/components/ui/sheet";
import { formatMoney as formatMoneyShared } from "@repo/money";
import { ReceiptTextIcon, RotateCcwIcon, ShieldCheckIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { reversePayment, verifyPayment } from "./actions";
import type { Payment } from "./columns";
import { recordedByName, StatusBadge } from "./columns";

const toDate = (value: Date | string) =>
  value instanceof Date ? value : new Date(value);

export function PaymentDetailSheet({
  currency,
  payment,
  onClose,
}: {
  currency: string;
  payment: Payment | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const formatMoney = (amountSen: number) =>
    formatMoneyShared(amountSen, { currency });

  return (
    <Sheet onOpenChange={(open) => !open && onClose()} open={payment !== null}>
      <SheetContent side="right">
        {payment ? (
          <>
            <SheetHeader>
              <div className="flex items-center justify-between gap-2">
                <SheetTitle>{payment.receiptNumber}</SheetTitle>
                <StatusBadge status={payment.status} />
              </div>
            </SheetHeader>
            <SheetPanel className="grid gap-6">
              {/* Amount hero */}
              <section className="rounded-lg bg-muted p-5 text-center">
                <p className="font-semibold text-muted-foreground text-xs uppercase tracking-widest">
                  Amount received
                </p>
                <p className="mt-1 font-bold text-3xl">
                  {formatMoney(payment.amountSen)}
                </p>
              </section>

              {/* Student info */}
              <section className="grid gap-3">
                <h2 className="font-semibold text-sm">Student</h2>
                <DetailRow label="Name" value={payment.student.fullName} />
                <DetailRow
                  label="Level"
                  value={payment.student.level?.name ?? "—"}
                />
                <DetailRow
                  label="Parent"
                  value={payment.student.guardians[0]?.guardian.fullName ?? "—"}
                />
              </section>

              {/* Payment info */}
              <section className="grid gap-3">
                <h2 className="font-semibold text-sm">Payment</h2>
                <DetailRow
                  label="Date"
                  value={formatShortDate(toDate(payment.paidAt))}
                />
                <DetailRow label="Method" mono value={payment.method} />
                <DetailRow
                  label="Invoices"
                  mono
                  value={
                    payment.allocations
                      .map((allocation) => allocation.invoice.invoiceNumber)
                      .join(", ") || "—"
                  }
                />
                {payment.reference && (
                  <DetailRow label="Reference" mono value={payment.reference} />
                )}
                <DetailRow
                  label="Recorded by"
                  value={recordedByName(payment)}
                />
              </section>

              {payment.notes && (
                <section className="grid gap-2">
                  <h2 className="font-semibold text-sm">Notes</h2>
                  <p className="rounded-lg bg-muted p-3 text-sm">
                    {payment.notes}
                  </p>
                </section>
              )}

              <section className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <StatusBadge status={payment.status} />
                <span>
                  {payment.status === "VERIFIED"
                    ? "This payment is confirmed and cannot be reversed."
                    : "Pending confirmation. Reversing releases the invoice allocation."}
                </span>
              </section>
            </SheetPanel>
            <SheetFooter>
              {payment.status === "RECORDED" && (
                <>
                  <form
                    action={async (formData) => {
                      await verifyPayment(formData);
                      router.refresh();
                      onClose();
                    }}
                  >
                    <input name="paymentId" type="hidden" value={payment.id} />
                    <Button className="w-full" type="submit">
                      <ShieldCheckIcon className="size-4" />
                      Mark as Verified
                    </Button>
                  </form>
                  <form
                    action={async (formData) => {
                      await reversePayment(formData);
                      router.refresh();
                      onClose();
                    }}
                  >
                    <input name="paymentId" type="hidden" value={payment.id} />
                    <Button className="w-full" type="submit" variant="outline">
                      <RotateCcwIcon className="size-4" />
                      Reverse
                    </Button>
                  </form>
                </>
              )}
              <Button
                render={<Link href={`/payments/${payment.id}`} />}
                variant="ghost"
              >
                <ReceiptTextIcon className="size-4" />
                View receipt
              </Button>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[6rem_1fr] gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "break-all font-mono text-xs leading-5" : ""}>
        {value}
      </span>
    </div>
  );
}
