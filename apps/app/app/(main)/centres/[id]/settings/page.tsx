import { ensureLocalUser } from "@repo/auth/organizations";
import { database } from "@repo/database";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CentreSettingsForm } from "./centre-settings-form";

interface CentreSettingsPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Centre Settings - TLAS.MY",
};

const CentreSettingsPage = async ({ params }: CentreSettingsPageProps) => {
  const { id } = await params;
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
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
        },
      },
    },
  });

  if (!membership) {
    notFound();
  }

  const { organization } = membership;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
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
          Manage your centre&apos;s profile and settings
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Centre Profile</CardTitle>
            <CardDescription>
              Update your centre name and logo. These appear across your
              workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CentreSettingsForm organization={organization} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Centre URL</CardTitle>
            <CardDescription>
              Your centre&apos;s unique subdomain. This affects all invitation
              links and bookmarks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <code className="flex-1 rounded bg-muted px-3 py-2 font-mono text-sm">
                {organization.slug}.tlas.my
              </code>
              <p className="text-muted-foreground text-sm">
                Contact support to change your centre URL.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions for this centre. Proceed with caution.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <h4 className="mb-1 font-medium">Archive Centre</h4>
              <p className="mb-3 text-muted-foreground text-sm">
                Once archived, your centre will be inaccessible to all users.
              </p>
              <Button disabled variant="destructive">
                Archive Centre
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CentreSettingsPage;
