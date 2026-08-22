# Add Student Page Replication Plan

Implementation plan for rebuilding `/students/new` to replicate the UI layout of
the reference design in `ref_code/student-creation-page/`, extended to full field
parity with functional class enrollment.

**Status:** Ready for engineering execution. No application code was changed to
produce this document.

**Decisions locked in with product:**

| Decision | Choice |
|---|---|
| Field scope | Full parity (IC/MyKid, school type, up to 3 guardians with WhatsApp/IC, subject fees, custom fee) |
| Visual style | App-native — reference layout/structure, existing Cal Sans font + design tokens |
| Enrollment section | Fully functional (real class selection wired into creation and billing) |

---

## 1. Objective

Replace the current Add Student form with the reference layout: five icon-headed
section cards in a two-column grid with a sticky profile-preview sidebar, while

- keeping every field persisted through the existing server-action flow;
- adding the missing data model fields via one Prisma migration;
- creating real `Enrollment` rows (with optional per-enrollment custom fee)
  inside student creation;
- preserving tenant scoping, ADMIN-only access, plan limits, student-code
  reservation, and activity-event writing exactly as they work today.

The reference (`ref_code/student-creation-page/src/app/App.tsx`, a standalone
Vite prototype) is the visual spec only. Its hardcoded subject catalogs, fee
tables, fonts ("DM Serif Display", "Plus Jakarta Sans"), and green/orange theme
are **not** copied; real data and repo tokens are used instead.

---

## 2. Verified repository state

### 2.1 What exists and is reused as-is

| Piece | Location | Notes |
|---|---|---|
| Route | `apps/app/app/(workspace)/students/new/page.tsx` | Server component; `requireTenantRole(["ADMIN"])`; fetches `nextCode` + `levels` |
| Form shell | `apps/app/app/(workspace)/students/components/student-create-form.tsx` | Client component; `useActionState` + `createStudent(formData)`; will be rewritten |
| Create action | `apps/app/app/(workspace)/students/actions.ts:99` | Manual FormData parsing; transaction creates Student + one Guardian + `StudentGuardian`; reserves code via `reserveStudentCode`; `assertWithinPlanLimit`; writes `studentCreatedEvent`; redirects to `/students/[id]` |
| Zod contract | `packages/schemas/students.ts` (`createStudentInputSchema`) | Also consumed by tRPC at `packages/api/routers/students.ts:256` — schema changes must be additive |
| Enrollment engine | `packages/domain/classes/enrollment.ts:161` `enrollStudent(db, ctx, input)` | Capacity check, duplicate-active check, `EnrollmentValidationError` |
| Fee semantics | `LearningClass.monthlyFeeSen`, `Enrollment.customFeeSen` | Invoices use `enrollment.customFeeSen ?? enrollment.class.monthlyFeeSen` (`apps/app/app/(workspace)/invoices/actions.ts:121`) |
| Invoice due date | `generateMonthlyInvoices` uses org-level `OrganizationSettings.defaultInvoiceDueDay` | Per-student due day does not exist yet |
| Grade/Form | `Level` model; already queried in the page | Reference's "Grade / Form" maps here |
| Photo upload | `app/(workspace)/components/student-photo-upload.tsx` | R2 upload, hidden `photoKey` input — moves from sidebar into the first card |
| Date handling | `@repo/date` (`getMalaysiaCalendarDate`, `tryParseCalendarDate`) | Calendar-date rules per AGENTS.md |
| Money | sen integers end-to-end; display via `@repo/money` `formatMoney` | Custom fee input converts RM → sen like `enroll-student-dialog.tsx:40` |

### 2.2 What does not exist yet (this plan adds it)

- `Student.icNumber`, `Student.schoolType`, `Student.invoiceDueDay`,
  `Student.emergencyContactName`, `Student.emergencyContactPhone`,
  `Student.medicalNotes`, `Student.referralSource`
- `Guardian.whatsapp`, `Guardian.icNumber`
- Multi-guardian creation (model supports many via `StudentGuardian`; action
  hardcodes exactly one)
- Class enrollment during creation (today it happens post-create via
  `[studentId]/enroll-student-dialog.tsx` → `enrollStudentAction`)
- IC-driven DOB/gender auto-fill

---

## 3. Reference → app mapping

Layout structure replicated 1:1; content mapped onto real data.

### 3.1 Page frame

