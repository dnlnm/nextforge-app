import { isPlatformAdminUserId } from "@repo/auth/authorization";
import { currentUser } from "@repo/auth/server";
import { showBetaFeature } from "@repo/feature-flags";
import { secure } from "@repo/security";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { env } from "@/env";
import { NotificationsProvider } from "../(authenticated)/components/notifications-provider";

interface SetupLayoutProperties {
  readonly children: ReactNode;
}

const SetupLayout = async ({ children }: SetupLayoutProperties) => {
  if (env.ARCJET_KEY) {
    await secure(["CATEGORY:PREVIEW"]);
  }

  const user = await currentUser();
  const betaFeature = await showBetaFeature();

  if (!user) {
    redirect("/sign-in");
  }

  if (isPlatformAdminUserId(user.id)) {
    redirect("/admin");
  }

  return (
    <NotificationsProvider userId={user.id}>
      <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background p-6 text-foreground">
        <div className="absolute inset-x-0 top-0 h-px bg-border" />
        <div className="absolute -top-24 left-1/2 size-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        {betaFeature ? (
          <div className="absolute top-4 right-4 rounded-full bg-blue-500 px-3 py-1 text-sm text-white">
            Beta feature now available
          </div>
        ) : null}
        {children}
      </main>
    </NotificationsProvider>
  );
};

export default SetupLayout;
