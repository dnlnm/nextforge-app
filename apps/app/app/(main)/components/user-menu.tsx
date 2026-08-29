"use client";

import { createClient } from "@repo/auth/client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/design-system/components/ui/avatar";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
} from "@repo/design-system/components/ui/menu";
import { LogOutIcon, UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface UserMenuProperties {
  readonly userName: string | null;
}

const whitespace = /\s+/;

const initials = (value: string) => {
  const words = value.split(whitespace).filter(Boolean);

  if (words.length > 1) {
    return `${words[0]?.[0] ?? ""}${words.at(-1)?.[0] ?? ""}`.toUpperCase();
  }

  return (value.split("@")[0]?.slice(0, 2) ?? "AC").toUpperCase();
};

export const UserMenu = ({ userName }: UserMenuProperties) => {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);

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
            aria-label="Account menu"
            className="relative size-9 rounded-full"
            variant="ghost"
          />
        }
      >
        <Avatar className="size-9">
          <AvatarImage
            alt={userName ?? email ?? "Account"}
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
              userName ?? email ?? "U"
            )}&background=6366f1&color=fff`}
          />
          <AvatarFallback>{initials(userName ?? email ?? "U")}</AvatarFallback>
        </Avatar>
      </MenuTrigger>
      <MenuContent align="end" className="w-56">
        <MenuGroup>
          <MenuLabel className="normal-case font-normal">
            <div className="flex flex-col space-y-1">
              <p className="font-medium text-sm leading-none">
                {email ?? "Account"}
              </p>
              {userName ? (
                <p className="text-muted-foreground text-xs leading-none">
                  {userName}
                </p>
              ) : null}
            </div>
          </MenuLabel>
        </MenuGroup>
        <MenuSeparator />
        <MenuItem
          // biome-ignore lint/a11y/useAnchorContent: MenuItem injects its children into the anchor via the render prop
          render={<a className="cursor-pointer" href="/account" />}
        >
          <UserIcon />
          Account Settings
        </MenuItem>
        <MenuSeparator />
        <MenuItem
          className="cursor-pointer"
          variant="destructive"
          onClick={() => signOut()}
        >
          <LogOutIcon />
          Sign Out
        </MenuItem>
      </MenuContent>
    </Menu>
  );
};