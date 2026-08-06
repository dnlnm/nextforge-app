import { ensureLocalUser } from "@repo/auth/organizations";
import { database } from "@repo/database";
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
import { BillingActions } from "./billing-actions-client";

interface CentreBillingPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ checkout?: string }>;
}

export const metadata: Metadata = {
  title: "Billing - TLAS.MY",
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
  const checkoutStatus =
    checkout === "success" || checkout === "cancelled" ? checkout : undefined;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        className="mb-6 inline-flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground"
        href="/centres"
      >
        <ArrowLeftIcon className="size-4" />
        Back to centres
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

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your centre&apos;s subscription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold text-2xl">{state.plan.name}</p>
              <p className="text-muted-foreground">
                {state.plan.monthlyPrice}/month
              </p>
            </div>
            <div>
              <p className="mb-1 text-muted-foreground text-sm">Status</p>
              <p className="font-medium">{state.subscription.status}</p>
            </div>
            <BillingActions
              alreadySubscribed={
                state.subscription.stripeSubscriptionId !== null
              }
              organizationId={organization.id}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
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
      </div>
    </div>
  );
};

export default CentreBillingPage;
