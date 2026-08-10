import "server-only";

import { database } from "@repo/database";
import { generateSlug, RESERVED_SLUGS } from "./slug-pure";

export { generateSlug, RESERVED_SLUGS };

export interface SlugAvailability {
  readonly available: boolean;
  readonly reason?: string;
}

export const isSlugAvailable = async (
  slug: string,
  excludeOrganizationId?: string
): Promise<SlugAvailability> => {
  const normalized = generateSlug(slug);

  if (normalized.length < 3) {
    return { available: false, reason: "Slug must be at least 3 characters" };
  }

  if (RESERVED_SLUGS.includes(normalized)) {
    return { available: false, reason: "This slug is reserved" };
  }

  const reserved = await database.reservedSlug.findUnique({
    where: { slug: normalized },
    select: { id: true },
  });

  if (reserved) {
    return { available: false, reason: "This slug is reserved" };
  }

  const existing = await database.organization.findFirst({
    where: {
      slug: normalized,
      id: excludeOrganizationId ? { not: excludeOrganizationId } : undefined,
    },
    select: { id: true },
  });

  if (existing) {
    return { available: false, reason: "This slug is already taken" };
  }

  return { available: true };
};