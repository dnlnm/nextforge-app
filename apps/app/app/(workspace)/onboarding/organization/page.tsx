import { appName } from "@repo/config/brand";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: `Create your centre - ${appName}`,
};

const OrganizationOnboardingPage = () => redirect("/center-setup");

export default OrganizationOnboardingPage;
