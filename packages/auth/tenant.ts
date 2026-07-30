import "server-only";

import { database, type MembershipRole } from "@repo/database";
import { notFound, redirect } from "next/navigation";
import { hasTenantRole } from "./roles";
import { auth } from "./server";

export interface TenantContext {
  readonly authOrganizationId: string;
  readonly authUserId: string;
  readonly membershipId: string;
  readonly organizationId: string;
  readonly role: MembershipRole;
  readonly userId: string;
}

export const requireTenant = async (): Promise<TenantContext> => {
  const session = await auth();

  if (!session.userId) {
    redirect("/sign-in");
  }

  if (!session.orgId) {
    redirect("/center-setup");
    throw new Error("Missing active organization");
  }

  const membership = await database.organizationMembership.findFirst({
    where: {
      status: "ACTIVE",
      organization: {
        id: session.orgId,
        status: "ACTIVE",
      },
      user: {
        authUserId: session.userId,
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
          id: true,
        },
      },
      user: {
        select: {
          authUserId: true,
        },
      },
    },
  });

  if (!membership) {
    redirect("/onboarding/synchronizing");
    throw new Error("Tenant membership is not synchronized");
  }

  return {
    authUserId: membership.user.authUserId,
    authOrganizationId: membership.organization.id,
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
