"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/design-system/components/ui/accordion";
import { Button } from "@repo/design-system/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
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
  ChevronDownIcon,
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

        <ul className="flex items-center gap-1">
          <li>
            <Button
              variant="ghost"
              className={cn(
                isMyCentreActive ? "text-foreground" : "text-foreground/60"
              )}
              render={<Link href={centreHref} />}
            >
              <BuildingIcon className="size-4" />
              My Centre
            </Button>
          </li>

          <li>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    className={cn(
                      isWorkspacesActive
                        ? "text-foreground"
                        : "text-foreground/60"
                    )}
                  />
                }
              >
                My Workspaces
                <ChevronDownIcon className="size-3.5 opacity-60" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-80 p-1">
                {workspaceItems.map((item) => (
                  <DropdownMenuItem
                    key={item.title}
                    render={<Link href={item.href} />}
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
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </li>

          <li>
            <Button
              variant="ghost"
              className={cn(
                isCentreSettingsActive
                  ? "text-foreground"
                  : "text-foreground/60"
              )}
              render={<Link href={centreSettingsHref} />}
            >
              <SettingsIcon className="size-4" />
              Centre Settings
            </Button>
          </li>

          <li>
            <Button
              variant="ghost"
              className={cn(
                isSubscriptionActive ? "text-foreground" : "text-foreground/60"
              )}
              render={<Link href={subscriptionHref} />}
            >
              <CreditCardIcon className="size-4" />
              Subscription
            </Button>
          </li>
        </ul>
      </nav>

      {/* Mobile Menu */}
      <div className="flex items-center justify-between lg:hidden">
        <Link className="flex items-center space-x-2" href="/centres">
          <Brand />
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <Sheet onOpenChange={setMobileMenuOpen} open={mobileMenuOpen}>
          <SheetTrigger
            render={
              <Button
                aria-label="Toggle menu"
                className="lg:hidden"
                size="icon"
                variant="outline"
              />
            }
          >
            <Menu className="size-4" />
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

              <Accordion className="flex w-full flex-col gap-4">
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
