import { requireTenantRole } from "@repo/auth/authorization";
import { appName } from "@repo/config/brand";
import { database } from "@repo/database";
import {
  formatMonthShort,
  formatRelativeTime,
  formatShortDate,
  getMalaysiaToday,
} from "@repo/date";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardFrame,
  CardFrameAction,
  CardFrameHeader,
  CardFrameTitle,
} from "@repo/design-system/components/ui/card";
import {
  Stat,
  StatAction,
  StatDescription,
  StatFooter,
  StatIndicator,
  StatLabel,
  StatPanel,
  StatTrend,
  StatValue,
} from "@repo/design-system/components/ui/stat";
import { cn } from "@repo/design-system/lib/utils";
import { formatMoneyWhole as formatMoneyShared } from "@repo/money";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BanknoteIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  CircleDollarSignIcon,
  ClipboardListIcon,
  FileTextIcon,
  MegaphoneIcon,
  PlusIcon,
  ReceiptTextIcon,
  UserRoundIcon,
  UsersRoundIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getOrganizationCurrency } from "@/lib/currency";
import { AttendanceDonutChart } from "./components/dashboard/attendance-donut-chart";
import { FeeCollectionChart } from "./components/dashboard/fee-collection-chart";
import { Header } from "./components/header";

export const metadata: Metadata = {
  description: "Tuition centre administration dashboard.",
  title: `Dashboard - ${appName}`,
};

const formatDate = (date: Date) => formatShortDate(date);

const startOfMonth = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

const startOfNextMonth = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));

const startOfPreviousMonth = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1));

const getPercentChange = (current: number, previous: number) => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return ((current - previous) / previous) * 100;
};

