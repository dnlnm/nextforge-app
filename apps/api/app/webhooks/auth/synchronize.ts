import { normalizeClerkRole } from "@repo/auth/roles";
import type {
  DeletedObjectJSON,
  OrganizationJSON,
  OrganizationMembershipJSON,
  UserJSON,
  WebhookEvent,
} from "@repo/auth/server";
import { database, type Prisma } from "@repo/database";

const getPrimaryEmail = (data: UserJSON) =>
  data.email_addresses.find(
    (email) => email.id === data.primary_email_address_id
  )?.email_address ?? data.email_addresses.at(0)?.email_address;

const syncUser = async (data: UserJSON, tx: Prisma.TransactionClient) =>
  tx.user.upsert({
    where: { clerkUserId: data.id },
    create: {
      clerkUserId: data.id,
      email: getPrimaryEmail(data),
      firstName: data.first_name,
      lastName: data.last_name,
      imageUrl: data.image_url,
      archivedAt: null,
    },
    update: {
      email: getPrimaryEmail(data),
      firstName: data.first_name,
      lastName: data.last_name,
      imageUrl: data.image_url,
      archivedAt: null,
    },
  });

const ensureUser = async (
  clerkUserId: string,
  tx: Prisma.TransactionClient,
  email?: string | null,
  firstName?: string | null,
  lastName?: string | null,
  imageUrl?: string | null
) =>
  tx.user.upsert({
    where: { clerkUserId },
    create: {
      clerkUserId,
      email: email ?? undefined,
      firstName: firstName ?? undefined,
      lastName: lastName ?? undefined,
      imageUrl: imageUrl ?? undefined,
    },
    update: {
      email: email ?? undefined,
      firstName: firstName ?? undefined,
      lastName: lastName ?? undefined,
      imageUrl: imageUrl ?? undefined,
      archivedAt: null,
    },
  });

const syncOrganization = async (
  data: OrganizationJSON,
  tx: Prisma.TransactionClient
) => {
  const createdBy = data.created_by
    ? await ensureUser(data.created_by, tx)
    : null;

  const organization = await tx.organization.upsert({
    where: { clerkOrganizationId: data.id },
    create: {
      clerkOrganizationId: data.id,
      name: data.name,
      slug: data.slug,
      imageUrl: data.image_url,
      createdByUserId: createdBy?.id,
      status: "ACTIVE",
      archivedAt: null,
      settings: {
        create: {},
      },
      branches: {
        create: {
          name: "Main Branch",
          isDefault: true,
        },
      },
    },
    update: {
      name: data.name,
      slug: data.slug,
      imageUrl: data.image_url,
      createdByUserId: createdBy?.id,
      status: "ACTIVE",
      archivedAt: null,
    },
  });

  await tx.organizationSettings.upsert({
    where: { organizationId: organization.id },
    create: { organizationId: organization.id },
    update: {},
  });

  const defaultBranch = await tx.branch.findFirst({
    where: { organizationId: organization.id, isDefault: true },
    select: { id: true },
  });

  if (!defaultBranch) {
    await tx.branch.create({
      data: {
        organizationId: organization.id,
        name: "Main Branch",
        isDefault: true,
      },
    });
  }

  return organization;
};

const syncMembership = async (
  data: OrganizationMembershipJSON,
  tx: Prisma.TransactionClient
) => {
  const clerkUserId = data.public_user_data.user_id;
  const organization = await tx.organization.upsert({
    where: { clerkOrganizationId: data.organization.id },
    create: {
      clerkOrganizationId: data.organization.id,
      name: data.organization.name,
      slug: data.organization.slug,
      imageUrl: data.organization.image_url,
      settings: { create: {} },
      branches: { create: { name: "Main Branch", isDefault: true } },
    },
    update: {
      name: data.organization.name,
      slug: data.organization.slug,
      imageUrl: data.organization.image_url,
      status: "ACTIVE",
      archivedAt: null,
    },
  });
  const user = await ensureUser(
    clerkUserId,
    tx,
    data.public_user_data.identifier,
    data.public_user_data.first_name,
    data.public_user_data.last_name,
    data.public_user_data.image_url
  );
  const ownerExists = await tx.organizationMembership.findFirst({
    where: {
      organizationId: organization.id,
      role: "OWNER",
      status: "ACTIVE",
    },
    select: { id: true },
  });
  const role = ownerExists ? normalizeClerkRole(data.role) : "OWNER";

  await tx.organizationMembership.upsert({
    where: { clerkMembershipId: data.id },
    create: {
      clerkMembershipId: data.id,
      organizationId: organization.id,
      userId: user.id,
      role,
      status: "ACTIVE",
      archivedAt: null,
    },
    update: {
      organizationId: organization.id,
      userId: user.id,
      role,
      status: "ACTIVE",
      archivedAt: null,
    },
  });
};

const archiveUser = async (
  data: DeletedObjectJSON,
  tx: Prisma.TransactionClient
) => {
  if (!data.id) {
    return;
  }

  await tx.user.updateMany({
    where: { clerkUserId: data.id },
    data: { archivedAt: new Date() },
  });
};

const archiveOrganization = async (
  data: DeletedObjectJSON,
  tx: Prisma.TransactionClient
) => {
  if (!data.id) {
    return;
  }

  await tx.organization.updateMany({
    where: { clerkOrganizationId: data.id },
    data: { status: "ARCHIVED", archivedAt: new Date() },
  });
};

const archiveMembership = async (
  data: OrganizationMembershipJSON,
  tx: Prisma.TransactionClient
) => {
  await tx.organizationMembership.updateMany({
    where: { clerkMembershipId: data.id },
    data: { status: "ARCHIVED", archivedAt: new Date() },
  });
};

export const synchronizeAuthEvent = async (
  event: WebhookEvent,
  eventId: string
) => {
  const existing = await database.webhookEvent.findUnique({
    where: { provider_eventId: { provider: "clerk", eventId } },
    select: { status: true },
  });

  if (existing?.status === "PROCESSED") {
    return { duplicate: true };
  }

  await database.webhookEvent.upsert({
    where: { provider_eventId: { provider: "clerk", eventId } },
    create: {
      provider: "clerk",
      eventId,
      eventType: event.type,
      status: "PROCESSING",
    },
    update: {
      eventType: event.type,
      status: "PROCESSING",
      error: null,
    },
  });

  try {
    await database.$transaction(async (tx) => {
      switch (event.type) {
        case "user.created":
        case "user.updated": {
          await syncUser(event.data, tx);
          break;
        }
        case "user.deleted": {
          await archiveUser(event.data, tx);
          break;
        }
        case "organization.created":
        case "organization.updated": {
          await syncOrganization(event.data, tx);
          break;
        }
        case "organization.deleted": {
          await archiveOrganization(event.data, tx);
          break;
        }
        case "organizationMembership.created":
        case "organizationMembership.updated": {
          await syncMembership(event.data, tx);
          break;
        }
        case "organizationMembership.deleted": {
          await archiveMembership(event.data, tx);
          break;
        }
        default: {
          break;
        }
      }

      await tx.webhookEvent.update({
        where: { provider_eventId: { provider: "clerk", eventId } },
        data: { status: "PROCESSED", processedAt: new Date() },
      });
    });
  } catch (error) {
    await database.webhookEvent.update({
      where: { provider_eventId: { provider: "clerk", eventId } },
      data: {
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });

    throw error;
  }

  return { duplicate: false };
};
