import { ensureLocalUser } from "@repo/auth/organizations";
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

export const metadata: Metadata = {
  title: "Account - TLAS.MY",
};

const AccountPage = async () => {
  const user = await ensureLocalUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        className="mb-6 inline-flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground"
        href="/centres"
      >
        <ArrowLeftIcon className="size-4" />
        Back to centres
      </Link>

      <div className="mb-8">
        <h1 className="font-semibold text-3xl tracking-tight">Account</h1>
        <p className="text-muted-foreground">
          Manage your TLAS.MY account details
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account details for TLAS.MY</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm">Name</p>
            <p className="font-medium">
              {[user.firstName, user.lastName].filter(Boolean).join(" ") || "—"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm">Email</p>
            <p className="font-medium">{user.email ?? "—"}</p>
          </div>
          <p className="text-muted-foreground text-sm">
            Profile updates are managed through your auth provider.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountPage;
