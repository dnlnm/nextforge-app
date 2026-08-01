const defaultLocale = "en";

export const localizePath = (locale: string, path: string) =>
  locale === defaultLocale ? path : `/${locale}${path}`;
