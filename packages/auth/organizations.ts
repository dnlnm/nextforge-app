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

export const createOrganization = async (name: string, imageUrl?: string) => {
  const user = await ensureLocalUser();

  if (!user) {
    throw new Error("You must be signed in to create an organization");
  }

  const defaultLevels: Array<{
    code: string;
    name: string;
    order: number;
    stage: import("@repo/database").LevelStage;
  }> = [
    { code: "Y1", name: "Year 1", order: 0, stage: "PRIMARY" },
    { code: "Y2", name: "Year 2", order: 1, stage: "PRIMARY" },
    { code: "Y3", name: "Year 3", order: 2, stage: "PRIMARY" },
    { code: "Y4", name: "Year 4", order: 3, stage: "PRIMARY" },
    { code: "Y5", name: "Year 5", order: 4, stage: "PRIMARY" },
    { code: "Y6", name: "Year 6", order: 5, stage: "PRIMARY" },
    { code: "F1", name: "Form 1", order: 6, stage: "LOWER_SECONDARY" },
    { code: "F2", name: "Form 2", order: 7, stage: "LOWER_SECONDARY" },
    { code: "F3", name: "Form 3", order: 8, stage: "LOWER_SECONDARY" },
    { code: "F4", name: "Form 4", order: 9, stage: "UPPER_SECONDARY" },
    { code: "F5", name: "Form 5", order: 10, stage: "UPPER_SECONDARY" },
    { code: "F6", name: "Form 6", order: 11, stage: "PRE_UNIVERSITY" },
    { code: "GEN", name: "General", order: 12, stage: "GENERAL" },
  ];

  const organization = await database.organization.create({
    data: {
      name,
      imageUrl,
      createdByUserId: user.id,
      settings: { create: {} },
      branch: { create: { name: "Main Branch", isDefault: true } },
      levels: {
        create: defaultLevels.map(({ code, name, order, stage }) => ({
          code,
          name,
          order,
          stage,
        })),
      },
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
