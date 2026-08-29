"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "@repo/design-system/components/ui/menu";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getMainDomain } from "./domain";

const browserClient = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  {
    auth: { flowType: "pkce" },
    cookieOptions: {
      domain: `.${getMainDomain()}`,
      path: "/",
      sameSite: "lax",
    },
  }
);

export const createClient = () => browserClient;

export const UserButton = ({ showName = false }: { showName?: boolean }) => {
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
    <Menu>
      <MenuTrigger
        render={
          <Button
            className="max-w-full justify-start truncate"
            variant="ghost"
          />
        }
      >
        {showName ? (email ?? "Account") : "Account"}
      </MenuTrigger>
      <MenuContent align="start">
        <MenuItem onClick={async () => signOut()}>
          Sign out
        </MenuItem>
      </MenuContent>
    </Menu>
  );
};
