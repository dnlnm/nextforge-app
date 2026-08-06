"use server";

import { ensureLocalUser } from "@repo/auth/organizations";
import { database } from "@repo/database";
import { revalidatePath } from "next/cache";

export const updateCentreProfile = async (
  organizationId: string,
  data: { name: string; imageUrl: string | null }
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

  await database.organization.update({
    where: { id: organizationId },
    data: {
      name,
      imageUrl: data.imageUrl,
    },
  });

  revalidatePath("/centres");
  revalidatePath(`/centres/${organizationId}/settings`);
};
