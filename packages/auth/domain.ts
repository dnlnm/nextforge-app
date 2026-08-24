import { buildWorkspaceUrl, mainDomain } from "@repo/config/brand";

export const getMainDomain = (): string => mainDomain;

// Subdomains reserved for app-level services; these are never workspace slugs.
export const reservedSubdomains = ["app", "www", "api", "docs"];

/**
 * Extract the subdomain from a hostname.
 * Examples:
 * - "klio.my"                 -> null (main domain)
 * - "brightmind.klio.my"      -> "brightmind"
 * - "app.klio.my"             -> null (reserved -> main domain)
 * - "www.klio.my"             -> null (treat www as main domain)
 * - "brightmind.klio.my:3000" -> "brightmind"
 */
export const parseSubdomain = (hostname: string): string | null => {
  const host = hostname.split(":")[0]?.toLowerCase() ?? "";
  const mainDomain = getMainDomain().toLowerCase();

  if (host === mainDomain || host === `www.${mainDomain}`) {
    return null;
  }

  const parts = host.split(".");
  const domainParts = mainDomain.split(".");

  if (
    parts.length > domainParts.length &&
    !reservedSubdomains.includes(parts[0])
  ) {
    return parts[0];
  }

  return null;
};

export const isMainDomain = (hostname: string): boolean =>
  parseSubdomain(hostname) === null;

/**
 * Build the subdomain workspace URL for a given centre slug.
 */
export { buildWorkspaceUrl };
