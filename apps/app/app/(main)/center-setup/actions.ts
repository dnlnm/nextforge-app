"use server";

import { createOrganization, ensureLocalUser } from "@repo/auth/organizations";
import { isSlugAvailable } from "@repo/auth/slug-utils";

export const checkSlugAvailability = async (slug: string) =>
  isSlugAvailable(slug);

export const createCentre = async (input: {
  name: string;
  slug: string;
  imageUrl?: string;
}) => {
  const user = await ensureLocalUser();

  if (!user) {
    throw new Error("You must be signed in to create a centre.");
  }

  return createOrganization(input.name, input.imageUrl, input.slug);
};
