"use client";

import { createClient } from "@repo/auth/client";
import { getMainDomain } from "@repo/auth/domain";
import {
  Avatar,
  AvatarFallback,
} from "@repo/design-system/components/ui/avatar";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
} from "@repo/design-system/components/ui/menu";
import { useSidebar as useClassicSidebar } from "@repo/design-system/components/ui/sidebar";
import { useSidebar as useFluidSidebar } from "@repo/design-system/components/ui/fluid-sidebar";
import { cn } from "@repo/design-system/lib/utils";
import {
  ChevronsUpDown,
  CreditCardIcon,
  LogOutIcon,
  MoonIcon,
  SunIcon,
  UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useOrganization } from "./organization-context";
import { fluidSidebarEnabled } from "./sidebar-variant";

const initials = (email: string) =>
  (email.split("@")[0]?.slice(0, 2) ?? "AC").toUpperCase();

const roleBadgeVariant = (
  role: "TEACHER" | "ADMIN" | "OWNER"
): "default" | "secondary" | "outline" => {
  switch (role) {
    case "OWNER":
      return "default";
    case "ADMIN":
      return "secondary";
    default:
      return "outline";
  }
};

export const SidebarUserMenu = () => {
  const router = useRouter();
  const { setTheme } = useTheme();
  const useSidebar = fluidSidebarEnabled ? useFluidSidebar : useClassicSidebar;
  const { state, isMobile } = useSidebar();
  const organization = useOrganization();
  const collapsed = state === "collapsed" || isMobile;
  const [email, setEmail] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null))
      .catch(() => undefined);
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            className={cn(
              "gap-2 px-2",
              collapsed ? "justify-center" : "w-full justify-start"
            )}
            variant="ghost"
          />
        }
      >
        <Avatar className="size-8">
          <AvatarFallback>{initials(email ?? "")}</AvatarFallback>
        </Avatar>
        {!collapsed && (
          <>
            <span className="flex-1 truncate text-left">
              {email ?? "Account"}
            </span>
            <ChevronsUpDown className="ml-auto size-4 shrink-0" />
          </>
        )}
      </MenuTrigger>
      <MenuContent align="start" className="w-56" sideOffset={8}>
        <MenuGroup>
          <MenuLabel className="normal-case font-normal">
            <span className="block font-medium text-sm">
              {email ?? "Account"}
            </span>
            {organization?.role && (
              <Badge className="mt-1" variant={roleBadgeVariant(organization.role)}>
                {organization.role}
              </Badge>
            )}
          </MenuLabel>
        </MenuGroup>
        <MenuSeparator />
        <MenuItem
          render={<a href={`https://${getMainDomain()}/account`} />}
        >
          <UserIcon />
          Account
        </MenuItem>
        <MenuItem render={<a href="/billing" />}>
          <CreditCardIcon />
          Subscription
        </MenuItem>
        <MenuSeparator />
        <MenuSub>
          <MenuSubTrigger>
            <MoonIcon />
            Theme
          </MenuSubTrigger>
          <MenuSubContent>
            <MenuItem onClick={() => setTheme("light")}>
              <SunIcon />
              Light
            </MenuItem>
            <MenuItem onClick={() => setTheme("dark")}>
              <MoonIcon />
              Dark
            </MenuItem>
            <MenuItem onClick={() => setTheme("system")}>
              System
            </MenuItem>
          </MenuSubContent>
        </MenuSub>
        <MenuSeparator />
        <MenuItem onClick={() => signOut()} variant="destructive">
          <LogOutIcon />
          Log out
        </MenuItem>
      </MenuContent>
    </Menu>
  );
};