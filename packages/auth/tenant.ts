import "server-only";

import { database, type MembershipRole } from "@repo/database";
import { notFound, redirect } from "next/navigation";
import { hasTenantRole } from "./roles";
import { auth } from "./server";

export interface TenantContext {
  readonly clerkOrganizationId: string;
  readonly clerkUserId: string;
  readonly membershipId: string;
  readonly organizationId: string;
  readonly role: MembershipRole;
  readonly userId: string;
}

export const requireTenant = async (): Promise<TenantContext> => {
  const session = await auth();

  if (!session.userId) {
    return session.redirectToSignIn() as never;
  }

  if (!session.orgId) {
    redirect("/onboarding/organization");
    throw new Error("Missing active organization");
  }

  const membership = await database.organizationMembership.findFirst({
    where: {
      status: "ACTIVE",
      organization: {
        clerkOrganizationId: session.orgId,
        status: "ACTIVE",
      },
      user: {
        clerkUserId: session.userId,
        archivedAt: null,
      },
    },
    select: {
      id: true,
      role: true,
      organizationId: true,
      userId: true,
      organization: {
        select: {
          clerkOrganizationId: true,
        },
      },
      user: {
        select: {
          clerkUserId: true,
        },
      },
    },
  });

  if (!membership) {
    redirect("/onboarding/synchronizing");
    throw new Error("Tenant membership is not synchronized");
  }

  return {
    clerkUserId: membership.user.clerkUserId,
    clerkOrganizationId: membership.organization.clerkOrganizationId,
    userId: membership.userId,
    organizationId: membership.organizationId,
    membershipId: membership.id,
    role: membership.role,
  };
};

export const requireTenantRole = async (
  allowedRoles: readonly MembershipRole[]
): Promise<TenantContext> => {
  const tenant = await requireTenant();

  if (!hasTenantRole(tenant.role, allowedRoles)) {
    notFound();
  }

  return tenant;
};
