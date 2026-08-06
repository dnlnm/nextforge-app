import "server-only";

import { database } from "@repo/database";

export const RESERVED_SLUGS = [
  "www",
  "api",
  "app",
  "admin",
  "dashboard",
  "billing",
  "account",
  "settings",
  "support",
  "help",
  "docs",
  "blog",
  "status",
  "mail",
  "ftp",
  "cdn",
  "static",
  "assets",
  "images",
  "uploads",
  "tlas",
  "my",
  "sign-in",
  "sign-up",
  "invite",
];

/**
 * Generate a URL-safe slug from a centre name.
 * Example: "Bright Mind Academy!" -> "bright-mind-academy"
 */
export const generateSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);

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
