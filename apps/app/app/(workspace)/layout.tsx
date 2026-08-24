import { currentUser } from "@repo/auth/server";
import { requireTenant } from "@repo/auth/tenant";
import { isSuperadminUserId } from "@repo/auth/superadmin";
import { database } from "@repo/database";
import { SidebarProvider } from "@repo/design-system/components/ui/sidebar";
import { showBetaFeature } from "@repo/feature-flags";
import { secure } from "@repo/security";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { env } from "@/env";
import { NotificationsProvider } from "./components/notifications-provider";
import { OrganizationProvider } from "./components/organization-context";
import { GlobalSidebar, type SidebarBadges } from "./components/sidebar";

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

  if (isSuperadminUserId(user.id)) {
    redirect("/superadmin");
  }

  // Resolve the tenant from the subdomain when present, otherwise fall back to
  // the session's active organization (e.g. when following a redirect to a
  // workspace route on the main domain after creating a student/class).
  const tenant = await requireTenant();

  const organization = await database.organization.findFirst({
    where: { id: tenant.organizationId, status: "ACTIVE" },
    select: { imageUrl: true, name: true, slug: true },
  });

  if (!organization) {
    redirect("/");
  }

  const [outstandingInvoices, pendingPayments] = await Promise.all([
    database.invoice.count({
      where: {
        organizationId: tenant.organizationId,
        status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] },
      },
    }),
    database.payment.count({
      where: {
        organizationId: tenant.organizationId,
        status: "RECORDED",
      },
    }),
  ]);

  const badges: SidebarBadges = {
    outstandingInvoices,
    pendingPayments,
  };

  return (
    <NotificationsProvider userId={user.id}>
      <OrganizationProvider
        organization={{ ...organization, role: tenant.role }}
      >
        <SidebarProvider>
          <GlobalSidebar badges={badges} role={tenant.role}>
            {children}
          </GlobalSidebar>
        </SidebarProvider>
      </OrganizationProvider>
    </NotificationsProvider>
  );
};

export default WorkspaceLayout;
