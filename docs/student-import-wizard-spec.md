# Student Import Wizard — Product & Engineering Spec

## 1. Overview

Build a multi-step **Student Import Wizard** for the tuition SaaS that lets a school/admin user bulk-create students from an Excel spreadsheet while making data quality problems easy to understand and fix before anything is committed.

The core experience is:

1. User opens **Import Students**.
2. User downloads a **personalized Excel template** generated for their account/school.
3. User fills in the template and uploads the `.xlsx` file.
4. System parses the workbook and validates the **file, columns, and rows**.
5. System shows the imported data in a spreadsheet-like table.
6. Invalid cells are highlighted with clear explanations.
7. User fixes values **inline** in the table, with validation re-running immediately.
8. User reviews the final import summary.
9. User confirms import.
10. System creates the valid students and reports success/failures.

The wizard should optimize for **safe bulk import**, **fast error correction**, and **clear feedback**. The user should never need to repeatedly edit Excel, re-upload, and retry just to fix a few bad cells.

---

## 2. Goals

### Primary goals

- Make bulk student creation substantially faster than manual entry.
- Provide a simple, downloadable Excel template customized to the current tenant/school.
- Detect structural problems before row-level processing.
- Validate every imported row and field before creating records.
- Make errors actionable and fixable without leaving the import screen.
- Prevent accidental duplicate students and invalid data from being committed.
- Provide an explicit final review/confirmation step.
- Make the process safe for large imports.

### Non-goals for v1

- Importing arbitrary spreadsheet formats beyond `.xlsx`.
- Complex spreadsheet formulas/macros/VBA execution.
- Automatic fuzzy data correction without user approval.
- Importing every possible student-related entity in one file.
- Editing existing student records in bulk unless explicitly supported later.

---

## 3. Recommended Wizard Flow

### Step 1 — Prepare

Header: **Import students**

Explain:
- Download the Excel template.
- Fill in one student per row.
- Do not rename the required columns.
- Upload the completed file in the next step.

Actions:
- `Download template`
- `Continue to upload`

Show a compact description of supported fields.

If the tenant already has configurable student fields, include those fields in the personalized template where applicable.

### Step 2 — Upload

UI:
- Drag-and-drop zone.
- `Choose Excel file` button.
- Supported format note: `.xlsx`.
- Maximum file size clearly displayed.
- Optional maximum row count clearly displayed.

After selection:
- Upload file.
- Parse workbook.
- Identify the target worksheet.
- Validate structure.

Show progress for large files.

Possible states:
- Uploading
- Reading file
- Checking columns
- Validating rows
- Ready for review
- Failed

### Step 3 — Review & Fix

Main area:
- Spreadsheet-like data table.
- Sticky header.
- Row number column.
- Editable cells.
- Invalid cells highlighted.
- Cell-level error tooltip/message.
- Optional row status indicator.

Top summary bar should show:
- Total rows
- Valid rows
- Rows with errors
- Duplicate rows
- Warning count

Suggested controls:
- `Errors only`
- `All rows`
- Search
- Filter by error type
- Sort by row / field
- `Fix automatically` only for deterministic, low-risk transformations if later introduced

Each invalid field should provide a plain-language message, e.g.:
- `Required field`
- `Invalid email address`
- `Date must be YYYY-MM-DD`
- `Phone number is not valid`
- `Student ID already exists`
- `This value does not match an available class`

Inline editing requirements:
- Click/double-click invalid cell to edit.
- Preserve raw value while editing.
- Keyboard navigation should work where practical.
- Revalidate on blur and/or Enter.
- Valid cells should clear their error styling immediately after passing validation.
- Invalid edits should not be silently accepted.

### Step 4 — Final Review

Only available when there are no blocking errors.

Show:
- Total students to create.
- Any warnings that will not block import.
- Duplicate/skip behavior if supported.
- Summary of optional fields missing.

Primary CTA:
- `Import students`

Secondary action:
- `Back to review`

Confirmation should make it clear that the import will create student records.

### Step 5 — Import Result

Show:
- Number successfully imported.
- Number skipped.
- Number failed.
- Link/action to view created students.
- Downloadable error report if any rows failed after final server-side validation.

Example success state:

> 243 students imported successfully.
>
> 2 rows were skipped because they matched existing students.

---

## 4. Personalized Excel Template

### Purpose

The template should reduce user guesswork and maximize first-pass validation success.

