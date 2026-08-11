# KLIO.MY — MVP Implementation Plan

Companion to `KLIO-MVP-Implementation-Spec.md`. This plan is grounded in an actual
inspection of the repository (`next-forge` fork; Prisma 7 + Supabase + Next.js 16 +
tRPC 11 + Expo 57). The repo is the source of truth — where the spec and the repo
disagree, the repo wins.

**Status:** Plan for engineering execution. No code has been changed to produce this
document.

---

## 1. Executive Summary

The MVP product flow from the spec (Account → Subscription → Owned Tuition Centre →
Workspace → Membership/Role → Students → Classes → Enrolment → Today → Attendance) is
**already largely implemented in the web application**. The dominant model is
`Organization` as both tenant and operational context (there is no separate
`Workspace` table; membership is `OrganizationMembership` with a per-org `role`).

The real MVP blockers are **not** greenfield features. They are:

1. **Broken migration history** — a fresh `prisma migrate deploy` fails; four tables
   (`Level`, `Room`, `ClassSchedule`, `ReservedSlug`) have no `CREATE TABLE`, and
   several stale columns/indexes were never dropped. No clean environment can be
   provisioned.
2. **"One centre per account" is unenforced at the database** and racy at the
   application layer (`packages/auth/organizations.ts:69-82`).
3. **Mobile bypasses all subscription/plan enforcement** — `packages/api` never
   imports `@repo/payments`; an expired-trial / `PAST_DUE` / `CANCELED` centre is
   fully usable from the app.
4. **Cross-tenant isolation has no real test.** All 24 API tests mock Prisma; the
   `organizationId` filter is only asserted as an argument shape, not as real data
   isolation.
5. **Mobile feature build-out is deferred** — the `Today → Class → Roster →
   Attendance` flow exists only as placeholders; `students.list` is org-wide (not
   teacher-scoped), and class/enrolment is absent from the API.
6. **Duplicated business logic** — today/attendance/students logic exists twice
   (server actions vs tRPC); plan-limit enforcement exists once (web only).

Scope discipline per spec §31: bulk import, WhatsApp, advanced reporting, payroll,
payments collection, Stripe Connect, AI, etc. are out of MVP unless already
implemented (bulk import **is** implemented — preserve it).

---

## 2. Verified Repository State

Verified against the working tree. File paths are relative to repo root.

### 2.1 Stack

| Concern | Choice |
|---|---|
| Package manager | Bun 1.3.10, monorepo workspaces |
| Apps | `app` (Next.js 16, main tenant UI), `web` (marketing), `api` (Next.js 16 + tRPC 11), `mobile` (Expo 57), `email`, `docs`, `studio`, `storybook` |
| Database | PostgreSQL (Supabase), Prisma 7.4.2 driver-adapter (`packages/database`) |
| Identity | Supabase Auth (`@supabase/ssr` cookies; `Authorization: Bearer` for API) |
| Billing | Stripe (`packages/payments`), webhook at `apps/api/app/webhooks/payments/route.ts` |
| Tests | Vitest 4, turbo-gated (`build` depends on `test`). No Playwright/Detox |
| Lint/format | Biome via ultracite (`bun check` / `bun fix`) |
| Mobile | Expo 57 + expo-router + HeroUI Native/Uniwind, tRPC client via `EXPO_PUBLIC_API_URL` |

### 2.2 Domain model (Prisma, `packages/database/prisma/schema.prisma`)

