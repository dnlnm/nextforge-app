import { appRouter, createContext } from "@repo/api";
import { log } from "@repo/observability/log";
import { createRateLimiter, slidingWindow } from "@repo/rate-limit";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { NextResponse } from "next/server";

const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL;

const rateLimiterEnabled = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

const corsHeaders = (request: Request): Headers => {
  const headers = new Headers();
  const origin = request.headers.get("origin");

  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "authorization, content-type");
  headers.set("Vary", "Origin");

  if (origin && allowedOrigin && origin === allowedOrigin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
  }

  return headers;
};

const getClientIp = (request: Request): string => {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";

  return ip;
};

export const OPTIONS = (request: Request): Response =>
  new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request),
  });

const handler = (request: Request) => {
  const applyRateLimit: Promise<{ ok: boolean }> = rateLimiterEnabled
    ? createRateLimiter({ limiter: slidingWindow(10, "10 s"), prefix: "trpc" })
        .limit(getClientIp(request))
        .then(({ success }) => ({ ok: success }))
        .catch(() => ({ ok: true }))
    : Promise.resolve({ ok: true });

  return applyRateLimit.then(({ ok }) => {
    if (!ok) {
      return NextResponse.json(
        { message: "Too many requests" },
        { status: 429, headers: corsHeaders(request) }
      );
    }

    return fetchRequestHandler({
      endpoint: "/trpc",
      req: request,
      router: appRouter,
      createContext: () => createContext(request.headers),
      onError: ({ error }) => {
        if (process.env.NODE_ENV !== "test") {
          log.error(error.message);
        }
      },
    }).then((response) => {
      const headers = corsHeaders(request);
      response.headers.forEach((value, key) => {
        headers.set(key, value);
      });

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    });
  });
};

export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };
