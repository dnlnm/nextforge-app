"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import {
  localizePath,
  normalizeLocale,
} from "@repo/internationalization/path";
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
    if (currentLocale !== "en" && pathname.startsWith(`/${currentLocale}`)) {
      pathnameWithoutLocale = pathname.slice(currentLocale.length + 1);
    }

    router.push(localizePath(normalizeLocale(locale), pathnameWithoutLocale));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
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
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {languages.map(({ label, value }) => (
          <DropdownMenuItem key={value} onClick={() => switchLanguage(value)}>
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