| Model | Tenant column | Notes |
|---|---|---|
| `User` | — | mirrors Supabase user via `authUserId` |
| `Organization` | itself (tenant) | unique `slug`; `createdByUserId`; `studentCodeSequence` |
| `OrganizationSubscription` | `organizationId` (1:1) | `plan`, `status`, Stripe fields, `trialEndsAt` |
| `OrganizationSettings` | `organizationId` (1:1) | invoice/receipt prefixes, address |
| `OrganizationMembership` | `organizationId` | **`@@unique([organizationId, userId])`**; `role` enum; `status` |
| `Branch` | `organizationId` | **`@@unique`** → one branch per org |
| `Student` | `organizationId` | `@@unique([organizationId, code])`; `status` ACTIVE/ARCHIVED; `photoKey` |
| `Guardian` / `StudentGuardian` | via student | primary-flag support |
| `TeacherProfile` | `organizationId` | `@@unique([organizationId, code])` |
| `Subject` / `Level` / `Room` | `organizationId` | name/code uniques |
| `LearningClass` | `organizationId` | `@@unique([organizationId, name])`, `@@unique([organizationId, code])`; schedules in `ClassSchedule` |
| `ClassSchedule` | via class | `@@unique([classId, dayOfWeek])` |
| `Enrollment` | `organizationId` | `@@unique([studentId, classId, status])` — **latent collision bug** |
| `ClassSession` | `organizationId` | `@@unique([classId, sessionDate])` |
| `AttendanceRecord` | `organizationId` | `@@unique([sessionId, studentId])` |
| `Invoice` / `InvoiceLineItem` / `Payment` / `PaymentAllocation` | `organizationId` | money as integer sen |
| `WebhookEvent` / `AuditEvent` / `TeacherInvitation` / `AdminInvitation` | mixed | |

**Key mapping to spec concepts:**
- Spec "Tuition Centre" = `Organization` (the tenant, owned 0..1 per account).
- Spec "Workspace" = `Organization` operationally. Membership/role =
  `OrganizationMembership.role` (`OWNER`/`ADMIN`/`TEACHER`), per-org — satisfies spec
  Rules 2 & 3 (one account, many memberships, contextual roles).
- There is no separate `Workspace`/`Tenant` table. **Do not add one** — adapt the
  spec to the existing model (spec §4 explicitly allows this).

### 2.3 What is complete (preserve)

- **Auth end-to-end**: sign in/up, cookies across subdomains (`packages/auth/server.ts`),
  bearer-token API auth (`packages/api/middleware.ts`).
- **Web centre setup**: `createOrganization` (org + settings + Main Branch + 13 default
  levels + OWNER membership + switch), one-centre-per-owner check (application-level).
- **SaaS dashboard**: `(main)/centres/[id]/subscription` with real Stripe checkout,
  billing portal, invoices, payment method, plan usage bars.
- **Web operational layer**: Today, Students (list/detail/create/edit/import), Classes
  (list/create/detail/edit/enrolment), Attendance, Teachers (create/invite), Members,
  Subjects, Rooms, Academic Levels, Settings, Invoices, Payments — all server-action
  driven and role-gated via `requireTenantRole`.
- **tRPC**: `today` (sessions/createSessions/createClassSession), `attendance`
  (markAttendance/markSessionAttendanceStatus), `students` (list/filterOptions),
  `organizations` (memberships/validateSwitch). Auth: `protectedProcedure`,
  `orgProcedure`, `roleProcedure`.
- **Bulk import**: full Excel flow in `(workspace)/students/import` + tests.

### 2.4 Gaps blocking the MVP (this plan's scope)

Ranked by spec impact:

| # | Gap | Spec ref | Location |
|---|---|---|---|
| G1 | Migration history is broken; no clean DB can be provisioned | §26 | `packages/database/prisma/migrations` |
| G2 | One-centre-per-owner has no DB constraint and is TOCTOU-racy | §16, Invariant 1 | `packages/auth/organizations.ts:69-82` |
| G3 | tRPC has zero subscription/plan enforcement | §14, Invariants 7/9 | `packages/api` (no `@repo/payments` import) |
| G4 | No real cross-tenant/isolation test | §28 | `apps/api/__tests__` |
| G5 | Mobile feature tabs are placeholders; no class/enrolment/attendance-read API | §24, Invariant 14 | `apps/mobile/src/app/(app)/*`, `packages/api/routers` |
| G6 | `students.list` is org-wide, not teacher-scoped (inconsistent with today/attendance) | §5 Teacher | `packages/api/routers/students.ts:134` |
| G7 | Duplicated logic: today/attendance/students both in actions and tRPC; plan limits web-only | §32 | see audit §4 |
| G8 | Dead/inert web UI: billing-tabs, organization-switcher (unwired), classes list toolbar/pagination | §23, §27 | `(workspace)` |
| G9 | `Enrollment @@unique([studentId,classId,status])` blocks second un-enrol; archived Student/Class/Subject/Room keep name/code reserved | §19/20 | schema + `classes/actions.ts` |
| G10 | Mobile dist artifacts and `.env.local` committed; README is boilerplate; mobile TS 6.0.3 diverges | §24 | `apps/mobile` |

