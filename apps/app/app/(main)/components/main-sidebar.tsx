"use client";

import { differenceInMalaysiaCalendarDays } from "@repo/date";
import {
  Card,
  CardDescription,
  CardHeader,
  CardImage,
  CardTitle,
} from "@repo/design-system/components/ui/fluid-card";
import { MobileDrawer } from "@repo/design-system/components/ui/fluid-mobile-drawer";
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
  SidebarTrigger,
  useSidebar,
} from "@repo/design-system/components/ui/fluid-sidebar";
import { useShape } from "@repo/design-system/lib/shape-context";
import {
  surfaceClasses,
  surfaceHoverClasses,
} from "@repo/design-system/lib/surface-classes";
import { useSurface } from "@repo/design-system/lib/surface-context";
import {
  BriefcaseIcon,
  BuildingIcon,
  CreditCardIcon,
  GraduationCapIcon,
  type LucideIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Brand } from "@/components/brand";
import {
  SidebarFooterShapeAction,
  SidebarFooterThemeAction,
} from "../../(workspace)/components/sidebar-footer-user-menu";
import { MainFooterUserMenu } from "./main-footer-user-menu";

export interface MainCounts {
  readonly admin: number;
  readonly teacher: number;
}

interface NavigationItem {
  readonly badge?: number;
  readonly icon: LucideIcon;
  readonly title: string;
  readonly url: string;
}

interface NavigationSection {
  readonly items: readonly NavigationItem[];
  readonly title: string;
}

interface MainTrial {
  readonly organizationId: string;
  readonly trialEndsAt: Date | null;
}

interface MainSidebarProperties {
  readonly children: ReactNode;
  readonly counts: MainCounts;
  readonly ownedCentreId: string | null;
  readonly trial: MainTrial | null;
  readonly userName: string | null;
}

const isActivePath = (pathname: string, url: string) =>
  url === "/" ? pathname === "/" : pathname.startsWith(url);

const SidebarBrandLink = ({ onNavigate }: { onNavigate: () => void }) => (
  <Link
    aria-label="My Centre"
    className="mb-2 block px-2"
    href="/centres"
    onClick={onNavigate}
  >
    <Brand />
  </Link>
);

const SidebarNavGroups = ({
  onNavigate,
  pathname,
  sections,
}: {
  onNavigate: () => void;
  pathname: string;
  sections: readonly NavigationSection[];
}) => (
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
              {item.badge ? (
                <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
              ) : null}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    ))}
  </>
);

const SidebarFooterRow = ({
  subscriptionHref,
  userName,
}: {
  subscriptionHref: string;
  userName: string | null;
}) => (
  <div className="flex items-center gap-1">
    <div className="min-w-0 flex-1">
      <MainFooterUserMenu
        subscriptionHref={subscriptionHref}
        userName={userName}
      />
    </div>
    <SidebarFooterThemeAction />
    <SidebarFooterShapeAction />
  </div>
);

// Soft blue gradient banner (docs callout style) — self-contained data URI so
// no image asset is needed.
const TRIAL_BANNER_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23C9D9FF'/%3E%3Cstop offset='.55' stop-color='%239DBBFF'/%3E%3Cstop offset='1' stop-color='%236E97F5'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='200' fill='url(%23g)'/%3E%3C/svg%3E";

const TrialCallout = ({ trial }: { trial: MainTrial }) => {
  const substrate = useSurface();
  const shape = useShape();

  if (!trial.trialEndsAt) {
    return null;
  }

  const daysLeft = Math.max(
    0,
    differenceInMalaysiaCalendarDays(trial.trialEndsAt, new Date())
  );
  const ended = daysLeft === 0;
  const title = ended
    ? "Trial ended"
    : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left in trial`;
  const description = "Choose a plan to keep going";

  // Banner callout per the sidebar docs: a Card one surface above the rail
  // that rises another level on hover.
  const level = Math.min(substrate + 1, 8);
  const surface = `${shape.container} overflow-hidden transition-[background-color,box-shadow] duration-80 ${surfaceClasses(level, 2)} ${surfaceHoverClasses(level + 1, 3)}`;

  return (
    <Card
      className={surface}
      href={`/centres/${trial.organizationId}/subscription`}
      label={`${title} — ${description}`}
      size="compact"
    >
      <CardImage className="aspect-[2/1] max-h-28" src={TRIAL_BANNER_SRC} />
      <CardHeader className="gap-0 pt-3">
        <CardTitle className="truncate">{title}</CardTitle>
        <CardDescription className="truncate text-caption">
          {description}
        </CardDescription>
      </CardHeader>
    </Card>
  );
};

export const MainSidebar = ({
  children,
  counts,
  ownedCentreId,
  trial,
  userName,
}: MainSidebarProperties) => {
  const pathname = usePathname() ?? "";
  const { isMobile, openMobile, setOpenMobile } = useSidebar();

  const centreHref = ownedCentreId ? "/centres" : "/center-setup";
  const centreSettingsHref = ownedCentreId
    ? `/centres/${ownedCentreId}/settings`
    : "/center-setup";
  const subscriptionHref = ownedCentreId
    ? `/centres/${ownedCentreId}/subscription`
    : "/center-setup";

  const sections: NavigationSection[] = [
    {
      items: [
        { title: "My Centre", url: centreHref, icon: BuildingIcon },
        {
          title: "Centre Settings",
          url: centreSettingsHref,
          icon: SettingsIcon,
        },
      ],
      title: "Centre",
    },
    {
      items: [
        {
          title: "Admin",
          url: "/workspaces/admin",
          icon: BriefcaseIcon,
          badge: counts.admin,
        },
        {
          title: "Teacher",
          url: "/workspaces/teacher",
          icon: GraduationCapIcon,
          badge: counts.teacher,
        },
      ],
      title: "Workspaces",
    },
    {
      items: [
        { title: "General", url: "/general", icon: SlidersHorizontalIcon },
        { title: "Profile", url: "/account", icon: UserIcon },
        {
          title: "Subscription",
          url: subscriptionHref,
          icon: CreditCardIcon,
        },
      ],
      title: "Settings",
    },
  ];

  const closeOnNavigate = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const navProps = { onNavigate: closeOnNavigate, pathname, sections };

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
          <SidebarNavGroups {...navProps} />
        </SidebarContent>
        <SidebarFooter>
          {trial ? <TrialCallout trial={trial} /> : null}
          <SidebarFooterRow
            subscriptionHref={subscriptionHref}
            userName={userName}
          />
        </SidebarFooter>
      </Sidebar>
      <MobileDrawer onClose={() => setOpenMobile(false)} open={openMobile}>
        <div className="flex min-h-full flex-col gap-2">
          <SidebarBrandLink onNavigate={closeOnNavigate} />
          <SidebarNavGroups {...navProps} />
          <div className="mt-auto pt-2">
            {trial ? <TrialCallout trial={trial} /> : null}
            <SidebarFooterRow
              subscriptionHref={subscriptionHref}
              userName={userName}
            />
          </div>
        </div>
      </MobileDrawer>
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        {children}
      </SidebarInset>
    </>
  );
};
