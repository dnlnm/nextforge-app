import type { SubscriptionPlan, SubscriptionStatus } from "@repo/database";
import { Badge } from "@repo/design-system/components/ui/fluid-badge";
import { Button } from "@repo/design-system/components/ui/fluid-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/fluid-card";
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from "@repo/design-system/components/ui/progress";
import type { PlanDefinition } from "@repo/payments/plans";
import {
  ArrowRightIcon,
  BookOpenIcon,
  ClockIcon,
  GraduationCapIcon,
  ReceiptIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";

export interface CentreCapacityCardProps {
  readonly organizationId: string;
  readonly plan: PlanDefinition;
  readonly subscription: {
    readonly plan: SubscriptionPlan;
    readonly status: SubscriptionStatus;
    readonly trialEndsAt: Date | null;
  };
  readonly trialDaysLeft: number | null;
  readonly usage: {
    readonly students: number;
    readonly classes: number;
    readonly teachers: number;
    readonly invoicesPerMonth: number;
    readonly billingMonth: string;
  };
}

const getPlanBadgeColor = (plan: SubscriptionPlan) => {
  switch (plan) {
    case "TRIAL":
      return "amber";
    case "STARTER":
      return "blue";
    case "PRO":
      return "purple";
    case "MAX":
      return "emerald";
    default:
      return "gray";
  }
};

interface MetricItemProps {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly limit: number;
  readonly value: number;
}

const CapacityMetricItem = ({ icon, label, limit, value }: MetricItemProps) => {
  const percentage = Math.min(
    100,
    Math.round((value / Math.max(1, limit)) * 100)
  );
  const isNearLimit = percentage >= 90;

  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-surface-1 p-3.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-foreground">
            {value}{" "}
            <span className="font-normal text-muted-foreground">/ {limit}</span>
          </span>
          {isNearLimit ? (
            <Badge color="amber" size="compact" variant="solid">
              {percentage}%
            </Badge>
          ) : (
            <span className="text-muted-foreground text-xs">{percentage}%</span>
          )}
        </div>
      </div>

      <Progress aria-label={`${label} usage`} value={percentage}>
        <ProgressTrack className="h-1.5 bg-muted">
          <ProgressIndicator
            className={isNearLimit ? "bg-amber-500" : "bg-primary"}
            style={{ width: `${percentage}%` }}
          />
        </ProgressTrack>
      </Progress>
    </div>
  );
};

export const CentreCapacityCard = ({
  organizationId,
  plan,
  subscription,
  usage,
  trialDaysLeft,
}: CentreCapacityCardProps) => {
  const isTrial = subscription.plan === "TRIAL";
  const subscriptionHref = `/centres/${organizationId}/subscription`;

  return (
    <Card className="flex h-full flex-col overflow-hidden border-border/80 shadow-xs">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base sm:text-lg">
                Subscription & Capacity
              </CardTitle>
              <Badge
                color={getPlanBadgeColor(subscription.plan)}
                size="compact"
                variant="solid"
              >
                {plan.name}
              </Badge>
            </div>
            <CardDescription className="mt-1">
              Current usage quotas on the {plan.name} tier ({plan.monthlyPrice})
            </CardDescription>
          </div>

          <Button asChild className="shrink-0" size="compact" variant="ghost">
            <Link href={subscriptionHref}>
              Manage Plan
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        {/* Trial callout */}
        {isTrial && trialDaysLeft !== null ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm">
            <div className="flex items-center gap-2">
              <ClockIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="font-medium text-amber-950 dark:text-amber-200">
                {trialDaysLeft === 0
                  ? "Trial ends today"
                  : `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left in trial`}
              </span>
            </div>
            <Button asChild size="compact" variant="primary">
              <Link href={subscriptionHref}>Upgrade</Link>
            </Button>
          </div>
        ) : null}

        {/* 4 capacity meters */}
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
          <CapacityMetricItem
            icon={<UsersIcon className="size-3.5" />}
            label="Students"
            limit={plan.students}
            value={usage.students}
          />
          <CapacityMetricItem
            icon={<BookOpenIcon className="size-3.5" />}
            label="Active Classes"
            limit={plan.classes}
            value={usage.classes}
          />
          <CapacityMetricItem
            icon={<GraduationCapIcon className="size-3.5" />}
            label="Teaching Staff"
            limit={plan.teachers}
            value={usage.teachers}
          />
          <CapacityMetricItem
            icon={<ReceiptIcon className="size-3.5" />}
            label={`Invoices (${usage.billingMonth})`}
            limit={plan.invoicesPerMonth}
            value={usage.invoicesPerMonth}
          />
        </div>
      </CardContent>
    </Card>
  );
};
