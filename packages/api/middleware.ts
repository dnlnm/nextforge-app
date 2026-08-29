import "server-only";

import type { TenantRole } from "@repo/auth/shared";
import { hasTenantRole } from "@repo/auth/shared";

export type { TenantRole } from "@repo/auth/shared";

import {
  database,
  type Prisma,
  type SubscriptionPlan,
  type SubscriptionStatus,
} from "@repo/database";
import { activeSubscriptionStatuses } from "@repo/payments/plans";
import { planDefinitions } from "@repo/payments/plans";
import {
  assertWithinPlanLimit as assertWithinPlanLimitShared,
  getSubscriptionUsage,
  type LimitResource,
} from "@repo/payments/subscription";
import { createSupabaseClient } from "./context";
import { baseProcedure, TRPCError } from "./trpc";

const getBearerToken = (headers: Headers): string | null => {
  const authorization = headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();

  return token.length > 0 ? token : null;
};

export interface AuthenticatedContext {
  /** The validated `Authorization: Bearer` token, for acting as the user. */
  accessToken: string;
  authEmail: string | null;
  authUserId: string;
  headers: Headers;
  /** `user_metadata.activeOrganizationId`, if set on the session. */
  orgId: string | null;
}

/**
 * Resolves the Supabase user from the `Authorization: Bearer <token>` header.
 * Every tRPC request that touches tenant data must pass through this.
 */
export const protectedProcedure = baseProcedure.use(async (opts) => {
  const token = getBearerToken(opts.ctx.headers);

  if (!token) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Missing or empty bearer token",
    });
  }

  const supabase = createSupabaseClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid or expired session",
    });
  }

  return opts.next({
    ctx: {
      accessToken: token,
      headers: opts.ctx.headers,
      authUserId: data.user.id,
      authEmail: data.user.email ?? null,
      orgId:
        (data.user.user_metadata?.activeOrganizationId as string | undefined) ??
        null,
    } satisfies AuthenticatedContext,
  });
});

export interface OrganizationContext extends AuthenticatedContext {
  membershipId: string;
  organizationId: string;
  role: TenantRole;
  /** Snapshot of the organization's subscription for the active request. */
  subscription: {
    canUsePaidFeatures: boolean;
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    trialExpired: boolean;
  };
  userId: string;
}

/**
 * Resolves the active organization for the user, exactly as the web's
 * `requireTenant()` does for the main domain (no subdomain on mobile):
 * - reads `user_metadata.activeOrganizationId`
 * - loads an ACTIVE membership for that organization
 * - rejects cross-tenant access
 */
export const orgProcedure = protectedProcedure.use(async (opts) => {
  const { headers, authUserId, authEmail, orgId } = opts.ctx;

  if (!orgId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "No active organization. Set activeOrganizationId in the session.",
    });
  }

  const membership = await database.organizationMembership.findFirst({
    where: {
      status: "ACTIVE",
      organization: { id: orgId, status: "ACTIVE" },
      user: { authUserId, archivedAt: null },
    },
    select: {
      id: true,
      role: true,
      organizationId: true,
      userId: true,
    },
  });

  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Access denied. You are not a member of this organisation. Please contact the centre owner for access.",
    });
  }

  const subscription = await database.organizationSubscription.findFirst({
    where: { organizationId: membership.organizationId },
  });

  const now = new Date();
  const trialExpired =
    subscription?.status === "TRIALING" &&
    Boolean(subscription.trialEndsAt && subscription.trialEndsAt < now);
  const canUsePaidFeatures =
    activeSubscriptionStatuses.has(subscription?.status ?? "TRIALING") &&
    !trialExpired;

  return opts.next({
    ctx: {
      accessToken: opts.ctx.accessToken,
      headers,
      authUserId,
      authEmail,
      orgId,
      membershipId: membership.id,
      organizationId: membership.organizationId,
      role: membership.role as TenantRole,
      userId: membership.userId,
      subscription: {
        canUsePaidFeatures,
        plan: subscription?.plan ?? "STARTER",
        status: subscription?.status ?? "TRIALING",
        trialExpired,
      },
    } satisfies OrganizationContext,
  });
});

/**
 * Blocks requests when the organization's subscription is not usable
 * (expired trial, past-due, cancelled, etc.). Mirrors the web's
 * `assertWithinPlanLimit` "not active" branch.
 */
export const requireActiveSubscription = (ctx: OrganizationContext) => {
  if (!ctx.subscription.canUsePaidFeatures) {
    throw new TRPCError({
      code: "PAYMENT_REQUIRED",
      message:
        "Your trial or subscription is not active. Contact the centre owner or manage the plan from Billing.",
    });
  }
};

/**
 * Enforces the same plan limits as the web's `assertWithinPlanLimit`, translating
 * the plain error into a tRPC PAYMENT_REQUIRED.
 */
export const assertWithinPlanLimit = async (
  ctx: OrganizationContext,
  resource: LimitResource,
  increment = 1
) => {
  try {
    await assertWithinPlanLimitShared({
      increment,
      organizationId: ctx.organizationId,
      resource,
      userId: ctx.authUserId,
    });
  } catch (error) {
    throw new TRPCError({
      code: "PAYMENT_REQUIRED",
      message:
        error instanceof Error
          ? error.message
          : "Your trial or subscription is not active.",
    });
  }
};

/**
 * Transaction-scoped plan-limit check that reuses the subscription snapshot
 * captured in `orgProcedure` (`ctx.subscription`), instead of re-running the
 * subscription upsert + full usage query on every counted mutation. Usage is
 * re-counted *inside the same transaction* as the create so the check and the
 * write commit (or roll back) together.
 */
export const assertWithinPlanLimitTx = async (
  ctx: OrganizationContext,
  tx: Prisma.TransactionClient,
  resource: LimitResource,
  increment = 1
) => {
  if (!ctx.subscription.canUsePaidFeatures) {
    throw new TRPCError({
      code: "PAYMENT_REQUIRED",
      message:
        "Your trial or subscription is not active. Open Billing to upgrade or manage your plan.",
    });
  }

  const plan = planDefinitions[ctx.subscription.plan];
  const usage = await getSubscriptionUsage(ctx.organizationId, tx);
  const current = usage[resource];

  if (current + increment > plan[resource]) {
    throw new TRPCError({
      code: "PAYMENT_REQUIRED",
      message: `${plan.name} allows ${plan[resource]} ${resource}. Open Billing to upgrade your plan.`,
    });
  }
};

/**
 * Role-gated procedure using the same hierarchical semantics as the web
 * (`OWNER >= ADMIN >= TEACHER`).
 */
export const roleProcedure = (roles: readonly TenantRole[]) =>
  orgProcedure.use((opts) => {
    const { role } = opts.ctx;

    if (!hasTenantRole(role, roles)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to perform this action",
      });
    }

    return opts.next();
  });
