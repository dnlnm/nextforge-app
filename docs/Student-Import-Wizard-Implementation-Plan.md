# Student Import Wizard Implementation Plan

Companion to `student-import-wizard-spec.md`. This implementation plan is based
on the current repository state and translates the spec into ordered
engineering work.

**Status:** Ready for engineering execution. No application code was changed to
produce this document.

---

## 1. Objective

A student import wizard already exists end-to-end in
`apps/app/app/(workspace)/students/import/`: personalized template download,
R2-backed `.xlsx` upload, server-side workbook validation, batched commit, import
history, and error-report download all work today.

What does not exist is the spec's core interaction — **Step 3 "Review & Fix"**.
Invalid rows currently land in a read-only "first 100 problem rows" table, and
the only correction path is editing the Excel file and re-uploading. This plan
closes that gap and aligns the remaining behavior with the spec.

Target principle (spec §30): *upload once, fix in place, import with confidence.*

### Locked decisions

| Decision | Choice |
|---|---|
| Commit gate | Import is **blocked while rows with blocking errors remain** (spec §22), replacing today's skip-invalid behavior |
| Duplicate policy | Create-only; within-file duplicates flagged by identity fingerprint; existing students are never matched or updated |
| Review grid rendering | Paginated table (~50 rows/page) over existing `ui/table` primitives; **no virtualization dependency** (max 5,000 rows × 19 cols) |
| API style | Next.js server actions in the existing `import/actions.ts`; no new tRPC routes |
| Permissions | `requireTenantRole(["ADMIN"])`, matching every other procedure in this feature |

---

## 2. Verified Repository State

Implementation must extend these files instead of replacing working behavior.

| Area | Current implementation | Gap vs spec |
|---|---|---|
| Template generation | `students/template/route.ts` → `createStudentTemplate()` in `import/lib/workbook.ts`. Instructions + Students sheets, veryHidden Lists sheet, dropdowns for Gender/Academic Level/Guardian Relationship, `yyyy-mm-dd` numFmt on date columns, text (`@`) numFmt on phone/postcode columns, frozen header row | No centre/tenant name, template version ID, or generated timestamp in the workbook (spec §4) |
| Upload | `student-import-upload.tsx` → `/api/uploads/student-import` presigned R2 PUT; `.xlsx` extension and 10 MiB limit enforced client- and server-side | None material |
| File/column validation | `parseStudentWorkbook()`: requires `Students` sheet, rejects empty/corrupt workbooks, missing/duplicate headers, empty header cells; unknown columns warned via `failureMessage`; column order flexible | None material |
| Row/cell validation | Per-row checks: required fields, MY phone regex, email syntax, 5-digit postcode, gender/relationship/level enum lookup, strict `YYYY-MM-DD` dates via `@repo/date`, formula-cell rejection, blank-row skip, 5,000-row cap | Errors are stored as plain strings with **no field attribution, no severity split, no stable codes** (spec §25). Nothing downstream (cell highlighting, filtering) can be built on strings |
| Data model | `StudentImport` / `StudentImportRow` at `packages/database/prisma/schema.prisma:232–281` with `@@unique([importId, rowNumber])`, `rawData`/`normalizedData`/`errors` Json columns | No warnings/info distinction; no session expiry or retention |
| Review & Fix (Step 3) | `[importId]/page.tsx` shows a read-only table of the first 100 invalid/duplicate/failed rows | **Core gap**: no editable grid, no inline cell editing, no errors-only filter/search, no revalidation after edits |
| Commit | `startStudentImport` + client-driven `executeStudentImportBatch` loop (`import-runner.tsx`); per-row transactions create Student + Guardian + StudentGuardian; plan-limit check via `assertWithinPlanLimit`; student codes auto-reserved via `reserveStudentCode` | Imports valid rows and silently skips invalid ones — contradicts the locked block-on-errors policy |
| Result (Step 5) | Stepper step 5, summary cards, error-report download via `[importId]/errors/route.ts` → `createErrorWorkbook()` with formula-prefix sanitization | None material |
| Duplicates | SHA-256 fingerprint of the **entire raw row** JSON; second occurrence marked `DUPLICATE` | Brittle: a trailing space changes identity. Spec §8 wants identity-based detection |
| Existing-record duplicates | Not applicable by design — student `code` is auto-generated at commit, not imported | Document as intentional deviation from spec §8 hierarchy |
| Retention | None — sessions persist indefinitely (spec §19/§20 edge cases) | Add lightweight cleanup |
| Analytics | `console.info` events for validate/start/complete only (spec §21) | Extend with wizard-funnel events |

