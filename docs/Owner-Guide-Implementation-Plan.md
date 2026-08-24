# Owner's Guide — Implementation Plan

Companion plan for adding an **owner-facing usage guide** to the Fumadocs app at
`apps/docs/`. The guide is written for the tuition-centre owner, not a developer
audience. It walks through each screen in `apps/app` so the owner can run the
centre end to end. Where a screenshot is needed, the plan names a file path under
`apps/docs/public/images/guide/` and a **capture instruction** of exactly what to
show on screen; the image file itself is a placeholder for now and will be
replaced by the owner later.

The final guide lives in `apps/docs/content/docs/` and renders under `/docs/...`
via the existing Fumadocs source (`source.config.ts` → `content/docs`).

---

## 1. Scope

### In scope

- New author-facing guide content (MDX) under `apps/docs/content/docs/guide/`.
- A "Owner's Guide" root page and section landing pages.
- Screenshot placeholders that reference a known, predictable image path, with a
  documented capture instruction for each.
- Sidebar/navigation wiring in `content/docs/meta.json`.

### Out of scope

- Changing `apps/app` behaviour or copy text.
- Any dev-facing reference/API docs (that is a separate effort).
- Adding search, i18n, or auth to the docs app.
- Capturing real screenshots (the owner does this — see the capture list).

---

## 2. Audience & voice

- **Reader:** the owner-operator of a small Malaysian tuition centre running KLIO.MY.
- **Voice:** calm, direct, practical. Use `centre` (not `center`). MYR amounts
  shown as `RM`. Where a screen has a Malaysia-first behaviour (attendance,
  bill/term dates, `Asia/Kuala_Lumpur` "today"), call it out plainly.
- **Goal per page:** answer "what is this screen for, and what do I do here?" in
  a few short steps. One primary task per page; no developer jargon.

---

## 3. Information architecture

The guide mirrors the app's real sidebar sections (`Overview`, `Centre Setup`,
`Operations`, `Account`). Each leaf corresponds to a route in
`apps/app/app/(workspace)/`.

```
Guide (index.mdx)
├─ Get Started
│  ├─ Sign In (sign-in)
│  ├─ Working with Centres (centres)            — note: main-domain account layer
│  └─ Your Workspace & Roles (workspaces)       — OWNER / ADMIN / TEACHER
├─ Overview
│  ├─ Dashboard                                 — / (workspace)
│  ├─ Today                                     — /today
│  ├─ Enrollment                                — /enrollment
│  ├─ Academic Planner                          — /academics
│  └─ Schedules                                 — /schedules
├─ Centre Setup
│  ├─ Students                                  — /students
│  ├─ Teachers                                  — /teachers
│  ├─ Classes                                   — /classes
│  ├─ Rooms                                     — /rooms
│  ├─ Subjects                                  — /subjects
│  ├─ Academic Levels                           — /academic-levels
│  └─ Members                                   — /members
├─ Operations
│  ├─ Attendance                                — /attendance
│  ├─ Invoices                                  — /invoices
│  ├─ Payments                                  — /payments
│  └─ Reports                                   — /reports
└─ Account
   └─ Settings                                  — /settings
```

Each page above gets **one primary screenshot** (the "main view") plus, where a
screen has a meaningful secondary action (a dialog/detail sheet/empty state), one
or two **optional** extra screenshots.

---

## 4. Content source & routing

Work happens entirely under `apps/docs/content/docs/`. The existing
`meta.json` is at the source root; the guide adds a nested folder.

### 4.1 Folder layout

```
apps/docs/content/docs/
├─ meta.json                        # root: add the guide index here
└─ guide/
   ├─ meta.json                     # section grouping/assets
   ├─ index.mdx                     # "Guide" landing page
   ├─ getting-started/
   │  ├─ meta.json
   │  ├─ sign-in.mdx
   │  ├─ centres.mdx
   │  └─ roles.mdx
   ├─ overview/
   │  ├─ meta.json
   │  ├─ dashboard.mdx
   │  ├─ today.mdx
   │  ├─ enrollment.mdx
   │  ├─ academic-planner.mdx
   │  └─ schedules.mdx
   ├─ centre-setup/
   │  ├─ meta.json
   │  ├─ students.mdx
   │  ├─ teachers.mdx
   │  ├─ classes.mdx
   │  ├─ rooms.mdx
   │  ├─ subjects.mdx
   │  ├─ academic-levels.mdx
   │  └─ members.mdx
   ├─ operations/
   │  ├─ meta.json
   │  ├─ attendance.mdx
   │  ├─ invoices.mdx
   │  ├─ payments.mdx
   │  └─ reports.mdx
   └─ account/
      ├─ meta.json
      └─ settings.mdx
```

### 4.2 Root meta wiring

