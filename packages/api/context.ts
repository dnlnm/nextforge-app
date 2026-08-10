import "server-only";

import { keys } from "@repo/auth/keys";
import { createClient } from "@supabase/supabase-js";
import type { ApiContext } from "./trpc";

export const createSupabaseClient = () => {
  const environment = keys();

  return createClient(
    environment.NEXT_PUBLIC_SUPABASE_URL ?? "",
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""
  );
};

export const createContext = (headers: Headers): ApiContext => ({
  headers,
});