Existing infrastructure to reuse (do not rebuild): `@repo/date` calendar-date
helpers, `@repo/storage` R2 helpers, `@repo/auth` role gating,
`packages/design-system` `ui/table` primitives, ExcelJS (only spreadsheet lib in
the repo), vitest configs already present in `apps/app`.

---

## 3. Phase 1 — Structured Validation Foundation

**Goal:** one shared validation path used by initial parse, inline edits, and
pre-commit recheck (spec §14). Everything else builds on this.

1. Extract per-row validation from `parseStudentWorkbook` into a pure
   `validateRow(rawData, ctx)` module (`import/lib/validation.ts`), where
   `ctx = { levels }`.
2. Change issue shape to `{ field: ColumnName | null, code, severity, message }`
   with stable codes from spec §25: `REQUIRED`, `INVALID_FORMAT`,
   `INVALID_DATE`, `INVALID_EMAIL`, `INVALID_PHONE`, `INVALID_ENUM`,
   `VALUE_TOO_LONG`, `DUPLICATE_IN_FILE`, plus severity `error | warning |
   info`. Human messages stay as today; codes are the contract.
3. Store issues in `StudentImportRow.errors` as a Json array of objects. Add a
   small reader that tolerates legacy string arrays so old sessions keep
   rendering (data is transient; no migration needed).
4. Move the current "unexpected columns ignored" warning out of the
   `failureMessage` string blob into row/session warnings.

**Acceptance:** identical inputs produce identical valid/invalid outcomes as
today; every issue carries a field and a code; `workbook.ts` parse logic is
thinner, not duplicated.

## 4. Phase 2 — Row-Edit Backend

**Goal:** server-authoritative single-cell correction without re-upload
(spec §13 PATCH equivalent).

1. Add `updateStudentImportRow(importId, rowId, field, value)` to
   `import/actions.ts`:
   - `requireTenantRole(["ADMIN"])`; session must belong to tenant and be in
     `READY` status.
   - Field must be a known `ColumnName`; value normalized (trim, etc.) exactly
     as the parser would.
   - Persist updated `rawData[field]`, then re-run **whole-row**
     `validateRow` (row-level rules like "student or guardian email required"
     stay consistent) and update status / errors / `normalizedData`.
   - Recount session counters (`validRows`, `invalidRows`, `skippedRows`) in
     the same transaction.
2. Extract the recount into a reusable helper so parse and edit share it.

**Acceptance:** editing an invalid cell to a valid value flips the row to
`VALID`, clears its issues, updates summary counts; editing a valid cell into
an invalid value flips it back; cross-field effects re-evaluate.

## 5. Phase 3 — Review & Fix Grid

**Goal:** the spec's Step 3 spreadsheet-like review experience.

1. On `[importId]/page.tsx`, when status is `READY`, replace the read-only
   problems table with an interactive review grid (client component):
   - Paginated ~50 rows/page over the filtered set using existing `ui/table`
     primitives.
   - Default filter **errors only**, toggle to all rows. (Search deferred — see
     §12.)
   - Row number column, per-row status badge, sticky header.
2. Invalid cells: destructive border/background **plus** error icon and
   tooltip/popover with the human message — never color-only (spec §17);
   include accessible text.
3. Edit controls by field type:
   - `<select>` for Gender, Academic Level (options fetched once server-side
     and passed down), Guardian Relationship.
   - Date input (`yyyy-MM-dd` contract) for Date of Birth, Enrolled Date.
   - Text input for everything else.
4. On save: call `updateStudentImportRow`, show pending state, refresh counts;
   blocking state derives from server counts, never client guesses.
5. Stepper reflects the review step (`current = 3` on `READY`).

