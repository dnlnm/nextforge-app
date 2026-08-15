import { ensureLocalUser } from "@repo/auth/organizations";
import { appName } from "@repo/config/brand";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from "@repo/design-system/components/ui/card";
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
        <CardFrame className="w-full">
          <CardFrameHeader>
            <CardFrameTitle>Profile</CardFrameTitle>
            <CardFrameDescription>
              Your display name for {appName}
            </CardFrameDescription>
          </CardFrameHeader>
          <Card>
            <CardPanel>
              <ProfileForm
                defaultName={
                  [user.firstName, user.lastName].filter(Boolean).join(" ") || ""
                }
              />
            </CardPanel>
          </Card>
        </CardFrame>

        <CardFrame className="w-full">
          <CardFrameHeader>
            <CardFrameTitle>Email</CardFrameTitle>
            <CardFrameDescription>
              The email address used to sign in to {appName}
            </CardFrameDescription>
          </CardFrameHeader>
          <Card>
            <CardPanel>
              <EmailForm defaultEmail={user.email ?? ""} />
            </CardPanel>
          </Card>
        </CardFrame>

        <CardFrame className="w-full">
          <CardFrameHeader>
            <CardFrameTitle>Password</CardFrameTitle>
            <CardFrameDescription>
              Change the password used to sign in to {appName}
            </CardFrameDescription>
          </CardFrameHeader>
          <Card>
            <CardPanel>
              <PasswordForm />
            </CardPanel>
          </Card>
        </CardFrame>
      </div>
    </div>
  );
};

export default AccountPage;
