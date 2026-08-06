export const getMainDomain = (): string => {
  const env = process.env.NODE_ENV;

  if (env === "development") {
    return "tlas.local";
  }

  return process.env.NEXT_PUBLIC_MAIN_DOMAIN ?? "tlas.my";
};

/**
 * Extract the subdomain from a hostname.
 * Examples:
 * - "tlas.local"                 -> null (main domain)
 * - "brightmind.tlas.local"      -> "brightmind"
 * - "www.tlas.my"                -> null (treat www as main domain)
 * - "brightmind.tlas.my:3000"    -> "brightmind"
 */
export const parseSubdomain = (hostname: string): string | null => {
  const host = hostname.split(":")[0]?.toLowerCase() ?? "";
  const mainDomain = getMainDomain().toLowerCase();

  if (host === mainDomain || host === `www.${mainDomain}`) {
    return null;
  }

  const parts = host.split(".");
  const domainParts = mainDomain.split(".");

  if (parts.length > domainParts.length) {
    return parts[0];
  }

  return null;
};

export const isMainDomain = (hostname: string): boolean =>
  parseSubdomain(hostname) === null;

/**
 * Build the subdomain workspace URL for a given centre slug.
 */
export const buildWorkspaceUrl = (slug: string, path = ""): string => {
  const mainDomain = getMainDomain();
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const base = `${protocol}://${slug}.${mainDomain}`;

  return path ? `${base}${path.startsWith("/") ? path : `/${path}`}` : base;
};
