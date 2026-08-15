import languine from "./languine.json" with { type: "json" };

const supportedLocales = [
  languine.locale.source,
  ...languine.locale.targets,
] as const;

const defaultLocale = supportedLocales[0];

export const normalizeLocale = (
  locale: string
): (typeof supportedLocales)[number] => {
  const normalizedLocale = locale.split("-")[0];

  return supportedLocales.includes(
    normalizedLocale as (typeof supportedLocales)[number]
  )
    ? (normalizedLocale as (typeof supportedLocales)[number])
    : supportedLocales[0];
};

export const localizePath = (locale: string, path: string) => {
  const normalizedLocale = normalizeLocale(locale);

  return normalizedLocale === defaultLocale
    ? path
    : `/${normalizedLocale}${path}`;
};
