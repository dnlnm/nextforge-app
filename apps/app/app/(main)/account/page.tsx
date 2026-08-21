import { ensureLocalUser } from "@repo/auth/organizations";
import { appName } from "@repo/config/brand";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { CardShell } from "@repo/design-system/components/ui/card-shell";
import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmailForm } from "./email-form";
import { PasswordForm } from "./password-form";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = {
  title: `Account - ${appName}`,
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
        Back to My Centre
      </Link>

      <div className="mb-8">
        <h1 className="font-semibold text-3xl tracking-tight">Account</h1>
        <p className="text-muted-foreground">
          Manage your {appName} account details
        </p>
      </div>

      <div className="space-y-6">
        <CardShell className="w-full">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your display name for {appName}</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              defaultName={
                [user.firstName, user.lastName].filter(Boolean).join(" ") || ""
              }
            />
          </CardContent>
        </CardShell>

        <CardShell className="w-full">
          <CardHeader>
            <CardTitle>Email</CardTitle>
            <CardDescription>
              The email address used to sign in to {appName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmailForm defaultEmail={user.email ?? ""} />
          </CardContent>
        </CardShell>

        <CardShell className="w-full">
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Change the password used to sign in to {appName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </CardShell>
      </div>
    </div>
  );
};

export default AccountPage;
