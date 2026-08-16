import { analytics } from "@repo/analytics/server";
import { appName } from "@repo/config/brand";
import { database, Prisma, type SubscriptionPlan, type SubscriptionStatus } from "@repo/database";
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
  // the price is unknown. An unknown price never downgrades an existing plan.
  const metadataPlan = subscription.metadata.plan as
    | SubscriptionPlan
    | undefined;
  const planFromPriceId = getPlanFromStripePriceId(priceId);
  const plan = planFromPriceId ?? metadataPlan;

  if (!(planFromPriceId || metadataPlan)) {
    log.error(
      `Could not map a plan for subscription ${subscription.id}: priceId=${priceId}, metadataPlan=${metadataPlan}. Keeping the current plan on file.`
    );
  }

  // Log for debugging
  log.info(
    `Syncing subscription ${subscription.id}: priceId=${priceId}, metadataPlan=${metadataPlan}, planFromPriceId=${planFromPriceId}, finalPlan=${plan}`
  );

  // Warn if there's a mismatch between metadata and priceId mapping
  if (metadataPlan && planFromPriceId && metadataPlan !== planFromPriceId) {
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

/**
 * Stripe redelivers webhooks until it receives a 2xx. Without deduplication a
 * lost response causes the same event to be handled again (double-firing
 * analytics or double-applying a side effect). We record each event id once and
 * treat a re-delivery as a no-op, making every handler idempotent by default.
 */
const tryClaimWebhookEvent = async (
  eventId: string,
  eventType: string
): Promise<boolean> => {
  try {
    await database.webhookEvent.create({
      data: {
        eventId,
        eventType,
        provider: "stripe",
        status: "PROCESSING",
      },
    });

    return true;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // Duplicate unique (provider, eventId): already processed this event.
      return false;
    }

    throw error;
  }
};

const markWebhookEventProcessed = async (eventId: string) => {
  await database.webhookEvent.updateMany({
    where: { eventId, provider: "stripe" },
    data: { processedAt: new Date(), status: "PROCESSED" },
  });
};

export const POST = async (request: Request): Promise<Response> => {
  if (!(stripe && env.STRIPE_WEBHOOK_SECRET)) {
    // Return a server error so Stripe retries once the webhook is configured.
    // A 200 here would make Stripe silently drop every event.
    return NextResponse.json(
      { message: "Not configured", ok: false },
      { status: 503 }
    );
  }

  const body = await request.text();
  const headerPayload = await headers();
  const signature = headerPayload.get("stripe-signature");
  let event: Stripe.Event | undefined;

  try {
    if (!signature) {
      throw new Error("missing stripe-signature header");
    }

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );

    // Idempotency guard: return 200 for a re-delivered event without
    // re-processing it.
    if (!(await tryClaimWebhookEvent(event.id, event.type))) {
      log.info(`Deduplicated Stripe event ${event.id} (${event.type})`);

      return NextResponse.json({ deduplicated: true, ok: true });
    }

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

    await markWebhookEventProcessed(event.id);
    await analytics?.shutdown();

    return NextResponse.json({ result: event, ok: true });
  } catch (error) {
    const message = parseError(error);

    log.error(message);

    // Release the claim (best-effort) so a Stripe retry re-processes the event.
    // Returning 500 without releasing would let a transient mid-handler failure
    // be silently dropped as a "duplicate" on the next delivery.
    if (event?.id) {
      try {
        await database.webhookEvent.deleteMany({
          where: { eventId: event.id, provider: "stripe" },
        });
      } catch {
        // Ignore cleanup errors; the primary failure is already being reported.
      }
    }

    return NextResponse.json(
      {
        message: "something went wrong",
        ok: false,
      },
      { status: 500 }
    );
  }
};
