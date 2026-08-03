"use client";

import type { SubscriptionPlan, SubscriptionStatus } from "@repo/database";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/design-system/components/ui/alert";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Progress } from "@repo/design-system/components/ui/progress";
import { Separator } from "@repo/design-system/components/ui/separator";
import {
  Stat,
  StatDescription,
  StatIndicator,
  StatLabel,
  StatValue,
} from "@repo/design-system/components/ui/stat";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/design-system/components/ui/tabs";
import { cn } from "@repo/design-system/lib/utils";
import {
  AlertCircleIcon,
  ArrowUpIcon,
  BanknoteIcon,
  BarChart3Icon,
  CalendarClockIcon,
  CheckCircleIcon,
  CheckIcon,
  CircleDollarSignIcon,
  CreditCardIcon,
  InfoIcon,
  SparklesIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { openBillingPortal, startSubscriptionCheckout } from "./actions";
import {
  formatDate,
  getProgressClasses,
  getUsagePercentage,
  getUsageTextColor,
  paidPlanRank,
} from "./billing-utils";

interface PlanCard {
  classes: number;
  invoicesPerMonth: number;
  key: SubscriptionPlan;
  monthlyPrice: string;
  name: string;
  students: number;
  teachers: number;
}

interface ComparisonRow {
  feature: string;
  values: string[];
}

interface SubscriptionData {
  currentPeriodEndsAt: Date | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripeSubscriptionId: string | null;
  trialEndsAt: Date | null;
}

interface UsageRow {
  label: string;
  limit: number;
  value: number;
}

interface BillingTabsProps {
  approachingLimit: boolean;
  checkoutStatus?: "cancelled" | "success";
  comparison: {
    columns: Array<{ key: SubscriptionPlan; name: string }>;
    rows: ComparisonRow[];
  };
  criticalResource: { label: string; value: number; limit: number } | null;
  daysUntilPeriodEnds: number | null;
  daysUntilTrialExpires: number | null;
  plan: {
    monthlyPrice: string;
    name: string;
  };
  planCards: PlanCard[];
  subscription: SubscriptionData;
  usageRows: UsageRow[];
}

const statusMeta: Record<
  SubscriptionStatus,
  {
    badge: string;
    indicator: "default" | "error" | "success" | "warning";
    label: string;
  }
> = {
  ACTIVE: {
    badge:
      "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
    indicator: "success",
    label: "Active",
  },
  TRIALING: {
    badge:
      "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
    indicator: "warning",
    label: "Trial",
  },
  PAST_DUE: {
    badge: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
    indicator: "error",
    label: "Past due",
  },
  CANCELED: {
    badge: "bg-muted text-muted-foreground border-border",
    indicator: "default",
    label: "Cancelled",
  },
  INCOMPLETE: {
    badge: "bg-muted text-muted-foreground border-border",
    indicator: "default",
    label: "Incomplete",
  },
  UNPAID: {
    badge: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
    indicator: "error",
    label: "Unpaid",
  },
};

const CheckoutToast = ({ status }: { status?: "cancelled" | "success" }) => {
  const router = useRouter();

  useEffect(() => {
    if (status === "success") {
      toast.success("Subscription updated", {
        description: "Your billing plan has been updated.",
      });
    } else if (status === "cancelled") {
      toast.info("Checkout cancelled", {
        description: "No changes were made to your subscription.",
      });
    }

    if (status) {
      router.replace("/billing");
    }
  }, [router, status]);

  return null;
};

const SubscriptionHero = ({
  daysUntilPeriodEnds,
  daysUntilTrialExpires,
  plan,
  subscription,
}: {
  daysUntilPeriodEnds: number | null;
  daysUntilTrialExpires: number | null;
  plan: { monthlyPrice: string; name: string };
  subscription: SubscriptionData;
}) => {
  const isOnTrial = subscription.status === "TRIALING";
  const isOnPro = subscription.plan === "PRO";
  const hasStripeSubscription = Boolean(subscription.stripeSubscriptionId);
  const status = statusMeta[subscription.status];

  return (
    <Card
      className={cn(
        "border-2",
        subscription.status === "ACTIVE" && "border-primary/50",
        subscription.status === "TRIALING" && "border-yellow-500/50"
      )}
    >
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-2xl">Current Subscription</CardTitle>
            <CardDescription>
              Manage your TLAS.MY subscription and billing
            </CardDescription>
          </div>
          <Badge className={status.badge}>
            {subscription.status === "ACTIVE" && (
              <CheckCircleIcon className="size-3" />
            )}
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Stat className="h-full">
            <StatLabel>Current Plan</StatLabel>
            <StatIndicator color={status.indicator} variant="icon">
              <CircleDollarSignIcon />
            </StatIndicator>
            <StatValue>{plan.name}</StatValue>
            <StatDescription>
              {status.label.toLowerCase()} subscription
            </StatDescription>
          </Stat>

          <Stat className="h-full">
            <StatLabel>Monthly Price</StatLabel>
            <StatIndicator color="default" variant="icon">
              <BanknoteIcon />
            </StatIndicator>
            <StatValue>{plan.monthlyPrice}</StatValue>
            <StatDescription>
              {isOnTrial ? "billed after trial ends" : "per month"}
            </StatDescription>
          </Stat>

          {isOnTrial ? (
            <Stat className="h-full">
              <StatLabel>Trial Ends</StatLabel>
              <StatIndicator
                color={
                  daysUntilTrialExpires !== null && daysUntilTrialExpires <= 3
                    ? "error"
                    : "warning"
                }
                variant="icon"
              >
                <CalendarClockIcon />
              </StatIndicator>
              <StatValue>{formatDate(subscription.trialEndsAt)}</StatValue>
              {daysUntilTrialExpires !== null && (
                <StatDescription
                  className={cn(
                    daysUntilTrialExpires <= 3 &&
                      "font-medium text-red-600 dark:text-red-400"
                  )}
                >
                  {daysUntilTrialExpires}{" "}
                  {daysUntilTrialExpires === 1 ? "day" : "days"} remaining
                </StatDescription>
              )}
            </Stat>
          ) : (
            <Stat className="h-full">
              <StatLabel>Current Period Ends</StatLabel>
              <StatIndicator color="default" variant="icon">
                <CalendarClockIcon />
              </StatIndicator>
              <StatValue>
                {formatDate(subscription.currentPeriodEndsAt)}
              </StatValue>
              {daysUntilPeriodEnds !== null && (
                <StatDescription>
                  {daysUntilPeriodEnds}{" "}
                  {daysUntilPeriodEnds === 1 ? "day" : "days"} remaining
                </StatDescription>
              )}
            </Stat>
          )}
        </div>

        <Separator />

        <div className="flex flex-wrap gap-3">
          {!isOnPro && (
            <form
              action={
                hasStripeSubscription
                  ? openBillingPortal
                  : startSubscriptionCheckout
              }
            >
              <input name="plan" type="hidden" value="PRO" />
              <Button size="lg" type="submit">
                <SparklesIcon className="size-4" />
                Upgrade to Pro
              </Button>
            </form>
          )}
          <form action={openBillingPortal}>
            <Button size="lg" type="submit" variant="outline">
              <CreditCardIcon className="size-4" />
              Manage Billing
            </Button>
          </form>
        </div>
        <p className="text-muted-foreground text-xs">
          Opens Stripe billing portal to manage payment methods, view invoices,
          or cancel subscription
        </p>
      </CardContent>
    </Card>
  );
};

const UsageGrid = ({
  compact = false,
  rows,
}: {
  compact?: boolean;
  rows: UsageRow[];
}) => (
  <div
    className={cn(
      "grid gap-x-8 sm:grid-cols-2",
      compact ? "gap-y-5" : "gap-y-6"
    )}
  >
    {rows.map((row) => {
      const percentage = getUsagePercentage(row.value, row.limit);
      return (
        <div className="grid gap-2" key={row.label}>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-medium">{row.label}</span>
            <span className={cn("tabular-nums", getUsageTextColor(percentage))}>
              {compact
                ? `${row.value} / ${row.limit}`
                : `${row.value} / ${row.limit} (${percentage}%)`}
            </span>
          </div>
          <Progress
            className={getProgressClasses(percentage)}
            value={Math.min(percentage, 100)}
          />
          {!compact && percentage >= 90 && (
            <p className="text-red-600 text-xs dark:text-red-400">
              <AlertCircleIcon className="mr-1 inline size-3" />
              Close to limit - upgrade recommended
            </p>
          )}
        </div>
      );
    })}
  </div>
);

const UsageBadge = ({ visible }: { visible: boolean }) =>
  visible ? (
    <Badge className="flex items-center gap-1" variant="destructive">
      <AlertCircleIcon className="size-3" />
      Approaching Limit
    </Badge>
  ) : null;

const UsageAtGlance = ({
  approachingLimit,
  isOnPro,
  onViewFullUsage,
  usageRows,
}: {
  approachingLimit: boolean;
  isOnPro: boolean;
  onViewFullUsage: () => void;
  usageRows: UsageRow[];
}) => (
  <Card>
    <CardHeader className="flex flex-row items-start justify-between gap-4">
      <div>
        <CardTitle className="text-xl">Usage at a glance</CardTitle>
        <CardDescription>
          Limits are enforced when creating new records
        </CardDescription>
      </div>
      <UsageBadge visible={approachingLimit} />
    </CardHeader>
    <CardContent className="space-y-5">
      <UsageGrid compact rows={usageRows} />
      <div className="flex items-center gap-2">
        <Button onClick={onViewFullUsage} variant="ghost">
          View full usage
          <BarChart3Icon className="size-4" />
        </Button>
        {!isOnPro && (
          <Button onClick={onViewFullUsage} variant="link">
            Upgrade to Pro for higher limits
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
);

const PlanCards = ({
  isOnPro,
  planCards,
  subscription,
}: {
  isOnPro: boolean;
  planCards: PlanCard[];
  subscription: SubscriptionData;
}) => {
  const hasStripeSubscription = Boolean(subscription.stripeSubscriptionId);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {planCards.map((definition) => {
        const isCurrentPlan = subscription.plan === definition.key;
        const isUpgrade =
          subscription.plan !== "TRIAL" &&
          paidPlanRank[definition.key] > paidPlanRank[subscription.plan];

        let buttonLabel = "Choose plan";
        if (isCurrentPlan) {
          buttonLabel = "Current plan";
        } else if (hasStripeSubscription) {
          buttonLabel = isUpgrade
            ? `Upgrade to ${definition.name}`
            : "Manage in billing portal";
        }

        const formAction = hasStripeSubscription
          ? openBillingPortal
          : startSubscriptionCheckout;

        return (
          <Card
            className={cn(
              "relative flex flex-col",
              isCurrentPlan && "border-2 border-primary shadow-md",
              definition.key === "PRO" && !isCurrentPlan && "shadow-lg"
            )}
            key={definition.key}
          >
            {isCurrentPlan && (
              <div className="absolute -top-3 left-4">
                <Badge className="bg-primary">
                  <CheckIcon className="size-3" />
                  Current Plan
                </Badge>
              </div>
            )}
            {definition.key === "PRO" && !isOnPro && (
              <div className="absolute -top-3 right-4">
                <Badge variant="secondary">
                  <SparklesIcon className="size-3" />
                  Most Popular
                </Badge>
              </div>
            )}

            <CardHeader>
              <CardTitle className="text-2xl">{definition.name}</CardTitle>
              <CardDescription className="font-semibold text-lg">
                {definition.monthlyPrice}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col space-y-6">
              <ul className="flex-1 space-y-3 text-sm">
                {[
                  [definition.students, "active students"],
                  [definition.teachers, "teachers"],
                  [definition.classes, "active classes"],
                  [definition.invoicesPerMonth, "invoices per month"],
                ].map(([count, label]) => (
                  <li className="flex items-start gap-2" key={String(label)}>
                    <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>
                      <strong>{count}</strong> {label}
                    </span>
                  </li>
                ))}
              </ul>

              <form action={formAction}>
                <input name="plan" type="hidden" value={definition.key} />
                <Button
                  className="w-full"
                  disabled={isCurrentPlan}
                  size="lg"
                  type="submit"
                  variant={isUpgrade ? "default" : "outline"}
                >
                  {isUpgrade && <ArrowUpIcon className="size-4" />}
                  {buttonLabel}
                </Button>
              </form>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

const ComparisonTable = ({
  comparison,
  currentPlan,
}: {
  comparison: BillingTabsProps["comparison"];
  currentPlan: SubscriptionPlan;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-xl">Compare plans</CardTitle>
      <CardDescription>
        See what every plan includes, side by side
      </CardDescription>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Feature</TableHead>
            {comparison.columns.map((column) => (
              <TableHead
                className={cn(
                  currentPlan === column.key && "bg-primary/5 text-foreground"
                )}
                key={column.key}
              >
                <div className="flex flex-col gap-1">
                  <span>{column.name}</span>
                  {currentPlan === column.key && (
                    <Badge className="w-fit bg-primary">Current</Badge>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {comparison.rows.map((row) => (
            <TableRow key={row.feature}>
              <TableCell className="font-medium">{row.feature}</TableCell>
              {row.values.map((value, index) => {
                const column = comparison.columns[index];
                const isCurrent = currentPlan === column.key;
                return (
                  <TableCell
                    className={cn("tabular-nums", isCurrent && "bg-primary/5")}
                    key={column.key}
                  >
                    {value}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

const UsageTab = ({
  approachingLimit,
  criticalResource,
  isOnPro,
  onGoToPlans,
  usageRows,
}: {
  approachingLimit: boolean;
  criticalResource: BillingTabsProps["criticalResource"];
  isOnPro: boolean;
  onGoToPlans: () => void;
  usageRows: UsageRow[];
}) => (
  <Card>
    <CardHeader className="flex flex-row items-start justify-between gap-4">
      <div>
        <CardTitle className="text-xl">Resource Usage</CardTitle>
        <CardDescription>
          Limits are enforced when creating new records
        </CardDescription>
      </div>
      <UsageBadge visible={approachingLimit} />
    </CardHeader>
    <CardContent className="space-y-6">
      {approachingLimit && criticalResource && (
        <Alert>
          <InfoIcon className="size-4" />
          <AlertTitle>Resource limit warning</AlertTitle>
          <AlertDescription>
            You're using{" "}
            {getUsagePercentage(criticalResource.value, criticalResource.limit)}
            % of your {criticalResource.label.toLowerCase()} limit.
            {!isOnPro && " Consider upgrading to Pro for higher limits."}
          </AlertDescription>
        </Alert>
      )}

      <UsageGrid rows={usageRows} />

      {!isOnPro && (
        <div className="flex items-center gap-2">
          <Button onClick={onGoToPlans}>
            <SparklesIcon className="size-4" />
            Upgrade to Pro for higher limits
          </Button>
          <Button asChild variant="ghost">
            <a href="/billing">Refresh usage</a>
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
);

const BillingTabs = ({
  approachingLimit,
  checkoutStatus,
  comparison,
  criticalResource,
  daysUntilPeriodEnds,
  daysUntilTrialExpires,
  plan,
  planCards,
  subscription,
  usageRows,
}: BillingTabsProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  const isOnPro = subscription.plan === "PRO";
  const goToUsage = () => setActiveTab("usage");
  const goToPlans = () => setActiveTab("plans");

  return (
    <>
      <CheckoutToast status={checkoutStatus} />
      <Tabs
        className="items-start gap-4"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>

        <TabsContent className="grid gap-5" value="overview">
          <SubscriptionHero
            daysUntilPeriodEnds={daysUntilPeriodEnds}
            daysUntilTrialExpires={daysUntilTrialExpires}
            plan={plan}
            subscription={subscription}
          />
          <UsageAtGlance
            approachingLimit={approachingLimit}
            isOnPro={isOnPro}
            onViewFullUsage={goToUsage}
            usageRows={usageRows}
          />
        </TabsContent>

        <TabsContent className="grid gap-5" value="plans">
          <PlanCards
            isOnPro={isOnPro}
            planCards={planCards}
            subscription={subscription}
          />
          <ComparisonTable
            comparison={comparison}
            currentPlan={subscription.plan}
          />
        </TabsContent>

        <TabsContent className="grid gap-5" value="usage">
          <UsageTab
            approachingLimit={approachingLimit}
            criticalResource={criticalResource}
            isOnPro={isOnPro}
            onGoToPlans={goToPlans}
            usageRows={usageRows}
          />
        </TabsContent>
      </Tabs>
    </>
  );
};

export default BillingTabs;
