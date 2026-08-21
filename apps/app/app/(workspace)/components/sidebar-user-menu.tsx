"use client";

import { createClient } from "@repo/auth/client";
import { getMainDomain } from "@repo/auth/domain";
import {
  Avatar,
  AvatarFallback,
} from "@repo/design-system/components/ui/avatar";
import { Button } from "@repo/design-system/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import { useSidebar } from "@repo/design-system/components/ui/sidebar";
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

const initials = (email: string) =>
  (email.split("@")[0]?.slice(0, 2) ?? "AC").toUpperCase();

export const SidebarUserMenu = () => {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { state, isMobile } = useSidebar();
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
    <DropdownMenu>
      <DropdownMenuTrigger
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
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56" sideOffset={8}>
        <DropdownMenuLabel className="font-normal">
          <span className="block font-medium text-sm">
            {email ?? "Account"}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={<a href={`https://${getMainDomain()}/account`} />}
        >
          <UserIcon />
          Account
        </DropdownMenuItem>
        <DropdownMenuItem render={<a href="/billing" />}>
          <CreditCardIcon />
          Subscription
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <MoonIcon />
            Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <SunIcon />
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <MoonIcon />
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              System
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOutIcon />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
