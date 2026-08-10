import "server-only";

import type { TenantRole } from "@repo/auth/shared";
import { hasTenantRole } from "@repo/auth/shared";

export type { TenantRole } from "@repo/auth/shared";

import { database } from "@repo/database";
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

  return opts.next({
    ctx: {
      headers,
      authUserId,
      authEmail,
      orgId,
      membershipId: membership.id,
      organizationId: membership.organizationId,
      role: membership.role as TenantRole,
      userId: membership.userId,
    } satisfies OrganizationContext,
  });
});

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
