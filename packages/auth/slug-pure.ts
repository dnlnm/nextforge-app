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
  "klio",
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
