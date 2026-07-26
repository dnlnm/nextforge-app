"use server";

import { requireTenantRole } from "@repo/auth/authorization";
import { database, type SubscriptionPlan } from "@repo/database";
import { stripe } from "@repo/payments";
import { getStripePriceId } from "@repo/payments/plans";
import { redirect } from "next/navigation";
import { env } from "@/env";
import { getOrCreateSubscription } from "./limits";

const getString = (formData: FormData, key: string) => {
  const value = formData.get(key);

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const paidPlans = new Set<SubscriptionPlan>(["STARTER", "PRO"]);

const getOrganizationCustomer = async (organizationId: string) => {
  const [organization, subscription] = await Promise.all([
    database.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    }),
    getOrCreateSubscription(organizationId),
  ]);

  if (subscription.stripeCustomerId) {
    return subscription.stripeCustomerId;
  }

  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const customer = await stripe.customers.create({
    metadata: { organizationId },
    name: organization?.name ?? "TLAS.MY centre",
  });

  await database.organizationSubscription.update({
    where: { organizationId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
};

export const startSubscriptionCheckout = async (formData: FormData) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const plan = getString(formData, "plan") as SubscriptionPlan | undefined;

  if (!(plan && paidPlans.has(plan))) {
    throw new Error("Choose a valid paid plan.");
  }

  const priceId = getStripePriceId(plan as Exclude<SubscriptionPlan, "TRIAL">);

  if (!(stripe && priceId)) {
    throw new Error("Stripe price is not configured for this plan.");
  }

  const customerId = await getOrganizationCustomer(tenant.organizationId);
  const session = await stripe.checkout.sessions.create({
    allow_promotion_codes: true,
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { organizationId: tenant.organizationId, plan },
    mode: "subscription",
    subscription_data: {
      metadata: { organizationId: tenant.organizationId, plan },
    },
    success_url: `${env.NEXT_PUBLIC_APP_URL}/billing?checkout=success`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/billing?checkout=cancelled`,
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }

  redirect(session.url);
};

export const openBillingPortal = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const customerId = await getOrganizationCustomer(tenant.organizationId);

  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${env.NEXT_PUBLIC_APP_URL}/billing`,
  });

  redirect(session.url);
};
