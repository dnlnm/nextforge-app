# Mobile-Readiness Plan (React Native)

## 1. Overview

This document is the implementation plan for adding a **React Native mobile app** to the KLIO.MY monorepo.

### Current status (10 August 2026)

| Phase | Status | Notes |
| --- | --- | --- |
| Phase 0 — Monorepo Foundations | **Complete** | React Native TypeScript config, Expo artefact ignores, bundle boundaries, and workspace-compatible Metro setup are in place. |
| Phase 1 — Shared Contracts | **Complete** | `@repo/schemas` is implemented and consumed by the refactored web/API domains. |
| Phase 2 — API Layer | **Implementation complete** | tRPC, bearer authentication, tenant/RBAC middleware, public Cloudflare Tunnel routing at `api.klio.my`, and automated tests are complete. The real-token curl acceptance check is deferred. |
| Phase 3 — Auth Package Split | **Complete** | `@repo/auth/shared` is React Native-safe and successfully bundles through Metro. |
| Phase 4 — Mobile Scaffold | **Implementation complete** | Auth, tRPC, organization switching, role-gated tabs, recovery deep links, and production exports are complete. Physical-device acceptance and the Supabase redirect allow-list check are deferred. |
| Phase 5 — Feature Build-out | **Deferred** | Deferred while the web application workflows and UX are improved and stabilized. |
| Phase 6 — CI/CD & Release | **Deferred** | Deferred with Phase 5; release automation should follow stable mobile features. |

**Resume condition for Phases 5–6:** the corresponding web workflows (Today, attendance,
classes, students, billing, and team management) should be functionally stable and sufficiently
polished before their mobile implementations are built and released.

