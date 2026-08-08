"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/design-system/components/ui/accordion";
import { Button } from "@repo/design-system/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@repo/design-system/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@repo/design-system/components/ui/sheet";
import { cn } from "@repo/design-system/lib/utils";
import {
  BriefcaseIcon,
  BuildingIcon,
  CreditCardIcon,
  GraduationCapIcon,
  type LucideIcon,
  Menu,
  SettingsIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Brand } from "@/components/brand";
import { UserMenu } from "./user-menu";

export interface WorkspaceCounts {
  readonly admin: number;
  readonly teacher: number;
}

interface WorkspaceItem {
  readonly count: number;
  readonly description: string;
  readonly href: string;
  readonly icon: LucideIcon;
  readonly isActive: (pathname: string) => boolean;
  readonly title: string;
}

interface MainNavProperties {
  readonly counts: WorkspaceCounts;
  readonly ownedCentreId: string | null;
  readonly userId: string;
}

export const MainNav = ({
  counts,
  ownedCentreId,
  userId,
}: MainNavProperties) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const centreHref = ownedCentreId ? "/centres" : "/center-setup";
  const centreSettingsHref = ownedCentreId
    ? `/centres/${ownedCentreId}/settings`
    : "/center-setup";
  const subscriptionHref = ownedCentreId
    ? `/centres/${ownedCentreId}/subscription`
    : "/center-setup";

  const isMyCentreActive = pathname === "/centres";
  const isCentreSettingsActive =
    ownedCentreId !== null && pathname === `/centres/${ownedCentreId}/settings`;
  const isSubscriptionActive =
    ownedCentreId !== null &&
    pathname === `/centres/${ownedCentreId}/subscription`;

  const workspaceItems: WorkspaceItem[] = [
    {
      title: "Admin Centres",
      description: "Manage billing, staff and centre settings",
      icon: BriefcaseIcon,
      href: "/workspaces/admin",
      isActive: (path) => path.startsWith("/workspaces/admin"),
      count: counts.admin,
    },
    {
      title: "Teacher Centres",
      description: "Schedules, classes and teaching tools",
      href: "/workspaces/teacher",
      icon: GraduationCapIcon,
      isActive: (path) => path.startsWith("/workspaces/teacher"),
      count: counts.teacher,
    },
  ];

  const isWorkspacesActive = workspaceItems.some((item) =>
    item.isActive(pathname ?? "")
  );

  return (
    <div className="flex w-full items-center justify-between gap-6">
      {/* Desktop Menu */}
      <nav className="hidden h-9 items-center gap-6 lg:flex">
        <Link className="flex h-9 items-center space-x-2" href="/centres">
          <Brand />
        </Link>

        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  className={cn(
                    "group inline-flex h-9 flex-row items-center justify-center gap-2 rounded-md bg-background px-4 py-2 font-medium text-sm transition-colors hover:bg-muted hover:text-accent-foreground",
                    isMyCentreActive ? "text-foreground" : "text-foreground/60"
                  )}
                  href={centreHref}
                >
                  <BuildingIcon className="size-4" />
                  My Centre
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger
                className={cn(
                  isWorkspacesActive ? "text-foreground" : "text-foreground/60"
                )}
              >
                My Workspaces
              </NavigationMenuTrigger>
              <NavigationMenuContent className="bg-popover text-popover-foreground">
                {workspaceItems.map((item) => (
                  <NavigationMenuLink asChild className="w-80" key={item.title}>
                    <Link
                      className="flex min-w-80 select-none flex-row gap-4 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-muted hover:text-accent-foreground"
                      href={item.href}
                    >
                      <div className="text-foreground">
                        <item.icon className="size-5 shrink-0" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">
                          {item.title} ({item.count})
                        </div>
                        <p className="text-muted-foreground text-sm leading-snug">
                          {item.description}
                        </p>
                      </div>
                    </Link>
                  </NavigationMenuLink>
                ))}
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  className={cn(
                    "group inline-flex h-9 flex-row items-center justify-center gap-2 rounded-md bg-background px-4 py-2 font-medium text-sm transition-colors hover:bg-muted hover:text-accent-foreground",
                    isCentreSettingsActive
                      ? "text-foreground"
                      : "text-foreground/60"
                  )}
                  href={centreSettingsHref}
                >
                  <SettingsIcon className="size-4" />
                  Centre Settings
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  className={cn(
                    "group inline-flex h-9 flex-row items-center justify-center gap-2 rounded-md bg-background px-4 py-2 font-medium text-sm transition-colors hover:bg-muted hover:text-accent-foreground",
                    isSubscriptionActive
                      ? "text-foreground"
                      : "text-foreground/60"
                  )}
                  href={subscriptionHref}
                >
                  <CreditCardIcon className="size-4" />
                  Subscription
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </nav>

      {/* Mobile Menu */}
      <div className="flex items-center justify-between lg:hidden">
        <Link className="flex items-center space-x-2" href="/centres">
          <Brand />
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <Sheet onOpenChange={setMobileMenuOpen} open={mobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              aria-label="Toggle menu"
              className="lg:hidden"
              size="icon"
              variant="outline"
            >
              <Menu className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center space-x-2">
                <Brand />
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-6 p-4">
              <Link
                className={cn(
                  "font-semibold text-base hover:no-underline",
                  isMyCentreActive ? "text-foreground" : "text-muted-foreground"
                )}
                href={centreHref}
                onClick={() => setMobileMenuOpen(false)}
              >
                My Centre
              </Link>

              <Accordion
                className="flex w-full flex-col gap-4"
                collapsible
                type="single"
              >
                <AccordionItem className="border-b-0" value="my-workspaces">
                  <AccordionTrigger className="py-0 font-semibold text-base hover:no-underline">
                    My Workspaces
                  </AccordionTrigger>
                  <AccordionContent className="mt-2">
                    {workspaceItems.map((item) => (
                      <Link
                        className="flex select-none flex-row gap-4 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-muted hover:text-accent-foreground"
                        href={item.href}
                        key={item.title}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="text-foreground">
                          <item.icon className="size-5 shrink-0" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm">
                            {item.title} ({item.count})
                          </div>
                          <p className="text-muted-foreground text-sm leading-snug">
                            {item.description}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <Link
                className={cn(
                  "font-semibold text-base hover:no-underline",
                  isCentreSettingsActive
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
                href={centreSettingsHref}
                onClick={() => setMobileMenuOpen(false)}
              >
                Centre Settings
              </Link>

              <Link
                className={cn(
                  "font-semibold text-base hover:no-underline",
                  isSubscriptionActive
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
                href={subscriptionHref}
                onClick={() => setMobileMenuOpen(false)}
              >
                Subscription
              </Link>
            </div>
          </SheetContent>
        </Sheet>

        <UserMenu userId={userId} />
      </div>
    </div>
  );
};
