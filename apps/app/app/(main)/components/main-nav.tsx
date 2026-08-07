"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@repo/design-system/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@repo/design-system/components/ui/sheet";
import { cn } from "@repo/design-system/lib/utils";
import {
  BriefcaseIcon,
  BuildingIcon,
  GraduationCapIcon,
  Menu,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Brand } from "@/components/brand";

export interface WorkspaceCounts {
  readonly admin: number;
  readonly teacher: number;
}

interface MainNavProperties {
  readonly counts: WorkspaceCounts;
}

export const MainNav = ({ counts }: MainNavProperties) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isCentresActive = pathname?.startsWith("/centres");
  const isWorkspacesActive =
    pathname?.startsWith("/workspaces/admin") ||
    pathname?.startsWith("/workspaces/teacher");

  return (
    <div className="flex items-center gap-6">
      <Link className="flex items-center space-x-2" href="/centres">
        <Brand />
      </Link>

      <Sheet onOpenChange={setMobileMenuOpen} open={mobileMenuOpen}>
        <SheetTrigger asChild>
          <Button
            aria-label="Toggle menu"
            className="md:hidden"
            size="icon"
            variant="ghost"
          >
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent className="w-72" side="left">
          <div className="flex flex-col gap-6">
            <Link className="flex items-center space-x-2" href="/centres">
              <Brand />
            </Link>

            <nav className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <p className="px-2 font-medium text-muted-foreground text-xs uppercase">
                  My Workspaces
                </p>
                <Link
                  className={cn(
                    "flex items-center gap-3 rounded-md p-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    pathname?.startsWith("/workspaces/admin")
                      ? "bg-accent/50 text-accent-foreground"
                      : "text-foreground/60"
                  )}
                  href="/workspaces/admin"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <BriefcaseIcon className="size-4" />
                  <span>Admin Centres ({counts.admin})</span>
                </Link>
                <Link
                  className={cn(
                    "flex items-center gap-3 rounded-md p-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    pathname?.startsWith("/workspaces/teacher")
                      ? "bg-accent/50 text-accent-foreground"
                      : "text-foreground/60"
                  )}
                  href="/workspaces/teacher"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <GraduationCapIcon className="size-4" />
                  <span>Teacher Centres ({counts.teacher})</span>
                </Link>
              </div>

              <Link
                className={cn(
                  "flex items-center gap-3 rounded-md p-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                  isCentresActive
                    ? "bg-accent/50 text-accent-foreground"
                    : "text-foreground/60"
                )}
                href="/centres"
                onClick={() => setMobileMenuOpen(false)}
              >
                <BuildingIcon className="size-4" />
                <span>Centres</span>
              </Link>
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      <NavigationMenu className="hidden md:flex">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger
              className={cn(
                navigationMenuTriggerStyle(),
                isWorkspacesActive ? "text-foreground" : "text-foreground/60"
              )}
            >
              My Workspaces
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="w-56 p-2">
                <li>
                  <NavigationMenuLink
                    active={pathname?.startsWith("/workspaces/admin")}
                    asChild
                    className={navigationMenuTriggerStyle()}
                  >
                    <Link
                      className="justify-start gap-2"
                      href="/workspaces/admin"
                    >
                      <BriefcaseIcon className="size-4" />
                      <span>Admin Centres ({counts.admin})</span>
                    </Link>
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink
                    active={pathname?.startsWith("/workspaces/teacher")}
                    asChild
                    className={navigationMenuTriggerStyle()}
                  >
                    <Link
                      className="justify-start gap-2"
                      href="/workspaces/teacher"
                    >
                      <GraduationCapIcon className="size-4" />
                      <span>Teacher Centres ({counts.teacher})</span>
                    </Link>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink
              active={isCentresActive}
              asChild
              className={cn(
                navigationMenuTriggerStyle(),
                isCentresActive ? "text-foreground" : "text-foreground/60"
              )}
            >
              <Link className="gap-2" href="/centres">
                <BuildingIcon className="size-4" />
                Centres
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
};
