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
  DropdownContent,
  DropdownLabel,
  DropdownMenu,
  DropdownSeparator,
  DropdownTrigger,
} from "@repo/design-system/components/ui/fluid-dropdown";
import { MenuItem } from "@repo/design-system/components/ui/fluid-menu-item";
import { Tooltip } from "@repo/design-system/components/ui/fluid-tooltip";
import { useShapeContext } from "@repo/design-system/lib/shape-context";
import {
  ChevronsUpDown,
  CreditCardIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  RectangleHorizontalIcon,
  SquareIcon,
  SunIcon,
  UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useOrganization } from "./organization-context";

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

export const SidebarFooterUserMenu = () => {
  const router = useRouter();
  const organization = useOrganization();
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
      <DropdownTrigger
        render={
          <Button className="w-full justify-start gap-2 px-2" variant="ghost" />
        }
      >
        <Avatar className="size-8">
          <AvatarFallback>{initials(email ?? "")}</AvatarFallback>
        </Avatar>
        <span className="flex-1 truncate text-left">
          {email ?? "Account"}
        </span>
        <ChevronsUpDown className="ml-auto size-4 shrink-0" />
      </DropdownTrigger>
      <DropdownContent align="start" className="w-56" side="top" sideOffset={8}>
        <DropdownLabel className="normal-case font-normal">
          <span className="block font-medium text-sm">
            {email ?? "Account"}
          </span>
          {organization?.role && (
            <Badge className="mt-1" variant={roleBadgeVariant(organization.role)}>
              {organization.role}
            </Badge>
          )}
        </DropdownLabel>
        <DropdownSeparator />
        <MenuItem
          icon={UserIcon}
          index={0}
          label="Account"
          onSelect={() => {
            window.location.href = `https://${getMainDomain()}/account`;
          }}
        />
        <MenuItem
          icon={CreditCardIcon}
          index={1}
          label="Subscription"
          onSelect={() => router.push("/billing")}
        />
        <DropdownSeparator />
        <MenuItem
          icon={LogOutIcon}
          index={2}
          label="Log out"
          onSelect={() => signOut()}
        />
      </DropdownContent>
    </DropdownMenu>
  );
};

const THEME_CYCLE = ["light", "dark", "system"] as const;

/** Footer shape action: icon button toggling pill ↔ rounded. */
export const SidebarFooterShapeAction = () => {
  const { shape, setShape } = useShapeContext();
  const Icon = shape === "pill" ? RectangleHorizontalIcon : SquareIcon;

  return (
    <Tooltip content={`Shape: ${shape}`} side="top">
      <Button
        aria-label="Switch shape"
        onClick={() => setShape(shape === "pill" ? "rounded" : "pill")}
        size="icon"
        variant="ghost"
      >
        <Icon />
      </Button>
    </Tooltip>
  );
};

/** Footer theme action: icon button cycling light → dark → system. */
export const SidebarFooterThemeAction = () => {
  const { setTheme, theme } = useTheme();
  // next-themes resolves `theme` only after mount (undefined on the server
  // and first client render) — render the fallback until then so server and
  // client HTML agree and hydration doesn't mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const resolved = (
    mounted ? (theme ?? "system") : "system"
  ) as "light" | "dark" | "system";
  const Icon =
    resolved === "dark" ? MoonIcon : resolved === "light" ? SunIcon : MonitorIcon;

  return (
    <Tooltip content={`Theme: ${resolved}`} side="top">
      <Button
        aria-label="Switch theme"
        onClick={() =>
          setTheme(
            THEME_CYCLE[(THEME_CYCLE.indexOf(resolved) + 1) % THEME_CYCLE.length]
          )
        }
        size="icon"
        variant="ghost"
      >
        <Icon />
      </Button>
    </Tooltip>
  );
};
