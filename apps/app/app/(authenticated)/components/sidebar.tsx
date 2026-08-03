"use client";

import { UserButton } from "@repo/auth/client";
import { ModeToggle } from "@repo/design-system/components/mode-toggle";
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
  GraduationCapIcon,
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
{
      title: "Academic Levels",
      url: "/academic-levels",
      icon: GraduationCapIcon,
    },
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

const isActivePath = (pathname: string, url: string) =>
  url === "/" ? pathname === "/" : pathname.startsWith(url);

export const GlobalSidebar = ({ children }: GlobalSidebarProperties) => {
  const pathname = usePathname();

  return (
    <>
      <Sidebar variant="inset">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link className="mb-2 block px-2" href="/">
                <Brand />
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
