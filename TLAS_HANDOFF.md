# TLAS.MY Handoff

## Project Context

- Product: TLAS.MY, a SaaS tuition management system for small Malaysian tuition centres.
- Users: centre owners/admins/teachers only, plus founder/superadmin.
- MVP scope: one operational branch per centre first, monthly-per-subject fee model.
- App UI: currently mostly English; eventual English and Bahasa Malaysia support desired.
- SaaS subscription billing: Stripe for TLAS subscriptions only.
- Tuition payments: recorded manually for MVP; no Stripe Connect.
- Founder/superadmin access: metadata by default; founder allowlist via `TLAS_PLATFORM_ADMIN_USER_IDS`.
- Clerk local dev webhook setup was deferred; safe local fallback sync is intentionally kept.

## Repo State

- Repo path: `/home/dnlnm/dev/nextfo/nextforge-app`
- Remote: `origin https://github.com/dnlnm/nextforge-app.git`
- Branch: `main`
- Last pushed commit: `c12b358 Build TLAS tuition management MVP`
- Worktree may contain unrelated pre-existing unstaged changes that must not be reverted:
  - `apps/web/app/[locale]/(home)/page.tsx`
  - `packages/design-system/styles/globals.css`
  - `packages/internationalization/dictionaries/en.json`
  - `packages/internationalization/dictionaries/ms.json`

## Completed Work

- Product planning/research completed for TLAS.MY MVP.
- Prisma schema replaced starter `Page` model with TLAS tenant/domain models and PostgreSQL foreign keys.
- Clerk auth webhook refactored to sync users, organizations, and memberships.
- Local dev fallback organization sync implemented for onboarding synchronization.
- Tenant auth helpers added.
- Founder `/admin` dashboard added.
- TLAS branding/sidebar/dashboard shell added.
- Operational modules implemented:
  - Students and primary guardians
  - Teachers
  - Subjects
  - Classes, weekly schedule, and fees
  - Enrolments
  - Attendance sessions and marking
  - Monthly invoices from active enrolments
  - Manual payment recording
  - Invoice/receipt printable detail pages
  - Dashboard and reports
  - CSV exports
  - Archive controls
- Phase A completed:
  - `/settings` centre settings form
  - Invoice payment instructions
  - `/students/[studentId]` edit
  - Student CSV import
  - `/classes/[classId]` edit
  - Enrolment custom fee update/end
  - Payment reversal from `/payments/[paymentId]`

## Validation Completed Before Last Commit

These commands passed before commit `c12b358`:

- `bun run check`
- `bun run typecheck` in `apps/app`
- `bun run typecheck` in `apps/api`
- `bun run typecheck` in `packages/auth`
- `bun run typecheck` in `packages/database`
- `bun run test` in `apps/app`
- `bun run test` in `apps/api`
- `SKIP_ENV_VALIDATION=true NEXT_PUBLIC_APP_URL=http://localhost:3000 NEXT_PUBLIC_WEB_URL=http://localhost:3001 NEXT_PUBLIC_DOCS_URL=http://localhost:3004 bun run build` in `apps/app`
- `SKIP_ENV_VALIDATION=true bun run build` in `apps/api`

## Phase B Teacher Workflow Work

Phase B teacher-focused daily workflow is implemented and pushed up to the initial `/today` workflow commit. Additional Phase B completion work has been implemented locally and should be committed/pushed next.

Already committed and pushed in `bd9621f Add teacher today workflow`:

- `apps/app/app/(authenticated)/today/actions.ts`
- `apps/app/app/(authenticated)/today/date.ts`
- `apps/app/app/(authenticated)/today/page.tsx`
- `apps/app/app/(authenticated)/components/sidebar.tsx`

Implemented locally after `bd9621f`, validated, and ready to commit/push:

- Teacher-scoped `/today` visibility by matching the logged-in user's email to an active teacher profile email.
- Admins/owners continue to see all classes and sessions.
- Teachers without a linked teacher profile see a guidance message and cannot create sessions.
- `createTodaySessions` only creates assigned class sessions for teacher users.
- Attendance marking now enforces the same teacher assignment scope for teacher users.
- Bulk session attendance action added for mark-all present, absent, late, or excused.
- `/today` revalidates after attendance changes.
- Empty state added when no sessions exist for today.

`today/actions.ts` adds:

- `createTodaySessions`

`today/date.ts` adds:

- `getMalaysiaDateParts`

`today/page.tsx` adds:

- `/today`
- “Create today’s sessions” action
- Fast attendance forms for today sessions
- Uses `markAttendance` from `apps/app/app/(authenticated)/attendance/actions.ts`

## Immediate Next Steps

