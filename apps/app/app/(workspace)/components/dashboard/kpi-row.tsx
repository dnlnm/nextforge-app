import { Button } from "@repo/design-system/components/ui/button";
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from "@repo/design-system/components/ui/progress";
import {
  Stat,
  StatDescription,
  StatFooter,
  StatIndicator,
  StatLabel,
  StatPanel,
  StatValue,
} from "@repo/design-system/components/ui/stat";
import { cn } from "@repo/design-system/lib/utils";
import type { DashboardKpiData } from "@repo/domain";
import { formatMoneyWhole } from "@repo/money";
import {
  CalendarDaysIcon,
  CircleDollarSignIcon,
  ClipboardCheckIcon,
  FileTextIcon,
  PlusIcon,
  UsersRoundIcon,
} from "lucide-react";
import Link from "next/link";

interface KpiRowProps {
  readonly currency: string;
  readonly data: DashboardKpiData;
}

export const KpiRow = ({ currency, data }: KpiRowProps) => {
  const formatMoney = (amountSen: number) =>
    formatMoneyWhole(amountSen, { currency });

  const stats: {
    action: { href: string; label: string } | null;
    color: "default" | "error" | "info" | "success" | "warning";
    detail: string;
    href: string;
    icon: typeof UsersRoundIcon;
    label: string;
    value: string;
  }[] = [
    {
      action: { href: "/students/new", label: "Student" },
      color: "info",
      detail: `+ ${data.students.addedThisMonth} this month`,
      href: "/students",
      icon: UsersRoundIcon,
      label: "Total Students",
      value: data.students.total.toLocaleString(),
    },
    {
      action: null,
      color: "default",
      detail:
        data.classesToday.inProgress > 0
          ? `${data.classesToday.inProgress} in progress`
          : "No classes running",
      href: "/today",
      icon: CalendarDaysIcon,
      label: "Classes Today",
      value: data.classesToday.total.toLocaleString(),
    },
    {
      action: null,
      color: "success",
      detail:
        data.attendanceToday.percentage === null
          ? "Not marked yet"
          : `${data.attendanceToday.present} / ${data.attendanceToday.expected} present`,
      href: "/attendance",
      icon: ClipboardCheckIcon,
      label: "Attendance (Today)",
      value:
        data.attendanceToday.percentage === null
          ? "—"
          : `${data.attendanceToday.percentage}%`,
    },
    {
      action: null,
      color: "success",
      detail: `${data.fees.targetPercent}% of ${formatMoney(data.fees.invoicedSen)} target`,
      href: "/payments",
      icon: CircleDollarSignIcon,
      label: "Fees Collected (This Month)",
      value: formatMoney(data.fees.collectedSen),
    },
    {
      action: null,
      color: "warning",
      detail:
        data.fees.overdueCount > 0
          ? `${data.fees.overdueCount} ${data.fees.overdueCount === 1 ? "invoice" : "invoices"} overdue`
          : "No overdue invoices",
      href: "/invoices",
      icon: FileTextIcon,
      label: "Outstanding Fees",
      value: formatMoney(data.fees.outstandingSen),
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-5">
      {stats.map((stat, index) => (
        <div
          className={cn(
            "relative h-full",
            index === stats.length - 1 && "col-span-2 lg:col-span-1"
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
            <StatFooter className="flex-col items-start gap-2 max-md:px-3 max-md:py-2">
              {stat.label === "Fees Collected (This Month)" &&
              data.fees.invoicedSen > 0 ? (
                <Progress
                  aria-label={`${data.fees.targetPercent}% of target collected`}
                  value={data.fees.targetPercent}
                >
                  <ProgressTrack>
                    <ProgressIndicator
                      className="bg-success"
                      style={{
                        width: `${Math.min(100, data.fees.targetPercent)}%`,
                      }}
                    />
                  </ProgressTrack>
                </Progress>
              ) : null}
              <StatDescription>{stat.detail}</StatDescription>
              {stat.action ? (
                <Button
                  className="relative z-10 mt-1"
                  render={<Link href={stat.action.href} />}
                  size="sm"
                  variant="outline"
                >
                  <PlusIcon aria-hidden="true" />
                  <span className="hidden md:inline">{stat.action.label}</span>
                </Button>
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
  );
};
