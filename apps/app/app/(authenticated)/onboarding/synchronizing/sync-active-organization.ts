import { normalizeClerkRole } from "@repo/auth/roles";
import { auth, clerkClient, currentUser } from "@repo/auth/server";
import { database, type Prisma } from "@repo/database";

const ensureUser = async (
  clerkUserId: string,
  tx: Prisma.TransactionClient,
  data?: {
    readonly email?: string | null;
    readonly firstName?: string | null;
    readonly imageUrl?: string | null;
    readonly lastName?: string | null;
  }
) =>
  tx.user.upsert({
    where: { clerkUserId },
    create: {
      clerkUserId,
      email: data?.email ?? undefined,
      firstName: data?.firstName ?? undefined,
      imageUrl: data?.imageUrl ?? undefined,
      lastName: data?.lastName ?? undefined,
    },
    update: {
      email: data?.email ?? undefined,
      firstName: data?.firstName ?? undefined,
      imageUrl: data?.imageUrl ?? undefined,
      lastName: data?.lastName ?? undefined,
      archivedAt: null,
    },
  });

export const syncActiveOrganization = async () => {
  const session = await auth();

  if (!(session.userId && session.orgId)) {
    return false;
  }

  const clerkUserId = session.userId;
  const clerkOrganizationId = session.orgId;

  const clerk = await clerkClient();
  const [user, organization, memberships] = await Promise.all([
    currentUser(),
    clerk.organizations.getOrganization({
      organizationId: clerkOrganizationId,
    }),
    clerk.organizations.getOrganizationMembershipList({
      organizationId: clerkOrganizationId,
      limit: 100,
    }),
  ]);
  const membership = memberships.data.find(
    (item) => item.publicUserData?.userId === clerkUserId
  );

  if (!membership) {
    return false;
  }

  await database.$transaction(async (tx) => {
    const localUser = await ensureUser(clerkUserId, tx, {
      email: user?.primaryEmailAddress?.emailAddress,
      firstName: user?.firstName,
      imageUrl: user?.imageUrl,
      lastName: user?.lastName,
    });
    const localOrganization = await tx.organization.upsert({
      where: { clerkOrganizationId },
      create: {
        clerkOrganizationId,
        imageUrl: organization.imageUrl,
        name: organization.name,
        slug: organization.slug,
        status: "ACTIVE",
        settings: { create: {} },
        branches: { create: { isDefault: true, name: "Main Branch" } },
      },
      update: {
        imageUrl: organization.imageUrl,
        name: organization.name,
        slug: organization.slug,
        status: "ACTIVE",
        archivedAt: null,
      },
    });
    const ownerExists = await tx.organizationMembership.findFirst({
      where: {
        organizationId: localOrganization.id,
        role: "OWNER",
        status: "ACTIVE",
      },
      select: { id: true },
    });

    await tx.organizationSettings.upsert({
      where: { organizationId: localOrganization.id },
      create: { organizationId: localOrganization.id },
      update: {},
    });

    await tx.organizationMembership.upsert({
      where: { clerkMembershipId: membership.id },
      create: {
        clerkMembershipId: membership.id,
        organizationId: localOrganization.id,
        role: ownerExists ? normalizeClerkRole(membership.role) : "OWNER",
        status: "ACTIVE",
        userId: localUser.id,
      },
      update: {
        organizationId: localOrganization.id,
        role: ownerExists ? normalizeClerkRole(membership.role) : "OWNER",
        status: "ACTIVE",
        archivedAt: null,
        userId: localUser.id,
      },
    });
  });

  return true;
};
