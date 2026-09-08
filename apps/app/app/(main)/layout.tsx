import { isSuperadminUserId } from "@repo/auth/authorization";
import { ensureLocalUser } from "@repo/auth/organizations";
import { currentUser } from "@repo/auth/server";
import { database } from "@repo/database";
import { SidebarProvider } from "@repo/design-system/components/ui/fluid-sidebar";
import { secure } from "@repo/security";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { env } from "@/env";
import { NotificationsProvider } from "../(workspace)/components/notifications-provider";
import { MainSidebar } from "./components/main-sidebar";

interface MainLayoutProperties {
  readonly children: ReactNode;
}

const MainLayout = async ({ children }: MainLayoutProperties) => {
  if (env.ARCJET_KEY) {
    await secure(["CATEGORY:PREVIEW"]);
  }

  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (isSuperadminUserId(user.id)) {
    redirect("/superadmin");
  }

  const localUser = await ensureLocalUser();

  if (!localUser) {
    redirect("/sign-in");
  }

  const userName =
    [localUser.firstName, localUser.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() || null;

  const [adminCount, teacherCount, ownedCentre] = await Promise.all([
    database.organizationMembership.count({
      where: { userId: localUser.id, role: "ADMIN", status: "ACTIVE" },
    }),
    database.organizationMembership.count({
      where: { userId: localUser.id, role: "TEACHER", status: "ACTIVE" },
    }),
    database.organizationMembership.findFirst({
      where: {
        userId: localUser.id,
        role: "OWNER",
        status: "ACTIVE",
        organization: { status: "ACTIVE" },
      },
      select: {
        organization: {
          select: {
            id: true,
            subscription: {
              select: {
                plan: true,
                status: true,
                trialEndsAt: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const trial =
    ownedCentre?.organization.subscription?.plan === "TRIAL"
      ? {
          organizationId: ownedCentre.organization.id,
          trialEndsAt:
            ownedCentre.organization.subscription?.trialEndsAt ?? null,
        }
      : null;

  return (
    <NotificationsProvider userId={user.id}>
      <div className="min-h-svh bg-background">
        <SidebarProvider className="bg-surface-1">
          <MainSidebar
            counts={{ admin: adminCount, teacher: teacherCount }}
            ownedCentreId={ownedCentre?.organization.id ?? null}
            trial={trial}
            userName={userName}
          >
            {children}
          </MainSidebar>
        </SidebarProvider>
      </div>
    </NotificationsProvider>
  );
};

export default MainLayout;
