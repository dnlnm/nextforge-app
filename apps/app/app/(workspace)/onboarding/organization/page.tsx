import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Create your centre - TLAS.MY",
};

const OrganizationOnboardingPage = () => redirect("/center-setup");

export default OrganizationOnboardingPage;