### Template requirements

Generate the template dynamically for the current tenant/school.

At minimum, the workbook should contain:

1. **Students** — the sheet users fill in.
2. **Instructions** — short usage guidance.
3. **Reference Data** (optional, preferably hidden/protected) — allowed values for dropdowns/reference fields.

### Personalized content

The generated template may include:

- School/tenant name in the title/instructions.
- Tenant-specific fields configured for students.
- Tenant-specific class/branch/program values.
- Tenant-specific custom fields.
- Existing reference data needed to complete the sheet.
- Template version.
- Generated timestamp.

Do not embed sensitive data unnecessarily. The template should only contain the minimum reference information required to make valid imports easy.

### Example columns

Use the actual application's student schema, but the baseline template can be:

| Column | Required | Example |
|---|---|---|
| Student ID | Yes | STU-00125 |
| First Name | Yes | Aisyah |
| Last Name | Yes | Rahman |
| Preferred Name | No | Aisy |
| Date of Birth | No | 2015-04-12 |
| Gender | No | Female |
| Email | No | aisyah@example.com |
| Phone | No | +60123456789 |
| Parent/Guardian Name | No | Nur Rahman |
| Parent/Guardian Phone | No | +60129876543 |
| Class | Yes/No* | Primary 4 |
| Branch | Yes/No* | PJ Campus |
| Enrollment Date | No | 2026-08-01 |
| Notes | No | Allergic to peanuts |

`*` Whether these are required depends on the tenant's configuration and business rules.

### Excel UX

Where possible:
- Add header descriptions/comments.
- Freeze the header row.
- Apply sensible column widths.
- Apply data validation dropdowns for finite-choice fields.
- Apply date formatting to date fields.
- Apply text formatting to IDs and phone numbers so Excel does not strip leading zeroes.
- Include a template version identifier.
- Do not rely solely on Excel validation; the application must always validate server-side.

### Template versioning

Every generated template should contain a version, e.g. `student-import-v3`.

The backend should accept older compatible template versions when possible and provide a clear upgrade error when a file is structurally incompatible.

---

## 5. File Validation

Validation should happen in layers. Fail fast on file-level problems before expensive row validation.

### File-level checks

Reject with a clear message if:

- File is not `.xlsx`.
- File is unreadable/corrupt.
- File is empty.
- Workbook contains no usable worksheet.
- Expected worksheet cannot be found.
- File exceeds configured size limit.
- File exceeds configured row limit.
- Workbook uses unsupported features that prevent safe parsing.

### Sheet handling

Recommended v1 rule:
- Look for worksheet named `Students`.
- If absent, show the available sheet names and explain what is expected.
- Do not silently import from an arbitrary first worksheet.

Future option:
- Allow the user to choose which sheet to import.

---

## 6. Column Validation

Column validation must happen before row validation.

### Validate

- Required columns exist.
- Column names match expected normalized names.
- Duplicate column names are rejected.
- Unsupported/unrecognized columns are either rejected or clearly marked according to product policy.
- Required columns are not blank.
- Column order may be flexible unless the importer explicitly requires fixed order.

Recommended behavior: **column order is flexible; column names are authoritative**.

### Header normalization

Consider safe normalization for comparison only:
- Trim leading/trailing whitespace.
- Normalize repeated spaces.
- Case-insensitive comparison.

Do not mutate the user's displayed header silently.

Example:

` first name ` → match to `First Name`

but still display the original source header if presenting a structural warning.

### Unknown columns

Recommended v1 behavior:
- Treat unknown columns as warnings if they can safely be ignored.
- Treat unknown columns as blocking errors if silently ignoring them could cause data loss or user confusion.

Prefer a clear message:

> Column `Nick Name` is not recognized. Remove it or download a newer template.

---

## 7. Row & Cell Validation

Each row should be assigned a stable imported-row identifier, e.g. source row number, so errors remain traceable during editing.

### Required field validation

Examples:
- First Name required.
- Last Name required.
- Student ID required if the tenant uses student IDs.
- Class required if enrollment requires a class.

### Type validation

Examples:
- Date fields must parse as valid dates.
- Boolean fields must map to supported values.
- Numeric fields must be numeric where required.
- Email must match accepted email syntax.

### Length validation

Respect database/domain limits for:
- Names
- IDs
- Notes
- Email
- Phone
- Custom fields

### Enum/reference validation

