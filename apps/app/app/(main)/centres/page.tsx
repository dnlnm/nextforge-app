import { ensureLocalUser } from "@repo/auth/organizations";
import { appName } from "@repo/config/brand";
import { database } from "@repo/database";
import { differenceInMalaysiaCalendarDays } from "@repo/date";
import { Button } from "@repo/design-system/components/ui/fluid-button";
import { getBillingState } from "@repo/payments/subscription";
import { PlusCircleIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CentreAffiliations } from "./components/centre-affiliations";
import { CentreCapacityCard } from "./components/centre-capacity-card";
import { CentreEmptyState } from "./components/centre-empty-state";
import { CentreHero } from "./components/centre-hero";
import { CentreQuickActions } from "./components/centre-quick-actions";

export const metadata: Metadata = {
  title: `My Centre - ${appName}`,
  description: "Manage your tuition centre and access your workspaces",
};

const CentresPage = async () => {
  const user = await ensureLocalUser();

  if (!user) {
    redirect("/sign-in");
  }

  const [ownedMembership, rawAffiliations] = await Promise.all([
    database.organizationMembership.findFirst({
      where: {
        userId: user.id,
        role: "OWNER",
        status: "ACTIVE",
        organization: { status: "ACTIVE" },
      },
      select: {
        id: true,
        role: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
            createdAt: true,
            branch: {
              select: {
                name: true,
                phone: true,
                city: true,
                state: true,
              },
            },
            subscription: {
              select: {
                plan: true,
                status: true,
                trialEndsAt: true,
              },
            },
            _count: {
              select: {
                students: { where: { archivedAt: null } },
                teachers: { where: { archivedAt: null } },
                classes: { where: { archivedAt: null } },
              },
            },
          },
        },
      },
    }),
    database.organizationMembership.findMany({
      where: {
        userId: user.id,
        role: { in: ["ADMIN", "TEACHER"] },
        status: "ACTIVE",
        organization: { status: "ACTIVE" },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        role: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
            _count: {
              select: {
                students: { where: { archivedAt: null } },
                classes: { where: { archivedAt: null } },
              },
            },
          },
        },
      },
    }),
  ]);

  const affiliations = rawAffiliations.filter(
    (item): item is typeof item & { role: "ADMIN" | "TEACHER" } =>
      item.role === "ADMIN" || item.role === "TEACHER"
  );

  const billingState = ownedMembership
    ? await getBillingState(ownedMembership.organization.id)
    : null;

  const trialDaysLeft = billingState?.subscription.trialEndsAt
    ? Math.max(
        0,
        differenceInMalaysiaCalendarDays(
          billingState.subscription.trialEndsAt,
          new Date()
        )
      )
    : null;

  return (
    <div className="container mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-semibold text-3xl text-foreground tracking-tight">
            My Centre
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Command hub for your tuition centre workspace, subscription, and
            operations
          </p>
        </div>

        {ownedMembership ? null : (
          <Button asChild size="default">
            <Link href="/center-setup">
              <PlusCircleIcon className="size-4" />
              Create Centre
            </Link>
          </Button>
        )}
      </div>

      {/* Main content */}
      {ownedMembership ? (
        <div className="space-y-6">
          {/* Identity & Subdomain Hero */}
          <CentreHero organization={ownedMembership.organization} />

          {/* 2-Column Section: Capacity & Subscriptions + Quick Workflows */}
          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
            {billingState ? (
              <CentreCapacityCard
                organizationId={ownedMembership.organization.id}
                plan={billingState.plan}
                subscription={billingState.subscription}
                trialDaysLeft={trialDaysLeft}
                usage={billingState.usage}
              />
            ) : null}

            <CentreQuickActions slug={ownedMembership.organization.slug} />
          </div>

          {/* Secondary Affiliations (if any) */}
          <CentreAffiliations affiliations={affiliations} />
        </div>
      ) : (
        <CentreEmptyState />
      )}
    </div>
  );
};

export default CentresPage;
