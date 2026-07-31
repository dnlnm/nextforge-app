import { requireTenantRole } from "@repo/auth/authorization";
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
import { cn } from "@repo/design-system/lib/utils";
import { planDefinitions } from "@repo/payments/plans";
import {
  AlertCircleIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
  InfoIcon,
  SparklesIcon,
} from "lucide-react";
import { Header } from "../components/header";
import { openBillingPortal, startSubscriptionCheckout } from "./actions";
import { getBillingState, getPlanUsageRows } from "./limits";

const paidPlanRank = {
  STARTER: 1,
  PRO: 2,
} as const;

const formatDate = (date?: Date | null) =>
  date
    ? new Intl.DateTimeFormat("en-MY", { dateStyle: "medium" }).format(date)
    : "-";

// Calculate days until date
const daysUntil = (date?: Date | null) => {
  if (!date) return null;
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// Get usage percentage
const getUsagePercentage = (value: number, limit: number) => {
  return Math.round((value / limit) * 100);
};

// Get usage status color
const getUsageStatus = (percentage: number) => {
  if (percentage >= 90) return "danger";
  if (percentage >= 70) return "warning";
  return "safe";
};

// Get progress bar classes based on usage
const getProgressClasses = (percentage: number) => {
  if (percentage >= 90) {
    return "bg-red-500/20 [&>div]:bg-red-500";
  }
  if (percentage >= 70) {
    return "bg-yellow-500/20 [&>div]:bg-yellow-500";
  }
  return "bg-green-500/20 [&>div]:bg-green-500";
};

// Get text color classes based on usage
const getUsageTextColor = (percentage: number) => {
  if (percentage >= 90) return "text-red-600 dark:text-red-400 font-semibold";
  if (percentage >= 70) return "text-yellow-600 dark:text-yellow-400 font-medium";
  return "text-muted-foreground";
};

const BillingPage = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const state = await getBillingState(tenant.organizationId);
  const usageRows = getPlanUsageRows(state.plan, state.usage);

  // Calculate additional data
  const daysUntilTrialExpires = daysUntil(state.subscription.trialEndsAt);
  const daysUntilPeriodEnds = daysUntil(state.subscription.currentPeriodEndsAt);
  const isOnTrial = state.subscription.status === "TRIALING";
  const isOnPro = state.subscription.plan === "PRO";
  const trialExpiringSoon = isOnTrial && daysUntilTrialExpires !== null && daysUntilTrialExpires <= 3;

  // Check if any resource is approaching limit
  const approachingLimit = usageRows.some(row => {
    const percentage = getUsagePercentage(row.value, row.limit);
    return percentage >= 90;
  });

  const criticalResource = usageRows.find(row => {
    const percentage = getUsagePercentage(row.value, row.limit);
    return percentage >= 90;
  });

  return (
    <>
      <Header page="Billing" pages={["TLAS.MY"]} />
      <main className="mx-auto max-w-7xl space-y-8 p-6 pt-0">
        {/* Alert: Trial Expiring Soon */}
        {trialExpiringSoon && (
          <Alert variant="destructive">
            <AlertCircleIcon className="size-4" />
            <AlertTitle>Trial ending soon</AlertTitle>
            <AlertDescription>
              Your trial expires in {daysUntilTrialExpires} {daysUntilTrialExpires === 1 ? "day" : "days"}. Choose a plan below to continue using TLAS.MY without interruption.
            </AlertDescription>
          </Alert>
        )}

        {/* SECTION 1: Current Subscription Hero */}
        <Card className={cn(
          "border-2",
          state.subscription.status === "ACTIVE" && "border-primary/50",
          state.subscription.status === "TRIALING" && "border-yellow-500/50"
        )}>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-2xl">Current Subscription</CardTitle>
                  <Badge className={cn(
                    state.subscription.status === "ACTIVE" && "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
                    state.subscription.status === "TRIALING" && "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
                  )}>
                    {state.subscription.status === "ACTIVE" && <CheckCircleIcon className="mr-1 size-3" />}
                    {state.subscription.status}
                  </Badge>
                </div>
                <CardDescription>
                  Manage your TLAS.MY subscription and billing
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="text-3xl font-bold tracking-tight">{state.plan.name}</p>
                <p className="text-lg text-muted-foreground">{state.plan.monthlyPrice}</p>
              </div>
              {isOnTrial && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Trial Ends</p>
                  <p className="text-lg font-medium">
                    {formatDate(state.subscription.trialEndsAt)}
                  </p>
                  {daysUntilTrialExpires !== null && (
                    <p className={cn(
                      "text-sm",
                      daysUntilTrialExpires <= 3 ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"
                    )}>
                      {daysUntilTrialExpires} {daysUntilTrialExpires === 1 ? "day" : "days"} remaining
                    </p>
                  )}
                </div>
              )}
              
              {!isOnTrial && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Current Period Ends</p>
                  <p className="text-lg font-medium">
                    {formatDate(state.subscription.currentPeriodEndsAt)}
                  </p>
                  {daysUntilPeriodEnds !== null && (
                    <p className="text-sm text-muted-foreground">
                      {daysUntilPeriodEnds} {daysUntilPeriodEnds === 1 ? "day" : "days"} remaining
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {!isOnPro && (
                <form action={state.subscription.stripeSubscriptionId ? openBillingPortal : startSubscriptionCheckout}>
                  <input name="plan" type="hidden" value="PRO" />
                  <Button size="lg" type="submit">
                    <SparklesIcon className="mr-2 size-4" />
                    Upgrade to Pro
                  </Button>
                </form>
              )}
              <form action={openBillingPortal}>
                <Button size="lg" variant="outline" type="submit">
                  Manage Billing
                  <ExternalLinkIcon className="ml-2 size-4" />
                </Button>
              </form>
            </div>
            <p className="text-xs text-muted-foreground">
              Opens Stripe billing portal to manage payment methods, view invoices, or cancel subscription
            </p>
          </CardContent>
        </Card>

        {/* SECTION 2: Usage */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Resource Usage</CardTitle>
                <CardDescription>
                  Limits are enforced when creating new records
                </CardDescription>
              </div>
              {approachingLimit && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertCircleIcon className="size-3" />
                  Approaching Limit
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Warning Alert */}
            {approachingLimit && criticalResource && (
              <Alert>
                <InfoIcon className="size-4" />
                <AlertTitle>Resource limit warning</AlertTitle>
                <AlertDescription>
                  You're using {getUsagePercentage(criticalResource.value, criticalResource.limit)}% of your {criticalResource.label.toLowerCase()} limit. 
                  {!isOnPro && " Consider upgrading to Pro for higher limits."}
                </AlertDescription>
              </Alert>
            )}

            {/* Usage Bars */}
            <div className="grid gap-6 sm:grid-cols-2">
              {usageRows.map((row) => {
                const percentage = getUsagePercentage(row.value, row.limit);
                const status = getUsageStatus(percentage);
                return (
                  <div className="space-y-3" key={row.label}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{row.label}</span>
                      <span className={cn("tabular-nums", getUsageTextColor(percentage))}>
                        {row.value} / {row.limit} ({percentage}%)
                      </span>
                    </div>
                    <Progress
                      value={Math.min(percentage, 100)}
                      className={getProgressClasses(percentage)}
                    />
                    {percentage >= 90 && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        <AlertCircleIcon className="mr-1 inline size-3" />
                        Close to limit - upgrade recommended
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: Plan Cards */}
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Available Plans</h2>
            <p className="text-sm text-muted-foreground">
              {isOnPro ? "You're on the highest plan" : "Choose the plan that fits your needs"}
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            {(["STARTER", "PRO"] as const).map((plan) => {
              const definition = planDefinitions[plan];
              const isCurrentPlan = state.subscription.plan === plan;
              const hasStripeSubscription = Boolean(
                state.subscription.stripeSubscriptionId
              );
              const isUpgrade =
                state.subscription.plan !== "TRIAL" &&
                paidPlanRank[plan] > paidPlanRank[state.subscription.plan];
              
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
                  key={plan}
                  className={cn(
                    "relative",
                    isCurrentPlan && "border-primary border-2 shadow-md",
                    plan === "PRO" && !isCurrentPlan && "shadow-lg"
                  )}
                >
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-4">
                      <Badge className="bg-primary">
                        <CheckCircleIcon className="mr-1 size-3" />
                        Current Plan
                      </Badge>
                    </div>
                  )}
                  {plan === "PRO" && !isOnPro && (
                    <div className="absolute -top-3 right-4">
                      <Badge variant="secondary">
                        <SparklesIcon className="mr-1 size-3" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader>
                    <CardTitle className="text-2xl">{definition.name}</CardTitle>
                    <CardDescription className="text-lg font-semibold">
                      {definition.monthlyPrice}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span><strong>{definition.students}</strong> active students</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span><strong>{definition.teachers}</strong> teachers</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span><strong>{definition.classes}</strong> active classes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span><strong>{definition.invoicesPerMonth}</strong> invoices per month</span>
                      </li>
                    </ul>
                    
                    <form action={formAction}>
                      <input name="plan" type="hidden" value={plan} />
                      <Button
                        className="w-full"
                        disabled={isCurrentPlan}
                        size="lg"
                        type="submit"
                        variant={isUpgrade ? "default" : "outline"}
                      >
                        {isUpgrade && <ArrowUpIcon className="mr-2 size-4" />}
                        {buttonLabel}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
};

export default BillingPage;
