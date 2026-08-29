import { formatLongDate } from "@repo/date";
import type { CurrentPlan, Plan } from "@repo/payments/billingsdk-plans";
import { billingSDKPlans } from "@repo/payments/billingsdk-plans";

interface BillingState {
  subscription: {
    plan: "TRIAL" | "STARTER" | "PRO" | "MAX";
    status:
      | "TRIALING"
      | "ACTIVE"
      | "PAST_DUE"
      | "CANCELED"
      | "INCOMPLETE"
      | "UNPAID";
    currentPeriodEndsAt: Date | null;
    cancelAtPeriodEnd: boolean;
  };
}

const statusMap: Record<
  BillingState["subscription"]["status"],
  CurrentPlan["status"]
> = {
  TRIALING: "active",
  ACTIVE: "active",
  PAST_DUE: "past_due",
  CANCELED: "cancelled",
  INCOMPLETE: "inactive",
  UNPAID: "past_due",
};

const formatDate = (date: Date): string => formatLongDate(date, "ms-MY");

export const mapToCurrentPlan = (
  state: BillingState,
  paymentMethod: string
): CurrentPlan => {
  const plan =
    billingSDKPlans.find((p) => p.id === state.subscription.plan) ?? null;

  if (!plan) {
    throw new Error("No billing plan configuration found.");
  }

  const status = state.subscription.cancelAtPeriodEnd
    ? "cancelled"
    : statusMap[state.subscription.status];

  return {
    plan,
    type: "monthly",
    nextBillingDate: state.subscription.currentPeriodEndsAt
      ? formatDate(state.subscription.currentPeriodEndsAt)
      : "N/A",
    paymentMethod,
    status,
  };
};

export const getPlanById = (planId: string): Plan | undefined =>
  billingSDKPlans.find((p) => p.id === planId);

export { billingSDKPlans };