For finite-choice values:
- Gender
- Branch
- Class
- Program
- Student status
- Any tenant-defined option

Validate against the current tenant's allowed values.

Error example:

> `Primary 5` is not an available class at this branch.

### Date validation

Use one canonical import format, preferably `YYYY-MM-DD`.

Support Excel-native date values when the parser exposes them reliably, but normalize the displayed value before final import.

Reject ambiguous dates such as `01/02/2015` unless the import contract explicitly supports locale-sensitive parsing.

### Phone validation

Normalize common formatting differences where safe, but preserve user intent.

Examples of safe transformations:
- Trim spaces.
- Normalize obvious separator characters.

Do not guess country codes unless the tenant has a configured default country/region and the rule is explicit.

### Email validation

- Trim whitespace.
- Validate syntax.
- Normalize case only where appropriate.

### Text normalization

Safe transformations may include:
- Trim leading/trailing whitespace.
- Normalize line breaks where required.

Avoid changing names beyond explicit deterministic rules.

---

## 8. Duplicate Detection

Duplicate detection should distinguish between:

1. **Duplicates within the uploaded file**.
2. **Duplicates against existing students**.

### Within-file duplicates

Example:

Rows 12 and 57 both use `STU-00125`.

Show both rows as invalid and explain the conflict.

### Existing-record duplicates

Use the tenant's configured unique identity rules.

Recommended hierarchy:
1. Student ID when configured as unique.
2. Other explicitly configured unique identifiers.
3. Do not use fuzzy name matching as a blocking rule in v1 unless business requirements demand it.

If a duplicate is found, the system should explain the reason and the available action:
- Fix value.
- Skip duplicate.
- Update existing record only if bulk update is explicitly supported.

For v1, prefer **create-only imports** with duplicates blocked/skipped rather than implicit updates.

---

## 9. Validation Severity

Use three levels.

### Error
Blocks import.

Examples:
- Missing required value.
- Invalid email.
- Unknown class.
- Duplicate unique ID.
- Invalid date.

### Warning
Does not block import, but should be visible before confirmation.

Examples:
- Optional field is empty.
- Unusual but technically valid value.
- Value was normalized.

### Info
Useful context that does not require action.

Examples:
- `Phone number normalized.`
- `Imported as text to preserve leading zeroes.`

---

## 10. Review Table UX

The review table is the core interaction and should feel closer to a lightweight spreadsheet than a read-only data grid.

### Required features

- Sticky column headers.
- Row numbers.
- Horizontal scrolling for wide datasets.
- Inline cell editing.
- Visible invalid state.
- Cell-level error messages.
- Row-level error indicator.
- Search.
- Filter to errors only.
- Keyboard-friendly navigation.
- Clear valid/invalid state changes after edits.

### Editing behavior

On edit:

1. User changes value.
2. Client validates immediately where practical.
3. Server validation is authoritative.
4. Cell state changes to valid/invalid.
5. Related row-level state recalculates.
6. Import summary updates.

Do not require a full-page reload or re-upload after every fix.

### Editing controls

Use specialized controls where appropriate:
- Date picker for date fields.
- Select/autocomplete for classes, branches, statuses, and other reference data.
- Plain text input for names/IDs.
- Phone input where appropriate.

For large datasets, avoid loading all reference options into every cell. Use virtualized dropdowns or search/autocomplete when needed.

### Error presentation

Prefer both visual and textual feedback:
- Invalid border/background state.
- Error icon.
- Tooltip/popover on hover/focus.
- Accessible text for screen readers.

Example:

`Class: Unknown class "P5"`

Suggested correction:

`Select: Primary 5`

A future enhancement can offer one-click replacement suggestions.

---

## 11. Import State Model

Represent the import session explicitly.

Recommended states:

```text
DRAFT
UPLOADING
PARSING
VALIDATING
READY_WITH_ERRORS
READY_TO_IMPORT
IMPORTING
COMPLETED
COMPLETED_WITH_ERRORS
FAILED
CANCELLED
```

A row can have:

```text
VALID
WARNING
ERROR
IMPORTED
SKIPPED
FAILED
```

Cell validation should include:

```text
value
normalizedValue
severity
code
message
```

---

## 12. Suggested Data Model

### ImportSession

```ts
interface ImportSession {
  id: string;
  tenantId: string;
  createdByUserId: string;
  templateVersion: string;
  fileName: string;
  fileSize: number;
  status: ImportSessionStatus;
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  importedRows: number;
  skippedRows: number;
  failedRows: number;
  createdAt: string;
  updatedAt: string;
}
```

