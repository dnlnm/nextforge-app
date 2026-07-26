import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import type { Metadata } from "next";
import { Header } from "../../components/header";
import { OrganizationOnboarding } from "./components/organization-onboarding";

export const metadata: Metadata = {
  title: "Create or select a centre - TLAS.MY",
};

const OrganizationOnboardingPage = () => (
  <>
    <Header page="Centre setup" pages={["TLAS.MY"]} />
    <main className="flex flex-1 items-center justify-center p-6 pt-0">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Create or select your tuition centre</CardTitle>
          <CardDescription>
            TLAS.MY uses a centre workspace to keep students, classes,
            attendance, and billing separated for each business.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrganizationOnboarding />
        </CardContent>
      </Card>
    </main>
  </>
);

export default OrganizationOnboardingPage;
