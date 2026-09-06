"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@repo/design-system/components/ui/fluid-sidebar";
import { MobileDrawer } from "@repo/design-system/components/ui/fluid-mobile-drawer";
import {
  BarChart3Icon,
  BookOpenIcon,
  CalendarCheckIcon,
  CalendarDaysIcon,
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
import { Brand } from "@/components/brand";
import { SidebarFooterUserMenu, SidebarFooterThemeAction, SidebarFooterShapeAction } from "./sidebar-footer-user-menu";
import type { SidebarBadges } from "./sidebar";

type SidebarRole = "TEACHER" | "ADMIN" | "OWNER";

type SidebarBadgeKey = "outstandingInvoices" | "pendingPayments";

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

interface FluidSidebarProperties {
  readonly badges?: SidebarBadges;
  readonly children: ReactNode;
  readonly role: SidebarRole;
}

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

  return navigationSections.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.title !== "Today"),
  }));
};

interface SidebarNavContentProperties {
  readonly badges?: SidebarBadges;
  readonly onNavigate: () => void;
  readonly pathname: string;
  readonly sections: readonly NavigationSection[];
}

/** Brand row shared by the desktop shell and the mobile drawer. */
const SidebarBrandLink = ({ onNavigate }: { onNavigate: () => void }) => (
  <Link
    aria-label="Home"
    className="mb-2 block px-2"
    href="/"
    onClick={onNavigate}
  >
    <Brand />
  </Link>
);

/** Collapsible nav groups shared by the desktop shell and the mobile drawer. */
const SidebarNavGroups = ({
  badges,
  onNavigate,
  pathname,
  sections,
}: SidebarNavContentProperties) => (
  <>
    {sections.map((section) => (
      <SidebarGroup collapsible defaultOpen key={section.title}>
        <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
        <SidebarMenu>
          {section.items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                icon={item.icon}
                isActive={isActivePath(pathname, item.url)}
                onClick={onNavigate}
                render={<Link href={item.url} />}
              >
                {item.title}
              </SidebarMenuButton>
              {item.badge && badges?.[item.badge] ? (
                <SidebarMenuBadge>{badges[item.badge]}</SidebarMenuBadge>
              ) : null}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    ))}
  </>
);

/** Footer identity + theme/shape actions shared by shell and drawer. */
const SidebarFooterRow = () => (
  <div className="flex items-center gap-1">
    <div className="min-w-0 flex-1">
      <SidebarFooterUserMenu />
    </div>
    <SidebarFooterThemeAction />
    <SidebarFooterShapeAction />
  </div>
);

export const FluidSidebar = ({
  badges,
  children,
  role,
}: FluidSidebarProperties) => {
  const pathname = usePathname();
  const { isMobile, openMobile, setOpenMobile } = useSidebar();
  const filteredSections = getNavigationForRole(role);

  const closeOnNavigate = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const navContentProps = {
    badges,
    onNavigate: closeOnNavigate,
    pathname,
    sections: filteredSections,
  };

  return (
    <>
      <Sidebar
        className="max-md:hidden"
        collapsible={isMobile ? "none" : "offcanvas"}
        variant="inset"
      >
        <SidebarHeader>
          <SidebarBrandLink onNavigate={closeOnNavigate} />
        </SidebarHeader>
        <SidebarContent>
          <SidebarNavGroups {...navContentProps} />
        </SidebarContent>
        <SidebarFooter>
          <SidebarFooterRow />
        </SidebarFooter>
      </Sidebar>
      <MobileDrawer
        onClose={() => setOpenMobile(false)}
        open={openMobile}
      >
        <div className="flex min-h-full flex-col gap-2">
          <SidebarBrandLink onNavigate={closeOnNavigate} />
          <SidebarNavGroups {...navContentProps} />
          <div className="mt-auto pt-2">
            <SidebarFooterRow />
          </div>
        </div>
      </MobileDrawer>
      <SidebarInset>{children}</SidebarInset>
    </>
  );
};
