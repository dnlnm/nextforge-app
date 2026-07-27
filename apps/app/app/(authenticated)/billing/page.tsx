import { requireTenantRole } from "@repo/auth/authorization";
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
import { planDefinitions } from "@repo/payments/plans";
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

const BillingPage = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const state = await getBillingState(tenant.organizationId);
  const usageRows = getPlanUsageRows(state.plan, state.usage);

  return (
    <>
      <Header page="Billing" pages={["TLAS.MY"]} />
      <main className="grid gap-4 p-4 pt-0 xl:grid-cols-[1fr_420px]">
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>Current subscription</CardTitle>
                  <CardDescription>
                    Manage the TLAS.MY SaaS subscription for this centre.
                  </CardDescription>
                </div>
                <Badge>{state.subscription.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-muted-foreground text-sm">Plan</p>
                <p className="font-semibold text-2xl">{state.plan.name}</p>
                <p className="text-muted-foreground text-sm">
                  {state.plan.monthlyPrice}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Trial ends</p>
                <p className="font-medium">
                  {formatDate(state.subscription.trialEndsAt)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">
                  Current period ends
                </p>
                <p className="font-medium">
                  {formatDate(state.subscription.currentPeriodEndsAt)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Usage</CardTitle>
              <CardDescription>
                Resource limits are enforced when admins create new records.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {usageRows.map((row) => (
                <div className="grid gap-2" key={row.label}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span>{row.label}</span>
                    <span className="text-muted-foreground">
                      {row.value} / {row.limit}
                    </span>
                  </div>
                  <Progress
                    value={Math.min((row.value / row.limit) * 100, 100)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4">
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
              <Card key={plan}>
                <CardHeader>
                  <CardTitle>{definition.name}</CardTitle>
                  <CardDescription>{definition.monthlyPrice}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <ul className="grid gap-2 text-sm">
                    <li>{definition.students} active students</li>
                    <li>{definition.teachers} teachers</li>
                    <li>{definition.classes} active classes</li>
                    <li>{definition.invoicesPerMonth} invoices per month</li>
                  </ul>
                  <form action={formAction}>
                    <input name="plan" type="hidden" value={plan} />
                    <Button
                      className="w-full"
                      disabled={isCurrentPlan}
                      type="submit"
                    >
                      {buttonLabel}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            );
          })}
          <Card>
            <CardHeader>
              <CardTitle>Billing portal</CardTitle>
              <CardDescription>
                Update payment method, download Stripe invoices, or cancel.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={openBillingPortal}>
                <Button className="w-full" type="submit" variant="outline">
                  Open billing portal
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
};

export default BillingPage;
