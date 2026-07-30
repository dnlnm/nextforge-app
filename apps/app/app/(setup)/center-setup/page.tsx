import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import type { Metadata } from "next";
import { OrganizationOnboarding } from "../../(authenticated)/onboarding/organization/components/organization-onboarding";

export const metadata: Metadata = {
  title: "Create your centre - TLAS.MY",
};

const CenterSetupPage = () => (
  <section className="relative z-10 grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_28rem] lg:items-center">
    <div className="grid gap-5">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center border bg-primary font-semibold text-primary-foreground">
          T
        </div>
        <div>
          <p className="font-semibold text-primary">TLAS.MY</p>
          <p className="text-muted-foreground text-sm">
            Tuition administration
          </p>
        </div>
      </div>
      <div className="grid gap-3">
        <h1 className="max-w-2xl font-semibold text-4xl tracking-tight md:text-5xl">
          Set up your tuition centre workspace.
        </h1>
        <p className="max-w-xl text-base text-muted-foreground leading-7">
          Add your centre name and optional logo now. You can update branding,
          billing details, and contact information later in settings.
        </p>
      </div>
      <div className="grid gap-3 text-muted-foreground text-sm sm:grid-cols-3">
        {["Students", "Classes", "Attendance"].map((item) => (
          <div className="border bg-card/70 p-3" key={item}>
            {item} ready from day one
          </div>
        ))}
      </div>
    </div>

    <Card className="w-full shadow-2xl">
      <CardHeader>
        <CardTitle>Create your tuition centre</CardTitle>
        <CardDescription>
          Set up your centre workspace to manage students, classes, attendance,
          and billing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <OrganizationOnboarding />
      </CardContent>
    </Card>
  </section>
);

export default CenterSetupPage;
