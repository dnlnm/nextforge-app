"use server";

import { ensureLocalUser } from "@repo/auth/organizations";
import { database, type SubscriptionPlan } from "@repo/database";
import { stripe } from "@repo/payments";
import { getStripePriceId } from "@repo/payments/plans";
import { redirect } from "next/navigation";
import { env } from "@/env";
import { getOrCreateSubscription } from "../../../../(workspace)/billing/limits";

const getString = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const paidPlans = new Set<SubscriptionPlan>(["STARTER", "PRO"]);

const requireOwner = async (organizationId: string) => {
  const user = await ensureLocalUser();

  if (!user) {
    redirect("/sign-in");
  }

  const membership = await database.organizationMembership.findFirst({
    where: {
      organizationId,
      userId: user.id,
      status: "ACTIVE",
      role: "OWNER",
    },
    select: { id: true },
  });

  if (!membership) {
    throw new Error("Only owners can manage billing");
  }
};

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

export const startSubscriptionCheckout = async (
  organizationId: string,
  formData: FormData
) => {
  await requireOwner(organizationId);

  const plan = getString(formData, "plan") as SubscriptionPlan | undefined;

  if (!(plan && paidPlans.has(plan))) {
    throw new Error("Choose a valid paid plan.");
  }

  const subscription = await getOrCreateSubscription(organizationId);

  if (subscription.stripeSubscriptionId) {
    throw new Error(
      "This centre already has a Stripe subscription. Use the billing portal to manage plan changes."
    );
  }

  const priceId = getStripePriceId(plan as Exclude<SubscriptionPlan, "TRIAL">);

  if (!(stripe && priceId)) {
    throw new Error("Stripe price is not configured for this plan.");
  }

  const customerId = await getOrganizationCustomer(organizationId);
  const session = await stripe.checkout.sessions.create({
    allow_promotion_codes: true,
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { organizationId, plan },
    mode: "subscription",
    subscription_data: {
      metadata: { organizationId, plan },
    },
    success_url: `${env.NEXT_PUBLIC_APP_URL}/centres/${organizationId}/billing?checkout=success`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/centres/${organizationId}/billing?checkout=cancelled`,
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }

  redirect(session.url);
};

export const openBillingPortal = async (organizationId: string) => {
  await requireOwner(organizationId);
  const customerId = await getOrganizationCustomer(organizationId);

  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${env.NEXT_PUBLIC_APP_URL}/centres/${organizationId}/billing`,
  });

  redirect(session.url);
};