Update `apps/docs/content/docs/meta.json` to add the guide as a page group.
Because Fumadocs orders pages by the `pages` array, list the guide group; nested
section order lives in each folder's own `meta.json`.

`apps/docs/content/docs/meta.json`:

```json
{
  "title": "KLIO.MY Docs",
  "pages": ["index", "guide"]
}
```

Move current seed pages (`getting-started.mdx`, `guide.mdx`) out of the root into
their own folder, or repurpose them — see §5.

`apps/docs/content/docs/guide/meta.json`:

```json
{
  "title": "Owner's Guide",
  "pages": [
    "index",
    {
      "group": "Get Started",
      "pages": [
        "getting-started/sign-in",
        "getting-started/centres",
        "getting-started/roles"
      ]
    },
    {
      "group": "Overview",
      "pages": [
        "overview/dashboard",
        "overview/today",
        "overview/enrollment",
        "overview/academic-planner",
        "overview/schedules"
      ]
    },
    {
      "group": "Centre Setup",
      "pages": [
        "centre-setup/students",
        "centre-setup/teachers",
        "centre-setup/classes",
        "centre-setup/rooms",
        "centre-setup/subjects",
        "centre-setup/academic-levels",
        "centre-setup/members"
      ]
    },
    {
      "group": "Operations",
      "pages": [
        "operations/attendance",
        "operations/invoices",
        "operations/payments",
        "operations/reports"
      ]
    },
    {
      "group": "Account",
      "pages": ["account/settings"]
    }
  ]
}
```

### 4.3 Note on nested folders & docs source

Fumadocs (`defineDocs({ dir: "content/docs" })`) already globs nested folders and
`meta.json` files, so no change to `apps/docs/source.config.ts` or
`apps/docs/lib/source.ts` is required. The guide's `baseUrl` stays `/docs`.

---

## 5. Resolve the existing seed pages

The current scaffold has `content/docs/index.mdx`, `getting-started.mdx`,
`guide.mdx`. Decide:

- Keep `index.mdx` as the docs landing page (it already links into `/docs`).
- Rename the scaffold `guide.mdx` → `guide/index.mdx` (the new Guide landing)
  and delete the old `getting-started.mdx` (superseded by `guide/getting-started/*`),
  or move its content into `guide/getting-started/sign-in.mdx`.

Recommended: repurpose `content/docs/index.mdx` as the docs home, and delete the
two scaffold pages once the real guide pages exist.

---

## 6. Screenshot strategy

### 6.1 Where images live

All guide screenshots go in `apps/docs/public/images/guide/`. Reference them from
MDX with `![alt](/images/guide/<file>.png)`. Create the directory and a 1×1 or
placeholder PNG per filename so the build renders before the owner drops in real
images.

### 6.2 Filename convention

`<slug>-<variant>.png` where `<variant>` is one of:

- `main` — the default/primary view
- `dialog` — an open dialog or detail sheet
- `empty` — the empty state before data exists
- `results` — after an action (e.g. generated invoices, recorded payment)

Example: `centre-setup-students-main.png`, `operations-invoices-dialog.png`,
`centre-setup-students-empty.png`.

### 6.3 Placeholder approach (authoring time)

For now each `.mdx` page includes an image component that renders a placeholder,
clearly labelled with the intended capture so the author doesn't mistake it for a
real screenshot. Non-blocking, so the build stays green.

Example MDX snippet:

```mdx
## Students

Manage your student records here.

![Capture: Students main view — refer to capture list S-10](/images/guide/centre-setup-students-main.png)
```

When real screenshots land, only the image bytes change; the MDX is untouched.

---

## 7. Per-page content blueprint

Standard shape for every guide page:

```
## Overview           — 2-3 sentences: what this screen does, in owner terms
## What you'll see    — bullets for the main elements (cards, table, filters, buttons)
>> SCREENSHOT: <variant> <<
## Common tasks       — numbered steps for the one or two most common actions
### <Task A>
### <Task B>
## Notes             — Malaysia-specific behaviour, MYR, warnings, links
```

The tasks below are drawn from what the screens actually expose (from
`apps/app/app/(workspace)/…`). Details are intentionally brief; the guide author
expands each into numbered steps.

### Get Started

- **sign-in** — how to sign in (`sign-in`), the account layer on the main domain,
  and what happens after. Capture: the sign-in form (`main`).
- **centres** — `centres/page.tsx` lists owned centres on the main domain; explain
  selecting/creating a centre and how it maps to `<slug>.klio.my`. Capture: centre
  list (`main`).
- **roles** — `workspaces/{admin,teacher}/page.tsx` and the sidebar role gating:
  OWNER, ADMIN, TEACHER. Explain what each can see; note Admin sees everything
  except Members, Teacher sees only Today + Attendance. Capture: teacher
  workspace nav (`main`).

