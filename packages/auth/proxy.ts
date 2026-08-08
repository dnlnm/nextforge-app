import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { getMainDomain } from "./domain";

type MiddlewareHandler = (
  auth: User | null,
  request: NextRequest,
  event: unknown
) => Response | Promise<Response | undefined> | undefined;

export const authMiddleware =
  (handler?: MiddlewareHandler) =>
  async (request: NextRequest, event: unknown) => {
    let response = NextResponse.next({ request });

    // Share auth cookies across all subdomains (e.g. brightmind.klio.my).
    const cookieDomain = `.${getMainDomain()}`;

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) => {
            for (const { name, value } of cookiesToSet) {
              request.cookies.set(name, value);
            }

            response = NextResponse.next({ request });

            for (const { name, value, options } of cookiesToSet) {
              response.cookies.set(name, value, {
                ...options,
                domain: cookieDomain,
                path: "/",
                sameSite: "lax",
              });
            }
          },
        },
        cookieOptions: {
          domain: cookieDomain,
          path: "/",
          sameSite: "lax",
        },
      }
    );

    const { data } = await supabase.auth.getUser();

    const handlerResponse = await handler?.(data.user, request, event);

    return handlerResponse ?? response;
  };
