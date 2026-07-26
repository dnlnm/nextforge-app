"use client";

import { UserButton } from "@repo/auth/client";
import { ModeToggle } from "@repo/design-system/components/mode-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@repo/design-system/components/ui/sidebar";
import { Building2Icon, GaugeIcon, ShieldIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Brand } from "@/components/brand";

interface AdminSidebarProperties {
  readonly children: ReactNode;
}

const adminNavigation = [
  { title: "Overview", url: "/admin", icon: GaugeIcon },
  { title: "Centres", url: "/admin", icon: Building2Icon },
];

export const AdminSidebar = ({ children }: AdminSidebarProperties) => (
  <>
    <Sidebar variant="inset">
      <SidebarHeader>
        <Link className="px-2" href="/admin">
          <Brand />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Founder</SidebarGroupLabel>
          <SidebarMenu>
            {adminNavigation.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <ShieldIcon className="size-4 text-muted-foreground" />
            <UserButton showName />
            <ModeToggle />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
    <SidebarInset>{children}</SidebarInset>
  </>
);
