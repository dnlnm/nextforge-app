"use client";

import { createClient } from "@repo/auth/client";
import {
  Avatar,
  AvatarFallback,
} from "@repo/design-system/components/ui/avatar";
import { Button } from "@repo/design-system/components/ui/button";
import {
  DropdownContent,
  DropdownLabel,
  DropdownMenu,
  DropdownSeparator,
  DropdownTrigger,
} from "@repo/design-system/components/ui/fluid-dropdown";
import { MenuItem } from "@repo/design-system/components/ui/fluid-menu-item";
import {
  ChevronsUpDown,
  CreditCardIcon,
  LogOutIcon,
  UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface MainFooterUserMenuProperties {
  readonly subscriptionHref: string;
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

export const MainFooterUserMenu = ({
  subscriptionHref,
  userName,
}: MainFooterUserMenuProperties) => {
  const router = useRouter();
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
          <AvatarFallback>{initials(userName ?? email ?? "U")}</AvatarFallback>
        </Avatar>
        <span className="flex-1 truncate text-left">
          {userName ?? email ?? "Account"}
        </span>
        <ChevronsUpDown className="ml-auto size-4 shrink-0" />
      </DropdownTrigger>
      <DropdownContent align="start" className="w-56" side="top" sideOffset={8}>
        <DropdownLabel className="font-normal normal-case">
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
        </DropdownLabel>
        <DropdownSeparator />
        <MenuItem
          icon={UserIcon}
          index={0}
          label="Profile"
          onSelect={() => router.push("/account")}
        />
        <MenuItem
          icon={CreditCardIcon}
          index={1}
          label="Subscription"
          onSelect={() => router.push(subscriptionHref)}
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
