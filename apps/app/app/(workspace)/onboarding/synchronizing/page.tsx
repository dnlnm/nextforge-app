import { auth } from "@repo/auth/server";
import { database } from "@repo/database";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
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
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Preparing your centre workspace</CardTitle>
            <CardDescription>
              TLAS.MY is preparing the local workspace records for this centre.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button asChild>
              <Link href="/onboarding/synchronizing">Check again</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/center-setup">Back</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </>
  );
};

export default SynchronizingPage;
