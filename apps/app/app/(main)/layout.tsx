import { isPlatformAdminUserId } from "@repo/auth/authorization";
import { currentUser } from "@repo/auth/server";
import { database } from "@repo/database";
import { secure } from "@repo/security";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { env } from "@/env";
import { NotificationsProvider } from "../(workspace)/components/notifications-provider";
import { MainNav } from "./components/main-nav";
import { UserMenu } from "./components/user-menu";

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

  if (isPlatformAdminUserId(user.id)) {
    redirect("/admin");
  }

  const [adminCount, teacherCount] = await Promise.all([
    database.organizationMembership.count({
      where: { userId: user.id, role: "ADMIN", status: "ACTIVE" },
    }),
    database.organizationMembership.count({
      where: { userId: user.id, role: "TEACHER", status: "ACTIVE" },
    }),
  ]);

  return (
    <NotificationsProvider userId={user.id}>
      <div className="min-h-svh bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center px-4 sm:px-6">
            <MainNav counts={{ admin: adminCount, teacher: teacherCount }} />
            <div className="ml-auto flex items-center gap-4">
              <UserMenu userId={user.id} />
            </div>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </NotificationsProvider>
  );
};

export default MainLayout;
