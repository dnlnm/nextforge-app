import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";
import { useSession } from "@/lib/session-provider";
import { setAccessToken, trpc, trpcClient } from "@/lib/trpc";

const MINUTES_5 = 5 * 60 * 1000;

export function TRPCProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();

  useEffect(() => {
    setAccessToken(session?.access_token ?? null);
  }, [session?.access_token]);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: MINUTES_5,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
