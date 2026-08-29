"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "@repo/design-system/components/ui/menu";
import { localizePath, normalizeLocale } from "@repo/internationalization/path";
import { Languages } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";

const languages = [
  { label: "🇬🇧 English", value: "en" },
  { label: "🇲🇾 Bahasa Melayu", value: "ms" },
];

export const LanguageSwitcher = () => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const currentLocale = normalizeLocale(String(params.locale));

  const switchLanguage = (locale: string) => {
    let pathnameWithoutLocale = pathname;

    // Strip the current non-default locale prefix, then re-localize.
    // Fall back to "/" so the default locale still resolves to the root path.
    if (currentLocale !== "en" && pathname.startsWith(`/${currentLocale}`)) {
      pathnameWithoutLocale = pathname.slice(currentLocale.length + 1) || "/";
    }

    router.push(localizePath(normalizeLocale(locale), pathnameWithoutLocale));
  };

  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            className="relative size-9 shrink-0 text-foreground"
            size="icon"
            variant="ghost"
          />
        }
      >
        <Languages className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Switch language</span>
      </MenuTrigger>
      <MenuContent>
        {languages.map(({ label, value }) => (
          <MenuItem key={value} onClick={() => switchLanguage(value)}>
            {label}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
};
