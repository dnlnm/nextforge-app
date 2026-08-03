import { requireTenantRole } from "@repo/auth/authorization";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/design-system/components/ui/alert";
import { planDefinitions } from "@repo/payments/plans";
import { AlertCircleIcon } from "lucide-react";
import { Header } from "../components/header";
import BillingTabs from "./billing-tabs";
import { daysUntil } from "./billing-utils";
import { getBillingState, getPlanUsageRows } from "./limits";

interface BillingPageProperties {
  readonly searchParams: Promise<{ checkout?: string }>;
}

const comparisonPlans = ["TRIAL", "STARTER", "PRO"] as const;

const comparisonRows = [
  {
    feature: "Monthly price",
    values: comparisonPlans.map((plan) => planDefinitions[plan].monthlyPrice),
  },
  {
    feature: "Active students",
    values: comparisonPlans.map((plan) =>
      planDefinitions[plan].students.toLocaleString()
    ),
  },
  {
    feature: "Teachers",
    values: comparisonPlans.map((plan) =>
      planDefinitions[plan].teachers.toLocaleString()
    ),
  },
  {
    feature: "Active classes",
    values: comparisonPlans.map((plan) =>
      planDefinitions[plan].classes.toLocaleString()
    ),
  },
  {
    feature: "Invoices per month",
    values: comparisonPlans.map((plan) =>
      planDefinitions[plan].invoicesPerMonth.toLocaleString()
    ),
  },
];

const BillingPage = async ({ searchParams }: BillingPageProperties) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const { checkout } = await searchParams;
  const state = await getBillingState(tenant.organizationId);
  const usageRows = getPlanUsageRows(state.plan, state.usage);

  const checkoutStatus =
    checkout === "success" || checkout === "cancelled" ? checkout : undefined;

  const daysUntilTrialExpires = daysUntil(state.subscription.trialEndsAt);
  const daysUntilPeriodEnds = daysUntil(state.subscription.currentPeriodEndsAt);
  const isOnTrial = state.subscription.status === "TRIALING";
  const trialExpiringSoon =
    isOnTrial && daysUntilTrialExpires !== null && daysUntilTrialExpires <= 3;

  const approachingLimit = usageRows.some(
    (row) => (row.value / row.limit) * 100 >= 90
  );

  const criticalResource =
    usageRows.find((row) => (row.value / row.limit) * 100 >= 90) ?? null;

  return (
    <>
      <Header page="Billing" pages={["TLAS.MY"]} />
      <main className="grid gap-5 p-4 pt-4">
        {trialExpiringSoon && (
          <Alert variant="destructive">
            <AlertCircleIcon className="size-4" />
            <AlertTitle>Trial ending soon</AlertTitle>
            <AlertDescription>
              Your trial expires in {daysUntilTrialExpires}{" "}
              {daysUntilTrialExpires === 1 ? "day" : "days"}. Choose a plan
              below to continue using TLAS.MY without interruption.
            </AlertDescription>
          </Alert>
        )}

        <BillingTabs
          approachingLimit={approachingLimit}
          checkoutStatus={checkoutStatus}
          comparison={{
            columns: comparisonPlans.map((plan) => ({
              key: plan,
              name: planDefinitions[plan].name,
            })),
            rows: comparisonRows,
          }}
          criticalResource={criticalResource}
          daysUntilPeriodEnds={daysUntilPeriodEnds}
          daysUntilTrialExpires={daysUntilTrialExpires}
          plan={{
            monthlyPrice: state.plan.monthlyPrice,
            name: state.plan.name,
          }}
          planCards={(["STARTER", "PRO"] as const).map((plan) => {
            const definition = planDefinitions[plan];

            return {
              classes: definition.classes,
              invoicesPerMonth: definition.invoicesPerMonth,
              key: plan,
              monthlyPrice: definition.monthlyPrice,
              name: definition.name,
              students: definition.students,
              teachers: definition.teachers,
            };
          })}
          subscription={{
            currentPeriodEndsAt: state.subscription.currentPeriodEndsAt,
            plan: state.subscription.plan,
            status: state.subscription.status,
            stripeSubscriptionId: state.subscription.stripeSubscriptionId,
            trialEndsAt: state.subscription.trialEndsAt,
          }}
          usageRows={usageRows}
        />
      </main>
    </>
  );
};

export default BillingPage;
