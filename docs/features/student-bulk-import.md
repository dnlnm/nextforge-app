# Student Bulk Import

## 1. Overview

Add a **Student Bulk Import** feature that allows a tuition centre administrator to create many student records from an Excel spreadsheet.

The feature should provide a safe, user-friendly workflow:

1. Download an Excel template
2. Fill in student information
3. Upload the completed Excel file
4. Parse and validate the file
5. Preview the import results
6. Review validation errors
7. Download an error report if necessary
8. Confirm the import
9. Import valid records
10. Show the final import summary
11. Record the import in import history

The feature must support the application's existing **multi-tenant architecture** and must never allow imported data to cross tenant boundaries.

---

# 2. Goals

## Primary goals

- Allow administrators to import students efficiently.
- Make the process understandable for non-technical tuition-centre operators.
- Provide an Excel template instead of requiring users to understand database IDs.
- Validate all rows before importing.
- Show useful row-level validation errors.
- Prevent invalid records from being silently imported.
- Prevent cross-tenant data access.
- Provide an import summary.
- Keep an audit/history record of imports.
- Support large imports without blocking a normal HTTP request.

## Secondary goals

- Make the import system extensible for future bulk-import features.
- Reuse existing application architecture and dependencies.
- Avoid introducing unnecessary abstractions or dependencies.

---

# 3. Non-Goals for V1

The following should NOT be implemented unless the existing architecture makes them trivial and safe:

- Updating existing students through import.
- Deleting students through import.
- Importing arbitrary database relationships.
- Importing invoices.
- Importing payments.
- Importing attendance records.
- Importing historical academic results.
- Importing multiple parents/guardians per student unless already supported naturally by the existing domain model.
- Importing subjects/enrolments if this requires complex relationship mapping.
- CSV support if it adds significant complexity.
- Undo/rollback after a completed import.

These can be future enhancements.

---

# 4. User Roles

The feature should only be available to users who already have permission to create/manage students.

Do not introduce a new permission model if an existing authorization system already exists.

Use the application's existing:

- Authentication
- Authorization
- Role/permission checks
- Tenant resolution

The frontend must not be treated as the security boundary.

The backend must verify authorization.

---

# 5. User Flow

The recommended UI flow is a wizard.

## Step 1 — Template

The user sees:

> Import Students

Explain briefly:

> Download the Excel template, fill in your student information, then upload it here.

Actions:

- `Download Template`
- `Continue`

The template should be generated using the current tenant's data where appropriate.

For example, class dropdowns should contain classes belonging to the current tuition centre.

---

## Step 2 — Upload

The user uploads the completed Excel file.

Supported format for V1:

- `.xlsx`

CSV support may be added later.

The upload interface should:

- Accept drag-and-drop if consistent with the existing UI.
- Provide a file picker.
- Display the selected filename.
- Display basic file information.
- Reject unsupported file types.
- Reject files exceeding the application's configured maximum size.

---

## Step 3 — Review

After upload, the system parses and validates the file.

The user should see a summary such as:

```text
Total rows       1,000
Valid rows         972
Errors              28
Existing students   10
```

The exact categories should reflect the actual implementation.

The user should be able to inspect row-level problems.

Example:

```text
Row 12
Student name is required

Row 34
Invalid parent phone number

Row 57
Class "Form 99" does not exist

Row 102
Student already exists
```

Nothing should be permanently imported merely by uploading the file.

---

## Step 4 — Confirm Import

If there are valid rows, display a confirmation action such as:

> Import 972 Students

The UI should clearly communicate what will happen.

If there are invalid rows, valid rows may still be imported depending on the final implementation.

Recommended V1 behavior:

- Valid rows can be imported.
- Invalid rows are skipped.
- Existing students are skipped.
- The user is clearly informed about both.

---

## Step 5 — Import

The system processes the import.

For larger imports, this should be handled asynchronously using the application's existing background-job infrastructure.

If the application already uses:

- Redis
- BullMQ
- Workers
- Background jobs

reuse those systems.

Do not create a second queue architecture.

The UI should be able to show progress where practical.

Example:

```text
Importing students...

723 / 1,000

██████████████░░░░░░
```

---

## Step 6 — Complete

Display a final summary:

```text
Import completed

Created       962
Skipped        10
Invalid        28

Total         1,000
```

Provide:

