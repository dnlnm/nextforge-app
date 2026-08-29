import type { SubscriptionPlan, SubscriptionStatus } from "@repo/database";
import { keys } from "./keys";

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
  TRIAL: {
    classes: 10,
    invoicesPerMonth: 50,
    monthlyPrice: "Free trial",
    name: "Trial",
    students: 50,
    teachers: 5,
  },
  STARTER: {
    classes: 20,
    invoicesPerMonth: 100,
    monthlyPrice: "RM49/month",
    name: "Starter",
    students: 100,
    teachers: 10,
  },
  PRO: {
    classes: 60,
    invoicesPerMonth: 300,
    monthlyPrice: "RM99/month",
    name: "Pro",
    students: 300,
    teachers: 30,
  },
  MAX: {
    classes: 200,
    invoicesPerMonth: 1000,
    monthlyPrice: "RM199/month",
    name: "Max",
    students: 500,
    teachers: 100,
  },
};

export const activeSubscriptionStatuses = new Set<SubscriptionStatus>([
  "ACTIVE",
  "TRIALING",
]);

export const getStripePriceId = (plan: SubscriptionPlan) => {
  const env = keys();

  const priceIds: Record<SubscriptionPlan, string | undefined> = {
    TRIAL: undefined,
    STARTER:
      env.KLIO_STRIPE_STARTER_PRICE_ID ?? env.TLAS_STRIPE_STARTER_PRICE_ID,
    PRO: env.KLIO_STRIPE_PRO_PRICE_ID ?? env.TLAS_STRIPE_PRO_PRICE_ID,
    MAX: env.KLIO_STRIPE_MAX_PRICE_ID ?? env.TLAS_STRIPE_MAX_PRICE_ID,
  };

  return priceIds[plan];
};

/**
 * Maps a Stripe price id to the plan, or `null` when the price id is not
 * recognised. Callers must not silently change the plan on an unknown id — a
 * misconfigured env var should never turn a paying customer into a different
 * plan.
 */
export const getPlanFromStripePriceId = (
  priceId?: string | null
): SubscriptionPlan | null => {
  const env = keys();

  const starterPriceId =
    env.KLIO_STRIPE_STARTER_PRICE_ID ?? env.TLAS_STRIPE_STARTER_PRICE_ID;
  const proPriceId =
    env.KLIO_STRIPE_PRO_PRICE_ID ?? env.TLAS_STRIPE_PRO_PRICE_ID;
  const maxPriceId =
    env.KLIO_STRIPE_MAX_PRICE_ID ?? env.TLAS_STRIPE_MAX_PRICE_ID;

  if (priceId && priceId === starterPriceId) {
    return "STARTER";
  }

  if (priceId && priceId === proPriceId) {
    return "PRO";
  }

  if (priceId && priceId === maxPriceId) {
    return "MAX";
  }

  return null;
};