### Overview

- **dashboard** — `(workspace)/page.tsx`: the dashboard widgets (KPI row, today's
  classes, attendance, fee collection, needs attention, recent activity). Notes:
  greeting + Malaysia "today". Capture: populated dashboard (`main`).
- **today** — `today/page.tsx`: today's sessions + marking attendance from it.
  Capture: today's class roster (`main`).
- **enrollment** — `enrollment/page.tsx` + `enrollment-center.tsx`: enroll /
  bulk-enroll / transfer / end enrollment into classes. Capture: enrollment list
  (`main`) and the enrollment dialog (`dialog`).
- **academic-planner** — `academics/page.tsx` + `academic-planner.tsx`: the
  level → subject → class hierarchy planner. Capture: planner tree (`main`).
- **schedules** — `schedules/page.tsx` + `schedule-calendar.tsx`: weekly timetable.
  Capture: weekly calendar (`main`).

### Centre Setup

- **students** — `students/page.tsx`: table, filters, KPIs, add/import students,
  archive/delete; plus `students/new`, `students/[studentId]`, and
  `students/import`. Capture: list (`main`), empty state (`empty`), import wizard
  (`results`), student detail (`dialog`).
- **teachers** — `teachers/page.tsx`, `teachers/new`, `teachers/[teacherId]`,
  `teachers/invite`. Capture: teacher list (`main`).
- **classes** — `classes/page.tsx`, `classes/new`, `classes/[classId]`, plus
  analytics tab and enrollment actions. Capture: class list (`main`), create-class
  dialog (`dialog`), class detail with analytics (`results`).
- **rooms** — `rooms/page.tsx`, `rooms/[roomId]/edit`. Capture: rooms list (`main`).
- **subjects** — `subjects/page.tsx`, `subjects/[subjectId]`, edit. Capture: list
  (`main`).
- **academic-levels** — `academic-levels/page.tsx`, add/edit level dialog,
  `[levelId]`. Capture: levels list (`main`), add dialog (`dialog`).
- **members** — `members/page.tsx`, `pending-invitations.tsx`, `members/invite`.
  Owner-only. Capture: member list + invite (`main`, `dialog`).

### Operations

- **attendance** — `attendance/page.tsx` + `attendance-view.tsx` +
  `session-panel.tsx`: mark Present / Absent / Late / Excused by session, history,
  week view. Capture: session attendance panel (`main`) and status dropdown
  (`dialog`).
- **invoices** — `invoices/page.tsx`, `invoices/generate-invoices-dialog.tsx`,
  `invoices/[invoiceId]`, invoice detail sheet, status badges (ISSUED /
  PARTIALLY_PAID / OVERDUE). Notes: MYR, monthly billing month. Capture: invoice
  list (`main`), generate dialog (`dialog`), invoice detail (`results`).
- **payments** — `payments/page.tsx`, `payments/new/record-payment-page.tsx`,
  `payments/[paymentId]`, detail sheet. Notes: cash / bank transfer / DuitNow /
  FPX / card / other. Capture: payments list (`main`), record payment form
  (`dialog`), recorded payment (`results`).
- **reports** — `reports/page.tsx`: operational exports (CSV) and charts. Capture:
  reports page (`main`).

### Account

- **settings** — `settings/page.tsx`: centre settings (name, logo, currency,
  branding), plus `centres/[id]/settings` and `centres/[id]/subscription`. Notes:
  Stripe billing on `centres/[id]/subscription`. Capture: settings page (`main`).

---

## 8. Screenshot capture list

The owner captures these. Each entry = filename → what to show on screen. All go to
`apps/docs/public/images/guide/`. Where the app has meaningful demo/empty states,
note which variant to prefer.

