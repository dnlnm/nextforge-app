"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
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
import {
  BarChart3Icon,
  BookOpenIcon,
  CalendarCheckIcon,
  CalendarDaysIcon,
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
import { useOrganization } from "./organization-context";
import { SidebarUserMenu } from "./sidebar-user-menu";

type SidebarRole = "TEACHER" | "ADMIN" | "OWNER";

interface GlobalSidebarProperties {
  readonly children: ReactNode;
  readonly role: SidebarRole;
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
      { title: "Classes", url: "/classes", icon: CalendarDaysIcon },
      { title: "Subjects", url: "/subjects", icon: BookOpenIcon },
      {
        title: "Academic Levels",
        url: "/academic-levels",
        icon: GraduationCapIcon,
      },
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
    items: [{ title: "Settings", url: "/settings", icon: SettingsIcon }],
    title: "Account",
  },
];

const isActivePath = (pathname: string, url: string) =>
  url === "/" ? pathname === "/" : pathname.startsWith(url);

const getNavigationForRole = (role: SidebarRole): typeof navigationSections => {
  if (role === "TEACHER") {
    return [
      {
        items: [{ title: "Today", url: "/today", icon: CalendarCheckIcon }],
        title: "Overview",
      },
      {
        items: [
          { title: "Attendance", url: "/attendance", icon: ClipboardCheckIcon },
        ],
        title: "Operations",
      },
    ];
  }

  return navigationSections;
};

const getRoleBadgeVariant = (
  role: SidebarRole
): "default" | "secondary" | "outline" => {
  switch (role) {
    case "OWNER":
      return "default";
    case "ADMIN":
      return "secondary";
    case "TEACHER":
      return "outline";
  }
};

export const GlobalSidebar = ({ children, role }: GlobalSidebarProperties) => {
  const pathname = usePathname();
  const organization = useOrganization();
  const filteredSections = getNavigationForRole(role);

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
            {organization?.role && (
              <SidebarMenuItem>
                <div className="flex justify-center px-2 pb-2">
                  <Badge
                    className="text-xs"
                    variant={getRoleBadgeVariant(organization.role)}
                  >
                    {organization.role}
                  </Badge>
                </div>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {filteredSections.map((section) => (
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
            <SidebarMenuItem>
              <SidebarUserMenu />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </>
  );
};
