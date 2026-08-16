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
import { toastManager } from "@repo/design-system/components/ui/toast";
import { SparklesIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { generateMonthlyInvoices } from "./actions";

export function GenerateInvoicesDialog({
  defaultBillingMonth,
}: {
  defaultBillingMonth: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    async (_state: { error?: string }, formData: FormData) => {
      try {
        await generateMonthlyInvoices(formData);
        setOpen(false);
        router.refresh();
        return {};
      } catch (error) {
        return {
          error:
            error instanceof Error
              ? error.message
              : "Failed to generate invoices.",
        };
      }
    },
    {}
  );

  useEffect(() => {
    if (state.error) {
      toastManager.add({ title: state.error, type: "error" });
    }
  }, [state.error]);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={<Button className="flex-1 md:flex-none" />}>
        <SparklesIcon className="size-4" />
        Generate invoices
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate monthly invoices</DialogTitle>
          <DialogDescription>
            Creates one invoice per active student based on active class
            enrolments that have started. Students whose enrollment date is
            after the billing month are skipped. Existing invoices for the same
            month are not recreated.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="billingMonth">Billing month</Label>
            <Input
              defaultValue={defaultBillingMonth}
              id="billingMonth"
              name="billingMonth"
              required
              type="month"
            />
          </div>
          <DialogFooter>
            <Button disabled={isPending} type="submit">
              <SparklesIcon className="size-4" />
              Generate invoices
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
