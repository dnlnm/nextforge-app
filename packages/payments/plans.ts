import type { SubscriptionPlan, SubscriptionStatus } from "@repo/database";
import { keys } from "./keys";

export type BillablePlan = Exclude<SubscriptionPlan, "TRIAL">;

export interface PlanDefinition {
  readonly classes: number;
  readonly invoicesPerMonth: number;
  readonly monthlyPrice: string;
  readonly name: string;
  readonly students: number;
  readonly teachers: number;
}

export const trialDays = 14;

export const planDefinitions: Record<SubscriptionPlan, PlanDefinition> = {
  PRO: {
    classes: 60,
    invoicesPerMonth: 300,
    monthlyPrice: "RM99/month",
    name: "Pro",
    students: 300,
    teachers: 30,
  },
  STARTER: {
    classes: 20,
    invoicesPerMonth: 100,
    monthlyPrice: "RM49/month",
    name: "Starter",
    students: 100,
    teachers: 10,
  },
  TRIAL: {
    classes: 10,
    invoicesPerMonth: 50,
    monthlyPrice: "Free trial",
    name: "Trial",
    students: 50,
    teachers: 5,
  },
};

export const activeSubscriptionStatuses = new Set<SubscriptionStatus>([
  "ACTIVE",
  "TRIALING",
]);

export const getStripePriceId = (plan: BillablePlan) => {
  const env = keys();

  return plan === "STARTER"
    ? env.TLAS_STRIPE_STARTER_PRICE_ID
    : env.TLAS_STRIPE_PRO_PRICE_ID;
};

export const getPlanFromStripePriceId = (priceId?: string | null) => {
  const env = keys();

  if (priceId && priceId === env.TLAS_STRIPE_STARTER_PRICE_ID) {
    return "STARTER";
  }

  if (priceId && priceId === env.TLAS_STRIPE_PRO_PRICE_ID) {
    return "PRO";
  }

  return "TRIAL";
};
