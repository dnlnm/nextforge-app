"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/design-system/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@repo/design-system/components/ui/sidebar";
import { cn } from "@repo/design-system/lib/utils";
import {
  BarChart3Icon,
  BookOpenIcon,
  CalendarCheckIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  ClipboardCheckIcon,
  CreditCardIcon,
  DoorOpenIcon,
  GraduationCapIcon,
  HomeIcon,
  type LucideIcon,
  ReceiptTextIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Brand, BrandLogo } from "@/components/brand";

type SidebarRole = "TEACHER" | "ADMIN" | "OWNER";

type SidebarBadgeKey = "outstandingInvoices" | "pendingPayments";

export type SidebarBadges = Partial<Record<SidebarBadgeKey, number>>;

interface NavigationItem {
  readonly badge?: SidebarBadgeKey;
  readonly icon: LucideIcon;
  readonly title: string;
  readonly url: string;
}

interface NavigationSection {
  readonly items: readonly NavigationItem[];
  readonly title: string;
}

interface GlobalSidebarProperties {
  readonly badges?: SidebarBadges;
  readonly children: ReactNode;
  readonly role: SidebarRole;
}

const GROUP_STORAGE_KEY = "sidebar-group-state";

const navigationSections: NavigationSection[] = [
  {
    items: [
      { title: "Dashboard", url: "/", icon: HomeIcon },
      { title: "Today", url: "/today", icon: CalendarCheckIcon },
      { title: "Enrollment", url: "/enrollment", icon: ClipboardCheckIcon },
      { title: "Academic Planner", url: "/academics", icon: BookOpenIcon },
      { title: "Schedules", url: "/schedules", icon: CalendarDaysIcon },
    ],
    title: "Overview",
  },
  {
    items: [
      {
        title: "Students",
        url: "/students",
        icon: UsersIcon,
      },
      { title: "Teachers", url: "/teachers", icon: UsersIcon },
      { title: "Classes", url: "/classes", icon: CalendarDaysIcon },
      { title: "Rooms", url: "/rooms", icon: DoorOpenIcon },
      { title: "Subjects", url: "/subjects", icon: BookOpenIcon },
      {
        title: "Academic Levels",
        url: "/academic-levels",
        icon: GraduationCapIcon,
      },
      { title: "Members", url: "/members", icon: UsersIcon },
    ],
    title: "Centre Setup",
  },
  {
    items: [
      { title: "Attendance", url: "/attendance", icon: ClipboardCheckIcon },
      {
        badge: "outstandingInvoices",
        title: "Invoices",
        url: "/invoices",
        icon: ReceiptTextIcon,
      },
      {
        badge: "pendingPayments",
        title: "Payments",
        url: "/payments",
        icon: CreditCardIcon,
      },
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

  if (role === "ADMIN") {
    return navigationSections.map((section) => ({
      ...section,
      items: section.items.filter((item) => item.title !== "Today"),
    }));
  }

  return navigationSections.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.title !== "Today"),
  }));
};

export const GlobalSidebar = ({
  badges,
  children,
  role,
}: GlobalSidebarProperties) => {
  const pathname = usePathname();
  const { isMobile, setOpenMobile, state } = useSidebar();
  const collapsed = !isMobile && state === "collapsed";
  const filteredSections = getNavigationForRole(role);
  const [groupOpen, setGroupOpenState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(GROUP_STORAGE_KEY);
      if (raw) {
        setGroupOpenState(JSON.parse(raw) as Record<string, boolean>);
      }
    } catch {
      // Ignore corrupted storage.
    }
  }, []);

  const setGroupOpen = (title: string, open: boolean) => {
    setGroupOpenState((previous) => {
      const next = { ...previous, [title]: open };
      try {
        window.localStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage failures.
      }
      return next;
    });
  };

  return (
    <>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link
                aria-label="Home"
                className="mb-2 block px-2"
                href="/"
                onClick={() => {
                  if (isMobile) {
                    setOpenMobile(false);
                  }
                }}
              >
                {collapsed ? (
                  <BrandLogo className="mx-auto block size-8" />
                ) : (
                  <Brand />
                )}
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {filteredSections.map((section) => {
            const open = collapsed || (groupOpen[section.title] ?? true);

            return (
              <Collapsible
                key={section.title}
                onOpenChange={(value) => setGroupOpen(section.title, value)}
                open={open}
              >
                <SidebarGroup>
                  <SidebarGroupLabel
                    className="mb-1 cursor-pointer text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:mb-0"
                    render={<CollapsibleTrigger className="w-full" />}
                  >
                    {section.title}
                    <ChevronDownIcon
                      className={cn(
                        "ml-auto size-4 shrink-0 transition-transform duration-200",
                        open && "rotate-180"
                      )}
                    />
                  </SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarMenu>
                      {section.items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            isActive={isActivePath(pathname, item.url)}
                            onClick={() => {
                              if (isMobile) {
                                setOpenMobile(false);
                              }
                            }}
                            render={<Link href={item.url} />}
                            tooltip={item.title}
                          >
                            <item.icon />
                            <span>{item.title}</span>
                          </SidebarMenuButton>
                          {item.badge && badges?.[item.badge] ? (
                            <SidebarMenuBadge aria-hidden="true">
                              {badges[item.badge]}
                            </SidebarMenuBadge>
                          ) : null}
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            );
          })}
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </>
  );
};
