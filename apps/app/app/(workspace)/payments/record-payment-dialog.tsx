"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/design-system/components/ui/dialog";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { formatMoney as formatMoneyShared } from "@repo/money";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { recordPayment } from "./actions";

const methods = [
  ["CASH", "Cash"],
  ["BANK_TRANSFER", "Bank transfer"],
  ["DUITNOW", "DuitNow"],
  ["FPX", "FPX"],
  ["CARD", "Card"],
  ["OTHER", "Other"],
] as const;

interface OpenInvoice {
  amountPaidSen: number;
  id: string;
  invoiceNumber: string;
  student: { fullName: string };
  totalSen: number;
}

export function RecordPaymentDialog({
  currency,
  openInvoices,
}: {
  currency: string;
  openInvoices: OpenInvoice[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const formatMoney = (amountSen: number) =>
    formatMoneyShared(amountSen, { currency });

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={<Button className="flex-1 md:flex-none" />}>
        <PlusIcon className="size-4" />
        Record Payment
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            Record cash, transfer, DuitNow, FPX, card, or other payments
            received outside the platform.
          </DialogDescription>
        </DialogHeader>
        <form
          action={async (formData) => {
            await recordPayment(formData);
            router.refresh();
            setOpen(false);
          }}
          className="grid gap-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="invoiceId">Invoice</Label>
            <Select name="invoiceId" required>
              <SelectTrigger id="invoiceId">
                <SelectValue placeholder="Select invoice" />
              </SelectTrigger>
              <SelectContent>
                {openInvoices.map((invoice) => (
                  <SelectItem key={invoice.id} value={invoice.id}>
                    {invoice.invoiceNumber} - {invoice.student.fullName} -{" "}
                    {formatMoney(invoice.totalSen - invoice.amountPaidSen)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              min="0.01"
              name="amount"
              required
              step="0.01"
              type="number"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="method">Method</Label>
            <Select name="method" required>
              <SelectTrigger id="method">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {methods.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reference">Reference</Label>
            <Input id="reference" name="reference" />
          </div>
          <DialogFooter>
            <Button disabled={openInvoices.length === 0} type="submit">
              <PlusIcon className="size-4" />
              Record payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
