import type { AppRouter } from "@repo/api";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

import { API_URL } from "@/constants/config";
import { supabase } from "@/lib/supabase";

let accessToken = "";

export const setAccessToken = (token: string | null) => {
  accessToken = token ?? "";
};

export const trpc = createTRPCReact<AppRouter>();

let refreshPromise: ReturnType<typeof supabase.auth.refreshSession> | null =
  null;

const fetchWithSessionRefresh: typeof fetch = async (input, init) => {
  const response = await fetch(input, init);

  if (response.status !== 401) {
    return response;
  }

  refreshPromise ??= supabase.auth.refreshSession();
  const { data, error } = await refreshPromise.finally(() => {
    refreshPromise = null;
  });

  if (error || !data.session) {
    return response;
  }

  setAccessToken(data.session.access_token);
  const headers = new Headers(init?.headers);
  headers.set("authorization", `Bearer ${data.session.access_token}`);

  return fetch(input, { ...init, headers });
};

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${API_URL}/trpc`,
      transformer: superjson,
      fetch: fetchWithSessionRefresh,
      headers() {
        return {
          ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
        };
      },
    }),
  ],
});