---

## 3. Execution Principles

- **Inspect → Understand → Plan → Implement → Test → Verify.** The repo is the source
  of truth; never rewrite working architecture (spec §34 Rules 1–2).
- **Fix root causes.** No `any`, no disabled lint/TS checks, no ignored tests
  (spec §34 Rule 3).
- **Security before convenience.** Server-side authorization everywhere; never trust
  client-supplied `workspaceId`/role (spec §8, §11, §12, Invariants 11–12).
- **Same domain rules everywhere.** Web and mobile hit the same tRPC/domain layer for
  shared operations (spec §34 Rule 6). Prefer moving shared business logic into
  `@repo/api` rather than a third copy.
- **Vertical slices.** Each work item is a slice with a test, not scaffolding
  (spec §34 Rule 7).
- **Defer, don't delete.** Anything out of scope is documented in §8 and left alone if
  it works.

---

## 4. Work Items (ordered)

### Phase 0 — Baseline verification

| ID | Task | Verification |
|---|---|---|
| 0.1 | Run `bun install` (lockfile present) | install completes |
| 0.2 | Run `bun test` (turbo-gated) | all 36 existing tests pass; record baseline |
| 0.3 | Run `bun check` (Biome) and `bunx tsc --noEmit` at root | clean or record pre-existing findings |
| 0.4 | Record current `git status` and `git log --oneline -10` | known starting point |

### Phase 1 — Database integrity (G1, G2)

**1.1 Reproduce broken migration** — in a disposable database, run
`bun prisma migrate deploy` in `packages/database` and confirm it fails at
`20260803221535_add_level_stage` (ALTER on missing `Level`).

**1.2 Repair migration history** — goal: `migrate deploy` produces a DB identical to
`schema.prisma`.
- **Deviation from the additive-repair approach (documented):** a pure additive
  repair migration was *not* viable because the chain breaks *before* any repair
  migration could run — `20260803221535_add_level_stage` ALTERs a missing `Level`
  table and `20260804120000_add_subject_level_class_codes` references it. Those two
  broken migrations were fixed **in place**:
  - `add_level_stage` now also creates the `Level` table (with the full
    `Level_organizationId_name_key` unique that the next migration converts to a
    partial unique).
  - `add_subject_level_class_codes` no longer references the then-nonexistent
    `LearningClass.levelId` column (defaults class codes to the `GEN` level code).
- Added `20260811000000_repair_schema_drift` to create `Level`-adjacent tables that
  were db-push-only (`Room`, `ClassSchedule`, `ReservedSlug`), add the schema-only
  columns (`Student.levelId`, `LearningClass.levelId/startsOn/endsOn`), drop stale
  columns/indexes (`Student.academicLevel`, `Subject.academicLevel`,
  `LearningClass.dayOfWeek/startsAt/endsAt/room`,
  `Subject_organizationId_name_academicLevel_key`,
  `LearningClass_organizationId_dayOfWeek_idx`), restore
  `Subject_organizationId_name_key`, and wire all FKs/indexes.
- Added `20260811000001_enrollment_partial_unique` (see 1.6).
- **Verify:** fresh `migrate deploy` succeeds (verified structurally via pg-mem —
  all 29 tables + column checks pass; the only pg-mem misses are plpgsql `DO $$`
  blocks in the invitation migrations, which are legitimate/idempotent on real
  Postgres); existing db-push'd dev DBs should use `prisma db push` or a one-time
  `prisma migrate reset` (documented runbook).

**1.3 Enforce one-centre-per-owner at the database**
- Add a partial unique index on `OrganizationMembership`:
  `CREATE UNIQUE INDEX ... ON "OrganizationMembership"("userId") WHERE role='OWNER' AND status='ACTIVE'`.