### ImportRow

```ts
interface ImportRow {
  id: string;
  importSessionId: string;
  sourceRowNumber: number;
  status: ImportRowStatus;
  values: Record<string, unknown>;
  normalizedValues: Record<string, unknown>;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}
```

### ValidationIssue

```ts
interface ValidationIssue {
  field: string | null;
  code: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}
```

Avoid storing uploaded files forever. Apply a retention policy and delete temporary files when the import session is completed/expired.

---

## 13. API Design

Exact routes can follow the existing codebase conventions, but the system should expose equivalents of:

### Generate template

`GET /student-import/template`

Returns a generated `.xlsx` file for the current tenant.

### Create import session

`POST /student-import/sessions`

Creates the import session and returns its ID.

### Upload/import file

`POST /student-import/sessions/:id/file`

Uploads the `.xlsx` file.

### Get validation result

`GET /student-import/sessions/:id`

Returns summary, columns, row data, and validation status.

### Update a cell

`PATCH /student-import/sessions/:id/rows/:rowId`

Payload:

```json
{
  "field": "firstName",
  "value": "Aisyah"
}
```

Server revalidates the changed row.

### Batch update

Optional but recommended for performance:

`PATCH /student-import/sessions/:id/rows`

Use when the UI needs to save multiple edits together.

### Import/commit

`POST /student-import/sessions/:id/commit`

Server must revalidate all rows before creation. Never trust only the client-side validation state.

### Download error report

`GET /student-import/sessions/:id/errors.xlsx`

Exports unresolved/final failed rows with error messages.

---

## 14. Backend Validation Architecture

Use a shared validation layer so that:

- File import validation.
- Inline row validation.
- Final commit validation.

all use the same core business rules where practical.

Suggested pipeline:

```text
XLSX
  -> workbook parser
  -> worksheet selection
  -> header mapping
  -> raw row extraction
  -> normalization
  -> schema validation
  -> tenant/business-rule validation
  -> duplicate detection
  -> review model
  -> final server-side validation
  -> database transaction
```

The commit step must be authoritative.

### Transaction safety

On commit:
- Re-check authorization.
- Re-check tenant ownership.
- Re-check duplicate constraints.
- Revalidate rows.
- Create records transactionally where practical.
- Handle partial failures explicitly if the architecture cannot guarantee all-or-nothing.

Recommended v1 behavior: **all-or-nothing per valid import batch**, with clear handling for rows intentionally skipped as duplicates if that behavior is implemented.

---

## 15. Performance & Scalability

The review UI should remain usable for large imports.

Recommended starting limits:
- Max file size: configurable.
- Max rows: configurable, e.g. 5,000–20,000 depending on infrastructure.

Use:
- Streaming or memory-conscious XLSX parsing where feasible.
- Server-side pagination for very large row sets.
- Virtualized table rendering on the client.
- Debounced validation for rapid edits.
- Batch validation rather than one network request per keystroke.

Do not render tens of thousands of DOM table rows simultaneously.

---

## 16. Security & Permissions

Only authorized users should be able to import students.

Validate:
- Tenant ownership of import session.
- User permission to create students.
- File type and content.
- File size.
- Request rate/abuse limits.
- Spreadsheet content safely; never execute macros or formulas.

Treat all spreadsheet cell content as untrusted input.

### Spreadsheet formula injection

When generating downloadable error reports or templates, prevent values that begin with formula-triggering characters from being interpreted as formulas if they originated from user input.

Examples to treat cautiously:
- `=`
- `+`
- `-`
- `@`

Use the application's existing spreadsheet sanitization strategy.

---

## 17. Accessibility

The wizard should support:
- Keyboard navigation.
- Focus management between steps.
- Screen-reader accessible error messages.
- Clear non-color-only indication of invalid cells.
- Accessible labels for buttons and inputs.
- Logical tab order.
- Confirmation of destructive/large actions.

Do not communicate errors only via red cell borders.

---

## 18. Error Handling UX

Errors should be human-readable and actionable.

Bad:

> `INVALID_ENUM_VALUE`

Good:

> `Class "P5" is not available. Choose one of the available classes.`

For technical failures:

> We couldn't read this Excel file. Make sure it is a valid `.xlsx` file and try again.

