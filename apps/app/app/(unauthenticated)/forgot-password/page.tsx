import { appName } from "@repo/config/brand";
import { createMetadata } from "@repo/seo/metadata";
import type { Metadata } from "next";
import { ForgotPasswordForm } from "./forgot-password-form";

const title = "Forgot password";
const description = `Reset your ${appName} account password.`;

export const metadata: Metadata = createMetadata({ title, description });

const ForgotPasswordPage = () => <ForgotPasswordForm />;

export default ForgotPasswordPage;
