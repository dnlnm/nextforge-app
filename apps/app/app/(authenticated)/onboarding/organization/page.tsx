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
  title: "Create your centre - TLAS.MY",
};

const OrganizationOnboardingPage = () => (
  <>
    <Header page="Centre setup" pages={["TLAS.MY"]} />
    <main className="flex flex-1 items-center justify-center p-6 pt-0">
        <Card className="w-full max-w-xl">
          <CardHeader>
          <CardTitle>Create your tuition centre</CardTitle>
          <CardDescription>
            Set up your centre workspace to manage students, classes,
            attendance, and billing.
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