Include a support/reference ID for unexpected server failures.

---

## 19. Empty / Edge Cases

Handle these explicitly:

- Empty file.
- Headers only, no rows.
- Completely blank rows in the middle of the file.
- Duplicate rows.
- Duplicate IDs.
- Unknown class/branch values.
- Mixed Excel date formats.
- Leading zeroes in phone/student IDs.
- Very long names/notes.
- Extra columns.
- Missing required columns.
- Duplicate headers.
- Hidden worksheets.
- Hidden columns.
- Formulas returning values.
- Cells containing errors such as `#N/A`.
- Unsupported workbook encryption/password protection.
- User closes/reloads the page during validation.
- User loses access to the tenant while an import is in progress.
- Two users importing the same student simultaneously.
- Import session expiry.

---

## 20. Autosave / Session Recovery

Recommended behavior:

- Persist import session server-side.
- Save edits automatically.
- If user refreshes the page, allow them to resume an active import session.
- Show when the latest edits were saved.

Do not rely only on local browser state for import recovery.

---

## 21. Analytics / Observability

Track events such as:

- Import wizard opened.
- Template downloaded.
- Upload started.
- Upload failed.
- Validation completed.
- Error count by category.
- Inline edit performed.
- Import committed.
- Import completed.
- Import failed.

Useful metrics:
- Template-to-upload conversion rate.
- Upload-to-complete conversion rate.
- Average rows per import.
- Average validation error rate.
- Average edits before successful import.
- Time from upload to successful commit.
- Most common validation errors.

Do not log sensitive student data unnecessarily.

---

## 22. UI Acceptance Criteria

### Template

- [ ] User can download a tenant-specific Excel template.
- [ ] Template contains all required columns for the tenant.
- [ ] Template includes helpful instructions.
- [ ] Reference-data dropdowns are included where useful.
- [ ] Template preserves IDs/phone numbers with leading zeroes where relevant.

### Upload

- [ ] `.xlsx` upload is supported.
- [ ] Invalid file types are rejected with a clear message.
- [ ] Large uploads show progress.
- [ ] File-level errors are shown before row-level review.

### Column validation

- [ ] Missing required columns are detected.
- [ ] Duplicate columns are detected.
- [ ] Unknown columns are handled according to the chosen policy.
- [ ] Column order does not matter unless explicitly configured otherwise.

### Row validation

- [ ] Every imported row receives validation state.
- [ ] Required fields are validated.
- [ ] Reference values are validated against tenant data.
- [ ] Duplicate students are detected.
- [ ] Validation errors include actionable messages.

### Inline editing

- [ ] Invalid cells can be edited directly in the review table.
- [ ] Changes are revalidated without re-uploading the file.
- [ ] Error state clears after a valid correction.
- [ ] Row and overall summaries update after edits.
- [ ] User can filter to rows with errors.

### Commit

- [ ] Import cannot be committed while blocking errors remain.
- [ ] Server performs final validation before creation.
- [ ] User sees a clear final summary before committing.
- [ ] Successful imports show the number of created students.
- [ ] Partial/final failures are clearly reported.

### Recovery

- [ ] User can resume an active import session after refresh.
- [ ] Import sessions expire according to a defined retention policy.

---

## 23. Recommended V1 Scope

Build the first release around these capabilities:

### Must have

1. Personalized `.xlsx` template generation.
2. Upload and parse one `Students` worksheet.
3. Header/column validation.
4. Required/type/reference/duplicate validation.
5. Spreadsheet-like review table.
6. Inline cell editing.
7. Server-side revalidation.
8. Final review and explicit commit.
9. Import result summary.
10. Error report download.

### Nice to have

1. Search and filter.
2. Reference-data dropdown/autocomplete inside the review table.
3. Resume after refresh.
4. Hidden reference-data sheet in template.
5. Batch cell/row updates.
6. Import analytics.

### Defer

1. Automatic fuzzy matching.
2. Bulk update of existing students.
3. Multi-sheet relationship imports.
4. Complex formula support.
5. Automatic correction of ambiguous values.

---

## 24. Suggested Frontend Component Structure

Adapt to the existing framework, but the conceptual structure can be:

