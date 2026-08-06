import { buildWorkspaceUrl } from "@repo/auth/domain";
import { ensureLocalUser } from "@repo/auth/organizations";
import { database } from "@repo/database";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import {
  CreditCardIcon,
  ExternalLinkIcon,
  PlusCircleIcon,
  SettingsIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Your Centres - TLAS.MY",
  description: "Manage your tuition centres and workspaces",
};

const CentresPage = async () => {
  const user = await ensureLocalUser();

  if (!user) {
    redirect("/sign-in");
  }

  const memberships = await database.organizationMembership.findMany({
    where: {
      userId: user.id,
      role: "OWNER",
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
          subscription: {
            select: { plan: true, status: true },
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
  });

  const canCreateCentre = memberships.length === 0;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-3xl tracking-tight">
            Your Centres
          </h1>
          <p className="text-muted-foreground">
            Manage your tuition centres and access your workspaces
          </p>
        </div>
        {canCreateCentre && (
          <Button asChild size="lg">
            <Link href="/center-setup">
              <PlusCircleIcon className="mr-2 size-5" />
              Create Centre
            </Link>
          </Button>
        )}
      </div>

      {memberships.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-primary/10">
              <PlusCircleIcon className="size-10 text-primary" />
            </div>
            <h3 className="mb-2 font-semibold text-xl">No centres yet</h3>
            <p className="mb-6 max-w-md text-center text-muted-foreground">
              Create your first tuition centre to start managing students,
              classes, and attendance.
            </p>
            <Button asChild size="lg">
              <Link href="/center-setup">
                <PlusCircleIcon className="mr-2 size-5" />
                Create Your First Centre
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {memberships.map(({ organization, role }) => {
            const workspaceUrl = buildWorkspaceUrl(organization.slug);
            const roleVariant = "default";

            return (
              <Card
                className="flex flex-col overflow-hidden transition-shadow hover:shadow-lg"
                key={organization.id}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {organization.imageUrl ? (
                        <Image
                          alt={organization.name}
                          className="size-12 rounded object-cover"
                          height={48}
                          src={organization.imageUrl}
                          unoptimized
                          width={48}
                        />
                      ) : (
                        <div className="flex size-12 items-center justify-center rounded bg-primary font-semibold text-lg text-primary-foreground">
                          {organization.name[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <CardTitle className="truncate text-lg">
                          {organization.name}
                        </CardTitle>
                        <p className="truncate text-muted-foreground text-sm">
                          {organization.slug}.tlas.my
                        </p>
                      </div>
                    </div>
                    <Badge className="shrink-0" variant={roleVariant}>
                      {role}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="font-semibold text-2xl">
                        {organization._count.students}
                      </p>
                      <p className="text-muted-foreground text-xs">Students</p>
                    </div>
                    <div>
                      <p className="font-semibold text-2xl">
                        {organization._count.teachers}
                      </p>
                      <p className="text-muted-foreground text-xs">Teachers</p>
                    </div>
                    <div>
                      <p className="font-semibold text-2xl">
                        {organization._count.classes}
                      </p>
                      <p className="text-muted-foreground text-xs">Classes</p>
                    </div>
                  </div>

                  {role === "OWNER" && organization.subscription ? (
                    <div className="rounded-lg border bg-muted/50 p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Plan</span>
                        <Badge variant="secondary">
                          {organization.subscription.plan}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-medium">
                          {organization.subscription.status}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-auto space-y-2">
                    <Button asChild className="w-full" size="lg">
                      <a href={workspaceUrl}>
                        Open Workspace
                        <ExternalLinkIcon className="ml-2 size-4" />
                      </a>
                    </Button>

                    {role === "OWNER" ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/centres/${organization.id}/settings`}>
                            <SettingsIcon className="mr-2 size-4" />
                            Settings
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/centres/${organization.id}/billing`}>
                            <CreditCardIcon className="mr-2 size-4" />
                            Billing
                          </Link>
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!canCreateCentre && memberships.length > 0 ? (
        <Card className="mt-6 border-blue-200 bg-blue-50">
          <CardContent className="flex items-start gap-3 py-4">
            <div className="rounded-full bg-blue-100 p-2">
              <PlusCircleIcon className="size-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-blue-900">
                You&apos;ve reached the centre limit
              </p>
              <p className="text-blue-700 text-sm">
                Each account can create one tuition centre. You can still be
                invited as a teacher or admin to other centres.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default CentresPage;
