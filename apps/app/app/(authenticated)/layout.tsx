import { isPlatformAdminUserId } from "@repo/auth/authorization";
import { currentUser } from "@repo/auth/server";
import { database } from "@repo/database";
import { SidebarProvider } from "@repo/design-system/components/ui/sidebar";
import { showBetaFeature } from "@repo/feature-flags";
import { secure } from "@repo/security";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { env } from "@/env";
import { NotificationsProvider } from "./components/notifications-provider";
import { GlobalSidebar } from "./components/sidebar";

interface AppLayoutProperties {
  readonly children: ReactNode;
}

const AppLayout = async ({ children }: AppLayoutProperties) => {
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

  const activeOrganizationId = user.user_metadata?.activeOrganizationId as
    | string
    | undefined;
  const activeOrganization = activeOrganizationId
    ? await database.organization.findFirst({
        where: { id: activeOrganizationId, status: "ACTIVE" },
        select: { imageUrl: true, name: true },
      })
    : null;
  const fallbackMembership = await database.organizationMembership.findFirst({
    where: {
      organization: { status: "ACTIVE" },
      status: "ACTIVE",
      user: { authUserId: user.id, archivedAt: null },
    },
    orderBy: { createdAt: "asc" },
    select: { organization: { select: { imageUrl: true, name: true } } },
  });
  const organization =
    activeOrganization ?? fallbackMembership?.organization ?? null;

  return (
    <NotificationsProvider userId={user.id}>
      <SidebarProvider>
        <GlobalSidebar organization={organization}>
          {betaFeature && (
            <div className="m-4 rounded-full bg-blue-500 p-1.5 text-center text-sm text-white">
              Beta feature now available
            </div>
          )}
          {children}
        </GlobalSidebar>
      </SidebarProvider>
    </NotificationsProvider>
  );
};

export default AppLayout;
