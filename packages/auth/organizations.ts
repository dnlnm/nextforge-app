import "server-only";

import { database } from "@repo/database";
import { createClient, currentUser } from "./server";

const whitespace = /\s+/;

const ensureLocalUser = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const name = (user.user_metadata?.name as string | undefined)?.trim();
  const [firstName, ...lastNameParts] = name?.split(whitespace) ?? [];

  return database.user.upsert({
    where: { authUserId: user.id },
    create: {
      authUserId: user.id,
      email: user.email,
      firstName: firstName || undefined,
      lastName: lastNameParts.join(" ") || undefined,
      imageUrl: user.user_metadata?.avatar_url as string | undefined,
    },
    update: {
      email: user.email,
      firstName: firstName || undefined,
      lastName: lastNameParts.join(" ") || undefined,
      imageUrl: user.user_metadata?.avatar_url as string | undefined,
      archivedAt: null,
    },
  });
};

export const getOrganizations = async () => {
  const user = await ensureLocalUser();

  if (!user) {
    return [];
  }

  return database.organizationMembership.findMany({
    where: { userId: user.id, status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      organization: {
        select: { id: true, name: true, slug: true },
      },
    },
  });
};

export const createOrganization = async (name: string) => {
  const user = await ensureLocalUser();

  if (!user) {
    throw new Error("You must be signed in to create an organization");
  }

  const organization = await database.organization.create({
    data: {
      name,
      createdByUserId: user.id,
      settings: { create: {} },
      branches: { create: { name: "Main Branch", isDefault: true } },
      memberships: {
        create: { userId: user.id, role: "OWNER", status: "ACTIVE" },
      },
    },
  });

  await switchOrganization(organization.id);
  return organization;
};

export const switchOrganization = async (organizationId: string) => {
  const user = await ensureLocalUser();

  if (!user) {
    throw new Error("You must be signed in to switch organizations");
  }

  const membership = await database.organizationMembership.findFirst({
    where: { organizationId, userId: user.id, status: "ACTIVE" },
    select: { id: true },
  });

  if (!membership) {
    throw new Error("You are not a member of this organization");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    data: { activeOrganizationId: organizationId },
  });

  if (error) {
    throw error;
  }
};
