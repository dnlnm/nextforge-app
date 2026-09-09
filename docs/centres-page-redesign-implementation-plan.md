# Redesign `/centres` Page — Implementation Plan & Specification

## Overview & Context

The [`/centres`](file:///c:/Users/Daniel%20Naim/.local/share/opencode/worktree/5036723e1db32eae161f7e6f91fb45e936947464/fluid-test/apps/app/app/(main)/centres/page.tsx) page is the primary landing destination when a user signs in to the main SaaS domain (`klio.my`). It is titled **"My Centre"** and serves tuition centre owner-operators managing their business and accessing their workspace subdomain (`<slug>.klio.my`).

### The Current Problems

1. **The Single-Tenant Paradox in a 3-Column Grid**:
   - Per product design and current data constraints (`PRODUCT.md`), an owner-operator can own **at most one active centre**.
   - The current UI renders a 3-column responsive grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`). For virtually every centre owner, this results in a single lonely card floating in the top-left corner, leaving two-thirds of the desktop screen empty. It feels like an unfinished marketplace template rather than an executive command hub.
2. **Low Information Density & Zero Operational Pulse**:
   - The card only renders three static counts: `Students`, `Teachers`, and `Classes`.
   - It provides no insight into plan capacity utilization (e.g. *38 / 50 students enrolled on Starter*), trial expiration countdown, or whether classes and attendance are active today.
   - The subscription details are dumped in a raw unstyled gray box (`rounded-lg border bg-muted/50 p-3`).
3. **Buried Primary Action & Awkward Hierarchy**:
   - The single most important action—**"Open Workspace"** (`<slug>.klio.my`)—is pushed to the bottom of the card under the stats.
   - Settings and Subscription buttons are squeezed side-by-side below that.
   - An redundant `OWNER` role badge is displayed next to the centre name.
4. **Visual Frame Inconsistencies**:
   - In the `fluid-test` branch, `<CentreCardFrame>` wraps an inner `<Card>`, creating duplicate borders and conflicting elevation levels.
5. **Disconnected Affiliations**:
   - If an owner also teaches or administrates at another tuition centre, those affiliations are completely omitted from `/centres` and buried under `/workspaces/admin` or `/workspaces/teacher`.
6. **Bland Empty State**:
   - For a user without a centre, the empty state is a bare dashed box with a plus icon that fails to explain the benefits, domain setup, or 3-step onboarding flow.

---

## The Target Experience: The Owner Command Hub

Transform `/centres` from a sparse "card list" into a cohesive **Executive Launchpad** tailored specifically for Malaysian tuition centre owners.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  [Logo]  Bright Mind Tuition Centre                                 [ Launch Workspace ↗ ]  │
│          brightmind.klio.my  [📋 Copy]                                                      │
│          Kuala Lumpur  •  Branch: Main Campus                        [ ⚙ Settings ] [ 💳 ] │
├───────────────────────────────────────┬─────────────────────────────────────────────────────┤
│  CAPACITY & SUBSCRIPTION              │  QUICK OPERATIONAL JUMP                             │
│                                       │                                                     │
│  Plan: Starter (RM49/mo)  [Active]    │  ⚡ Mark Today's Attendance   → /today               │
│  Trial: 6 days remaining  [Upgrade]   │  👥 Register New Student       → /students/new       │
│                                       │  📚 Schedule a Class           → /classes            │
│  Students:  38 / 50   [████████░░]    │  📄 Invoices & Fees            → /invoices           │
│  Classes:    8 / 20   [████░░░░░░]    │  👨‍🏫 Teaching Staff           → /teachers           │
│  Teachers:   4 / 10   [████░░░░░░]    │                                                     │
│  Invoices:  12 / 50   [██░░░░░░░░]    │                                                     │
├───────────────────────────────────────┴─────────────────────────────────────────────────────┤
│  AFFILIATIONS & OTHER WORKSPACES (Optional, only shown if user has Admin/Teacher roles)     │
│  [Logo] EduKids Academy (Admin)       → edukids.klio.my                                    │
│  [Logo] Pusat Tuisyen Bestari (Teacher) → bestari.klio.my                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Architectural Changes & Key Components

### 1. Unified Server Data Fetching in `page.tsx`
Leverage existing domain and payment services to fetch complete data in a single parallel roundtrip:
- **Owned Centre**: `database.organizationMembership.findFirst` for `role: "OWNER"`, with `organization` including `branch` (phone, city, address), `subscription`, and `_count`.
- **Plan Usage & Limits**: Call `getBillingState(organization.id)` from `@repo/payments/subscription` to get:
  - Exact limits from `planDefinitions[plan]` (`students`, `classes`, `teachers`, `invoicesPerMonth`).
  - Active usage counts.
  - Calculated trial days remaining via `differenceInMalaysiaCalendarDays(trialEndsAt, new Date())`.
  - Over-capacity threshold warnings (e.g. usage >= 90%).
- **Other Affiliations**: Query `database.organizationMembership.findMany` for `userId: user.id`, `role: { in: ["ADMIN", "TEACHER"] }` to optionally render the affiliations section.

### 2. Decomposed Fluid UI Components
Break down the monolithic page into modular, single-responsibility components under `apps/app/app/(main)/centres/components/`:

#### A. `CentreHero` (`centre-hero.tsx`)
- High-resolution centre logo with fallback monogram.
- Official centre name and branch location badge.
- Formatted workspace hostname (`<slug>.klio.my`) with integrated one-click copy button (`InputCopy` / clipboard feedback).
- Primary **"Launch Workspace"** button (`Button variant="primary"` with `ExternalLinkIcon`).
- Secondary quick buttons for **"Settings"** (`/centres/[id]/settings`) and **"Subscription"** (`/centres/[id]/subscription`).

#### B. `CentreCapacityCard` (`centre-capacity-card.tsx`)
- Clean subscription status pill (e.g., `Starter`, `Pro`, or `14-Day Free Trial`).
- Trial countdown banner with dynamic urgency styling (amber when ≤ 3 days).
- Four progress meters utilizing `@repo/design-system/components/ui/progress`:
  1. **Students**: current active students vs plan limit (e.g., `38 / 50`).
  2. **Classes**: active classes vs limit (e.g., `8 / 20`).
  3. **Teachers**: profiles + pending invitations vs limit (e.g., `4 / 10`).
  4. **Monthly Invoices**: invoices generated in current Malaysian billing month (`YYYY-MM`) vs limit.
- Direct "Manage Plan" / "Upgrade" action link.

#### C. `CentreQuickActions` (`centre-quick-actions.tsx`)
- Quick-jump action tiles with clear icons leading directly into high-frequency subdomain workflows:
  - **Today's Operations**: `buildWorkspaceUrl(slug, "/today")`
  - **Register Student**: `buildWorkspaceUrl(slug, "/students/new")`
  - **Classes & Timetable**: `buildWorkspaceUrl(slug, "/classes")`
  - **Invoices & Tuition Collection**: `buildWorkspaceUrl(slug, "/invoices")`
  - **Teachers & Staff**: `buildWorkspaceUrl(slug, "/teachers")`

#### D. `CentreAffiliations` (`centre-affiliations.tsx`)
- Renders only if the user is an `ADMIN` or `TEACHER` at other tuition centres.
- Displays compact horizontal rows with logo, centre name, role badge (`Admin` or `Teacher`), and direct external link to their workspace.

#### E. `CentreEmptyState` (`centre-empty-state.tsx`)
- Rendered when `memberships.length === 0`.
- Beautiful 3-step visual onboarding guide:
  1. **Claim Your Centre Subdomain**: Choose your name & unique URL (`yourcentre.klio.my`).
  2. **Set Up Academics & Fees**: Define subjects, academic levels, and classes.
  3. **Enrol Students & Track Attendance**: Bulk import students and start running daily sessions.
- Prominent CTA: **"Set Up Your Tuition Centre"** linking to `/center-setup`.

---

## User Review Required

> [!IMPORTANT]
> **Data Scope & Performance**:
> Calling `getBillingState(organization.id)` executes lightweight count queries across `student`, `learningClass`, `teacherProfile`, and `invoice`. Because this is limited to the single owned centre, database query overhead is negligible (< 15ms total), while providing immense UX value.

> [!TIP]
> **Fluid Design System Consistency**:
> All new components will use `@repo/design-system/components/ui/fluid-*` (`fluid-button`, `fluid-badge`, `fluid-card`, `progress`) adhering to the canonical two-step size ladder (`default` 36px, `compact` 28px) and surface elevation tokens.

---

## Proposed File Changes

### Component Layer: `apps/app/app/(main)/centres`

| Action | Path | Description |
| :--- | :--- | :--- |
| **[MODIFY]** | [`page.tsx`](file:///c:/Users/Daniel%20Naim/.local/share/opencode/worktree/5036723e1db32eae161f7e6f91fb45e936947464/fluid-test/apps/app/app/(main)/centres/page.tsx) | Replace 3-column grid with Command Hub layout, query billing state and affiliations. |
| **[NEW]** | `components/centre-hero.tsx` | Centre identity header, workspace URL, copy link, launch button, quick settings. |
| **[NEW]** | `components/centre-capacity-card.tsx` | Plan subscription details, trial countdown, and resource capacity progress bars. |
| **[NEW]** | `components/centre-quick-actions.tsx` | Deep-link shortcuts to high-frequency subdomain tasks. |
| **[NEW]** | `components/centre-affiliations.tsx` | Secondary section displaying other centres where user has Admin or Teacher roles. |
| **[NEW]** | `components/centre-empty-state.tsx` | Redesigned 3-step onboarding card for first-time owners. |
| **[DELETE]** | [`components/centre-card-frame.tsx`](file:///c:/Users/Daniel%20Naim/.local/share/opencode/worktree/5036723e1db32eae161f7e6f91fb45e936947464/fluid-test/apps/app/app/(main)/centres/components/centre-card-frame.tsx) | Remove obsolete frame wrapper that caused double container borders. |

---

## Verification & Testing Plan

### Automated Checks
- **Biome & Ultracite**:
  ```bash
  bun run check
  ```
- **Type Checking**:
  ```bash
  bun x turbo run build --filter=@repo/app
  ```
- **Unit & Integration Tests**:
  ```bash
  bun x turbo run test --filter=@repo/app
  ```

### Manual Verification Scenarios
1. **Active Owner with Starter/Pro Plan**:
   - Verify logo, name, branch address, and formatted `<slug>.klio.my`.
   - Test "Copy URL" button and verify clipboard content and toast feedback.
   - Click "Launch Workspace" and ensure it opens `https://<slug>.klio.my`.
   - Confirm capacity meters accurately display Students, Classes, Teachers, and Monthly Invoices against plan limits.
2. **Owner on 14-Day Trial**:
   - Verify trial countdown banner shows accurate days remaining.
   - Verify "Upgrade" button links directly to `/centres/[id]/subscription`.
3. **Owner with Secondary Roles (Admin/Teacher)**:
   - Ensure the "Other Centres & Affiliations" section appears cleanly below the main centre hub.
4. **New User (Zero Centres)**:
   - Verify the 3-step onboarding empty state renders cleanly with a working link to `/center-setup`.
