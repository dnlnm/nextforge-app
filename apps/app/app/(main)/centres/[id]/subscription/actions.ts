"use server";

import { ensureLocalUser } from "@repo/auth/organizations";
import { appName } from "@repo/config/brand";
import { database, type SubscriptionPlan } from "@repo/database";
import type { InvoiceItem } from "@repo/design-system/components/billingsdk/invoice-history";
import { stripe } from "@repo/payments";
import {
  getPlanFromStripePriceId,
  getStripePriceId,
  planDefinitions,
  type BillablePlan,
} from "@repo/payments/plans";
import { revalidatePath } from "next/cache";
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
    name: organization?.name ?? `${appName} centre`,
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
    success_url: `${env.NEXT_PUBLIC_APP_URL}/centres/${organizationId}/subscription?checkout=success`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/centres/${organizationId}/subscription?checkout=cancelled`,
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
    return_url: `${env.NEXT_PUBLIC_APP_URL}/centres/${organizationId}/subscription`,
  });

  redirect(session.url);
};

type InvoiceStatus = "paid" | "refunded" | "open" | "void";

const mapStripeStatus = (status: string | null | undefined): InvoiceStatus => {
  switch (status) {
    case "paid":
    case "open":
    case "void":
      return status;
    case "uncollectible":
      return "open";
    case "refunded":
      return "refunded";
    default:
      return "open";
  }
};

const formatRM = (amountCents: number): string => `RM${(amountCents / 100).toFixed(2)}`;

export const getStripeInvoices = async (
  organizationId: string
): Promise<InvoiceItem[]> => {
  await requireOwner(organizationId);

  const subscription = await getOrCreateSubscription(organizationId);

  if (!subscription.stripeCustomerId) {
    return [];
  }

  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  try {
    const invoices = await stripe.invoices.list({
      customer: subscription.stripeCustomerId,
      limit: 12,
    });

    return invoices.data.map((invoice) => {
      const date = new Date(invoice.created * 1000);
      const formattedDate = date.toISOString().split("T")[0];
      const priceDetail = invoice.lines?.data[0]?.pricing?.price_details?.price;
      const priceId =
        typeof priceDetail === "string" ? priceDetail : priceDetail?.id;
      const planName =
        planDefinitions[getPlanFromStripePriceId(priceId ?? subscription.stripePriceId)].name;

      return {
        id: invoice.id,
        date: formattedDate,
        amount: formatRM(invoice.total),
        status: mapStripeStatus(invoice.status),
        description:
          invoice.description ??
          `${planName} plan - ${date.toLocaleDateString("en-MY", { month: "long", year: "numeric" })}`,
        invoiceUrl: invoice.invoice_pdf ?? undefined,
      };
    });
  } catch (error) {
    console.error("Failed to fetch Stripe invoices:", error);
    return [];
  }
};

const getSubscription = async (organizationId: string) => {
  const user = await ensureLocalUser();

  if (!user) {
    redirect("/sign-in");
  }

  const subscription = await getOrCreateSubscription(organizationId);

  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  return { subscription, stripeInstance: stripe };
};

export const getPaymentMethod = async (
  organizationId: string
): Promise<string> => {
  await requireOwner(organizationId);

  const subscription = await getOrCreateSubscription(organizationId);

  if (!subscription.stripeCustomerId) {
    return "No payment method";
  }

  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: subscription.stripeCustomerId,
      type: "card",
      limit: 1,
    });

    const card = paymentMethods.data[0]?.card;

    if (!card) {
      return "No payment method";
    }

    const brand = card.brand.toUpperCase();

    return `${brand} •••• ${card.last4}`;
  } catch (error) {
    console.error("Failed to fetch payment method:", error);
    return "Unknown";
  }
};

export const updateSubscriptionPlan = async (
  organizationId: string,
  newPlan: SubscriptionPlan
) => {
  await requireOwner(organizationId);

  if (newPlan === "TRIAL") {
    throw new Error("You cannot switch to the trial plan.");
  }

  const { subscription, stripeInstance } = await getSubscription(organizationId);

  if (!subscription.stripeCustomerId) {
    throw new Error("Please subscribe to a plan first.");
  }

  if (!subscription.stripeSubscriptionId) {
    throw new Error("Please subscribe to a plan first.");
  }

  const priceId = getStripePriceId(newPlan as BillablePlan);

  if (!priceId) {
    throw new Error("Stripe price is not configured for this plan.");
  }

  const stripeSubscription = await stripeInstance.subscriptions.retrieve(
    subscription.stripeSubscriptionId
  );

  const itemId = stripeSubscription.items.data[0]?.id;

  if (!itemId) {
    throw new Error("Unable to find the subscription item to update.");
  }

  await stripeInstance.subscriptions.update(
    subscription.stripeSubscriptionId,
    {
      items: [{ id: itemId, price: priceId }],
      metadata: { organizationId, plan: newPlan },
      proration_behavior: "always_invoice",
    }
  );

  revalidatePath(`/centres/${organizationId}/subscription`);
};

export const cancelSubscriptionAtPeriodEnd = async (
  organizationId: string
) => {
  await requireOwner(organizationId);

  const { subscription, stripeInstance } = await getSubscription(
    organizationId
  );

  if (!subscription.stripeSubscriptionId) {
    throw new Error("No active subscription to cancel.");
  }

  if (subscription.cancelAtPeriodEnd) {
    throw new Error(
      "Your subscription is already scheduled to cancel at the end of the billing period."
    );
  }

  await stripeInstance.subscriptions.update(
    subscription.stripeSubscriptionId,
    {
      cancel_at_period_end: true,
    }
  );

  revalidatePath(`/centres/${organizationId}/subscription`);
};

export const reactivateSubscription = async (organizationId: string) => {
  await requireOwner(organizationId);

  const { subscription, stripeInstance } = await getSubscription(
    organizationId
  );

  if (!subscription.stripeSubscriptionId) {
    throw new Error("No subscription to reactivate.");
  }

  if (!subscription.cancelAtPeriodEnd) {
    throw new Error("Your subscription is not scheduled for cancellation.");
  }

  await stripeInstance.subscriptions.update(
    subscription.stripeSubscriptionId,
    {
      cancel_at_period_end: false,
    }
  );

  revalidatePath(`/centres/${organizationId}/subscription`);
};
