"use client";

import { SubscriptionManagement } from "@repo/design-system/components/billingsdk/subscription-management";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Button } from "@repo/design-system/components/ui/button";
import type { CurrentPlan } from "@repo/payments/billingsdk-plans";
import { billingSDKPlans } from "@repo/payments/billingsdk-plans";
import { CheckIcon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  cancelSubscriptionAtPeriodEnd,
  reactivateSubscription,
  startSubscriptionCheckout,
  updateSubscriptionPlan,
} from "./actions";

interface SubscriptionManagementWrapperProps {
  readonly currentPlan: CurrentPlan;
  readonly organizationId: string;
  readonly isTrial: boolean;
  readonly isCancelled: boolean;
}

const paidPlans = billingSDKPlans.filter((plan) => plan.id !== "TRIAL");

export const SubscriptionManagementWrapper = ({
  currentPlan,
  organizationId,
  isTrial,
  isCancelled,
}: SubscriptionManagementWrapperProps) => {
  const [pending, startTransition] = useTransition();

  const handleSubscribe = (planId: string) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("plan", planId);
        await startSubscriptionCheckout(organizationId, formData);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to start checkout"
        );
      }
    });
  };

  const handlePlanChange = (planId: string) => {
    startTransition(async () => {
      try {
        if (isTrial) {
          await handleSubscribe(planId);
          return;
        }

        const targetPlan = billingSDKPlans.find((plan) => plan.id === planId);
        const currentPrice = Number.parseFloat(currentPlan.plan.monthlyPrice);
        const targetPrice = Number.parseFloat(targetPlan?.monthlyPrice ?? "0");
        const isDowngrade = targetPrice < currentPrice;

        await updateSubscriptionPlan(organizationId, planId as never);

        if (isDowngrade) {
          toast.success(
            `Downgrade will take effect on ${currentPlan.nextBillingDate}.`
          );
        } else {
          toast.success("Plan updated successfully!");
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update plan"
        );
      }
    });
  };

  const handleCancel = () => {
    startTransition(async () => {
      try {
        await cancelSubscriptionAtPeriodEnd(organizationId);
        toast.success(
          `Subscription will remain active until ${currentPlan.nextBillingDate}.`
        );
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to cancel subscription"
        );
      }
    });
  };

  const handleReactivate = () => {
    startTransition(async () => {
      try {
        await reactivateSubscription(organizationId);
        toast.success("Subscription reactivated successfully!");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to reactivate"
        );
      }
    });
  };

  if (isTrial) {
    return (
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        {paidPlans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.title}</CardTitle>
                {plan.badge ? (
                  <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
                    {plan.badge}
                  </span>
                ) : null}
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-semibold text-2xl">
                RM{plan.monthlyPrice}
                <span className="text-muted-foreground text-sm font-normal">
                  /month
                </span>
              </p>
              <ul className="space-y-2 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature.name} className="flex items-center gap-2">
                    <CheckIcon className="text-primary size-4" />
                    {feature.name}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                disabled={pending}
                onClick={() => handleSubscribe(plan.id)}
              >
                {pending ? "Redirecting..." : `Subscribe to ${plan.title}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-6 space-y-6">
      {isCancelled ? (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="py-4">
            <p className="font-medium text-orange-900">
              Subscription scheduled to end on {currentPlan.nextBillingDate}
            </p>
            <p className="text-orange-700 text-sm">
              You can reactivate your subscription anytime before then to keep
              your access and data.
            </p>
            <Button
              className="mt-4"
              disabled={pending}
              onClick={handleReactivate}
            >
              {pending ? "Reactivating..." : "Reactivate Subscription"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <SubscriptionManagement
        currentPlan={currentPlan}
        isCancelled={isCancelled}
        updatePlan={{
          currentPlan: currentPlan.plan,
          plans: paidPlans,
          onPlanChange: handlePlanChange,
          triggerText: "Change Plan",
        }}
        cancelSubscription={{
          title: "Cancel Subscription",
          description:
            "We're sorry to see you go. Are you sure you want to cancel your subscription?",
          plan: currentPlan.plan,
          warningTitle: "You will lose access to these TLAS.MY features",
          warningText:
            "Once cancelled, you will lose access to student and class management, automated invoicing, payment tracking, attendance monitoring, and reports. Your subscription will remain active until the end of your billing period, and you can reactivate anytime before then.",
          keepButtonText: "Keep My Subscription",
          continueButtonText: "Continue Cancellation",
          finalTitle: "Cancel your subscription?",
          finalSubtitle:
            "This will stop renewals at the end of your current billing period.",
          finalWarningText:
            "You'll lose access to all premium features and your data may be removed after the billing period ends.",
          confirmButtonText: "Yes, Cancel Subscription",
          onCancel: handleCancel,
          onKeepSubscription: async () => {
            toast.success("Great choice! Your subscription continues.");
          },
        }}
      />
    </div>
  );
};