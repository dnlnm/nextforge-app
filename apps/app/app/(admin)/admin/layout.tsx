import { requirePlatformAdmin } from "@repo/auth/authorization";
import { SidebarProvider } from "@repo/design-system/components/ui/sidebar";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminSidebar } from "./components/admin-sidebar";

interface AdminLayoutProperties {
  readonly children: ReactNode;
}

const AdminLayout = async ({ children }: AdminLayoutProperties) => {
  const admin = await requirePlatformAdmin();

  if (!admin) {
    redirect("/admin/forbidden");
  }

  return (
    <SidebarProvider>
      <AdminSidebar>{children}</AdminSidebar>
    </SidebarProvider>
  );
};

export default AdminLayout;
