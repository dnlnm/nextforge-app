"use server";

import { ensureLocalUser } from "@repo/auth/organizations";
import { database } from "@repo/database";
import { revalidatePath } from "next/cache";

export interface UpdateCentreProfileInput {
  readonly addressLine1?: string | null;
  readonly addressLine2?: string | null;
  readonly city?: string | null;
  readonly email?: string | null;
  readonly imageUrl?: string | null;
  readonly name: string;
  readonly phone?: string | null;
  readonly postcode?: string | null;
  readonly state?: string | null;
}

export const updateCentreProfile = async (
  organizationId: string,
  data: UpdateCentreProfileInput
) => {
  const user = await ensureLocalUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const membership = await database.organizationMembership.findFirst({
    where: {
      organizationId,
      userId: user.id,
      status: "ACTIVE",
      role: "OWNER",
    },
    select: { id: true },
  });

  if (!membership) {
    throw new Error("Only owners can update centre profile");
  }

  const name = data.name.trim();

  if (name.length < 3) {
    throw new Error("Centre name must be at least 3 characters");
  }

  const imageUrl = data.imageUrl?.trim() || null;
  const email = data.email?.trim() || null;
  const phone = data.phone?.trim() || null;
  const addressLine1 = data.addressLine1?.trim() || null;
  const addressLine2 = data.addressLine2?.trim() || null;
  const city = data.city?.trim() || null;
  const state = data.state?.trim() || null;
  const postcode = data.postcode?.trim() || null;

  await database.$transaction(async (tx) => {
    await tx.organization.update({
      where: { id: organizationId },
      data: {
        name,
        imageUrl,
      },
    });

    await tx.organizationSettings.upsert({
      where: { organizationId },
      create: {
        organizationId,
        addressLine1,
        addressLine2,
        city,
        email,
        phone,
        postcode,
        state,
      },
      update: {
        addressLine1,
        addressLine2,
        city,
        email,
        phone,
        postcode,
        state,
      },
    });

    // Mirror contact and address to branch record if present
    await tx.branch.updateMany({
      where: { organizationId },
      data: {
        addressLine1,
        addressLine2,
        city,
        phone,
        postcode,
        state,
      },
    });
  });

  revalidatePath("/centres");
  revalidatePath(`/centres/${organizationId}`);
  revalidatePath(`/centres/${organizationId}/settings`);
  revalidatePath("/settings");
};

export const archiveCentre = async (
  organizationId: string,
  confirmationName: string
) => {
  const user = await ensureLocalUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const organization = await database.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      status: true,
      memberships: {
        where: {
          userId: user.id,
          status: "ACTIVE",
          role: "OWNER",
        },
        select: { id: true },
      },
      subscription: {
        select: {
          plan: true,
          status: true,
        },
      },
    },
  });

  if (!organization || organization.memberships.length === 0) {
    throw new Error("Only owners can archive this centre");
  }

  if (organization.status === "ARCHIVED") {
    throw new Error("This centre is already archived");
  }

  if (confirmationName.trim() !== organization.name.trim()) {
    throw new Error("Centre name confirmation does not match");
  }

  if (
    organization.subscription?.plan !== "TRIAL" &&
    organization.subscription?.status === "ACTIVE"
  ) {
    throw new Error(
      "Please cancel your active subscription in Billing before archiving your centre."
    );
  }

  await database.organization.update({
    where: { id: organizationId },
    data: {
      status: "ARCHIVED",
      archivedAt: new Date(),
    },
  });

  revalidatePath("/centres");
};