const formatPercentChange = (change: number) => {
  if (change === 0) {
    return "No change";
  }

  return `${change > 0 ? "+" : ""}${change.toFixed(1)}% from last month`;
};

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const App = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const currency = await getOrganizationCurrency(tenant.organizationId);
  const formatMoney = (amountSen: number) =>
    formatMoneyShared(amountSen, { currency });
  // "Business today" is the Asia/Kuala_Lumpur calendar day, per AGENTS.md.
  const today = getMalaysiaToday();
  const monthStart = startOfMonth(today);
  const nextMonthStart = startOfNextMonth(today);
  const previousMonthStart = startOfPreviousMonth(today);

  const [
    activeStudents,
    studentsAddedThisMonth,
    activeTeachers,
    teachersAddedThisMonth,
    activeClasses,
    classesAddedThisMonth,
    todaySessions,
    openInvoices,
    currentMonthPayments,
    previousMonthPayments,
    currentMonthAttendance,
    recentActivities,
    currentUser,
    organization,
  ] = await Promise.all([
    database.student.count({
      where: { organizationId: tenant.organizationId, status: "ACTIVE" },
    }),
    database.student.count({
      where: {
        createdAt: { gte: monthStart, lt: nextMonthStart },
        organizationId: tenant.organizationId,
        status: "ACTIVE",
      },
    }),
    database.teacherProfile.count({
      where: { archivedAt: null, organizationId: tenant.organizationId },
    }),
    database.teacherProfile.count({
      where: {
        archivedAt: null,
        createdAt: { gte: monthStart, lt: nextMonthStart },
        organizationId: tenant.organizationId,
      },
    }),
    database.learningClass.count({
      where: { organizationId: tenant.organizationId, status: "ACTIVE" },
    }),
    database.learningClass.count({
      where: {
        createdAt: { gte: monthStart, lt: nextMonthStart },
        organizationId: tenant.organizationId,
        status: "ACTIVE",
      },
    }),
    database.classSession.findMany({
      include: {
        attendance: true,
        class: {
          include: {
            schedules: {
              orderBy: { dayOfWeek: "asc" },
              include: { room: { select: { name: true } } },
            },
            subject: true,
            teacher: true,
          },
        },
      },
      orderBy: { startsAt: "asc" },
      take: 5,
      where: { organizationId: tenant.organizationId, sessionDate: today },
    }),
    database.invoice.findMany({
      include: { student: true },
      orderBy: [{ dueDate: "asc" }, { invoiceNumber: "asc" }],
      take: 5,
      where: {
        organizationId: tenant.organizationId,
        status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] },
      },
    }),
    database.payment.findMany({
      orderBy: { paidAt: "asc" },
      where: {
        organizationId: tenant.organizationId,
        paidAt: { gte: monthStart, lt: nextMonthStart },
        status: { in: ["RECORDED", "VERIFIED"] },
      },
    }),
    database.payment.findMany({
      where: {
        organizationId: tenant.organizationId,
        paidAt: { gte: previousMonthStart, lt: monthStart },
        status: { in: ["RECORDED", "VERIFIED"] },
      },
    }),
    database.attendanceRecord.groupBy({
      _count: { id: true },
      by: ["status"],
      where: {
        markedAt: { gte: monthStart, lt: nextMonthStart },
        organizationId: tenant.organizationId,
      },
    }),
    database.auditEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      where: { organizationId: tenant.organizationId },
    }),
    database.user.findUnique({
      select: { firstName: true },
      where: { id: tenant.userId },
    }),
    database.organization.findUnique({
      select: { name: true },
      where: { id: tenant.organizationId },
    }),
  ]);

  const currentMonthCollectedSen = currentMonthPayments.reduce(
    (sum, payment) => sum + payment.amountSen,
    0
  );
  const previousMonthCollectedSen = previousMonthPayments.reduce(
    (sum, payment) => sum + payment.amountSen,
    0
  );
  const outstandingSen = openInvoices.reduce(
    (sum, invoice) => sum + (invoice.totalSen - invoice.amountPaidSen),
    0
  );
  const attendanceTotal = currentMonthAttendance.reduce(
    (sum, item) => sum + item._count.id,
    0
  );
  const presentCount = currentMonthAttendance
    .filter((item) => item.status === "PRESENT")
    .reduce((sum, item) => sum + item._count.id, 0);
  const averageAttendance =
    attendanceTotal > 0 ? (presentCount / attendanceTotal) * 100 : 0;

  let cumulativeCollectedSen = 0;
  const paymentsByDay = new Map<number, number>();

  for (const payment of currentMonthPayments) {
    const day = payment.paidAt.getUTCDate();
    paymentsByDay.set(day, (paymentsByDay.get(day) ?? 0) + payment.amountSen);
  }

  const daysInMonth = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0)
  ).getUTCDate();
  const feeCollectionData = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    cumulativeCollectedSen += paymentsByDay.get(day) ?? 0;

    return {
      collected: Math.round(cumulativeCollectedSen / 100),
      day: `${day} ${formatMonthShort(today)}`,
    };
  });
  // Map each attendance status to an existing semantic token so the chart slices
  // render in both light and dark mode. (The previous `--color-present/...`
  // variables were never defined, so the chart was invisible.)
  const attendanceFillByStatus: Record<string, string> = {
    PRESENT: "var(--success)",
    ABSENT: "var(--destructive)",
    LATE: "var(--warning)",
    EXCUSED: "var(--info)",
  };
  const attendanceData = currentMonthAttendance.map((item) => ({
    fill: attendanceFillByStatus[item.status] ?? "var(--muted-foreground)",
    label: item.status[0] + item.status.slice(1).toLowerCase(),
    status: item.status.toLowerCase(),
    value: item._count.id,
  }));
  const revenueChange = getPercentChange(
    currentMonthCollectedSen,
    previousMonthCollectedSen
  );
  const stats = [
    {
      action: { href: "/students/new", label: "Student" },
      color: "info" as const,
      detail: `+ ${studentsAddedThisMonth} this month`,
      href: "/students",
      icon: UsersRoundIcon,
      label: "Total Students",
      value: activeStudents.toLocaleString(),
    },
    {
      action: { href: "/classes/new", label: "Class" },
      color: "default" as const,
      detail: `+ ${classesAddedThisMonth} this month`,
      href: "/classes",
      icon: BookOpenIcon,
      label: "Total Classes",
      value: activeClasses.toLocaleString(),
    },
    {
      action: { href: "/teachers/new", label: "Teacher" },
      color: "info" as const,
      detail: `+ ${teachersAddedThisMonth} this month`,
      href: "/teachers",
      icon: UserRoundIcon,
      label: "Total Teachers",
      value: activeTeachers.toLocaleString(),
    },
    {
      color: "success" as const,
      detail: formatPercentChange(revenueChange),
      href: "/payments",
      icon: CircleDollarSignIcon,
      label: "Total Revenue",
      trend: revenueChange,
      value: formatMoney(currentMonthCollectedSen),
    },
    {
      color: "warning" as const,
      detail: "Current unpaid balance",
      href: "/invoices",
      icon: FileTextIcon,
      label: "Outstanding Fees",
      value: formatMoney(outstandingSen),
    },
  ];

  const firstName = currentUser?.firstName?.trim() ?? "";
  const welcome = firstName ? `Welcome back, ${firstName}!` : "Welcome back!";

  return (
    <>
      <Header page="Dashboard" pages={[`${appName}`]} />
      <main className="grid gap-5 p-4 pt-4">
        <section className="space-y-1">
          <h1 className="font-heading font-semibold text-2xl tracking-tight sm:text-3xl">
            {welcome}
          </h1>
          <p className="text-muted-foreground text-sm">
            Here&apos;s what&apos;s happening at{" "}
            <span className="font-medium text-foreground">
              {organization?.name ?? "your centre"}
            </span>{" "}
            today.
          </p>
        </section>
        <section className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          {stats.map((stat, index) => (
            <div
              className={cn(
                "relative h-full",
                index === stats.length - 1 && "col-span-2 md:col-span-1"
              )}
              key={stat.label}
            >
              <Stat className="h-full">
                <StatPanel className="max-md:p-3">
                  <StatLabel>{stat.label}</StatLabel>
                  <StatIndicator color={stat.color} variant="stacked">
                    <stat.icon />
                  </StatIndicator>
                  <StatValue>{stat.value}</StatValue>
                </StatPanel>
                <StatFooter className="max-md:px-3 max-md:py-2">
                  {typeof stat.trend === "number" ? (
                    <StatTrend
                      trend={
                        stat.trend > 0
                          ? "up"
                          : stat.trend < 0
                            ? "down"
                            : "neutral"
                      }
                    >
                      {stat.trend > 0 ? <ArrowUpIcon /> : null}
                      {stat.trend < 0 ? <ArrowDownIcon /> : null}
                      {stat.detail}
                    </StatTrend>
                  ) : (
                    <StatDescription>{stat.detail}</StatDescription>
                  )}
                  {stat.action ? (
                    <StatAction>
                      <Button
                        className="relative z-10"
                        render={<Link href={stat.action.href} />}
                        size="sm"
                        variant="outline"
                      >
                        <PlusIcon aria-hidden="true" />
                        <span className="hidden md:inline">
                          {stat.action.label}
                        </span>
                      </Button>
                    </StatAction>
                  ) : null}
                </StatFooter>
              </Stat>
              <Link
                aria-label={stat.label}
                className="absolute inset-0 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                href={stat.href}
              />
            </div>
          ))}
        </section>

        <section className="grid items-start gap-5 2xl:grid-cols-[1.15fr_1fr_0.95fr]">
          <CardFrame className="h-[430px] 2xl:h-[clamp(26.875rem,42dvh,40rem)]">
            <CardFrameHeader>
              <CardFrameTitle>Fee Collection Overview</CardFrameTitle>
              <CardFrameAction>
                <Badge variant="outline">This Month</Badge>
              </CardFrameAction>
            </CardFrameHeader>
            <Card className="flex-1">
              <CardContent className="flex min-h-0 flex-col">
                <div className="mb-4 shrink-0">
                  <p className="text-muted-foreground text-sm">
                    Total Collected
                  </p>
                  <div className="mt-1 flex flex-wrap items-end gap-3">
                    <p className="font-semibold text-3xl tracking-tight">
                      {formatMoney(currentMonthCollectedSen)}
                    </p>
                    <p className="mb-1 flex items-center gap-1 text-muted-foreground text-sm">
                      {revenueChange > 0 ? (
                        <ArrowUpIcon className="size-3" />
                      ) : null}
                      {revenueChange < 0 ? (
                        <ArrowDownIcon className="size-3" />
                      ) : null}
                      {formatPercentChange(revenueChange)}
                    </p>
                  </div>
                  <p className="mt-1 text-muted-foreground text-sm">
                    vs last month ({formatMoney(previousMonthCollectedSen)})
                  </p>
                </div>
                <FeeCollectionChart
                  currency={currency}
                  data={feeCollectionData}
                />
              </CardContent>
            </Card>
          </CardFrame>

          <CardFrame className="h-[430px] 2xl:h-[clamp(26.875rem,42dvh,40rem)]">
            <CardFrameHeader>
              <CardFrameTitle>Student Attendance Overview</CardFrameTitle>
              <CardFrameAction>
                <Badge variant="outline">This Month</Badge>
              </CardFrameAction>
            </CardFrameHeader>
            <Card className="flex-1">
              <CardContent>
                {attendanceTotal > 0 ? (
                  <div className="grid gap-5 md:grid-cols-[1fr_0.8fr] 2xl:grid-cols-1">
                    <AttendanceDonutChart
                      average={averageAttendance}
                      data={attendanceData}
                    />
                    <div className="grid content-center gap-3">
                      {attendanceData.map((item) => (
                        <div
                          className="flex items-center justify-between gap-3 text-sm"
                          key={item.status}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className="size-2.5 rounded-sm"
                              style={{ background: item.fill }}
                            />
                            {item.label}
                          </span>
                          <span className="font-medium tabular-nums">
                            {item.value} (
                            {((item.value / attendanceTotal) * 100).toFixed(1)}
                            %)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={ClipboardListIcon}
                    text="Attendance records will appear here once classes are marked."
                    title="No attendance marked this month"
                  />
                )}
                <p className="mt-4 text-muted-foreground text-sm">
                  Overall attendance this month
                </p>
              </CardContent>
            </Card>
          </CardFrame>

          <div className="grid gap-5">
            <CardFrame className="h-[430px] 2xl:h-[clamp(26.875rem,42dvh,40rem)]">
              <CardFrameHeader>
                <CardFrameTitle>Today&apos;s Classes</CardFrameTitle>
                <CardFrameAction>
                  <Button
                    render={<Link href="/today" />}
                    size="sm"
                    variant="link"
                  >
                    View All
                  </Button>
                </CardFrameAction>
              </CardFrameHeader>
              <Card className="flex-1">
                <CardContent className="grid gap-1">
                  {todaySessions.length > 0 ? (
                    todaySessions.map((session) => (
                      <Link
                        className="grid grid-cols-[4.5rem_1fr_auto] items-start gap-3 border-b py-3 text-sm last:border-b-0"
                        href="/today"
                        key={session.id}
                      >
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <span className="size-2 rounded-full bg-muted-foreground/40" />
                          {session.startsAt}
                        </span>
                        <span>
                          <span className="block font-medium">
                            {session.class.name}
                          </span>
                          <span className="block text-muted-foreground">
                            {session.class.subject.name}
                            {session.class.schedules.at(0)?.room?.name
                              ? ` - ${session.class.schedules.at(0)?.room?.name}`
                              : ""}
                          </span>
                        </span>
                        <Badge variant="outline">{session.status}</Badge>
                      </Link>
                    ))
                  ) : (
                    <EmptyState
                      icon={CalendarDaysIcon}
                      text="Create sessions from the Today page when classes are scheduled."
                      title="No classes today"
                    />
                  )}
                </CardContent>
              </Card>
            </CardFrame>
          </div>
        </section>

        <section className="grid items-stretch gap-5 xl:grid-cols-[1.1fr_0.95fr_0.9fr]">
          <CardFrame className="h-full xl:min-h-[clamp(16rem,28dvh,27.5rem)]">
            <CardFrameHeader>
              <CardFrameTitle>Recent Activities</CardFrameTitle>
            </CardFrameHeader>
            <Card className="flex-1">
              <CardContent className="flex min-h-0 flex-col gap-1">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <div
                      className="grid grid-cols-[2.5rem_1fr_auto] items-start gap-4 border-b py-3 text-sm last:border-b-0"
                      key={activity.id}
                    >
                      <div className="flex size-9 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground">
                        <ReceiptTextIcon className="size-4" />
                      </div>
                      <p className="font-medium leading-6">
                        {activity.summary}
                      </p>
                      <p className="whitespace-nowrap text-muted-foreground text-xs">
                        {formatRelativeTime(activity.createdAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    icon={ReceiptTextIcon}
                    text="Audit events will appear here as centre activity is recorded."
                    title="No recent activity"
                  />
                )}
              </CardContent>
            </Card>
          </CardFrame>

          <CardFrame className="h-full xl:min-h-[clamp(16rem,28dvh,27.5rem)]">
            <CardFrameHeader>
              <CardFrameTitle>Outstanding Fees</CardFrameTitle>
              <CardFrameAction>
                <Button
                  render={<Link href="/invoices" />}
                  size="sm"
                  variant="link"
                >
                  View All
                </Button>
              </CardFrameAction>
            </CardFrameHeader>
            <Card className="flex-1">
              <CardContent className="flex min-h-0 flex-col gap-1">
                {openInvoices.length > 0 ? (
                  openInvoices.map((invoice) => {
                    const outstanding =
                      invoice.totalSen - invoice.amountPaidSen;

                    return (
                      <Link
                        className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 border-b py-3 text-sm last:border-b-0"
                        href={`/invoices/${invoice.id}`}
                        key={invoice.id}
                      >
                        <span className="flex size-9 items-center justify-center rounded-full border bg-muted/40 font-medium text-xs">
                          {initials(invoice.student.fullName)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium">
                            {invoice.student.fullName}
                          </span>
                          <span className="block truncate text-muted-foreground text-xs">
                            {invoice.invoiceNumber} - Due:{" "}
                            {formatDate(invoice.dueDate)}
                          </span>
                        </span>
                        <span className="font-semibold tabular-nums">
                          {formatMoney(outstanding)}
                        </span>
                      </Link>
                    );
                  })
                ) : (
                  <EmptyState
                    icon={BanknoteIcon}
                    text="Unpaid issued invoices will appear here."
                    title="No outstanding fees"
                  />
                )}
                {openInvoices.length > 0 ? (
                  <Button
                    className="mt-4"
                    render={<Link href="/invoices" />}
                    variant="outline"
                  >
                    View All Outstanding Fees
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          </CardFrame>

          <CardFrame className="h-full xl:min-h-[clamp(16rem,28dvh,27.5rem)]">
            <CardFrameHeader>
              <CardFrameTitle>Latest Announcements</CardFrameTitle>
              <CardFrameAction>
                <Button disabled size="sm" variant="link">
                  View All
                </Button>
              </CardFrameAction>
            </CardFrameHeader>
            <Card className="flex-1">
              <CardContent className="flex min-h-0 flex-col">
                <EmptyState
                  icon={MegaphoneIcon}
                  text="Announcements are not available yet. Once added, centre notices will show here."
                  title="No announcements"
                />
              </CardContent>
            </Card>
          </CardFrame>
        </section>
      </main>
    </>
  );
};

interface EmptyStateProps {
  icon: typeof ClipboardListIcon;
  text: string;
  title: string;
}

const EmptyState = ({ icon: Icon, text, title }: EmptyStateProps) => (
  <div className="flex min-h-36 flex-1 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 p-6 text-center">
    <div className="mb-3 flex size-10 items-center justify-center rounded-lg border bg-background text-muted-foreground">
      <Icon className="size-5" />
    </div>
    <p className="font-medium text-sm">{title}</p>
    <p className="mt-1 max-w-sm text-muted-foreground text-sm">{text}</p>
  </div>
);

export default App;
