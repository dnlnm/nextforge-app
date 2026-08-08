import { isSuperadminUserId } from "@repo/auth/authorization";
import { ensureLocalUser } from "@repo/auth/organizations";
import { currentUser } from "@repo/auth/server";
import { database } from "@repo/database";
import { secure } from "@repo/security";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { env } from "@/env";
import { NotificationsProvider } from "../(workspace)/components/notifications-provider";
import { MainNav } from "./components/main-nav";

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
      select: { organization: { select: { id: true } } },
    }),
  ]);

  return (
    <NotificationsProvider userId={user.id}>
      <div className="min-h-svh bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center px-4 sm:px-6">
            <MainNav
              counts={{ admin: adminCount, teacher: teacherCount }}
              ownedCentreId={ownedCentre?.organization.id ?? null}
              userId={user.id}
            />
          </div>
        </header>
        <main>{children}</main>
      </div>
    </NotificationsProvider>
  );
};

export default MainLayout;
