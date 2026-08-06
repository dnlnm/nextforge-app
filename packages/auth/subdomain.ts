import "server-only";

import { database, type MembershipRole } from "@repo/database";
import { headers } from "next/headers";
import { parseSubdomain } from "./domain";
import { ensureLocalUser } from "./organizations";

export interface SubdomainTenant {
  readonly authOrganizationId: string;
  readonly authUserId: string;
  readonly membershipId: string;
  readonly organizationId: string;
  readonly role: MembershipRole;
  readonly slug: string;
  readonly userId: string;
}

/**
 * Resolve the subdomain slug from the current request's Host header.
 * Returns null when running on the main domain.
 */
export const getCurrentSlug = async (): Promise<string | null> => {
  const headersList = await headers();
  const hostname = headersList.get("host");

  if (!hostname) {
    return null;
  }

  return parseSubdomain(hostname);
};

export const requireSubdomainTenant = async (): Promise<SubdomainTenant> => {
  const slug = await getCurrentSlug();

  if (!slug) {
    throw new Error(
      "No center context found. This page must be accessed via a center subdomain."
    );
  }

  const organization = await database.organization.findFirst({
    where: { slug, status: "ACTIVE" },
    select: { id: true },
  });

  if (!organization) {
    throw new Error("Center not found");
  }

  const user = await ensureLocalUser();

  if (!user) {
    throw new Error("User not found");
  }

  const membership = await database.organizationMembership.findFirst({
    where: {
      organizationId: organization.id,
      userId: user.id,
      status: "ACTIVE",
    },
    select: { id: true, role: true },
  });

  if (!membership) {
    throw new Error("Membership not found");
  }

  return {
    authOrganizationId: organization.id,
    authUserId: user.authUserId,
    membershipId: membership.id,
    organizationId: organization.id,
    role: membership.role,
    userId: user.id,
    slug,
  };
};

export const requireSubdomainTenantRole = async (
  allowedRoles: readonly MembershipRole[]
): Promise<SubdomainTenant> => {
  const tenant = await requireSubdomainTenant();

  if (!allowedRoles.includes(tenant.role)) {
    throw new Error(
      `Access denied. Required role: ${allowedRoles.join(" or ")}`
    );
  }

  return tenant;
};