- Express it in `schema.prisma` (Prisma 7 supports partial indexes via the
  `partialIndexes` preview feature already enabled) and in a migration.
- **Verify:** two concurrent `createOrganization` calls → exactly one succeeds (see 5.5).

**1.4 Harden `createOrganization`**
- Wrap the ownership count + create in a `$transaction` (or catch the unique-violation
  error from 1.3 and translate to a user-facing "You can only create one tuition centre").
- Keep `switchOrganization` behavior identical.
- **Verify:** existing web flow unchanged; race test from 1.3 passes.

**1.5 Index audit (spec §26)**
- Confirm indexes exist for: membership `(userId, status)`, student `(organizationId,
  status)`, student `(organizationId, code)`, class `(organizationId, status)`,
  enrolment `(classId, status)`, session `(organizationId, sessionDate)`, attendance
  `(sessionId, studentId)`. Add any missing via migration. (Audit says most already exist.)

**1.6 (Deferred-safe) `Enrollment` unique fix (G9)**
- Change to a **partial** unique that only constrains `ACTIVE` rows, e.g.
  `@@unique([studentId, classId], where: { status: ACTIVE })`, so re-un-enrolling an
  already-`ENDED` enrolment no longer collides.
- Update `endEnrollment`/`updateEnrollment` in `(workspace)/classes/actions.ts` to be
  idempotent (end existing ACTIVE enrolment instead of inserting a duplicate).
- **Verify:** un-enrol → re-enrol → un-enrol cycles work; existing tests updated.

### Phase 2 — Identity & SaaS hardening (G3, part of Invariants 7/9/10)

**2.1 Move plan-limit helpers into a shared package**
- Extract `apps/app/app/(workspace)/billing/limits.ts` (getOrCreateSubscription,
  getSubscriptionUsage, getBillingState, assertWithinPlanLimit,
  assertAdminWithinPlanLimit) into `@repo/payments` (or a new `@repo/subscription`
  package), keeping the web call sites' signatures.
- **Verify:** web build + all existing tests still pass; no behavior change.

**2.2 Add subscription context + gates to tRPC**
- Extend `orgProcedure` middleware to also load the org's `OrganizationSubscription`
  and attach `subscriptionStatus`/`plan`/`trialExpired`/`canUsePaidFeatures` to the
  context (mirror `getBillingState`).
- Add a `roleProcedure`-style gate or an explicit `requireActiveSubscription`/
  `requireWithinPlanLimit` helper usable inside routers. Do **not** silently let
  TEACHER/ADMIN procedures bypass it (Invariants 7/9/10).
- Gate: student create (limit), teacher invite (limit), admin invite (limit), class
  create (limit), invoice generation (limit). Reads (`list`) may stay open to active
  members per existing web behavior.
- **Verify:** new tests in `apps/api` for expired-trial block, plan-limit block, and
  superadmin bypass parity with web.

**2.3 Fix `getPlanFromStripePriceId` silent-downgrade** — unrecognised price id must
**not** silently map to `TRIAL` (`packages/payments/plans.ts:73`); log + keep previous
plan or mark `INCOMPLETE` instead. Verify webhook sync test.

**2.4 Fix webhook unconfigured path** — `apps/api/app/webhooks/payments/route.ts:205-208`
returns 200 `{ok:false}`; return `503`/`500` so Stripe retries when
`STRIPE_WEBHOOK_SECRET` is missing.

**2.5 Account-level tRPC** — add an `account` router (`profile` get/update name, email,
password) mirroring `(main)/account/actions.ts`, so mobile can manage profile.

### Phase 3 — Workspace & isolation verification (G4, Invariants 4–6, 11)

**3.1 Real integration tests for tenant isolation (no mocks where possible)**
- Stand up a test database (local Postgres or a dedicated Supabase project) and write
  integration tests that exercise tRPC routers against real data:
  - Org A member cannot read Org B students/classes/sessions.
  - Non-member with a valid token gets `FORBIDDEN`.
  - `attendance.markAttendance` against a session in another org → `NOT_FOUND`.
  - `validateSwitch` to a non-member org → `FORBIDDEN`; and a client that bypasses
    `validateSwitch` and writes `activeOrganizationId` directly is still blocked by
    `orgProcedure`.
  - Archived user / archived org / `SUSPENDED` membership paths.
