import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { keys } from "./keys";

export const createClient = async () => {
  const cookieStore = await cookies();
  const environment = keys();

  return createServerClient(
    environment.NEXT_PUBLIC_SUPABASE_URL ?? "",
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components cannot write cookies; proxy refreshes sessions.
          }
        },
      },
    }
  );
};

export const currentUser = async (): Promise<User | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user;
};

export const auth = async () => {
  const user = await currentUser();

  return {
    userId: user?.id ?? null,
    orgId:
      (user?.user_metadata?.activeOrganizationId as string | undefined) ?? null,
  };
};

export const ensureOrganizationCreationLimit = async () => undefined;
