import { isPlatformAdminUserId } from "@repo/auth/platform-admin";
import { currentUser } from "@repo/auth/server";
import { requireSubdomainTenant } from "@repo/auth/subdomain";
import { database } from "@repo/database";
import { SidebarProvider } from "@repo/design-system/components/ui/sidebar";
import { showBetaFeature } from "@repo/feature-flags";
import { secure } from "@repo/security";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { env } from "@/env";
import { NotificationsProvider } from "./components/notifications-provider";
import { OrganizationProvider } from "./components/organization-context";
import { GlobalSidebar } from "./components/sidebar";

interface WorkspaceLayoutProperties {
  readonly children: ReactNode;
}

const WorkspaceLayout = async ({ children }: WorkspaceLayoutProperties) => {
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

  const tenant = await requireSubdomainTenant();

  const organization = await database.organization.findFirst({
    where: { id: tenant.organizationId, status: "ACTIVE" },
    select: { imageUrl: true, name: true, slug: true },
  });

  if (!organization) {
    redirect("/");
  }

  return (
    <NotificationsProvider userId={user.id}>
      <OrganizationProvider
        organization={{ ...organization, role: tenant.role }}
      >
        <SidebarProvider>
          <GlobalSidebar role={tenant.role}>{children}</GlobalSidebar>
        </SidebarProvider>
      </OrganizationProvider>
    </NotificationsProvider>
  );
};

export default WorkspaceLayout;
