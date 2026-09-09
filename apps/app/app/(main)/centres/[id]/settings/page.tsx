import { ensureLocalUser } from "@repo/auth/organizations";
import { appName } from "@repo/config/brand";
import { database } from "@repo/database";
import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CentreSettingsForm } from "./centre-settings-form";

interface CentreSettingsPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: `Centre Settings - ${appName}`,
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
          settings: {
            select: {
              addressLine1: true,
              addressLine2: true,
              city: true,
              email: true,
              phone: true,
              postcode: true,
              state: true,
            },
          },
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
        Back to My Centre
      </Link>

      <CentreSettingsForm organization={organization} />
    </div>
  );
};

export default CentreSettingsPage;
