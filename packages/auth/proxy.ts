import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

type MiddlewareHandler = (
  auth: undefined,
  request: NextRequest,
  event: unknown
) => Response | Promise<Response | undefined> | undefined;

export const authMiddleware =
  (handler?: MiddlewareHandler) =>
  async (request: NextRequest, event: unknown) => {
    let response = NextResponse.next({ request });

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
              response.cookies.set(name, value, options);
            }
          },
        },
      }
    );

    await supabase.auth.getUser();

    const handlerResponse = await handler?.(undefined, request, event);

    return handlerResponse ?? response;
  };