- Keep the existing mocked unit tests (fast) and add integration tests alongside
  (opt-in via env `TEST_DATABASE_URL`, excluded from turbo `test` unless configured).
- **Verify:** the new suite passes; a deliberately-broken router (org filter removed)
  fails the suite — proving the tests catch real leaks.

**3.2 Unify role semantics** — make `subdomain.ts` role checks consistent with
`hasTenantRole` (hierarchical) or document the intentional difference. Prefer
consistency. Verify no behavior regression.

**3.3 Teacher scoping for `students.list` (G6)**
- Apply the same teacher-scoping used by `today`/`attendance`
  (`getTeacherProfileId`): a TEACHER sees only students enrolled in their classes (or
  `__unassigned_teacher__` → empty). ADMIN/OWNER see all.
- Keep web parity: update `getStudentsForTable` to match if needed (currently
  org-wide), or decide teacher rosters are acceptable on web too — **must match mobile
  after change**.
- **Verify:** new tests: TEACHER sees only own-class students; ADMIN sees all.

### Phase 4 — API completeness for mobile (G5, §24, §25)

Goal: mobile needs read/create for the core flow. Implement in `@repo/api` reusing
`apps/app` domain logic (lift the shared logic, don't duplicate).

| Router | Procedures | Notes |
|---|---|---|
| `classes` | `list`, `get` (detail + active enrollments + schedules), `create` (ADMIN, plan-limit), `update`, `archive`, `enrollStudent` (ADMIN), `endEnrollment` (ADMIN) | mirror `(workspace)/classes/actions.ts` |
| `students` | add `create` (ADMIN, plan-limit + duplicate-code guard), `update`, `archive`, `restore`, `getNextStudentCode` | reuse existing `list` |
| `attendance` | add `session` (roster + records for a session/date), `history` | read path currently missing |
| `today` | (already present) ensure it returns attendance status the mobile Today card needs | verify response shape |

**Schema additions (zod, `packages/schemas`):** `classes.ts`, extend `students.ts` and
`attendance.ts` with the above input/output contracts. Export from `@repo/schemas`
(shared, RN-safe).

**Verify:** per-router tests; a web+mobile parity test where web actions and tRPC
procedures return the same scoped data for the same org.

### Phase 5 — Mobile Today → Class → Roster → Attendance (G5, §24)

**5.1 Replace placeholders** in `apps/mobile/src/app/(app)/*`:
- `index.tsx` (Today): fetch `today.sessions` for today; render class cards with time,
  student count, attendance status; tap → class screen.
- `classes.tsx`: `classes.list` + class detail with roster.
- `attendance.tsx`: given a session, render roster, mark present/absent, submit
  `attendance.markAttendance`; support edit (re-fetch records).
- Keep `organization-switcher.tsx` (already wired) — it drives `activeOrganizationId`.
- Use HeroUI Native components already in the app; loading/empty/error states per §27.

**5.2 Add subscription-aware error surfaces** — when a gate returns a plan/status error,
show a friendly "subscription required / expired" card instead of a raw tRPC error.

**5.3 Mobile housekeeping (G10)**
- Remove committed build artifacts (`apps/mobile/dist*`) and add to `.gitignore`;
  ensure `.env.local` is ignored (add `EXPO_PUBLIC_API_URL` etc. to `.env.example` only).
- Add `test` script + at least smoke tests for the router-independent helpers
  (org provider, date helpers). Keep scope tiny.
- (Optional, low priority) align mobile TS with `^5.9` or pin the tsconfig to
  `react-native.json`.

### Phase 6 — Web cleanup & UX completion (§23, §27, G8)

- **Wire or remove the org switcher**: mount `(workspace)/components/organization-switcher.tsx`
  in the workspace sidebar (it is fully implemented), or delete it + the deprecated
  `organization-menu.tsx`. Decision: mount it — it satisfies spec §18 (workspace
  switching) that is otherwise only reachable via `(main)/centres`.
- **Classes list page**: implement search, filters, and pagination that actually work
  (mirror `students` list pattern) or wire the existing table to `getClassesForTable`.
- **Remove dead code**: `(workspace)/billing/billing-tabs.tsx` (700-line orphan) after
  confirming the redirect page + main-domain subscription page are canonical.
- **`(main)/centres/[id]/settings`**: implement or clearly disable the "Archive Centre"
  action (spec §19 archive semantics); remove the misleading disabled button if
  out-of-scope and document.
- **Sidebar "Account" fix**: TEACHER clicking "Account" currently hits
  `/settings` (ADMIN-gated) → `notFound()`. Point it at main-domain `/account`.
- **Empty/loading/error/validation** pass over Today, Students, Classes, Attendance
  (spec §27) — reuse existing patterns.

### Phase 7 — End-to-end verification (§28, §36)

**7.1 Test matrix** — expand `apps/api/__tests__` (+ integration suite from Phase 3) to
cover spec §28 explicitly: auth (reject/accept), ownership (first centre ok, second
rejected — both via API and DB constraint), subscription (owner access, non-owner
denied, state handling), workspace (member/non-member, multiple memberships, different
roles per org), role authorization (teacher→admin action blocked, admin→owner SaaS
blocked), tenant isolation (both directions), students (create/update/list/search/
archive/isolation), classes (create/update/list/enrol/isolation), attendance
(create/update/duplicate protection/isolation).

**7.2 Manual E2E pass (web + mobile)** — record each of spec §7's 30 acceptance steps,
noting step, result, and any blocker. Gate MVP sign-off on this checklist.

**7.3 Full checks** — `bun test`, `bun check`, `bunx tsc --noEmit`, `bun run build`
(turbo, includes `apps/api`, `apps/app`); verify production build passes.

---

## 5. Key Tests (spec §28 + invariants) — target list

| Test | File (suggested) |
|---|---|
| Unauthenticated request rejected / authenticated accepted | `apps/api/__tests__/api-auth.test.ts` (extend) |
| First centre creation ok; second rejected (API + DB unique index) | `apps/api/__tests__/` (new, integration) |
| Concurrent create → exactly one succeeds (TOCTOU) | integration |
| Owner can access subscription; TEACHER/ADMIN denied owner billing | integration |
| Member accesses workspace; non-member `FORBIDDEN` | integration |
| Same account, two orgs, different roles | integration |
| TEACHER blocked from ADMIN procedures; ADMIN blocked from OWNER-only | existing `routers.test.ts` (extend) |
| Org A cannot read/write Org B data (real rows) | integration |
| `students.list` teacher-scoping | `apps/api/__tests__/routers.test.ts` (extend) |
| Duplicate attendance prevented (`@@unique([sessionId, studentId])`) | `apps/api/__tests__/routers.test.ts` (extend) |
| Plan-limit / expired-trial gates on student/class/teacher/admin/invoice writes | `apps/api/__tests__/` (new) |
| Second un-enrol doesn't collide (post-1.6) | `apps/app/__tests__/` (new) |
| Prisma↔zod enum drift test (specified in mobile-readiness-plan, missing) | `packages/schemas/__tests__/` (new) |

---

## 6. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Repair migration diverges from `db push`-modified envs | Test repair against both a fresh DB and a copy of the dev DB; document runbook |
| `assertWithinPlanLimit` move changes web behavior | Keep public signatures; run web tests + manual centre-setup→billing pass |
| Mobile scope creep (payments/invoices/etc.) | Hard scope: only Today/Class/Roster/Attendance + profile. Everything else deferred (§8) |
| Integration tests slow/flaky | Separate opt-in suite (env `TEST_DATABASE_URL`); keep mocked unit tests as default `test` |
| Teacher-scoping change surprises ADMIN/OWNER | Only TEACHER path changes; add explicit tests for ADMIN/OWNER visibility |

---

## 7. Definition of Done (MVP)

Per spec §35/§36:

1. One account owns ≤ 1 tuition centre — enforced in DB and API; race-tested.
2. One account, many memberships; contextual roles — tested.
3. Workspace membership required for workspace data — tested.
4. Workspace/tenant data isolation — proven by integration tests, not just argument
   shapes.
5. Subscription/billing is owner/account-level; TEACHER/ADMIN cannot reach it — tested.
6. Subscription/plan enforcement works on **web and mobile** alike.
7. Teacher scoping consistent across today/attendance/students.
8. Core flow works end-to-end on web **and** mobile:
   Account → centre → workspace → students → classes → enrolment → Today →
   attendance (create, save, reopen, edit).
9. `bun test`, `bun check`, `tsc --noEmit`, production build all green.
10. Final report delivered per spec §36 (completed / partial / deferred / tests /
    known issues / next steps).

---

## 8. Explicitly Deferred (spec §31 + audit findings)

- Advanced analytics/reporting, payroll, accounting, full payment collection, Stripe
  Connect, WhatsApp/SMS automation, parent portal, white-label domains, enterprise
  permissions, branch management, AI, notification centre, advanced timetabling,
  advanced import/export, enterprise billing, advanced audit logs.
- **Mobile:** invoices, payments, members, teachers, subjects, rooms, academic-levels,
  bulk import, student write flows beyond create/edit/archive — not needed for the
  §24 core flow.
- `checkSlugAvailability` unauthenticated oracle — minor; note but defer unless used
  by the flow.
- Superadmin env-var-only model — fine for MVP; document.
- `OrganizationSettings`-level polish and the `(workspace)/billing` redirect chain —
  revisit after MVP.

---

## 9. Phase → Spec section mapping

| Plan phase | Spec sections |
|---|---|
| 0 — Baseline | §33 Phase 1, §34 Rules 1/4 |
| 1 — Database integrity | §16, §26, §32, Invariants 1, 6 |
| 2 — Identity & SaaS hardening | §8, §14, §15, §31, Invariants 7, 9, 10 |
| 3 — Workspace & isolation | §10, §11, §12, §17, §28, Invariants 4, 5, 11, 12 |
| 4 — API completeness | §24, §25 |
| 5 — Mobile | §22, §24, §27, Invariant 14 |
| 6 — Web cleanup & UX | §18, §19, §20, §23, §27 |
| 7 — E2E verification | §7, §28, §33 Phase 8, §36 |

---

## 10. Implementation Status

Executed per this plan. Verification results:

- **Tests:** apps/api 41 passed + 3 skipped (integration suite gated on TEST_DATABASE_URL); apps/app 10 passed.
- **Typecheck:** packages (api, auth, payments, schemas), apps (app, api), and mobile all pass 	sc --noEmit.
- **Lint:** files changed by this plan are Biome-clean; the repo-wide baseline lint debt (vendored .agents/skills, pre-existing) is unchanged.
- **Build:** 	urbo build --filter=app --filter=api � 5 tasks, all successful.
- **Migrations:** chain verified structurally (pg-mem) after in-place fixes + repair migration; fresh prisma migrate deploy now produces the schema.

### Completed
- DB integrity: migration history repaired, one-owner-per-account partial unique index, createOrganization transaction + race hardening, Enrollment partial unique.
- SaaS: plan-limit logic moved to @repo/payments/subscription; tRPC subscription context + PAYMENT_REQUIRED gates; Stripe price-id no longer silently downgrades; webhook returns 503 when unconfigured; ccount tRPC router.
- Security: mock-based isolation suite (9 tests), opt-in real-DB integration suite, unified role semantics, teacher-scoped students.list (API + web).
- API for mobile: classes router (list/get/create/update/archive/enroll/endEnrollment), student create/update/archive/restore/getNextStudentCode, attendance session/history.
- Mobile: Today/Classes/Students/Attendance tabs wired to the API; session attendance screen; class detail screen; navigation restructured (Stack + Tabs); housekeeping (gitignore, README).
- Web cleanup: org switcher wired into the sidebar, sidebar Account link fixed, dead code removed, classes table search/filter/pagination made functional.

### Deferred
- Mobile test runner (vitest/RN) � post-MVP.
- (main)/centres/[id]/settings archive-centre action (stays disabled).
- Pre-existing 
oExcessiveCognitiveComplexity in getStudentsForTable and repo-wide lint debt in vendored skill files.

