import { analytics } from "@repo/analytics/server";
import { appName } from "@repo/config/brand";
import {
  database,
  type SubscriptionPlan,
  type SubscriptionStatus,
} from "@repo/database";
import { parseError } from "@repo/observability/error";
import { log } from "@repo/observability/log";
import type { Stripe } from "@repo/payments";
import { stripe } from "@repo/payments";
import { getPlanFromStripePriceId } from "@repo/payments/plans";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "@/env";

const getUserFromCustomerId = async (customerId: string) => {
  const subscription = await database.organizationSubscription.findFirst({
    where: { stripeCustomerId: customerId },
    include: {
      organization: {
        select: { createdBy: { select: { id: true, authUserId: true } } },
      },
    },
  });

  return subscription?.organization.createdBy;
};

const handleCheckoutSessionCompleted = async (
  data: Stripe.Checkout.Session
) => {
  if (data.mode === "subscription") {
    const organizationId = data.metadata?.organizationId;
    const subscriptionId =
      typeof data.subscription === "string"
        ? data.subscription
        : data.subscription?.id;

    if (organizationId && subscriptionId && stripe) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await syncSubscription(subscription, organizationId);
    }
  }

  if (!data.customer) {
    return;
  }

  const customerId =
    typeof data.customer === "string" ? data.customer : data.customer.id;
  const user = await getUserFromCustomerId(customerId);

  if (!user) {
    return;
  }

  analytics?.capture({
    event: "User Subscribed",
    distinctId: user.id,
  });
};

const statusMap: Partial<
  Record<Stripe.Subscription.Status, SubscriptionStatus>
> = {
  active: "ACTIVE",
  canceled: "CANCELED",
  incomplete: "INCOMPLETE",
  incomplete_expired: "INCOMPLETE",
  past_due: "PAST_DUE",
  paused: "PAST_DUE",
  trialing: "TRIALING",
  unpaid: "UNPAID",
};

const getDateFromUnix = (value?: number | null) =>
  value ? new Date(value * 1000) : undefined;

const getCurrentPeriodEnd = (subscription: Stripe.Subscription) =>
  subscription.items.data.at(0)?.current_period_end;

const getOrganizationId = async (subscription: Stripe.Subscription) => {
  if (subscription.metadata.organizationId) {
    return subscription.metadata.organizationId;
  }

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;
  const existing = await database.organizationSubscription.findUnique({
    where: { stripeCustomerId: customerId },
    select: { organizationId: true },
  });

  return existing?.organizationId;
};

const syncSubscription = async (
  subscription: Stripe.Subscription,
  fallbackOrganizationId?: string
) => {
  const organizationId =
    fallbackOrganizationId ?? (await getOrganizationId(subscription));

  if (!organizationId) {
    log.warn(
      `No ${appName} organization found for Stripe subscription ${subscription.id}`
    );
    return;
  }

  // Verify the organization exists before attempting to upsert
  const organizationExists = await database.organization.findUnique({
    where: { id: organizationId },
    select: { id: true },
  });

  if (!organizationExists) {
    log.error(
      `Organization ${organizationId} does not exist. Cannot create subscription for Stripe subscription ${subscription.id}`
    );
    return;
  }

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;
  const priceId = subscription.items.data.at(0)?.price.id;

  // Price mapping is the source of truth for the plan; metadata (set during
  // checkout) can go stale when a plan is changed, so only fall back to it when
  // the price is unknown (mapped to TRIAL).
  const metadataPlan = subscription.metadata.plan as
    | SubscriptionPlan
    | undefined;
  const planFromPriceId = getPlanFromStripePriceId(priceId);
  const plan = planFromPriceId !== "TRIAL" ? planFromPriceId : metadataPlan;

  // Log for debugging
  log.info(
    `Syncing subscription ${subscription.id}: priceId=${priceId}, metadataPlan=${metadataPlan}, planFromPriceId=${planFromPriceId}, finalPlan=${plan}`
  );

  // Warn if there's a mismatch between metadata and priceId mapping
  if (
    metadataPlan &&
    metadataPlan !== planFromPriceId &&
    planFromPriceId !== "TRIAL"
  ) {
    log.warn(
      `Plan mismatch for subscription ${subscription.id}: metadata=${metadataPlan}, priceId mapping=${planFromPriceId}`
    );
  }

  await database.organizationSubscription.upsert({
    where: { organizationId },
    create: {
      organizationId,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEndsAt: getDateFromUnix(getCurrentPeriodEnd(subscription)),
      plan,
      status: statusMap[subscription.status] ?? "INCOMPLETE",
      stripeCustomerId: customerId,
      stripePriceId: priceId,
      stripeSubscriptionId: subscription.id,
      trialEndsAt: getDateFromUnix(subscription.trial_end),
    },
    update: {
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEndsAt: getDateFromUnix(getCurrentPeriodEnd(subscription)),
      plan,
      status: statusMap[subscription.status] ?? "INCOMPLETE",
      stripeCustomerId: customerId,
      stripePriceId: priceId,
      stripeSubscriptionId: subscription.id,
      trialEndsAt: getDateFromUnix(subscription.trial_end),
    },
  });
};

const handleSubscriptionScheduleCanceled = async (
  data: Stripe.SubscriptionSchedule
) => {
  if (!data.customer) {
    return;
  }

  const customerId =
    typeof data.customer === "string" ? data.customer : data.customer.id;
  const user = await getUserFromCustomerId(customerId);

  if (!user) {
    return;
  }

  analytics?.capture({
    event: "User Unsubscribed",
    distinctId: user.id,
  });
};

export const POST = async (request: Request): Promise<Response> => {
  if (!(stripe && env.STRIPE_WEBHOOK_SECRET)) {
    return NextResponse.json({ message: "Not configured", ok: false });
  }

  try {
    const body = await request.text();
    const headerPayload = await headers();
    const signature = headerPayload.get("stripe-signature");

    if (!signature) {
      throw new Error("missing stripe-signature header");
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.deleted":
      case "customer.subscription.updated": {
        await syncSubscription(event.data.object);
        break;
      }
      case "subscription_schedule.canceled": {
        await handleSubscriptionScheduleCanceled(event.data.object);
        break;
      }
      default: {
        log.warn(`Unhandled event type ${event.type}`);
      }
    }

    await analytics?.shutdown();

    return NextResponse.json({ result: event, ok: true });
  } catch (error) {
    const message = parseError(error);

    log.error(message);

    return NextResponse.json(
      {
        message: "something went wrong",
        ok: false,
      },
      { status: 500 }
    );
  }
};
