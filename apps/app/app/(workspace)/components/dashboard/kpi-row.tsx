import { Button } from "@repo/design-system/components/ui/button";
import { Card } from "@repo/design-system/components/ui/card";
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from "@repo/design-system/components/ui/progress";
import {
  StatDescription,
  StatIndicator,
  StatLabel,
  StatValue,
} from "@repo/design-system/components/ui/stat";
import { cn } from "@repo/design-system/lib/utils";
import type { DashboardKpiData } from "@repo/domain";
import { formatMoneyWhole } from "@repo/money";
import {
  BookOpenIcon,
  CircleDollarSignIcon,
  FileTextIcon,
  PlusIcon,
  UserRoundIcon,
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
    progress: number | null;
    value: string;
  }[] = [
    {
      action: { href: "/students/new", label: "Student" },
      color: "info",
      detail: `+ ${data.students.addedThisMonth} this month`,
      href: "/students",
      icon: UsersRoundIcon,
      label: "Total Students",
      progress: null,
      value: data.students.total.toLocaleString(),
    },
    {
      action: { href: "/classes/new", label: "Class" },
      color: "default",
      detail: `+ ${data.classes.addedThisMonth} this month`,
      href: "/classes",
      icon: BookOpenIcon,
      label: "Total Classes",
      progress: null,
      value: data.classes.total.toLocaleString(),
    },
    {
      action: { href: "/teachers/new", label: "Teacher" },
      color: "info",
      detail: `+ ${data.teachers.addedThisMonth} this month`,
      href: "/teachers",
      icon: UserRoundIcon,
      label: "Total Teachers",
      progress: null,
      value: data.teachers.total.toLocaleString(),
    },
    {
      action: { href: "/invoices", label: "Invoice" },
      color: "success",
      detail: `${data.fees.targetPercent}% of ${formatMoney(data.fees.invoicedSen)} target`,
      href: "/payments",
      icon: CircleDollarSignIcon,
      label: "Fees Collected (This Month)",
      progress: data.fees.invoicedSen > 0 ? data.fees.targetPercent : null,
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
      progress: null,
      value: formatMoney(data.fees.outstandingSen),
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-5">
      {stats.map((stat, index) => (
        <div
          className={cn(
            "relative h-full rounded-xl border border-border/70 p-1",
            index === stats.length - 1 && "col-span-2 lg:col-span-1"
          )}
          key={stat.label}
        >
          <div className="relative h-full overflow-hidden rounded-lg">
            <div
              aria-hidden="true"
              className="absolute inset-1 z-0 rounded-sm"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, transparent, transparent 2px, var(--border) 2px, var(--border) 4px)",
                opacity: 0.5,
              }}
            />
            <Card className="relative isolate z-10 h-full rounded-lg border-2 border-border bg-transparent shadow-none before:hidden">
              <div className="grid flex-1 grid-cols-[auto_1fr] gap-x-3 gap-y-2 p-4 **:data-[slot=stat-value]:col-span-2 **:data-[slot=stat-indicator]:col-start-1 **:data-[slot=stat-label]:col-start-2 **:data-[slot=stat-indicator]:row-start-1 **:data-[slot=stat-label]:row-start-1 **:data-[slot=stat-value]:row-start-2 **:data-[slot=stat-indicator]:self-center **:data-[slot=stat-label]:self-center max-md:p-3">
                <StatLabel>{stat.label}</StatLabel>
                <StatIndicator color={stat.color} variant="stacked">
                  <stat.icon />
                </StatIndicator>
                <StatValue>{stat.value}</StatValue>
              </div>
              <div className="flex flex-col items-start gap-2 px-4 py-3 max-md:px-3 max-md:py-2">
                {stat.progress !== null ? (
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
                <StatDescription className="min-w-0 flex-1">
                  {stat.detail}
                </StatDescription>
                {stat.action ? (
                  <Button
                    className="relative z-10 mt-1"
                    render={<Link href={stat.action.href} />}
                    size="sm"
                    variant="outline"
                  >
                    <PlusIcon aria-hidden="true" />
                    <span className="hidden md:inline">
                      {stat.action.label}
                    </span>
                  </Button>
                ) : null}
              </div>
            </Card>
          </div>
          <Link
            aria-label={stat.label}
            className="absolute inset-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            href={stat.href}
          />
        </div>
      ))}
    </section>
  );
};