- `View Import Details`
- `Download Error Report` if errors exist
- `Back to Students`

---

# 6. Excel Template

## 6.1 General Requirements

The system should generate an `.xlsx` template.

The template should be designed for non-technical users.

It should contain:

1. Instructions sheet
2. Student data sheet
3. Example row
4. Appropriate Excel data validation
5. Tenant-specific choices where practical

---

# 7. Template Structure

Recommended workbook:

```text
Student Import Template.xlsx

├── Instructions
├── Students
└── Lists
```

The exact implementation may differ depending on the chosen Excel library.

---

## 7.1 Instructions Sheet

Explain:

- What the template is for.
- Which fields are required.
- Accepted formats.
- How to enter dates.
- How to select classes.
- How to handle phone numbers.
- What happens to duplicate students.
- What happens if a row contains an error.
- How to upload the completed file.

Example:

```text
Student Bulk Import

1. Fill in the Students sheet.
2. Do not rename the column headers.
3. Fields marked as required must be completed.
4. Select values from dropdowns where provided.
5. Do not delete the header row.
6. Save the file as .xlsx.
7. Upload the file through KLIO.
```

---

# 8. Student Template Fields

The exact fields must be adapted to the existing database/domain model after inspecting the repository.

Potential fields:

## Student

- Student Name *
- Student ID
- IC / MyKid
- Date of Birth
- Gender

## Parent / Guardian

- Parent Name *
- Parent Phone *
- Parent Email

## Academic

- Class *
- School
- Academic Year

## Optional

- Address
- Notes

Do not blindly create duplicate database fields if equivalent fields already exist.

The existing database schema is authoritative for actual field names and relationships.

---

# 9. Excel Data Validation

Where practical, use Excel data validation.

Examples:

## Gender

Dropdown:

```text
Male
Female
```

The actual values must match the application's existing domain conventions.

## Class

Dropdown containing classes belonging to the current tenant.

For example:

```text
Standard 1
Standard 2
Standard 3
Standard 4
```

Users must NOT have to enter internal database IDs.

The backend should resolve:

```text
"Standard 3"
```

to the appropriate class record belonging to the current tenant.

---

# 10. Important Template Rule

Do not make the user enter database identifiers such as:

```text
classId = 8f73a8c2...
```

The spreadsheet should be human-readable.

Use:

```text
Standard 3
```

and resolve it server-side.

The backend must still validate that the referenced class belongs to the authenticated tenant.

---

# 11. File Validation

Before parsing/importing the data, validate the uploaded file.

Check:

- File exists.
- File is an allowed format.
- File size is within configured limits.
- Workbook is readable.
- Required worksheet exists.
- Required columns exist.
- Required headers are not duplicated.
- Workbook is not corrupted.

Do not rely solely on the filename extension.

---

# 12. Column Validation

The importer should detect:

- Missing required columns.
- Unexpected columns.
- Duplicate columns.
- Empty headers.
- Renamed required columns.

The implementation should decide whether unexpected columns are:

- Ignored
- Warned about
- Rejected

Prefer the least disruptive behavior that is consistent with the existing application.

Do not silently ignore required fields.

---

# 13. Row Validation

Every row should be validated independently.

Do NOT stop processing at the first invalid row.

Example:

```text
Row 12
Student name is required.

Row 34
Invalid phone number.

Row 57
Class does not exist.

Row 102
Student already exists.

Row 301
Invalid date.
```

The importer should collect all relevant errors.

---

# 14. Validation Categories

## Required fields

Validate fields that are required by the domain model.

Potential examples:

- Student Name
- Parent Name
- Parent Phone
- Class

Do not hard-code these requirements without checking the existing application schema and business rules.

---

## Data types

Validate:

- Strings
- Dates
- Emails
- Phone numbers
- Enumerations
- Numeric fields

Use the application's existing validation conventions.

If the application already uses a validation library such as Zod, reuse it.

Do not introduce a second validation framework unnecessarily.

---

## Date validation

Ensure dates are valid.

Handle Excel date values correctly.

Do not assume every Excel date is stored as a plain string.

Normalize dates into the application's expected format before persistence.

---

## Gender validation

If gender is an enum/domain value, validate against the existing allowed values.

Do not create a new gender representation specifically for the importer.

---

## Phone validation

Use the application's existing phone-number validation conventions.

