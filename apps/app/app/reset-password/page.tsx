import { currentUser } from "@repo/auth/server";
import { appName } from "@repo/config/brand";
import { createMetadata } from "@repo/seo/metadata";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "./reset-password-form";

const title = "Set a new password";
const description = `Choose a new password for your ${appName} account.`;

export const metadata: Metadata = createMetadata({ title, description });

const ResetPasswordPage = async () => {
  const user = await currentUser();

  if (!user) {
    redirect("/forgot-password");
  }

  return <ResetPasswordForm />;
};

export default ResetPasswordPage;
