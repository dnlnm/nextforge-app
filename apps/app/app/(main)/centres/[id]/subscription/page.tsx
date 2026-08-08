import { ensureLocalUser } from "@repo/auth/organizations";
import { appName } from "@repo/config/brand";
import { database } from "@repo/database";
import { InvoiceHistory } from "@repo/design-system/components/billingsdk/invoice-history";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Progress } from "@repo/design-system/components/ui/progress";
import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  getBillingState,
  getPlanUsageRows,
} from "../../../../(workspace)/billing/limits";
import { getPaymentMethod, getStripeInvoices } from "./actions";
import { SubscriptionManagementWrapper } from "./subscription-management-wrapper";
import { mapToCurrentPlan } from "./utils";

interface CentreBillingPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ checkout?: string }>;
}

export const metadata: Metadata = {
  title: `Subscription - ${appName}`,
};

const CentreBillingPage = async ({
  params,
  searchParams,
}: CentreBillingPageProps) => {
  const { id } = await params;
  const { checkout } = await searchParams;
  const user = await ensureLocalUser();

  if (!user) {
    redirect("/sign-in");
  }

  const membership = await database.organizationMembership.findFirst({
    where: {
      organizationId: id,
      userId: user.id,
      status: "ACTIVE",
      role: "OWNER",
    },
    select: {
      organization: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  if (!membership) {
    notFound();
  }

  const organization = membership.organization;
  const state = await getBillingState(organization.id);
  const usageRows = getPlanUsageRows(state.plan, state.usage);
  const invoices = await getStripeInvoices(organization.id);
  const paymentMethod = await getPaymentMethod(organization.id);
  const currentPlan = mapToCurrentPlan(state, paymentMethod);
  const isTrial = state.subscription.stripeSubscriptionId === null;
  const checkoutStatus =
    checkout === "success" || checkout === "cancelled" ? checkout : undefined;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        className="mb-6 inline-flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground"
        href="/centres"
      >
        <ArrowLeftIcon className="size-4" />
        Back to My Centre
      </Link>

      <div className="mb-8">
        <h1 className="font-semibold text-3xl tracking-tight">
          {organization.name}
        </h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing for this centre
        </p>
      </div>

      {checkoutStatus === "success" ? (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="py-4">
            <p className="font-medium text-green-900">Payment successful</p>
            <p className="text-green-700 text-sm">
              Your subscription has been updated successfully.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {checkoutStatus === "cancelled" ? (
        <Card className="mb-6 border-destructive/30 bg-destructive/5">
          <CardContent className="py-4">
            <p className="font-medium">Payment cancelled</p>
            <p className="text-muted-foreground text-sm">
              Your payment was cancelled. No charges were made.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <SubscriptionManagementWrapper
        currentPlan={currentPlan}
        isCancelled={state.subscription.cancelAtPeriodEnd}
        isTrial={isTrial}
        organizationId={organization.id}
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Plan Usage</CardTitle>
          <CardDescription>
            Your current usage against this plan&apos;s limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {usageRows.map((row) => {
            const percentage =
              row.limit > 0 ? Math.round((row.value / row.limit) * 100) : 0;

            return (
              <div key={row.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{row.label}</span>
                  <span className="text-muted-foreground">
                    {row.value} / {row.limit}
                  </span>
                </div>
                <Progress value={Math.min(percentage, 100)} />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="mt-6">
        {invoices.length > 0 ? (
          <InvoiceHistory
            description="View and download your past subscription invoices"
            invoices={invoices}
            title="Invoice History"
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Invoice History</CardTitle>
              <CardDescription>
                View and download your past subscription invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="py-8 text-center text-muted-foreground text-sm">
                No invoices yet. Subscribe to a plan to see your invoice
                history.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CentreBillingPage;
