import { requireTenantRole } from "@repo/auth/authorization";
import { appName } from "@repo/config/brand";
import { database } from "@repo/database";
import { formatWeekdayDate, getMalaysiaToday } from "@repo/date";
import { Button } from "@repo/design-system/components/ui/button";
import { getDashboardKpiData } from "@repo/domain";
import { NotificationsTrigger as NotificationsTriggerComponent } from "@repo/notifications/components/trigger";
import {
  BookPlusIcon,
  CalendarDaysIcon,
  ClipboardCheckIcon,
  FilePlus2Icon,
  PlusIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getOrganizationCurrency } from "@/lib/currency";
import { AnnouncementsCard } from "./components/dashboard/announcements-card";
import { AttendanceCard } from "./components/dashboard/attendance-card";
import { FeeCollectionCard } from "./components/dashboard/fee-collection-card";
import { KpiRow } from "./components/dashboard/kpi-row";
import { NeedsAttentionCard } from "./components/dashboard/needs-attention-card";
import { RecentActivityCard } from "./components/dashboard/recent-activity-card";
import { SetupCard } from "./components/dashboard/setup-card";
import { TodaysClassesCard } from "./components/dashboard/todays-classes-card";
import { WidgetBoundary } from "./components/dashboard/widget-boundary";
import { Header } from "./components/header";
import {
  ChartCardSkeleton,
  StatCardsSkeleton,
} from "./components/loading-skeletons";

export const metadata: Metadata = {
  description: "Tuition centre administration dashboard.",
  title: `Dashboard - ${appName}`,
};

const NotificationsTrigger = NotificationsTriggerComponent;

const greetingForHour = (hour: number): string => {
  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
};

const quickActions = [
  { href: "/students/new", icon: BookPlusIcon, label: "+ Student" },
  { href: "/classes/new", icon: FilePlus2Icon, label: "+ Class" },
  { href: "/invoices", icon: PlusIcon, label: "+ Invoice" },
  { href: "/today", icon: ClipboardCheckIcon, label: "Mark Attendance" },
];

const App = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const currency = await getOrganizationCurrency(tenant.organizationId);
  // "Business today" is the Asia/Kuala_Lumpur calendar day, per AGENTS.md.
  const now = new Date();
  const today = getMalaysiaToday(now);
  const greetingHour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: "Asia/Kuala_Lumpur",
    }).format(now)
  );

  const [currentUser, organization] = await Promise.all([
    database.user.findUnique({
      select: { firstName: true },
      where: { id: tenant.userId },
    }),
    database.organization.findUnique({
      select: { name: true },
      where: { id: tenant.organizationId },
    }),
  ]);

  const firstName = currentUser?.firstName?.trim() ?? "";
  const name = firstName ? firstName : "there";
  const greeting = `${greetingForHour(greetingHour)}, ${name} 👋`;

  return (
    <>
      <Header page="Dashboard" pages={[`${appName}`]}>
        <NotificationsTrigger />
      </Header>
      <main className="grid gap-5 p-4 pt-4">
        <section className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h1 className="font-heading font-semibold text-2xl tracking-tight sm:text-3xl">
              {greeting}
            </h1>
            <p className="text-muted-foreground text-sm">
              Here&apos;s what&apos;s happening at{" "}
              <span className="font-medium text-foreground">
                {organization?.name ?? "your centre"}
              </span>{" "}
              today.
            </p>
          </div>
          <p className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <CalendarDaysIcon className="size-4" />
            {formatWeekdayDate(today)}
          </p>
        </section>

        <section className="flex flex-wrap items-center gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              render={<Link href={action.href} />}
              size="sm"
              variant={action.label === "+ Student" ? "default" : "outline"}
            >
              <action.icon className="size-4" />
              {action.label}
            </Button>
          ))}
        </section>

        <Suspense fallback={null}>
          <WidgetBoundary title="setup">
            <SetupCard organizationId={tenant.organizationId} />
          </WidgetBoundary>
        </Suspense>

        <WidgetBoundary title="key metrics">
          <Suspense
            fallback={
              <StatCardsSkeleton
                className="lg:grid-cols-3 2xl:grid-cols-5"
                count={5}
              />
            }
          >
            <KpiSection
              currency={currency}
              organizationId={tenant.organizationId}
            />
          </Suspense>
        </WidgetBoundary>

        <section className="grid items-start gap-5 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <WidgetBoundary title="today's classes">
              <Suspense fallback={<ChartCardSkeleton />}>
                <TodaysClassesCard organizationId={tenant.organizationId} />
              </Suspense>
            </WidgetBoundary>
          </div>
          <div className="xl:col-span-5">
            <WidgetBoundary title="attention items">
              <Suspense fallback={<ChartCardSkeleton />}>
                <NeedsAttentionCard organizationId={tenant.organizationId} />
              </Suspense>
            </WidgetBoundary>
          </div>
          <div className="xl:col-span-7">
            <WidgetBoundary title="fee collection">
              <Suspense fallback={<ChartCardSkeleton />}>
                <FeeCollectionCard
                  currency={currency}
                  organizationId={tenant.organizationId}
                />
              </Suspense>
            </WidgetBoundary>
          </div>
          <div className="xl:col-span-5">
            <WidgetBoundary title="attendance">
              <Suspense fallback={<ChartCardSkeleton />}>
                <AttendanceCard organizationId={tenant.organizationId} />
              </Suspense>
            </WidgetBoundary>
          </div>
          <div className="xl:col-span-7">
            <WidgetBoundary title="recent activity">
              <Suspense fallback={<ChartCardSkeleton />}>
                <RecentActivityCard organizationId={tenant.organizationId} />
              </Suspense>
            </WidgetBoundary>
          </div>
          <div className="xl:col-span-5">
            <AnnouncementsCard />
          </div>
        </section>
      </main>
    </>
  );
};

const KpiSection = async ({
  currency,
  organizationId,
}: {
  readonly currency: string;
  readonly organizationId: string;
}) => {
  const data = await getDashboardKpiData(database, organizationId);

  return <KpiRow currency={currency} data={data} />;
};

export default App;
