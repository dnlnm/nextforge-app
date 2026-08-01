"use client";

import { ModeToggle } from "@repo/design-system/components/mode-toggle";
import { Button } from "@repo/design-system/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@repo/design-system/components/ui/navigation-menu";
import type { Dictionary } from "@repo/internationalization";
import { localizePath } from "@repo/internationalization/path";
import { Menu, MoveRight, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { env } from "@/env";
import { LanguageSwitcher } from "./language-switcher";

interface HeaderProps {
  dictionary: Dictionary;
  locale: string;
}

export const Header = ({ dictionary, locale }: HeaderProps) => {
  const pathname = usePathname();

  const handleHashClick = (
    event: MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    const hashIndex = href.indexOf("#");

    if (hashIndex === -1) {
      return;
    }

    const path = href.slice(0, hashIndex) || "/";
    const hash = href.slice(hashIndex);

    if (pathname === path) {
      event.preventDefault();
      const target = document.querySelector(hash);
      target?.scrollIntoView({ behavior: "smooth" });
      if (target && window.location.hash !== hash) {
        window.history.replaceState(null, "", href);
      }
    }
  };

  const navigationItems = [
    {
      title: dictionary.web.header.home,
      href: localizePath(locale, "/"),
    },
    {
      title: dictionary.web.header.features,
      href: localizePath(locale, "/#features"),
    },
    {
      title: dictionary.web.header.product.pricing,
      href: localizePath(locale, "/#pricing"),
    },
    {
      title: dictionary.web.header.blog,
      href: localizePath(locale, "/blog"),
    },
  ];

  if (env.NEXT_PUBLIC_DOCS_URL) {
    navigationItems.push({
      title: dictionary.web.header.docs,
      href: env.NEXT_PUBLIC_DOCS_URL,
    });
  }

  const [isOpen, setOpen] = useState(false);
  return (
    <header className="sticky top-0 left-0 z-40 w-full border-b bg-background">
      <div className="container relative mx-auto flex min-h-20 flex-row items-center gap-4 lg:grid lg:grid-cols-3">
        <div className="hidden flex-row items-center justify-start gap-4 lg:flex">
          <NavigationMenu className="flex items-start justify-start">
            <NavigationMenuList className="flex flex-row justify-start gap-4">
              {navigationItems.map((item) => (
                <NavigationMenuItem key={item.title}>
                  <NavigationMenuLink asChild>
                    <Button asChild variant="ghost">
                      <Link
                        href={item.href}
                        onClick={(event) => handleHashClick(event, item.href)}
                        rel={
                          item.href.startsWith("http")
                            ? "noopener noreferrer"
                            : undefined
                        }
                        target={
                          item.href.startsWith("http") ? "_blank" : undefined
                        }
                      >
                        {item.title}
                      </Link>
                    </Button>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="flex items-center gap-2 lg:justify-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground text-sm">
            T
          </div>
          <p className="whitespace-nowrap font-semibold">TLAS.MY</p>
        </div>
        <div className="flex w-full items-center justify-end gap-4">
          <Button asChild className="hidden lg:inline-flex" variant="ghost">
            <Link href={localizePath(locale, "/contact")}>
              {dictionary.web.header.contact}
            </Link>
          </Button>
          <Button asChild className="hidden lg:inline-flex" variant="ghost">
            <Link
              href={localizePath(locale, "/#faq")}
              onClick={(event) =>
                handleHashClick(event, localizePath(locale, "/#faq"))
              }
            >
              {dictionary.web.header.faq}
            </Link>
          </Button>
          <div className="hidden items-center gap-1 lg:flex">
            <LanguageSwitcher />
            <ModeToggle />
          </div>
          <Button
            asChild
            className="hidden lg:ml-2 lg:inline-flex"
            variant="outline"
          >
            <Link href={`${env.NEXT_PUBLIC_APP_URL}/sign-in`}>
              {dictionary.web.header.signIn}
            </Link>
          </Button>
          <Button asChild className="lg:inline-flex">
            <Link href={`${env.NEXT_PUBLIC_APP_URL}/sign-up`}>
              {dictionary.web.header.signUp}
            </Link>
          </Button>
        </div>
        <div className="flex w-12 shrink items-end justify-end lg:hidden">
          <Button onClick={() => setOpen(!isOpen)} variant="ghost">
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          {isOpen && (
            <div className="container absolute top-20 right-0 flex w-full flex-col gap-8 border-t bg-background py-4 shadow-lg">
              {navigationItems.map((item) => (
                <Link
                  className="flex items-center justify-between"
                  href={item.href}
                  key={item.title}
                  onClick={(event) => handleHashClick(event, item.href)}
                  rel={
                    item.href.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  target={
                    item.href.startsWith("http") ? "_blank" : undefined
                  }
                >
                  <span className="text-lg">{item.title}</span>
                  <MoveRight className="h-4 w-4 stroke-1 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