The repository is a [next-forge](https://github.com/vercel/next-forge) v6 Turborepo running on **Bun workspaces**, with:

- **Auth:** Supabase (`@supabase/ssr`, cross-subdomain cookies)
- **Database:** Prisma + PostgreSQL (`@repo/database`, `server-only`)
- **Business logic:** ~20 Next.js **server-action** files under `apps/app/app/**/actions.ts`
- **Design system:** shadcn/ui + Tailwind CSS v4 (web DOM / Radix only)
- **Data fetching:** React Server Components + Server Actions (no react-query, no tRPC)

The critical constraint: **server actions are not a callable API for a mobile client.** Business
logic must be lifted into a transport-agnostic layer before a mobile app can exist.

### Locked decisions

| Decision | Choice |
| --- | --- |
| Backend transport | Dedicated API layer — tRPC hosted on `apps/api` |
| First release audience | Owners / Admins / Teachers (role-based navigation) |
| Mobile UI stack | Expo + expo-router + NativeWind |
| Scope of this document | Full phased implementation roadmap |

---

## 2. Goals

### Primary goals

- Give the mobile app a stable, typed, authenticated API surface.
- Eliminate logic duplication between web and mobile by sharing validation schemas and
  (eventually) the procedures themselves.
- Preserve the existing multi-tenant and RBAC guarantees on every mobile request.
- Keep `server-only` code (Prisma, secrets) out of the mobile bundle by construction.
- Ship a role-aware app covering the highest-value on-the-go workflows: today's sessions,
  attendance marking, class rosters, student lookup, and admin billing views.

### Secondary goals

- Make the extracted API reusable by future surfaces (public API, integrations, webhooks).
- Keep design tokens visually consistent between web and mobile.
- Establish CI/CD (EAS Build + EAS Update) without disturbing the existing Vercel pipelines.

---

## 3. Non-Goals for V1

- Parent/guardian mobile access. Guardians are not Supabase auth users today; this requires a
  new auth and invitation flow.
- Full offline-first sync with conflict resolution. V1 uses optimistic mutations with retry.
- Migrating **all** web server actions to tRPC. Only mobile-facing domains are extracted; the
  web keeps its server actions and converges opportunistically.
- A shared cross-platform component library. The web design system stays web-only; mobile gets
  its own primitives.
- Student bulk import, CMS, collaboration (Liveblocks), or AI features on mobile.
- Publishing to the App Store / Play Store as part of the initial phases (internal distribution
  via EAS first).

---

## 4. Target Architecture

```
apps/
  mobile/            NEW — Expo (SDK 54+) + expo-router + NativeWind
  api/               EXPANDED — hosts the tRPC handler at /trpc/[trpc]
  app/               UNCHANGED behaviour; actions import shared schemas
packages/
  schemas/           NEW — @repo/schemas: shared zod schemas + inferred types (pure TS)
  api/               NEW — @repo/api: tRPC routers, procedures, context, auth middleware
  auth/              SPLIT — add an RN-safe entry point for pure helpers/types
  typescript-config/ EXPANDED — react-native.json
```

### Request flow

```
Expo app
  → Supabase JS (session + access token, stored in expo-secure-store)
  → tRPC client (Authorization: Bearer <supabase access token>)
  → apps/api /trpc/[trpc]
      → @repo/api context: verify token → load membership → { user, orgId, role, db }
      → procedure → Prisma (@repo/database)
```

The web app can later call the same `@repo/api` procedures directly from server actions
(in-process caller, no HTTP), which is what ends the duplication permanently.

### Multi-tenancy on mobile

The web resolves the tenant from the **subdomain** (`brightmind.klio.my`) via
`apps/app/proxy.ts`. Mobile has no subdomain, so:

- The active organisation is read from the Supabase session
  (`user_metadata.activeOrganizationId`), same as `auth()` in `packages/auth/server.ts`.
- Every tRPC request resolves and re-validates membership server-side. The client never
  asserts its own role.
- An in-app organisation switcher updates `activeOrganizationId`.

---

## 5. Phase 0 — Monorepo Foundations

**Status:** Complete.

**Estimate:** 1–2 days. **Risk:** low. **Touches:** tooling only, no runtime behaviour.

1. **`packages/typescript-config/react-native.json`** — new config extending `base.json` but
   overriding:
   - `moduleResolution: "bundler"` and `module: "ESNext"` — Metro cannot use `NodeNext`
   - `jsx: "react-jsx"`, `lib: ["ESNext"]` (no `DOM`)
   - `declaration: false` (apps do not emit types)
2. **`.gitignore`** — add Expo/RN artefacts: `.expo/`, `.expo-shared/`, `ios/`, `android/`,
   `*.jks`, `*.keystore`, `*.mobileprovision`, `.eas/`.
3. **Bundle boundary rule** — `apps/mobile` must never import `@repo/database`,
   `@repo/auth/server`, or any `server-only` module. `@repo/api` is imported **type-only**
   (`import type { AppRouter }`), so no server code is reachable from the mobile graph.
4. **Metro + Bun workspaces** — `apps/mobile/metro.config.js` must set `watchFolders` to the
   monorepo root and add the root `node_modules` to `nodeModulesPaths` so hoisted dependencies
   resolve. Validate with `bun run dev --filter mobile` early in Phase 4.
5. **Turbo** — no new task types required initially. `apps/mobile` will expose `dev`, `lint`,
   and `typecheck`; it is intentionally excluded from the `build` graph because EAS builds run
   outside Turborepo.

**Exit criteria:** `bun run typecheck` and `bun run build` unchanged and green.

---

## 6. Phase 1 — Shared Contracts: `@repo/schemas`

**Status:** Complete.

**Estimate:** 2–4 days. **Risk:** low (behaviour-neutral refactor). **Highest leverage step.**

Today, zod input schemas are declared inline inside each `actions.ts` file, so mobile and web
would validate differently. This phase creates one source of truth.

1. **Create `packages/schemas`** — pure TypeScript, `zod` as the only runtime dependency. No
   `next`, no `react`, no `server-only`, no Prisma imports. This keeps it consumable from
   Node (API), the browser (web), and Metro (mobile).
2. **Structure** — one module per domain, plus shared primitives:

   ```
   packages/schemas/
     src/
       common.ts        cuid/id, pagination, date-range, sort helpers
       enums.ts         role, attendance status, invoice status (mirrors Prisma enums)
       attendance.ts
       classes.ts
       today.ts
       students.ts
       invoices.ts
       payments.ts
       members.ts
       organization.ts
     index.ts           re-exports
   ```

3. **Extraction order** (mobile-critical domains first):
   1. `attendance` — session lookup, mark attendance
   2. `today` / `classes` — schedules, sessions, rosters
   3. `students` — list, search, detail
   4. `invoices`, `payments` — admin read views + record payment
   5. `members`, `organization` — org context and roles
4. **Mirror Prisma enums as zod enums** in `enums.ts` rather than importing from
   `@repo/database` (which is `server-only`). Add a unit test asserting the zod enum members
   match the Prisma enum members so drift fails CI.
5. **Refactor web server actions** to import from `@repo/schemas` instead of declaring schemas
   inline. This must not change behaviour — same schemas, new location.
6. **Add `@repo/schemas` as a dependency** of `apps/app` (and later `packages/api`,
   `apps/mobile`).

**Exit criteria:** `bun run typecheck`, `bun run test`, and `bun run build` green; no schema
declared inline in the refactored `actions.ts` files.

---

## 7. Phase 2 — API Layer: `@repo/api` + tRPC on `apps/api`

**Status:** Implementation complete; real-token curl acceptance deferred.

**Estimate:** 1–2 weeks. **Risk:** medium.

1. **Create `packages/api`** with tRPC v11:
   - `trpc.ts` — `initTRPC.context<Context>()`, superjson transformer, zod error formatter.
   - `context.ts` — builds `{ user, orgId, role, db }` from the incoming request.
   - **Auth middleware** — read `Authorization: Bearer <token>`, call
     `supabase.auth.getUser(token)`, then load `OrganizationMembership` via Prisma. Reuse the
     rules already in `packages/auth/tenant.ts` and `packages/auth/authorization.ts`.
   - **Procedure builders** — `publicProcedure`, `protectedProcedure` (authenticated),
     `orgProcedure` (authenticated + org resolved), `roleProcedure(...roles)` for
     OWNER/ADMIN/TEACHER gating.
   - **Routers** mirroring the Phase 1 domains. Procedures initially port the same Prisma
     queries as the corresponding server actions, then converge.
   - Export `AppRouter` **type** for clients.
2. **`apps/api/app/trpc/[trpc]/route.ts`** — tRPC fetch adapter handler.
   - CORS allowing the mobile origin and Expo dev client.
   - Rate limiting via the existing `@repo/rate-limit` (Upstash).
   - Errors reported through `@repo/observability` (Sentry).
3. **Env** — add any new keys via a `keys.ts` in `packages/api` using `@t3-oss/env-nextjs`,
   composed into `apps/api/env.ts` following the existing per-package pattern.
4. **Tests** — vitest coverage for the auth middleware (missing token, expired token, wrong
   org, insufficient role) plus integration tests for the attendance and today routers.

**Security note:** this is the first network-exposed, mobile-callable surface in the repo.
Authentication, per-request org/role re-validation, and rate limiting are all in scope for this
phase, not deferred.

**Exit criteria:** every mobile-facing procedure callable with a real Supabase token via curl;
unauthorised and cross-tenant requests rejected with tests proving it.

---

## 8. Phase 3 — Auth Package Split

**Status:** Complete.

**Estimate:** 2–3 days. **Risk:** low.

`@repo/auth` currently depends on `next`, `next-themes`, and `server-only`, so it cannot be
imported from React Native at all.

1. **Add subpath entry points** to `@repo/auth`:
   - `@repo/auth/shared` — roles, tenant types, `domain.ts`, `slug-utils.ts` (pure TS, RN-safe)
   - `@repo/auth/server`, `@repo/auth/client`, `@repo/auth/proxy` remain web-only
2. **Mobile Supabase client** lives in `apps/mobile` (not in `@repo/auth`):
   `@supabase/supabase-js` with an `expo-secure-store` storage adapter,
   `autoRefreshToken: true`, `detectSessionInUrl: false`.
3. **Env** — `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` point at the
   **same Supabase project** as the web app, so users, memberships, and
   `activeOrganizationId` work with no migration.
4. **Deep links** — register a `klio://` scheme, add the redirect URL to the Supabase
   allow-list, and handle email confirmation / password reset callbacks.

**Exit criteria:** web auth untouched and regression-tested; `@repo/auth/shared` imports
cleanly in a Metro bundle.

---

## 9. Phase 4 — `apps/mobile` Scaffold

**Status:** Implementation complete; physical-device and Supabase redirect allow-list acceptance
deferred.

**Estimate:** ~1 week. **Risk:** medium (toolchain integration).

1. **Scaffold** an Expo app (SDK 54+, TypeScript) into `apps/mobile`; apply the monorepo Metro
   config and the Phase 0 `react-native.json` tsconfig.
2. **Stack:**
   - **expo-router** — file-based routing, closest mental model to the App Router
   - **HeroUI Native** + **Uniwind** (Tailwind CSS v4 for React Native) — semantic,
     accessible component library following the compound-component pattern
   - **@tanstack/react-query** + `@trpc/react-query`, base URL from `EXPO_PUBLIC_API_URL`
   - **expo-secure-store** for the session; token injected per request and refreshed on 401
3. **App shell:**
   - Auth: sign in, sign up, forgot password, email confirmation deep link
   - Organisation switcher driven by the user's memberships
   - **Role-gated tabs:**
     - **Teacher:** Today · Attendance · My Classes · Students (read-only)
     - **Admin / Owner:** the above plus Dashboard · Invoices · Payments · Members
4. **Theming** — HeroUI Native ships `heroui-native/styles` with a default light/dark
   theme, imported from `apps/mobile/global.css` via Uniwind. Semantic tokens (accent,
   surface, field, muted, danger, etc.) replace bespoke tokens; per-app overrides can live
   in the same `global.css` with Uniwind `@variant` blocks if the brand requires.
5. **EAS** — `eas.json` with development / preview / production profiles and an
   env-driven `app.config.ts`.

**Exit criteria:** sign in on a physical device, switch organisation, and load one
authenticated tRPC query end to end.

---

## 10. Phase 5 — Feature Build-out

**Status:** Deferred until the web application is improved, polished, and its workflows are
stable.

**Estimate:** 2–4 weeks, iterative. Ordered by on-the-go value.

1. **Today / session list** — the teacher landing screen.
2. **Attendance marking** — optimistic mutations with a retry queue; tolerant of flaky
   connectivity without full offline sync.
3. **Class schedules and rosters.**
4. **Student lookup and detail** — server-side search endpoint (the web's client-side
   `fuse.js` approach does not scale to mobile payloads).
5. **Admin views** — dashboard KPIs, invoice list, payment recording.
6. **Push notifications** — `expo-notifications` plus `@knocklabs/react-native`, extending
   `@repo/notifications`, for session reminders and payment alerts.
7. **Analytics and observability parity** — `posthog-react-native` and `@sentry/react-native`,
   configured alongside the existing `@repo/analytics` / `@repo/observability` setup.

---

## 11. Phase 6 — CI/CD & Release

**Status:** Deferred with Phase 5.

Runs in parallel with Phase 5.

1. **Turbo tasks** — `apps/mobile` exposes `lint`, `typecheck`, and `test`; excluded from
   `build` (or given an `expo export` smoke check) since EAS builds run externally.
2. **EAS pipeline** — preview build per pull request, EAS Update (OTA) on merge to `main`,
   store submission on tags. Existing Vercel deployments for `app` / `web` / `api` are
   unaffected apart from the new `/trpc` route.
3. **Documentation** — `apps/mobile/.env.example` listing every `EXPO_PUBLIC_*` key, and a
   README section on running the app against a local `apps/api`.

---

## 12. Risks & Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Bun + Expo/Metro hoisting quirks | Blocks Phase 4 | Standard Expo monorepo Metro config; pin the Expo SDK; smoke-test `expo start` first thing in Phase 4 |
| Logic drift between server actions and tRPC procedures | Silent behavioural divergence | Phase 1 shared schemas first; migrate web actions to call `@repo/api` procedures over time |
| `server-only` / Prisma leaking into the RN bundle | Build failure or secret exposure | Mobile never depends on `@repo/database`; `AppRouter` imported type-only; enforced by dependency review |
| Tailwind v4 (web) vs mobile styling | Visual drift | Mobile uses HeroUI Native + Uniwind (Tailwind v4 for RN); HeroUI defaults are used for now, brand tokens can be overridden in `apps/mobile/global.css` |
| Supabase cookie auth (web) vs bearer-token auth (mobile) | Auth regressions | Independent flows; no changes to `apps/app/proxy.ts` or cross-subdomain cookies |
| Serverless cold starts on `apps/api` | Poor perceived mobile latency | Keep procedures lean, reuse the existing keep-alive cron, add react-query caching and optimistic UI |
| New public network surface | Unauthorised or cross-tenant access | Auth + org/role middleware and rate limiting are Phase 2 deliverables with explicit negative tests |

---

## 13. Sequencing Summary

| Step | Phases | Status | Outcome |
| --- | --- | --- | --- |
| 1 | 0 + 1 | **Complete** | Tooling ready, `@repo/schemas` shared — benefits the web immediately, zero mobile code |
| 2 | 2 + 3 | **Implementation complete** | Authenticated tRPC API and RN-safe auth helpers; Phase 2 real-token acceptance deferred |
| 3 | 4 | **Implementation complete** | Expo scaffold and authenticated mobile architecture complete; physical-device acceptance deferred |
| 4 | 5 + 6 | **Deferred** | Resume after the web product and corresponding workflows are stable and polished |

Phases 0 and 1 are safe, behaviour-neutral, and independently valuable: they remove inline
schema duplication from the web app whether or not the mobile app ships.