If no existing convention exists, ensure that:

- Empty values are handled according to whether the field is required.
- Invalid characters are detected where appropriate.
- International/Malaysian formats are handled consistently.

Do not silently modify user-entered phone numbers unless the application's existing behavior already normalizes them.

---

# 15. Database / Domain Validation

After basic row validation, perform domain-level validation.

Examples:

- Does the referenced class exist?
- Does the class belong to the current tenant?
- Does the student already exist?
- Does the parent already exist?
- Are required relationships valid?
- Are existing unique constraints satisfied?

The importer must respect the application's existing business rules.

---

# 16. Duplicate Student Handling

For V1:

> Existing students should be skipped rather than overwritten.

Do NOT update existing student records automatically.

Do NOT use student name alone as the duplicate identifier.

Potential identifiers may include:

- Existing student ID
- IC / MyKid
- Other unique identifier already defined by the application

The actual duplicate strategy must be based on the existing domain model.

If no reliable identifier exists, the system should avoid making unsafe assumptions.

Possible result:

```text
Skipped:
Student already exists.
```

---

# 17. Parent / Guardian Deduplication

If the application has a parent/guardian entity, inspect the existing relationship model.

Do not blindly create duplicate parent records for every student.

If the existing system has a reliable parent identifier, reuse it.

If parent deduplication is ambiguous, document the limitation and avoid implementing risky matching logic.

---

# 18. Multi-Tenant Security

This is a critical requirement.

Every import operation must execute within the authenticated user's tenant context.

Never trust tenant IDs supplied by:

- Excel
- Request body
- Query parameters
- Client-side state
- Hidden form fields

The authenticated tenant must determine ownership.

---

## 18.1 Class Lookup

Incorrect:

```text
findClass({
  id: classId
})
```

Preferred conceptually:

```text
findClass({
  id: classId,
  tenantId: currentTenantId
})
```

Use the actual repository's ORM/query conventions.

---

## 18.2 Student Lookup

Existing student checks must also be tenant-scoped.

Never allow a student belonging to Tenant A to be treated as an existing student for Tenant B.

---

## 18.3 Parent Lookup

Parent/guardian lookups must follow the application's tenant-isolation model.

---

## 18.4 Authorization

The backend must verify that the current user has permission to import/create students.

Frontend visibility is not sufficient.

---

# 19. Import Architecture

Prefer the following architecture where appropriate:

```text
Browser
   │
   │ Upload
   ▼
Import API
   │
   ├── Authenticate
   ├── Authorize
   ├── Validate file
   └── Store file
          │
          ▼
     Create Import
          │
          ▼
       Queue Job
          │
          ▼
    Import Worker
          │
          ├── Parse
          ├── Normalize
          ├── Validate
          ├── Resolve relationships
          ├── Detect duplicates
          └── Persist batches
                  │
                  ▼
             PostgreSQL
                  │
                  ▼
             Import Result
```

However:

**Do not introduce this architecture blindly.**

First inspect the existing repository.

If the application already has a background-job system, reuse it.

If there is no background processing infrastructure, evaluate whether the expected import size justifies introducing one.

---

# 20. BullMQ / Redis

If BullMQ and Redis already exist in the application, they should be considered the preferred mechanism for large imports.

Example conceptual flow:

```text
POST /imports/students
        │
        ▼
Create import record
        │
        ▼
Queue BullMQ job
        │
        ▼
Return import ID
        │
        ▼
Worker processes import
```

The frontend can then poll or subscribe to import status using whatever mechanism already exists in the application.

Do not create a separate queue system.

---

# 21. Batch Processing

Do not assume that 10,000 students should be inserted in a single giant transaction/request.

Process records in reasonable batches.

Potential batch size:

```text
100–500 rows
```

The exact batch size should be determined based on the existing ORM/database architecture.

The implementation should prioritize:

- Reliability
- Memory usage
- Database performance
- Retryability

---

# 22. Transaction Strategy

Use transactions appropriately.

The importer should not leave partially-created relational data when a single student fails unexpectedly.

However, do not necessarily wrap an entire 10,000-row import in one giant transaction.

Prefer batch-level transactions where appropriate.

The implementation should follow the application's existing transaction patterns.

---

# 23. Import Status

Create an import record if the application does not already have an equivalent system.

Potential statuses:

```text
pending
processing
completed
completed_with_errors
failed
```

Status names should follow existing application conventions.

---

# 24. Import History

Track enough information to allow administrators to understand what happened.

Potential fields:

```text
id
tenantId
filename
status
totalRows
validRows
invalidRows
importedRows
skippedRows
createdAt
completedAt
errorFileReference
```

Adapt these to the application's existing database naming conventions.

Do not create redundant fields if equivalent information already exists.

---

# 25. Error Report

If invalid rows exist, generate an Excel error report.

Example:

```text
students-import-errors.xlsx
```

The error report should contain the original row data plus an error column.

Example:

| Student Name | Parent Name | Parent Phone | Class | Import Error |
|---|---|---|---|---|
| Ahmad | Ali | 01234 | Standard 4 | Invalid phone |
| Sarah | Abu | | Standard 3 | Parent phone required |
| John | Lim | 0112345678 | Form 99 | Class does not exist |

If a row has multiple errors, represent them clearly.

Example:

```text
Student name is required; Parent phone is invalid
```

Do not expose internal stack traces or sensitive implementation details.

---

# 26. Error Report Security

Error files can contain personal information.

Therefore:

- Store them using the application's existing secure file-storage mechanism.
- Do not make them publicly accessible.
- Ensure only authorized users from the same tenant can access them.
- Use existing signed/private download mechanisms if available.
- Respect existing file retention policies.

Do not expose error files through predictable public URLs.

---

# 27. Import Preview

Before final import, the system should provide a summary.

Example:

```text
Import Preview

Total rows       1,000
Valid              972
Existing            10
Invalid              28

Nothing has been imported yet.

[Download Errors]

[Import 972 Students]
```

The UI should make it obvious that uploading does not automatically create records.

---

# 28. Import Result

After completion:

```text
Import Completed

Created       962
Skipped        10
Invalid        28
------------------
Total       1,000
```

The actual numbers and categories should correspond to the import result.

Provide an error download if errors occurred.

---

# 29. UI Requirements

Follow the application's existing design system.

Do not introduce a new UI framework or design language.

Reuse existing:

- Buttons
- Cards
- Tables
- Dialogs
- Toasts
- Progress indicators
- File upload components
- Form components
- Empty states
- Error states

Recommended wizard:

```text
Template
   ↓
Upload
   ↓
Review
   ↓
Import
   ↓
Complete
```

The UI should work well on desktop because Excel bulk import is likely to be performed primarily by tuition-centre administrators on computers.

---

# 30. Student Page Integration

The Students page should expose the feature using the existing action pattern.

Potential UI:

```text
Students

[ Add Student ] [ Import Students ]
```

Do not introduce a separate navigation area unless the existing application architecture calls for it.

---

# 31. Import History UI

If import history is implemented, administrators should be able to see previous imports.

Potential columns:

```text
Date
File
Status
Total
Created
Skipped
Errors
```

Example:

```text
09 Aug 2026
students-2026.xlsx
Completed with errors
1,000 rows
962 created
10 skipped
28 errors
```

Use existing table/list patterns.

---

# 32. API Design

Inspect the existing API architecture before deciding exact routes.

Potential conceptual endpoints:

```text
GET  /student-import/template
POST /student-imports
GET  /student-imports/:id
GET  /student-imports/:id/errors
POST /student-imports/:id/execute
```

These are examples only.

Use the application's existing:

- Routing conventions
- REST/RPC conventions
- Server actions
- API naming
- Authentication middleware
- Error response format

Do not introduce a new API style.

---

# 33. Separation of Concerns

Keep the importer separated into logical stages:

```text
File handling
      ↓
Parsing
      ↓
Normalization
      ↓
Schema validation
      ↓
Domain validation
      ↓
Duplicate detection
      ↓
Persistence
      ↓
Result generation
```

Avoid putting the entire import process into a single controller/API handler.

The exact module/service structure should follow the existing codebase.

---

# 34. Normalization

Before validation/persistence, normalize input where appropriate.

Potential examples:

- Trim unnecessary whitespace.
- Normalize empty Excel cells.
- Normalize date representations.
- Normalize phone numbers if consistent with existing application behavior.
- Normalize enum values according to existing conventions.

Do not perform destructive transformations that change user data unexpectedly.

---

# 35. Performance

The implementation should be able to handle normal tuition-centre imports efficiently.