```text
StudentImportWizard
├── ImportStepper
├── PrepareStep
│   ├── TemplateDownloadCard
│   └── ImportFieldSummary
├── UploadStep
│   ├── FileDropzone
│   └── UploadProgress
├── ReviewStep
│   ├── ImportSummaryBar
│   ├── ImportToolbar
│   ├── ImportDataGrid
│   │   ├── EditableCell
│   │   ├── ValidationMessage
│   │   └── RowStatus
│   └── ReviewFooter
├── ConfirmStep
│   └── ImportConfirmation
└── ResultStep
    └── ImportResultSummary
```

Keep business validation logic outside presentation components.

---

## 25. Suggested Validation Codes

Use stable codes so the UI can map behavior/messages without depending on free-form backend text.

```text
FILE_INVALID
FILE_TOO_LARGE
FILE_UNSUPPORTED
WORKSHEET_NOT_FOUND
HEADER_MISSING
HEADER_DUPLICATE
HEADER_UNKNOWN
REQUIRED
INVALID_FORMAT
INVALID_DATE
INVALID_EMAIL
INVALID_PHONE
INVALID_NUMBER
INVALID_ENUM
VALUE_TOO_LONG
DUPLICATE_IN_FILE
DUPLICATE_EXISTING
REFERENCE_NOT_FOUND
NORMALIZED
```

Codes should be stable even if human-facing messages change.

---

## 26. Important Product Decisions to Lock Down

Before implementation, confirm these with the existing student domain model:

1. What fields uniquely identify a student?
2. Is Student ID mandatory, optional, or tenant-configurable?
3. Which student fields are required?
4. Which fields are tenant-specific/custom fields?
5. Are class and branch mandatory at enrollment time?
6. Should an existing student ever be updated by import, or is this create-only?
7. What should happen when a duplicate is found: block, skip, or update?
8. What are the supported country/locale rules for phone numbers and dates?
9. What are the maximum upload size and row limits for the production environment?
10. Which existing permission controls govern student creation?

These decisions should be derived from the current application schema and business rules rather than duplicated in the import feature.

---

## 27. Definition of Done

The feature is ready for production when:

- A staff user with permission can download a personalized template.
- A completed template can be uploaded successfully.
- Structural problems are identified before data creation.
- Row/cell validation catches the configured business-rule violations.
- The review table makes errors obvious and allows inline correction.
- Corrected values are revalidated without requiring a new upload.
- No import can bypass final server-side validation.
- Duplicate behavior is deterministic and documented.
- Import results are auditable and understandable.
- Large imports perform within agreed limits.
- Sensitive student data is handled according to the application's existing security and retention requirements.
- Automated tests cover parsing, header validation, row validation, duplicate detection, inline edits, final commit validation, and failure scenarios.

---

## 28. Testing Strategy

### Unit tests

Cover:
- Header normalization/mapping.
- Required-field validation.
- Date parsing.
- Email/phone validation.
- Reference-data validation.
- Duplicate detection.
- Normalization rules.
- Stable validation codes.

### Integration tests

Cover:
- Template generation.
- Upload/parsing.
- Import session creation.
- Inline row updates.
- Final commit validation.
- Database transaction behavior.

### End-to-end tests

At minimum:

1. Download template → fill valid rows → upload → commit → verify students created.
2. Upload missing required column → verify blocked before row review.
3. Upload invalid values → verify highlighted cells and messages.
4. Fix invalid cells inline → verify errors disappear and import becomes available.
5. Upload duplicate student IDs → verify duplicate handling.
6. Refresh during review → verify session recovery.
7. Final commit after client-side state is stale → verify server-side validation prevents invalid creation.

---

## 29. Implementation Notes for Coding Agent

When implementing, first inspect the existing codebase for:

- Student entity/model and creation service.
- Tenant configuration and custom fields.
- Existing validation/schema library.
- Existing Excel/XLSX tooling.
- Existing data-grid/table component.
- Existing file upload/storage abstraction.
- Existing authorization/permission model.
- Existing background job infrastructure.
- Existing error-report/download patterns.

Prefer reusing existing domain validation and UI primitives rather than creating a parallel student schema or a second permission system.

The **single source of truth should remain the existing student domain model**. The import layer should transform spreadsheet data into that model, validate it using existing business rules, and then call the existing student-creation path.

Avoid putting spreadsheet-specific business logic directly into the data grid component.

---

## 30. UX Principle

The key product principle is:

> **“Upload once, fix in place, import with confidence.”**

The user should not have to leave the wizard to repair common data issues. The Excel file is the input format; the review table is the correction interface; the server-side domain validation is the final authority.
