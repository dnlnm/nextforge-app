"use client";

import { UserButton } from "@repo/auth/client";
import { ModeToggle } from "@repo/design-system/components/mode-toggle";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/design-system/components/ui/avatar";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@repo/design-system/components/ui/sidebar";
import { NotificationsTrigger } from "@repo/notifications/components/trigger";
import {
  BarChart3Icon,
  BookOpenIcon,
  CalendarCheckIcon,
  CalendarDaysIcon,
  CircleDollarSignIcon,
  ClipboardCheckIcon,
  CreditCardIcon,
  HomeIcon,
  ReceiptTextIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Brand } from "@/components/brand";

interface GlobalSidebarProperties {
  readonly children: ReactNode;
  readonly organization?: {
    readonly imageUrl: string | null;
    readonly name: string;
  } | null;
}

const navigationSections = [
  {
    items: [
      { title: "Dashboard", url: "/", icon: HomeIcon },
      { title: "Today", url: "/today", icon: CalendarCheckIcon },
    ],
    title: "Overview",
  },
  {
    items: [
      { title: "Students", url: "/students", icon: UsersIcon },
      { title: "Teachers", url: "/teachers", icon: UsersIcon },
      { title: "Subjects", url: "/subjects", icon: BookOpenIcon },
      { title: "Classes", url: "/classes", icon: CalendarDaysIcon },
    ],
    title: "Centre Setup",
  },
  {
    items: [
      { title: "Attendance", url: "/attendance", icon: ClipboardCheckIcon },
      { title: "Invoices", url: "/invoices", icon: ReceiptTextIcon },
      { title: "Payments", url: "/payments", icon: CreditCardIcon },
      { title: "Reports", url: "/reports", icon: BarChart3Icon },
    ],
    title: "Operations",
  },
  {
    items: [
      { title: "Billing", url: "/billing", icon: CircleDollarSignIcon },
      { title: "Settings", url: "/settings", icon: SettingsIcon },
    ],
    title: "Account",
  },
];

const whitespaceRegex = /\s+/;

const isActivePath = (pathname: string, url: string) =>
  url === "/" ? pathname === "/" : pathname.startsWith(url);

const getInitials = (value?: string) => {
  const parts = value?.trim().split(whitespaceRegex).filter(Boolean) ?? [];

  return (
    parts
      .slice(0, 2)
      .map((part) => part.at(0))
      .join("")
      .toUpperCase() || "T"
  );
};

export const GlobalSidebar = ({
  children,
  organization,
}: GlobalSidebarProperties) => {
  const pathname = usePathname();
  const centreName = organization?.name ?? "TLAS.MY";

  return (
    <>
      <Sidebar variant="inset">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link className="mb-2 block px-2" href="/">
                <Brand />
              </Link>
              <Link
                className="mx-2 flex items-center gap-3 rounded-lg border bg-sidebar-accent/40 p-3 text-sidebar-foreground transition hover:bg-sidebar-accent"
                href="/settings"
              >
                <Avatar className="size-10 rounded-lg border bg-sidebar">
                  {organization?.imageUrl ? (
                    <AvatarImage
                      alt={centreName}
                      src="/api/organization-logo"
                    />
                  ) : null}
                  <AvatarFallback className="rounded-lg bg-primary font-semibold text-primary-foreground">
                    {getInitials(centreName)}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0">
                  <span className="block truncate font-medium text-sm">
                    {centreName}
                  </span>
                  <span className="block truncate text-muted-foreground text-xs">
                    Active centre
                  </span>
                </span>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {navigationSections.map((section) => (
            <SidebarGroup key={section.title}>
              <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActivePath(pathname, item.url)}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
              <UserButton showName />
              <div className="flex shrink-0 items-center gap-px">
                <ModeToggle />
                <Button
                  asChild
                  className="shrink-0"
                  size="icon"
                  variant="ghost"
                >
                  <div className="h-4 w-4">
                    <NotificationsTrigger />
                  </div>
                </Button>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </>
  );
};