Design for at least:

```text
100 students
1,000 students
5,000 students
```

without requiring the user to split the file manually.

The actual maximum import size should be configurable.

Do not prematurely optimize for millions of students.

---

# 36. Failure Handling

If an unexpected system error occurs:

- Mark the import as failed.
- Record an appropriate error state.
- Do not expose internal stack traces to the user.
- Log enough information for debugging.
- Preserve tenant context in logs where appropriate.
- Avoid logging unnecessary sensitive student information.

If a single row has invalid data, it should normally be treated as a row-level error rather than failing the entire import.

---

# 37. Retry Behavior

If background jobs are used:

- Follow the existing retry strategy.
- Ensure retries do not create duplicate students.
- Design persistence operations to be idempotent where practical.
- Do not blindly retry operations that could create duplicate records.

The import should be safe to retry after a worker failure.

---

# 38. Idempotency

The importer should avoid duplicate creation when the same job is retried.

Use existing unique constraints and reliable identifiers where available.

Do not rely solely on:

```text
student.name
```

for idempotency.

---

# 39. Logging

Log important import lifecycle events:

```text
Import created
Import started
Import completed
Import failed
```

Where appropriate include:

- import ID
- tenant ID
- user ID
- filename
- row counts
- status

Avoid logging unnecessary personal information such as:

- IC numbers
- phone numbers
- addresses

unless required for debugging and consistent with the application's logging/security policy.

---

# 40. Testing Requirements

Tests should be added according to the existing project testing conventions.

At minimum, test:

## File validation

- Valid `.xlsx`
- Unsupported file
- Corrupted workbook
- Missing worksheet
- Missing required columns

## Row validation

- Valid row
- Missing required field
- Invalid date
- Invalid phone
- Invalid enum
- Invalid class

## Duplicate handling

- Existing student
- New student
- Duplicate rows within the same import

## Multi-tenancy

Critical tests:

- Cannot reference another tenant's class.
- Cannot detect another tenant's student as an existing student.
- Cannot import data into another tenant.
- User without permission cannot start an import.
- Error file cannot be accessed by another tenant.

## Import execution

- Valid records are created.
- Invalid records are skipped.
- Existing records are skipped.
- Correct counts are recorded.
- Import status changes correctly.

## Error report

- Invalid rows appear in the error report.
- Error messages are included.
- Original data is preserved.
- Error file access is secured.

---

# 41. Database Constraints

Do not rely exclusively on application-level validation.

Where appropriate, preserve/enforce existing database constraints.

Examples:

- Tenant ownership
- Unique identifiers
- Foreign keys
- Required relationships

If new constraints are required, explain why before introducing them.

---

# 42. Security Checklist

Before considering the feature complete, verify:

- [ ] Authentication required.
- [ ] Authorization checked server-side.
- [ ] Tenant derived from authenticated context.
- [ ] Uploaded tenant IDs are ignored.
- [ ] Class lookups are tenant-scoped.
- [ ] Student lookups are tenant-scoped.
- [ ] Parent lookups are tenant-scoped.
- [ ] Error files are private.
- [ ] Error files are tenant-scoped.
- [ ] File size limits exist.
- [ ] File type validation exists.
- [ ] Sensitive data is not unnecessarily logged.
- [ ] Background jobs preserve tenant context.
- [ ] Retry behavior cannot create duplicates.

---

# 43. Dependency Policy

Before adding a dependency:

1. Search the existing project dependencies.
2. Determine whether the required functionality already exists.
3. Prefer existing dependencies.
4. Add a new dependency only when there is a clear benefit.

Potential functionality may require:

- Excel parsing/generation
- Validation
- Background jobs

But do not assume specific libraries before inspecting the repository.

If a suitable existing library is already used, reuse it.

---

# 44. Architecture Decision Rules

The existing codebase is authoritative for:

- Naming
- Folder structure
- Database conventions
- API conventions
- Authentication
- Authorization
- Validation
- UI components
- State management
- Background jobs
- File storage
- Error handling
- Testing

This specification defines **desired behavior**, not permission to rewrite existing architecture.

Do not refactor unrelated parts of the application merely to implement this feature.

---

# 45. Suggested Implementation Order

Implement in this order:

## Phase 1 — Repository analysis

Inspect:

- Student domain
- Parent domain
- Class domain
- Tenant architecture
- Auth
- File storage
- Validation
- Existing import features
- Background jobs
- Tests
- UI patterns

Produce an implementation plan before modifying code.

---

## Phase 2 — Domain/database

Implement any required:

- Import model
- Import status
- Import metadata
- Database migration

Only if equivalent functionality does not already exist.

---

## Phase 3 — Excel template

Implement:

- Template generation
- Instructions
- Headers
- Example row
- Tenant-specific class dropdowns
- Excel validation

---

## Phase 4 — Parser

Implement:

- Workbook parsing
- Worksheet detection
- Header mapping
- Row normalization

---

## Phase 5 — Validation

Implement:

- File validation
- Schema validation
- Domain validation
- Tenant validation
- Duplicate detection

---

## Phase 6 — Preview

Implement:

- Upload
- Validation
- Import preview
- Error display
- Error counts

---

## Phase 7 — Import execution

Implement:

- Import confirmation
- Batch processing
- Student creation
- Parent handling
- Class resolution
- Duplicate skipping
- Import status

---

## Phase 8 — Error report

Implement:

- Error workbook generation
- Secure storage
- Download
- Error messages

---

## Phase 9 — Import history

Implement:

- Import history
- Status
- Counts
- File information
- Error download

Only if not already covered by the import model.

---

## Phase 10 — Testing

Run:

- Unit tests
- Integration tests
- Database tests
- Tenant-isolation tests
- Type checking
- Linting
- Existing project test suite

Fix failures before considering the feature complete.

---

# 46. Future Enhancements

Potential V2 features:

- CSV import
- Update existing students
- Import parents separately
- Multiple parents/guardians
- Student enrolments
- Subject assignments
- Bulk class assignment
- Import rollback
- Import history details
- Import cancellation
- Import progress via realtime updates
- Saved import mappings
- Custom column mapping
- Multiple Excel templates
- Automatic duplicate suggestions
- Import from Google Sheets

These should not expand V1 scope unless explicitly approved.

---

# 47. Definition of Done

The feature is complete when:

- [ ] Authorized administrators can access Student Bulk Import.
- [ ] Users can download an Excel template.
- [ ] Template contains appropriate instructions.
- [ ] Template contains tenant-specific class choices where appropriate.
- [ ] Users can upload an `.xlsx` file.
- [ ] Invalid files are rejected safely.
- [ ] Required columns are validated.
- [ ] Every row is validated.
- [ ] Multiple row errors are collected.
- [ ] Class references are resolved within the current tenant.
- [ ] Existing students are detected according to the application's duplicate rules.
- [ ] Existing students are skipped in V1.
- [ ] No cross-tenant data access is possible.
- [ ] User can preview the import.
- [ ] Nothing is imported before confirmation.
- [ ] Valid rows can be imported.
- [ ] Invalid rows are skipped.
- [ ] Import counts are accurate.
- [ ] Error reports can be generated.
- [ ] Error reports are securely accessible.
- [ ] Import status is tracked.
- [ ] Import history is available if implemented.
- [ ] Large imports do not require one enormous HTTP request.
- [ ] Background processing is used where appropriate.
- [ ] Retry behavior does not create duplicate students.
- [ ] Relevant tests are implemented.
- [ ] Typecheck passes.
- [ ] Lint passes.
- [ ] Relevant tests pass.
- [ ] No unrelated functionality is broken.

---

# 48. Instructions for the Coding Agent

Before implementing this feature:

1. Read this specification completely.
2. Inspect the existing repository.
3. Identify existing models/services/components that should be reused.
4. Identify existing file-upload/storage functionality.
5. Identify existing validation functionality.
6. Identify existing background-job functionality.
7. Identify existing tenant-scoping patterns.
8. Identify existing testing conventions.
9. Produce an implementation plan.
10. Identify decisions that require approval.

Do not immediately start modifying files.

The specification defines the desired feature behavior.

The existing codebase defines how that behavior should be implemented.

Do not introduce unnecessary dependencies.

Do not refactor unrelated code.

Do not weaken tenant isolation.

Do not bypass existing authorization.

Do not trust data from the uploaded spreadsheet for ownership or tenant selection.

When implementation begins, work incrementally and verify each phase before continuing.

Run the appropriate tests, type checks, and lint checks before declaring the feature complete.