**Acceptance:** user fixes a bad cell inline, sees the error clear immediately,
and the summary bar updates without any page reload or re-upload.

## 6. Phase 4 — Commit Gate & Final Review

**Goal:** align commit behavior with the locked policy (spec §22).

1. `startStudentImport`: refuse when `invalidRows > 0` with a message directing
   the user to fix or delete failing rows first.
2. Final-review card before the confirm dialog: totals, count of remaining
   non-blocking warnings, explicit "this creates student and guardian records"
   copy (already present in `import-runner.tsx` AlertDialog — keep it).
3. Result semantics: skipped = duplicates + post-validation failures only.

**Acceptance:** commit is impossible while any blocking error remains; the
confirm dialog states what will be created.

## 7. Phase 5 — Dedupe Tuning & Template Personalization

1. Replace the full-row SHA-256 fingerprint with an identity tuple:
   normalized (trimmed, lowercased) student name + DOB + guardian phone digits.
   Both/all colliding rows are flagged, not just later ones (spec §8).
2. Template additions to the Instructions sheet: tuition-centre name, template
   version constant (e.g. `student-import-v2`), generated timestamp.
3. Parse time: read the version cell when present; older/missing versions get a
   soft warning, not a hard block (spec §4 template versioning).

**Acceptance:** whitespace-only variants of the same student collide; template
identifies itself and its tenant.

## 8. Phase 6 — Session Retention

Delete terminal-state sessions (`COMPLETED`, `COMPLETED_WITH_ERRORS`, `FAILED`)
older than 30 days. Lazy approach: opportunistic `deleteMany` scoped to the
tenant during `/students/import` page load — no new job infrastructure needed.
Mark with a `ponytail:` comment naming the ceiling (cleanup only runs when an
ADMIN visits the page) and the upgrade path (cron/job when volume matters).

**Acceptance:** old terminal sessions disappear; active sessions are never
touched.

## 9. Phase 7 — Analytics

Extend the existing structured `console.info` pattern (no analytics SDK exists
in the repo) with funnel events: template downloaded, upload failed,
validation completed (with error-count-by-category totals), inline edit
performed, import committed/completed. Never log student field values.

**Acceptance:** funnel stages observable in logs without PII leakage.

---

## 10. Testing Strategy

Vitest is configured in `apps/app` (`apps/app/vitest.config.mts`).

- **Unit:** `validateRow` — required fields, each stable code, severities, date/
  email/phone/postcode edges, cross-field email rule; identity-fingerprint
  dedupe (whitespace/case variants collide, distinct students don't); header
  normalization edge cases (marker stripping, duplicates, unknown columns).
- **Unit (pure):** counter-recount helper — row status transitions produce
  correct session totals.
- **Integration-style:** `updateStudentImportRow` happy path and guards (wrong
  tenant, wrong status, unknown field) against a test database if available;
  otherwise test the extracted pure core.
- **Manual E2E checklist** (from spec §28): download → fill → upload → fix one
  bad cell inline → commit → verify students created; missing-column rejection;
  duplicate-ID handling; refresh mid-review resumes from server state.

## 11. Definition of Done

Spec §27 applies, verified against this repo:

- [ ] Invalid cells are editable in place and revalidated without re-upload.
- [ ] Errors carry stable codes and field attribution end-to-end.
- [ ] Commit is blocked while blocking errors remain; server revalidates.
- [ ] Within-file duplicates use identity fingerprints and flag all copies.
- [ ] Template self-identifies (version, centre, timestamp).
- [ ] Terminal sessions expire per retention rule.
- [ ] Funnel events logged without PII.
- [ ] Unit tests cover validation, dedupe, and recount logic.

## 12. Out of Scope (Deferred)

From spec §23 defer list plus deliberate scope cuts made in this plan:

- Search within the review grid (filters suffice until users ask).
- Virtualized grid / autocomplete-virtualized dropdowns (pagination covers the
  5,000-row ceiling).
- Resume-prompt UX beyond what server-persisted sessions already provide.
- Fuzzy duplicate matching, bulk update of existing students, multi-sheet
  imports, formula evaluation.
- Background-job infrastructure for retention and commit (client-driven batches
  stay, matching the current working pattern).
