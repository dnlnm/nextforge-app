"use client";

import { appName } from "@repo/config/brand";
import { SubscriptionManagement } from "@repo/design-system/components/billingsdk/subscription-management";
import { Button } from "@repo/design-system/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { CardShell } from "@repo/design-system/components/ui/card-shell";
import { toastManager } from "@repo/design-system/components/ui/toast";
import type { CurrentPlan } from "@repo/payments/billingsdk-plans";
import { billingSDKPlans } from "@repo/payments/billingsdk-plans";
import { CheckIcon } from "lucide-react";
import { useTransition } from "react";
import {
  cancelSubscriptionAtPeriodEnd,
  reactivateSubscription,
  startSubscriptionCheckout,
  updateSubscriptionPlan,
} from "./actions";

interface SubscriptionManagementWrapperProps {
  readonly currentPlan: CurrentPlan;
  readonly isCancelled: boolean;
  readonly isTrial: boolean;
  readonly organizationId: string;
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
        toastManager.add({
          title:
            error instanceof Error ? error.message : "Failed to start checkout",
          type: "error",
        });
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
          toastManager.add({
            title: `Downgrade will take effect on ${currentPlan.nextBillingDate}.`,
            type: "success",
          });
        } else {
          toastManager.add({
            title: "Plan updated successfully!",
            type: "success",
          });
        }
      } catch (error) {
        toastManager.add({
          title:
            error instanceof Error ? error.message : "Failed to update plan",
          type: "error",
        });
      }
    });
  };

  const handleCancel = () => {
    startTransition(async () => {
      try {
        await cancelSubscriptionAtPeriodEnd(organizationId);
        toastManager.add({
          title: `Subscription will remain active until ${currentPlan.nextBillingDate}.`,
          type: "success",
        });
      } catch (error) {
        toastManager.add({
          title:
            error instanceof Error
              ? error.message
              : "Failed to cancel subscription",
          type: "error",
        });
      }
    });
  };

  const handleReactivate = () => {
    startTransition(async () => {
      try {
        await reactivateSubscription(organizationId);
        toastManager.add({
          title: "Subscription reactivated successfully!",
          type: "success",
        });
      } catch (error) {
        toastManager.add({
          title:
            error instanceof Error ? error.message : "Failed to reactivate",
          type: "error",
        });
      }
    });
  };

  if (isTrial) {
    return (
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        {paidPlans.map((plan) => (
          <CardShell key={plan.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.title}</CardTitle>
                {plan.badge ? (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
                    {plan.badge}
                  </span>
                ) : null}
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-semibold text-2xl">
                RM{plan.monthlyPrice}
                <span className="font-normal text-muted-foreground text-sm">
                  /month
                </span>
              </p>
              <ul className="space-y-2 text-sm">
                {plan.features.map((feature) => (
                  <li className="flex items-center gap-2" key={feature.name}>
                    <CheckIcon className="size-4 text-primary" />
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
          </CardShell>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-6 space-y-6">
      {isCancelled ? (
        <CardShell className="border-orange-200" panelClassName="bg-orange-50">
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
        </CardShell>
      ) : null}

      <SubscriptionManagement
        cancelSubscription={{
          title: "Cancel Subscription",
          description:
            "We're sorry to see you go. Are you sure you want to cancel your subscription?",
          plan: currentPlan.plan,
          warningTitle: `You will lose access to these ${appName} features`,
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
          onKeepSubscription: () => {
            toastManager.add({
              title: "Great choice! Your subscription continues.",
              type: "success",
            });
          },
        }}
        currentPlan={currentPlan}
        isCancelled={isCancelled}
        updatePlan={{
          currentPlan: currentPlan.plan,
          plans: paidPlans,
          onPlanChange: handlePlanChange,
          triggerText: "Change Plan",
        }}
      />
    </div>
  );
};
