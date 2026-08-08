import "server-only";
import { injectBrand } from "@repo/config/brand";
import type en from "./dictionaries/en.json";
import languine from "./languine.json" with { type: "json" };

export { localizePath } from "./path";

export const locales = [
  languine.locale.source,
  ...languine.locale.targets,
] as const;

export type Dictionary = typeof en;

const injectDictionaryBrand = (dictionary: Dictionary): Dictionary =>
  JSON.parse(injectBrand(JSON.stringify(dictionary))) as Dictionary;

const dictionaries: Record<string, () => Promise<Dictionary>> =
  Object.fromEntries(
    locales.map((locale) => [
      locale,
      () =>
        import(`./dictionaries/${locale}.json`)
          .then((mod) => mod.default)
          .catch((_err) =>
            import("./dictionaries/en.json").then((mod) => mod.default)
          ),
    ])
  );

export const getDictionary = async (locale: string): Promise<Dictionary> => {
  const normalizedLocale = locale.split("-")[0];

  if (!locales.includes(normalizedLocale as (typeof locales)[number])) {
    return injectDictionaryBrand(await dictionaries.en());
  }

  try {
    return injectDictionaryBrand(await dictionaries[normalizedLocale]());
  } catch (_error) {
    return injectDictionaryBrand(await dictionaries.en());
  }
};