1. Commit and push the validated Phase B completion work if desired.
2. Stage only intended files; do not include unrelated web/design/i18n changes unless explicitly requested.
3. Continue the next phase, likely pilot hardening and production readiness.

Validation commands that passed after the `/today` work:

```bash
bun run check
```

```bash
bun run typecheck
```

Passed in `apps/app`:

```bash
bun run test
```

Passed in `apps/app`:

```bash
SKIP_ENV_VALIDATION=true NEXT_PUBLIC_APP_URL=http://localhost:3000 NEXT_PUBLIC_WEB_URL=http://localhost:3001 NEXT_PUBLIC_DOCS_URL=http://localhost:3004 bun run build
```

## Sidebar Edit Completed

File:

- `apps/app/app/(authenticated)/components/sidebar.tsx`

`/today` has been added to the authenticated sidebar navigation.

Relevant imports now include:

```tsx
import {
  BarChart3Icon,
  BookOpenIcon,
  CalendarDaysIcon,
  ClipboardCheckIcon,
  CreditCardIcon,
  HomeIcon,
  ReceiptTextIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
```

Current result:

```tsx
import {
  BarChart3Icon,
  BookOpenIcon,
  CalendarCheckIcon,
  CalendarDaysIcon,
  ClipboardCheckIcon,
  CreditCardIcon,
  HomeIcon,
  ReceiptTextIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";

const navigation = [
  { title: "Dashboard", url: "/", icon: HomeIcon },
  { title: "Today", url: "/today", icon: CalendarCheckIcon },
  { title: "Students", url: "/students", icon: UsersIcon },
  { title: "Teachers", url: "/teachers", icon: UsersIcon },
  { title: "Subjects", url: "/subjects", icon: BookOpenIcon },
  { title: "Classes", url: "/classes", icon: CalendarDaysIcon },
  { title: "Attendance", url: "/attendance", icon: ClipboardCheckIcon },
  { title: "Invoices", url: "/invoices", icon: ReceiptTextIcon },
  { title: "Payments", url: "/payments", icon: CreditCardIcon },
  { title: "Reports", url: "/reports", icon: BarChart3Icon },
  { title: "Settings", url: "/settings", icon: SettingsIcon },
];
```

## Important Files

- `packages/database/prisma/schema.prisma`: TLAS domain schema and enums.
- `packages/auth/authorization.ts`: exports tenant/platform auth helpers.
- `packages/auth/tenant.ts`: `requireTenant`, `requireTenantRole`.
- `packages/auth/platform-admin.ts`: `TLAS_PLATFORM_ADMIN_USER_IDS` founder guard.
- `packages/auth/roles.ts`: role constants/helpers.
- `apps/api/app/webhooks/auth/route.ts`: Clerk webhook endpoint.
- `apps/api/app/webhooks/auth/handlers.ts`: Clerk event handlers.
- `apps/api/app/webhooks/auth/synchronize.ts`: Clerk sync logic.
- `apps/app/app/(authenticated)/onboarding/synchronizing/sync-active-organization.ts`: local fallback sync.
- `apps/app/app/(authenticated)/components/sidebar.tsx`: authenticated app navigation.
- `apps/app/app/(authenticated)/today/actions.ts`: new teacher-focused daily workflow actions.
- `apps/app/app/(authenticated)/today/page.tsx`: new teacher-focused Today page.
- `apps/app/app/(authenticated)/attendance/actions.ts`: `createClassSession`, `markAttendance`.
- `apps/app/app/(authenticated)/attendance/page.tsx`: attendance workflow.
- `apps/app/app/(authenticated)/students/actions.ts`: create/update/import/archive students.
- `apps/app/app/(authenticated)/students/page.tsx`: student list/create/import.
- `apps/app/app/(authenticated)/students/[studentId]/page.tsx`: student/guardian edit.
- `apps/app/app/(authenticated)/classes/actions.ts`: class/enrolment actions.
- `apps/app/app/(authenticated)/classes/page.tsx`: class list/create/enrol.
- `apps/app/app/(authenticated)/classes/[classId]/page.tsx`: class edit/enrolment management.
- `apps/app/app/(authenticated)/invoices/actions.ts`: monthly invoice generation.
- `apps/app/app/(authenticated)/payments/actions.ts`: payment recording/reversal.
- `apps/app/app/(authenticated)/settings/actions.ts`: centre settings update.
- `apps/app/app/(authenticated)/reports/exports/[kind]/route.ts`: CSV exports.

## Constraints For Next Session

- Do not revert unrelated unstaged changes.
- Use minimal edits where possible.
- Use `apply_patch` for manual edits.
- Before committing, inspect `git status`, `git diff`, and `git log --oneline -10`.
- Stage only intended TLAS teacher-workflow files.
- Do not amend commits unless explicitly asked.
