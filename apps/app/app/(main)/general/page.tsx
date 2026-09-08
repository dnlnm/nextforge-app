import { appName } from "@repo/config/brand";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { CardShell } from "@repo/design-system/components/ui/card-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `General - ${appName}`,
  description: "General settings",
};

const GeneralPage = () => (
  <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
    <div className="mb-8">
      <h1 className="font-semibold text-3xl tracking-tight">General</h1>
      <p className="text-muted-foreground">
        Organisation-level preferences for {appName}
      </p>
    </div>

    <CardShell className="w-full">
      <CardHeader>
        <CardTitle>Coming soon</CardTitle>
        <CardDescription>
          General settings live here (language, timezone, branding)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Placeholder page — settings form to follow.
        </p>
      </CardContent>
    </CardShell>
  </div>
);

export default GeneralPage;
