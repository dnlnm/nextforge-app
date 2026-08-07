import { requireSuperadmin } from "@repo/auth/authorization";
import { SidebarProvider } from "@repo/design-system/components/ui/sidebar";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminSidebar } from "./components/admin-sidebar";

interface AdminLayoutProperties {
  readonly children: ReactNode;
}

const AdminLayout = async ({ children }: AdminLayoutProperties) => {
  const admin = await requireSuperadmin();

  if (!admin) {
    redirect("/superadmin/forbidden");
  }

  return (
    <SidebarProvider>
      <AdminSidebar>{children}</AdminSidebar>
    </SidebarProvider>
  );
};

export default AdminLayout;
