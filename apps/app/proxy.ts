import { isMainDomain, parseSubdomain } from "@repo/auth/domain";
import { authMiddleware } from "@repo/auth/proxy";
import {
  noseconeOptions,
  noseconeOptionsWithToolbar,
  securityMiddleware,
} from "@repo/security/proxy";
import { type NextProxy, type NextRequest, NextResponse } from "next/server";
import { env } from "./env";

const securityHeaders = env.FLAGS_SECRET
  ? securityMiddleware(noseconeOptionsWithToolbar)
  : securityMiddleware(noseconeOptions);

const mainDomainRoutes = [
  "/centres",
  "/workspaces",
  "/account",
  "/center-setup",
  "/sign-in",
  "/sign-up",
  "/invite",
  "/api",
  "/_next",
  "/favicon.ico",
  "/legal",
  "/onboarding",
];

const workspaceRoutes = [
  "/students",
  "/teachers",
  "/classes",
  "/subjects",
  "/academic-levels",
  "/attendance",
  "/invoices",
  "/payments",
  "/reports",
  "/today",
  "/settings",
  "/billing",
];

const isRouteMatch = (pathname: string, routes: string[]) =>
  routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

export default authMiddleware(
  async (_auth, request: NextRequest): Promise<Response | undefined> => {
    const url = request.nextUrl.clone();
    const hostname = request.headers.get("host") ?? "";
    const subdomain = parseSubdomain(hostname);

    // ============================================================
    // SUBDOMAIN ROUTING (brightmind.tlas.my)
    // ============================================================
    if (subdomain) {
      // Allow trusted subdomain paths through. Authenticated access is
      // enforced in the workspace layout via requireSubdomainTenant.
      return undefined;
    }

    // ============================================================
    // MAIN DOMAIN ROUTING (tlas.my)
    // ============================================================
    if (!isMainDomain(hostname)) {
      return undefined;
    }

    if (url.pathname === "/") {
      url.pathname = "/centres";
      return NextResponse.redirect(url);
    }

    // Block old workspace routes on the main domain; route users to /centres.
    if (isRouteMatch(url.pathname, workspaceRoutes)) {
      url.pathname = "/centres";
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (isRouteMatch(url.pathname, mainDomainRoutes)) {
      return undefined;
    }

    return undefined;
  }
) as unknown as NextProxy;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};