| # | File | Page / route | What to capture |
|---|------|--------------|-----------------|
| S-01 | `getting-started-sign-in-main.png` | `/sign-in` | The full sign-in card/form, centred. |
| S-02 | `getting-started-centres-main.png` | `/centres` | List of owned centres. One to two cards. |
| S-03 | `getting-started-roles-main.png` | Teacher workspace | Sidebar collapsed to Today + Attendance (teacher role). |
| S-04 | `overview-dashboard-main.png` | `/` (workspace) | Full dashboard with dashboard widgets + today's classes, populated with a few rows. |
| S-05 | `overview-today-main.png` | `/today` | Today's session roster with attendance controls visible. |
| S-06 | `overview-enrollment-main.png` | `/enrollment` | Enrollment list, filter/sidebar visible. |
| S-07 | `overview-enrollment-dialog.png` | `/enrollment` | The enroll/transfer dialog open over the list. |
| S-08 | `overview-academic-planner-main.png` | `/academics` | Level → subject → class hierarchy tree. |
| S-09 | `overview-schedules-main.png` | `/schedules` | Weekly timetable grid. |
| S-10 | `centre-setup-students-main.png` | `/students` | Students table with filter bar + KPI chips; a few student rows. Remove personal data or use sample rows. |
| S-11 | `centre-setup-students-empty.png` | `/students` | Empty state (no students yet) with "Add student" / "Import" buttons. |
| S-12 | `centre-setup-students-dialog.png` | `/students/[id]` | Student detail view, or the add-student form (`/students/new`) open. |
| S-13 | `centre-setup-students-results.png` | `/students/import` | Import wizard mid/after import showing validation results. |
| S-14 | `centre-setup-teachers-main.png` | `/teachers` | Teacher list; note invite flow. |
| S-15 | `centre-setup-classes-main.png` | `/classes` | Class list with schedule summary. |
| S-16 | `centre-setup-classes-dialog.png` | `/classes/new` | Create-class form open. |
| S-17 | `centre-setup-classes-results.png` | `/classes/[id]` | Class detail with analytics tab + enrollment actions. |
| S-18 | `centre-setup-rooms-main.png` | `/rooms` | Rooms/capacity tiles. |
| S-19 | `centre-setup-subjects-main.png` | `/subjects` | Subject list. |
| S-20 | `centre-setup-academic-levels-main.png` | `/academic-levels` | Levels list. |
| S-21 | `centre-setup-academic-levels-dialog.png` | `/academic-levels` | Add/edit level dialog open. |
| S-22 | `centre-setup-members-main.png` | `/members` | Members + pending invitations (Owner only). |
| S-23 | `centre-setup-members-dialog.png` | `/members/invite` | Invite-member dialog. |
| S-24 | `operations-attendance-main.png` | `/attendance` | Session attendance panel with Present/Absent/Late/Excused controls. |
| S-25 | `operations-attendance-dialog.png` | `/attendance` | The status picker / session detail open. |
| S-26 | `operations-invoices-main.png` | `/invoices` | Invoice list with status badges (ISSUED, PARTIALLY_PAID, OVERDUE) and totals. |
| S-27 | `operations-invoices-dialog.png` | `/invoices` | "Generate invoices" dialog open (billing month). |
| S-28 | `operations-invoices-results.png` | `/invoices/[id]` | A single invoice detail sheet/routes. |
| S-29 | `operations-payments-main.png` | `/payments` | Payments list with method + outstanding. |
| S-30 | `operations-payments-dialog.png` | `/payments/new` | Record-payment form (method, amount, date). |
| S-31 | `operations-payments-results.png` | `/payments/[id]` | Recorded payment detail/receipt. |
| S-32 | `operations-reports-main.png` | `/reports` | Reports/exports page with export buttons. |
| S-33 | `account-settings-main.png` | `/settings` | Centre settings (name, logo, currency). |
| S-34 | `account-settings-subscription.png` | `/centres/[id]/subscription` | Subscription/billing screen (Stripe). |

### Capture conventions

- Browser logged in as an **Owner** with one centre, using sample sanitised data
  (no real student/guardian PII).
- Viewport ≈ 1440×900; light theme for consistency unless the guide page is
  explicitly dark.
- Hide browser chrome (address bar, bookmarks) where practical.
- Crop to the main content region, keeping the app sidebar visible for context
  on `main` variants; crop tighter for `dialog` variants.

---

## 9. Build & verify

1. Create the folder tree and placeholder images under
   `apps/docs/public/images/guide/`.
2. Author each MDX page per §7, referencing the §8 capture filenames.
3. Update `content/docs/meta.json` + each nested `meta.json`.
4. Verify locally:
   ```bash
   bun run dev --filter=docs    # in apps/docs via turbo: bunx turbo run dev --filter=docs
   ```
   Open `http://localhost:3004/docs` and walk every sidebar link. Confirm:
   - Each page renders from the source (not 404).
   - Placeholder images load.
   - Sidebar grouping matches §3.
5. Build:
   ```bash
   bunx turbo run build --filter=docs
   ```
6. (Deferred) Replace placeholder PNGs with real captures from §8; no MDX change.

---

## 10. Open questions for the owner

- **Terminology:** the product has not finalised `enrolment` vs `enrollment`.
  The app route/file uses `enrollment`; the guide should pick one for the
  visible page and note it. Default in the plan: **Enrollment**.
- **Do you want dark-theme screenshots too?** The docs site has a theme toggle;
  decide before capture to avoid a second pass.
- **Sample data:** capture list assumes sample/sanitised rows. Confirm a safe
  fixture or a fresh centre so no real PII is exposed.
- **Trial/plan screens:** `centres/[id]/subscription` may differ per plan; confirm
  which plan is used for the subscription capture.
