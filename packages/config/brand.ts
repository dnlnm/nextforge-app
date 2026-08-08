export const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "KLIO.MY";

const configuredMainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN ?? "klio.my";

export const mainDomain = configuredMainDomain
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "");

export const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? `https://${mainDomain}`;

export const formatWorkspaceHostname = (slug: string): string =>
  `${slug}.${mainDomain}`;

export const buildWorkspaceUrl = (slug: string, path = ""): string => {
  const base = `https://${formatWorkspaceHostname(slug)}`;

  return path ? `${base}${path.startsWith("/") ? path : `/${path}`}` : base;
};

export const buildAppUrl = (path = ""): string => {
  const base = appUrl.replace(/\/$/, "");

  return path ? `${base}${path.startsWith("/") ? path : `/${path}`}` : base;
};

export const injectBrand = (value: string): string =>
  value.replaceAll("{appName}", appName);
