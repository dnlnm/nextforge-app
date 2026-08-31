import { Button } from "@repo/design-system/components/ui/button";
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from "@repo/design-system/components/ui/progress";
import { Icon } from "@repo/design-system/components/ui/icon";
import { StatLabel, StatValue } from "@repo/design-system/components/ui/stat";
import { PreviewCard } from "@repo/design-system/components/preview-card";
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
    <section className="grid grid-cols-2 gap-5 lg:grid-cols-3 2xl:grid-cols-5">
      {stats.map((stat, index) => (
        <PreviewCard
          className={cn(
            "relative flex h-full flex-col",
            index === stats.length - 1 && "col-span-2 lg:col-span-1"
          )}
          key={stat.label}
          label={stat.detail}
          footer={
            stat.action ? (
              <div className="relative z-10 ml-auto flex justify-end">
                <Button
                  render={<Link href={stat.action.href} />}
                  size="2xs"
                  variant="elevated"
                >
                  <PlusIcon aria-hidden="true" data-icon="inline-start" />
                  <span className="hidden md:inline">{stat.action.label}</span>
                </Button>
              </div>
            ) : null
          }
          stageClassName="flex-col items-start justify-center gap-3 p-4 sm:p-4"
        >
          <div className="flex items-center gap-3">
            <Icon color={stat.color} variant="elevated-filled">
              <stat.icon />
            </Icon>
            <StatLabel>{stat.label}</StatLabel>
          </div>
          <StatValue>{stat.value}</StatValue>
          {stat.progress !== null ? (
            <Progress
              aria-label={`${data.fees.targetPercent}% of target collected`}
              className="w-full max-w-40"
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
          <Link
            aria-label={stat.label}
            className="absolute inset-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            href={stat.href}
          />
        </PreviewCard>
      ))}
    </section>
  );
};
