import { auth } from "@repo/auth/server";
import { appName } from "@repo/config/brand";
import { database } from "@repo/database";
import { Button } from "@repo/design-system/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { CardShell } from "@repo/design-system/components/ui/card-shell";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "../../components/header";

const SynchronizingPage = async () => {
  const session = await auth();

  if (!session.userId) {
    redirect("/sign-in");
  }

  if (!session.orgId) {
    redirect("/center-setup");
  }

  const membership = await database.organizationMembership.findFirst({
    where: {
      status: "ACTIVE",
      organization: { id: session.orgId, status: "ACTIVE" },
      user: { authUserId: session.userId, archivedAt: null },
    },
    select: { id: true },
  });

  if (membership) {
    redirect("/");
  }

  return (
    <>
      <Header page="Synchronizing" pages={["Centre setup"]} />
      <main className="flex flex-1 items-center justify-center p-6 pt-0">
        <CardShell className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Preparing your centre workspace</CardTitle>
            <CardDescription>
              {appName} is preparing the local workspace records for this
              centre.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button render={<Link href="/onboarding/synchronizing" />}>
              Check again
            </Button>
            <Button render={<Link href="/center-setup" />} variant="outline">
              Back
            </Button>
          </CardContent>
        </CardShell>
      </main>
    </>
  );
};

export default SynchronizingPage;