| Reference | Implementation |
|---|---|
| Own header bar "TuitionPay" | Dropped — app `(workspace)` layout header stays |
| Breadcrumb Dashboard › Students › Add Student | Existing `Header` component (`pages={[appName, { href: "/students", label: "Students" }]}`) stays |
| Serif h1 "Add Student" + subtitle | Same text block, `font-semibold text-2xl tracking-tight` (existing style), subtitle "Register a new student and their parent/guardian details." |
| `grid xl:grid-cols-[1fr_300px] gap-6 items-start` | Keep current grid: `xl:grid-cols-[1fr_300px] 2xl:grid-cols-[1fr_360px]` |
| Sticky right rail `xl:sticky xl:top-24` | `xl:sticky xl:top-4 xl:self-start` (current offset matches app header height) |
| Success screen | Not replicated — action already redirects to `/students/[id]` |

### 3.2 Section cards (left column)

Shared chrome for every card: header row = 8×8 rounded-lg chip `bg-primary/10`
with lucide icon (`size-4 text-primary`), title `text-sm font-semibold`,
subtitle `text-muted-foreground text-xs`; body `p-5 grid gap-4`. Implemented as
a small local component wrapping the existing `CardShell` primitives.

#### Card 1 — Student Information (`UserRoundIcon`, "Legal name as per IC / birth certificate")

| Reference field | Storage / behaviour |
|---|---|
| Photo upload tile (dashed, camera icon, "Photo (optional)") | Existing `StudentPhotoUpload name="photoKey"` restyled inline (80×80 dashed tile); lives here instead of sidebar |
| First name * / Last name / Family name | Two inputs; client posts hidden composed `fullName` = `"first last".trim()`; `fullName` remains the single DB field. Validation: first name required |
| IC / MyKid number, hint "12 digits — auto-detects DOB & gender" | New `Student.icNumber`. Input normalizes to digits (max 12). Auto-fill: ≥6 digits → DOB selects (`yy ≤ 26 → 20yy else 19yy`); 12 digits → gender from last digit (odd = male, even = female). Server re-derives DOB when missing |
| Gender Male / Female buttons | `ToggleGroup type="single"` bound to `MALE/FEMALE`; an **Other** option is appended so the `Gender` enum keeps full coverage (deviation from reference, preserves edit-page capability). Required |
| Date of birth Day/Month/Year selects | Three `Select`s posting combined hidden `dateOfBirth` (`yyyy-MM-dd` via `@repo/date`). Hint shows derived age ("Age: N years old") using Malaysia "today" |

Dropped from current UI (stay nullable in DB, untouched by this page):
student phone/email, address lines, city/state/postcode. See §6.3 for the email
rule consequence.

#### Card 2 — School & Grade (`GraduationCapIcon`, "Current academic level")

| Reference field | Storage / behaviour |
|---|---|
| Grade / Form * select | Existing `levelId` Select fed by `levels` (already fetched). Required. Changing it clears selected classes |
| School type select | New `Student.schoolType`. Options: SK (National), SJKC (Chinese), SJKT (Tamil), SMK (Secondary), Private, International |
| School name | Existing `schoolName` |

#### Card 3 — Parent / Guardian (`UsersRoundIcon`, "At least one contact is required")

Repeatable guardian blocks (1–3), each a bordered sub-card:

| Reference field | Storage / behaviour |
|---|---|
| ★ Primary contact label | First block fixed primary (`isPrimary`, `receivesBilling` true); additional blocks get remove ✕ button |
| Full name * ("As per IC") | `guardian.fullName` — required for every block |
| Relationship select | Existing enum `FATHER/MOTHER/GUARDIAN/OTHER`; options Father, Mother, Legal Guardian, Grandparent→OTHER? No — keep 4 enum values: Father, Mother, Guardian, Other (reference's grandparent folds into Other) |
| Phone number * (+60 prefix) | Static `+60` adornment; placeholder follows current convention `012-345 6789` so existing `^01\d{8,10}$` validation still holds after dash/space stripping |
| WhatsApp number + "Same as phone number" checkbox | New `Guardian.whatsapp`. Checkbox default on; mirrors phone and disables the input; hint "Same as phone" |
| Email address | Optional per-block; see §6.3 rule |
| IC number, hint "12 digits, no dashes" | New `Guardian.icNumber`; stored digits-only |
| "+ Add second parent / guardian" | Appends block; hidden at 3 |

Serialized client-side into one hidden `guardiansJson` input (zod-validated
server-side, §5.2) because the count is dynamic — same technique as
`enrollmentsJson`.

#### Card 4 — Enrollment (`BookOpenIcon`, "Subjects, fees, and start date") — fully functional

| Reference field | Storage / behaviour |
|---|---|
| Start date | Existing `DatePicker` defaulting to `getMalaysiaCalendarDate()`; posts `enrolledAt` and doubles as each enrollment's `startsOn` |
| Fee due day select ("Nth of each month", hint "Day of month invoices are due") | New `Student.invoiceDueDay Int?` (1–28, ordinal labels). Default preselected from `OrganizationSettings.defaultInvoiceDueDay` |
| Subjects / programmes enrolled * | Multi-select of **active classes** (class ≈ programme; subject shown as label): `Popover` + `Command` list — row label `{subject.name} · {class.name}`, right side `{RM}/mo` + capacity note, `CheckIcon` when selected, full classes disabled. Selected entries render as removable tag chips. Filtered to the chosen level when one is set; grouped by level otherwise. Serialized to hidden `enrollmentsJson` = `[{ classId, customFeeSen? }]` |
| Live summary bar ("N subjects · monthly total RM X") | Sums class fees; reflects custom override when applicable |
| Custom monthly fee (RM, hint "Overrides the subject-based total") | Maps to `Enrollment.customFeeSen`. Enabled **only when exactly one class is selected** (override is per-enrollment in the billing model — §2.1); disabled with hint otherwise. RM → sen conversion like the enroll dialog |
| Error "Enroll at least one subject" | Field-level error under picker |

#### Card 5 — Additional Information (`MoreHorizontalIcon`, collapsible, collapsed by default)

| Reference field | Storage / behaviour |
|---|---|
| Emergency contact name / phone (+60) | New `emergencyContactName`, `emergencyContactPhone` |
| Medical conditions / allergies textarea (hint "Visible to centre staff only") | New `medicalNotes` |
| How did they find us? select | New `referralSource` (Friend / Word of mouth, Facebook, Instagram, Google Search, Banner / Flyer, Walk-in, WhatsApp broadcast, Other) |
| Internal notes textarea | Existing `notes` column (unchanged meaning) |

Collapse uses the existing `Collapsible` + `CollapsibleTrigger` pattern already
in this form.

#### Footer

- Destructive `Alert`: "Please complete all required fields before saving." —
  rendered only when client/server validation errors exist.
- `Save Student` (`flex-1`, spinner + "Saving..." pending state) and `Cancel`
  (`render={<Link href="/students" />}` outline). Moves from sidebar to bottom of
  the form column, matching the reference.

### 3.3 Sidebar (right column)

| Reference block | Implementation |
|---|---|
| "PROFILE PREVIEW" label | `text-xs font-semibold uppercase tracking-widest text-muted-foreground` |
| Gradient band + overlapping avatar + grade badge | Band: `h-16 bg-gradient-to-r from-primary to-primary/70`. Avatar: 80×80 rounded-2xl initials (photo when uploaded) overlapping `-bottom-8 left-5`; grade badge pill bottom-right when level chosen. Body shows italic "Student name" placeholder → live name, level, school, "N years old · Male/Female" (age derived from DOB selects) |
| Parent/Guardian summary card | Rows (icon + value) for primary guardian name, `+60 phone`, email — appears once any primary field is filled |
| Enrollment summary card | Per-class fee rows, divider, "Monthly total" honoring single-class custom override, "Starts {date}" row (`formatCalendarDate`) — appears when ≥1 class selected |
| Quick Tips card | Tinted panel `bg-secondary/40 border border-primary/10`; three tips kept verbatim (IC auto-fill, pick grade first, up to 3 guardians) |

---

## 4. Data model changes

One migration (`bun run migrate` from repo root), all columns nullable — zero
backfill needed:

```prisma
model Student {
  // …existing…
  icNumber               String?   // IC / MyKid, digits only
  schoolType             String?
  invoiceDueDay          Int?      // 1–28; falls back to org default
  emergencyContactName   String?
  emergencyContactPhone  String?
  medicalNotes           String?
  referralSource         String?
}

model Guardian {
  // …existing…
  whatsapp String?
  icNumber String?
}
```

No indexes added (never filtered/queried by these). `@@unique` and existing
relations untouched.

---

## 5. Backend changes

### 5.1 `packages/schemas/students.ts`

Additive only — `createStudentInputSchema` is also consumed by the tRPC router
(`packages/api/routers/students.ts:256`), so nothing existing is removed or made
required:

```ts
export const guardianInputSchema = z.strictObject({
  fullName: z.string().trim().min(1),
  relationship: guardianRelationshipSchema.optional(),
  phone: phone,
  whatsapp: z.string().trim().optional(),        // normalized digits/dashes server-side
  email: email,
  icNumber: z.string().trim().optional(),
});

// new optional student fields merged into studentFields:
icNumber, schoolType, invoiceDueDay (int 1–28 optional),
emergencyContactName, emergencyContactPhone, medicalNotes, referralSource,
firstName, lastName            // optional pair; action composes fullName when present
guardiansJson                  // z.string() carrying JSON guardianInputSchema[]
enrollmentsJson                // z.string() carrying JSON [{ classId, customFeeSen? }]
```

### 5.2 `apps/app/app/(workspace)/students/actions.ts` — `createStudent` rewrite

Same signature `(formData) => Promise<{ error?: string }>`, same transaction
boundaries, plan limit, code reservation, activity event, and redirect. Changes
inside:

1. **Name**: compose `fullName` from `firstName`/`lastName` when provided
   (`[first, last].filter(Boolean).join(" ")`), else fall back to `fullName`
   (keeps API/import callers working).
2. **IC derivation**: if `icNumber` has 12 digits and `dateOfBirth` absent →
   derive calendar date (year pivot: `yy <= 26 → 20yy else 19yy`); if gender not
   posted → derive from last digit.
3. **New student fields** persisted (`schoolType`, `invoiceDueDay`,
   emergency/medical/referral).
4. **Guardians**: parse+validate `guardiansJson` with `guardianInputSchema`
   (1–3 items). Loop-creates `Guardian` rows; first link gets
   `isPrimary: true, receivesBilling: true`, others `false/false`.
5. **Enrollments**: parse+validate `enrollmentsJson` (≥1 when present — the form
   enforces ≥1, but empty array stays allowed for programmatic/API use). For each
   entry call domain `enrollStudent(tx, ctx, { studentId, classId, startsOn:
   enrolledAt, customFeeSen })` inside the same transaction. Widen its `db`
   parameter type to accept `Prisma.TransactionClient` if the current signature
   is narrower. Catch `EnrollmentValidationError` → return `{ error }` (whole tx
   rolls back — student is not created half-enrolled).
6. **Email rule**: see §6.3.

### 5.3 `packages/api/routers/students.ts` — keep in sync

Extend the `create` mutation to persist the same new optional fields (single-
guardian shape there can remain; multi-guardian/enrollment wiring is web-flow
only for now). Required so the shared schema extension doesn't silently drop
fields for API consumers.

### 5.4 `apps/app/app/(workspace)/invoices/actions.ts`

Due-date preference becomes per-student with org fallback:

```ts
dueDate: getDueDate(
  billingMonth,
  studentInvoiceDueDay ?? settings?.defaultInvoiceDueDay ?? 7
)
```

(`studentEnrollments[0].student.invoiceDueDay` — the query already includes
`student: true`.)

### 5.5 `apps/app/app/(workspace)/students/new/page.tsx`

Additional server fetches alongside `nextCode`/`levels`:

```ts
organizationSettings: defaultInvoiceDueDay
classes: database.learningClass.findMany({
  where: { organizationId, archivedAt: null, status: "ACTIVE" },
  select: { id, name, monthlyFeeSen, capacity, levelId,
            subject: { select: { name } },
            _count: { select: { enrollments: { where: { status: "ACTIVE", archivedAt: null } } } } },
})
currency: organizationSettings.currency
```

Passed as props to the rebuilt form.

---

## 6. Client behaviour details

### 6.1 State architecture

Keep the current pattern (uncontrolled inputs + `useActionState` +
client-side `validate(FormData)` gate in `onSubmit`) rather than introducing
react-hook-form. Dynamic collections (guardians, enrollments) are controlled
React state serialized into their hidden JSON inputs on submit; the beforeunload
dirty guard is preserved.

### 6.2 IC auto-fill (shared helper)

```ts
// lib/ic-number.ts (new, co-located with students/lib/)
normalizeIc(value)            // digits only, max 12
deriveDateOfBirth(ic)         // yy<=26 ? 20yy : 19yy — returns yyyy-MM-dd or null
deriveGender(ic)              // 12-digit: odd last digit → MALE, even → FEMALE
```

Used by both the form (fills DOB selects / gender toggles live) and the action
(§5.2 step 2) so the rule exists in exactly one importable place.

### 6.3 Email business rule

Removing the Contact & Address section removes the student email input, but the
system requires ≥1 email (action guard + schema refine + invoices/notifications
rely on it). Resolution: **guardian email becomes the required email** — the
primary guardian's email field is marked required in the UI, validation, and
schema (`guardianInputSchema` refines to require email on item 0 when
`studentEmail` is absent). The action guard changes accordingly. This is the
one deliberate business-rule adjustment; flagged here for sign-off.

### 6.4 Validation summary (client mirrors server)

| Key | Rule |
|---|---|
| `firstName` | required |
| `gender` | required (MALE/FEMALE/OTHER) |
| `levelId` | required |
| `guardians[i].fullName`, `.phone` | required, every block |
| `guardians[0].email` | required (unless `studentEmail` present — impossible in this UI) |
| `subjects` | ≥1 class |
| phones | existing `^01\d{8,10}$` after stripping dashes/spaces |
| emails / postcode-free | existing regex set; postcode no longer collected |

Server errors surface via the existing toast path plus the footer Alert.

---

## 7. File-by-file change list

| # | File | Change |
|---|---|---|
| 1 | `packages/database/prisma/schema.prisma` | §4 columns; run `bun run migrate` |
| 2 | `packages/schemas/students.ts` | §5.1 additive schemas + types |
| 3 | `apps/app/app/(workspace)/students/lib/ic-number.ts` | **new** — §6.2 helpers |
| 4 | `apps/app/app/(workspace)/students/actions.ts` | §5.2 createStudent rewrite |
| 5 | `packages/api/routers/students.ts` | §5.3 persist new optional fields |
| 6 | `apps/app/app/(workspace)/invoices/actions.ts` | §5.4 per-student due day |
| 7 | `apps/app/app/(workspace)/students/new/page.tsx` | §5.5 extra fetches; updated subtitle |
| 8 | `apps/app/app/(workspace)/students/components/student-create-form.tsx` | Full rewrite — §3 layout, §6 behaviour |
| 9 | `apps/app/app/(workspace)/students/components/form-section-card.tsx` | **new** — icon-chip card chrome |
| 10 | `apps/app/app/(workspace)/students/components/guardian-editor.tsx` | **new** — repeatable guardian blocks + JSON serialization |
| 11 | `apps/app/app/(workspace)/students/components/class-picker.tsx` | **new** — Popover+Command multi-select, tags, fee summary |
| 12 | `apps/app/app/(workspace)/students/components/create-profile-preview.tsx` | **new** — sidebar preview/tips/summaries |

Not touched: `guardian-fields.tsx` (edit page), `[studentId]/edit`, mobile app,
import flow, `sidebar-user-menu` etc.

---

## 8. Out of scope / follow-ups

- **Edit page parity** — `[studentId]/edit` keeps the old single-guardian form;
  new fields (IC, WhatsApp, etc.) won't be editable until a follow-up ports the
  same sections onto `updateStudent`.
- **Mobile parity** — Expo account/student flows unaffected.
- **Per-class custom fees at creation** — override applies only in the
  single-selection case; multi-class overrides continue via the post-create
  enroll dialog / transfer dialog.
- **Success screen** from the prototype (redirect replaces it).

---

## 9. Verification

1. `bun run migrate` (from repo root) — migration applies clean on a dev DB.
2. `bun run typecheck` in `apps/app` and `packages/api` (schema consumers).
3. Scoped lint: Biome check on the touched files only (repo-wide check has
   pre-existing baseline noise).
4. Manual pass at `/students/new` as ADMIN:
   - IC typing auto-fills DOB selects and gender; year pivot correct for
     pre-2000 births.
   - Grade change clears class selection; picker groups/filters by level; full
     classes disabled; fee total updates; custom fee enabled only with exactly
     one class.
   - Add second/third guardian; WhatsApp mirrors phone; unchecking enables
     manual entry.
   - Save with missing required fields → inline errors + footer alert, no
     navigation.
   - Happy path → lands on `/students/[id]`; verify in DB: guardians rows +
     links (first primary/billing), enrollments rows (`customFeeSen` when set),
     new Student columns populated; activity event written.
   - Regenerate a monthly invoice for that student → dueDate honors
     `invoiceDueDay`; line items reflect `customFeeSen ?? class fee`.
5. Regression: tRPC `students.create` still validates with the additive schema
   (old payload shape unchanged).
