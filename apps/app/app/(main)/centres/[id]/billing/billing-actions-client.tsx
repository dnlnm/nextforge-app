"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { CreditCardIcon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { openBillingPortal, startSubscriptionCheckout } from "./actions";

interface BillingActionsProps {
  readonly alreadySubscribed: boolean;
  readonly organizationId: string;
}

export const BillingActions = ({
  alreadySubscribed,
  organizationId,
}: BillingActionsProps) => {
  const [pending, startTransition] = useTransition();

  const handleUpgrade = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        await startSubscriptionCheckout(organizationId, formData);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to start checkout"
        );
      }
    });
  };

  const handlePortal = () => {
    startTransition(async () => {
      try {
        await openBillingPortal(organizationId);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to open billing portal"
        );
      }
    });
  };

  if (alreadySubscribed) {
    return (
      <Button
        className="w-full"
        disabled={pending}
        onClick={handlePortal}
        variant="secondary"
      >
        <CreditCardIcon className="mr-2 size-4" />
        {pending ? "Opening..." : "Manage Subscription"}
      </Button>
    );
  }

  return (
    <form className="space-y-2" onSubmit={handleUpgrade}>
      <input name="plan" type="hidden" value="STARTER" />
      <Button className="w-full" disabled={pending} type="submit">
        <CreditCardIcon className="mr-2 size-4" />
        {pending ? "Redirecting..." : "Subscribe to Starter"}
      </Button>
    </form>
  );
};
