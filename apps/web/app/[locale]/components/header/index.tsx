"use client";

import { appName } from "@repo/config/brand";
import { ModeToggle } from "@repo/design-system/components/mode-toggle";
import { Button } from "@repo/design-system/components/ui/button";
import type { Dictionary } from "@repo/internationalization";
import { localizePath } from "@repo/internationalization/path";
import { Menu, MoveRight, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type MouseEvent, useState } from "react";
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
      <div className="container relative mx-auto flex min-h-20 flex-row items-center gap-4 lg:justify-between">
        <nav className="hidden flex-row items-center justify-start gap-4 lg:flex">
          <ul className="flex flex-row justify-start gap-3">
            {navigationItems.map((item) => (
              <li key={item.title}>
                <Button
                  render={
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
                    />
                  }
                  variant="ghost"
                >
                  {item.title}
                </Button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2 lg:absolute lg:left-1/2 lg:-translate-x-1/2">
          <svg
            aria-hidden="true"
            className="h-8 w-8 text-primary"
            fill="currentColor"
            viewBox="-0.5899949999999308 -1.5384450000000243 526.186 559.8149999999999"
          >
            <path
              d="M1119.5,444.643C1105.867,447.525 1107.184,446.809 975.078,523.228C956.147,534.18 938.597,544.55 936.078,546.272C900.081,570.901 888.984,623.293 911.799,660.901C917.603,670.468 923.854,677.72 931.816,684.126C955.53,703.202 987.853,708.369 1017.09,697.757C1022.646,695.74 1053.113,678.637 1104,648.969C1110.325,645.281 1130.575,633.595 1149,622.999C1186.619,601.366 1192.108,597.749 1200.163,589.282C1223.563,564.689 1230.42,529.362 1218.03,497.233C1209.831,475.973 1190.254,456.652 1168.684,448.533C1154.148,443.062 1134.376,441.498 1119.5,444.643M773.5,445.426C754.79,449.748 741.65,457.267 728.36,471.258C716.934,483.287 710.016,496.629 706.579,513.27C704.234,524.624 704.241,622.402 706.588,633.792C713.451,667.096 738.65,693.254 771.351,701.021C782.064,703.565 798.403,703.761 809.5,701.478C837.021,695.815 861.093,675.523 871.836,648.93C877.492,634.93 877.347,636.679 877.741,577.413C878.161,514.352 877.855,511.02 870.125,494.526C859.423,471.688 841.845,455.917 818.219,447.958C809.324,444.961 807.271,444.656 794,444.362C784.131,444.143 777.584,444.483 773.5,445.426M775.5,726.415C743.215,732.736 716.994,756.808 707.797,788.568C705.518,796.439 705.5,796.949 705.5,855C705.5,921.467 705.185,918.434 713.975,936.5C739.72,989.409 810.724,1001.313 852.34,959.697C863.154,948.883 869.974,937.497 874.737,922.307L877.498,913.5L877.498,796.5L874.683,787.5C865.473,758.053 843.24,736.251 814,727.992C804.31,725.255 785.382,724.48 775.5,726.415M972.66,726.048C936.908,732.048 908.705,759.199 901.368,794.68C898.913,806.549 899.879,825.797 903.492,837C909.475,855.551 919.546,869.866 934.471,881.031C937.237,883.1 965.825,899.978 998,918.537C1030.175,937.097 1065.05,957.24 1075.5,963.3C1085.95,969.36 1097.65,975.815 1101.5,977.643C1131.073,991.69 1167.07,986.9 1193.454,965.408C1206.357,954.897 1217.93,935.931 1222.077,918.5C1225.135,905.645 1224.467,886.281 1220.541,874C1215.186,857.249 1204.917,841.88 1192.451,831.961C1185.124,826.131 1029.87,736.117 1019.565,731.724C1006.146,726.004 986.839,723.668 972.66,726.048"
              fill-rule="evenodd"
              transform="translate(-704.823995,-443.036445)"
            />
          </svg>
          <p className="whitespace-nowrap font-semibold">{appName}</p>
        </div>
        <div className="flex w-full items-center justify-end gap-3 lg:w-auto lg:gap-2">
          <Button
            className="hidden lg:inline-flex"
            render={<Link href={localizePath(locale, "/contact")} />}
            variant="ghost"
          >
            {dictionary.web.header.contact}
          </Button>
          <Button
            className="hidden lg:inline-flex"
            render={
              <Link
                href={localizePath(locale, "/#faq")}
                onClick={(event) =>
                  handleHashClick(event, localizePath(locale, "/#faq"))
                }
              />
            }
            variant="ghost"
          >
            {dictionary.web.header.faq}
          </Button>
          <div className="hidden items-center gap-1 lg:flex">
            <LanguageSwitcher />
            <ModeToggle />
          </div>
          <Button
            className="hidden lg:inline-flex"
            render={<Link href={`${env.NEXT_PUBLIC_APP_URL}/sign-in`} />}
            variant="outline"
          >
            {dictionary.web.header.signIn}
          </Button>
          <Button
            className="lg:inline-flex"
            render={<Link href={`${env.NEXT_PUBLIC_APP_URL}/sign-up`} />}
          >
            {dictionary.web.header.signUp}
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
                  target={item.href.startsWith("http") ? "_blank" : undefined}
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
