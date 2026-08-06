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
import { redirect } from "next/navigation";
import { CenterSetupForm } from "./center-setup-form";

export const metadata: Metadata = {
  title: "Create Your Centre - TLAS.MY",
};

const CenterSetupPage = async () => {
  const user = await ensureLocalUser();

  if (!user) {
    redirect("/sign-in");
  }

  const ownedCentres = await database.organizationMembership.findMany({
    where: {
      userId: user.id,
      role: "OWNER",
      status: "ACTIVE",
      organization: { status: "ACTIVE" },
    },
    select: {
      organization: {
        select: { name: true },
      },
    },
  });

  const hasOwnedCentre = ownedCentres.length > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1fr_28rem] lg:items-start">
        <div className="grid gap-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center bg-primary font-semibold text-primary-foreground">
              T
            </div>
            <div>
              <p className="font-semibold text-primary">TLAS.MY</p>
              <p className="text-muted-foreground text-sm">
                Tuition administration
              </p>
            </div>
          </div>
          <div className="grid gap-3">
            <h1 className="font-semibold text-4xl tracking-tight md:text-5xl">
              Set up your tuition centre workspace.
            </h1>
            <p className="max-w-xl text-base text-muted-foreground leading-7">
              Add your centre name and choose a unique URL. You can update
              branding, billing details, and contact information later.
            </p>
          </div>
          <div className="grid gap-3 text-muted-foreground text-sm sm:grid-cols-3">
            {["Students", "Classes", "Attendance"].map((item) => (
              <div className="border bg-card/70 p-3" key={item}>
                {item} ready from day one
              </div>
            ))}
          </div>
        </div>

        {hasOwnedCentre ? (
          <Card className="w-full shadow-2xl">
            <CardHeader>
              <CardTitle>Centre Limit Reached</CardTitle>
              <CardDescription>
                You&apos;ve already created a tuition centre
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Each account can create one tuition centre. You currently own:
              </p>
              <p className="rounded-md bg-muted/50 p-3 font-medium">
                {ownedCentres[0]?.organization.name ?? "Your centre"}
              </p>
              <p className="text-muted-foreground text-sm">
                You can still be invited as a teacher or admin to other centres.
                Contact support if you need additional centres.
              </p>
              <Button asChild className="w-full">
                <Link href="/centres">
                  <ArrowLeftIcon className="mr-2 size-4" />
                  Back to Centres
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full shadow-2xl">
            <CardHeader>
              <CardTitle>Create your tuition centre</CardTitle>
              <CardDescription>
                Set up your centre workspace to manage students, classes,
                attendance, and billing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CenterSetupForm />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CenterSetupPage;
