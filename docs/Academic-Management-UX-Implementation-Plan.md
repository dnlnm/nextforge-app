# Academic Management UX Implementation Plan

Companion to `Academic-Management-UX-Improvement-Plan.md`. This implementation
plan is based on the current repository state and translates the UX proposal into
ordered engineering work.

**Status:** Ready for engineering execution. No application code was changed to
produce this document.

---

## 1. Objective

Transform the academic administration experience from disconnected CRUD screens
into workflow-oriented dashboards and operations while preserving the existing
tenant, authorization, billing, and mobile architecture.

The implementation must:

- make student, teacher, class, subject, and level information actionable from one
  place;
- make enrollment, transfer, and enrollment termination explicit domain workflows;
- provide accurate, consistently defined dashboard metrics;
- reuse the same business rules in the web app and `@repo/api`;
- expose stable contracts that can later support mobile parity;
- preserve organization isolation and OWNER/ADMIN/TEACHER role restrictions.

---

## 2. Verified Repository State

The UX proposal describes several capabilities that are already partially present.
Implementation should extend these screens instead of replacing working behavior.

| Area | Current implementation | Main gap |
|---|---|---|
| Students | List, create, edit, import, archive/restore, and a detailed tabbed profile at `apps/app/app/(workspace)/students/[studentId]/page.tsx` | Summary metrics are calculated from truncated records; no activity timeline, enroll, transfer, or print workflow |
| Teachers | List and selected-teacher side panel in `teachers-page-client.tsx` | No teacher detail route, weekly timetable, weekly hours, or workload indicator |
| Classes | List, create, edit, schedules, active enrollment editing, and enrollment actions | Detail page is edit-centric; no capacity/health dashboard, add/bulk-add UI, or transfer workflow |
| Subjects | Detailed dashboard with classes, distinct students, and teachers | Attendance rate is missing |
| Academic levels | Grouped CRUD list with student and class counts | No detail route or subject/teacher overview |
| Enrollment | `Enrollment` model and web/API create/end operations exist | No single-screen center, bulk enrollment, capacity enforcement, or atomic transfer operation |
| Schedules | `ClassSchedule`, class schedule builder, and teacher-scoped Today view exist | No calendar grouped by teacher, room, or class; no room-conflict validation |
| Attendance | Web and mobile marking flows are implemented | Dashboard aggregation and expected-session semantics are not centralized |
| Student billing | Invoices, invoice lines, payments, and allocations are implemented on web | Class revenue semantics are ambiguous for partial invoice payments |
| Mobile | Students list, teacher classes, rosters, and attendance exist | Student detail, academic dashboards, enrollment management, invoices, and payments lack parity |

### 2.1 Existing routes to preserve

- `/students`, `/students/new`, `/students/[studentId]`, and student import routes
- `/teachers`, `/teachers/new`, and `/teachers/invite`
- `/classes`, `/classes/new`, and `/classes/[classId]`
- `/subjects` and `/subjects/[subjectId]`
- `/academic-levels`
- `/today` and `/attendance`
- `/invoices`, `/payments`, and `/reports`

### 2.2 New routes

| Route | Purpose | Initial roles |
|---|---|---|
| `/teachers/[teacherId]` | Teacher dashboard, schedule, classes, and analytics | OWNER, ADMIN |
| `/academic-levels/[levelId]` | Level overview and hierarchy navigation | OWNER, ADMIN |
| `/enrollment` | Single-screen enroll, transfer, bulk add, and end workflow | OWNER, ADMIN |
| `/academics` | Level to subject to class hierarchy browser | OWNER, ADMIN |
| `/schedules` | Calendar grouped by teacher, room, or class | OWNER, ADMIN; scoped read view for TEACHER later |
| `/students/[studentId]/print` | Print-friendly student profile | OWNER, ADMIN |

---

## 3. Implementation Decisions

These definitions remove ambiguity before dashboard queries and UI work begin.

### 3.1 Metric contracts

| Metric | Definition |
|---|---|
| Active classes | Active, non-archived enrollments whose class is active and non-archived |
| Student attendance rate | `(PRESENT + LATE) / all non-EXCUSED marked records * 100`; default period is current academic year; display `No data` when the denominator is zero |
| Subject/class attendance rate | Same formula across attendance records for included active classes during the selected period |
| Outstanding balance | Sum of `max(totalSen - amountPaidSen, 0)` for non-void invoices; never derived from a limited recent-invoice list |
| Teacher student count | Distinct active students across the teacher's active classes |
| Weekly teaching hours | Sum of active class schedule durations in minutes divided by 60; overlapping schedules are not double-counted after conflict validation |
| Teacher workload | Class-count thresholds from the UX proposal: Light `0-5`, Medium `6-10`, Heavy `11+` active classes |
| Class capacity utilization | Active enrollment count divided by capacity; show count only when capacity is null |
| Class revenue in Phase 1 | **Billed revenue**, calculated from non-void `InvoiceLineItem.totalSen` where `classId` matches |
| Class outstanding fees | Outstanding invoice value attributable to class invoice lines; do not label this as collected revenue |
| Enrollment trend | Enrollment starts and ends grouped by calendar month |

`InvoiceLineItem` identifies a class, but `PaymentAllocation` allocates to an invoice,
not to individual invoice lines. Exact collected revenue by class is therefore not
currently representable for multi-class invoices with partial payments. Phase 1 and
Phase 3 must use **billed revenue**. A collected-revenue metric requires a separate
product/data decision before implementation.

### 3.2 Enrollment and capacity policy

- Normal enrollment and transfer must reject an active destination class at or above
  its configured capacity.
- A class with `capacity = null` is treated as unlimited.
- Bulk enrollment must validate all selected students before writing and return
  per-student errors without creating duplicate active enrollments.
- Transfers must be atomic: end the source enrollment, create the destination
  enrollment, and write the activity event in one database transaction.
- Transfers preserve the source custom fee by default, but the confirmation step may
  override it.
- Ending an already-ended enrollment is idempotent.
- Archived students and archived classes cannot receive new enrollments.

### 3.3 Activity timeline policy

Use the existing `AuditEvent` model as the initial activity store. Every
student-related event must use:

- `organizationId`: active tenant;
- `actorUserId`: authenticated actor when available;
- `targetType`: `Student`;
- `targetId`: student ID;
- `action`: the closest existing `AuditAction` value;
- `summary`: human-readable timeline text;
- `metadata.eventType`: stable event discriminator;
- metadata identifiers such as `classId`, `sourceClassId`, `destinationClassId`,
  `invoiceId`, `paymentId`, or `sessionId`.

Initial event types:

- `student.created`
- `student.archived`
- `student.restored`
- `enrollment.created`
- `enrollment.ended`
- `enrollment.transferred`
- `attendance.marked`
- `invoice.generated`
- `payment.recorded`
- `payment.reversed`

Events begin when event producers are deployed. Do not fabricate a full historical
timeline. The UI may show the existing `Student.createdAt` as a synthetic first event
when no persisted creation event exists.

### 3.4 Academic hierarchy policy

The first `/academics` release is an **operational hierarchy** derived from existing
classes:

```text
Level
  Subject
    Class
```

There is no direct Level-to-Subject relation. Subjects without a class cannot appear
under a level. Do not add a curriculum join table unless product requirements expand
the planner to include planned subjects that do not yet have classes.

### 3.5 Authorization policy

- All dashboard queries are scoped by `organizationId` on the server.
- OWNER and ADMIN can use all management workflows.
- TEACHER access remains scoped to the linked `TeacherProfile` and assigned classes.
- Client-supplied organization IDs or roles are never trusted.
- Server actions and tRPC procedures remain transport/auth adapters; shared domain
  services own reusable rules and transactions.

---

## 4. Target Architecture

A small part of the original "Architecture Cleanup" phase must precede the visible
features. Adding dashboards and workflows directly to server actions would create a
third set of metrics and deepen existing duplication between the web app and
`@repo/api`.

```text
apps/app server component or server action
  -> authorization + form adaptation
  -> @repo/domain query or command
  -> @repo/database

packages/api tRPC procedure
  -> authentication + tenant/RBAC + input adaptation
  -> @repo/domain query or command
  -> @repo/database

apps/mobile
  -> tRPC
  -> packages/api
  -> @repo/domain
```

### 4.1 Proposed package

```text
packages/domain/
  package.json
  tsconfig.json
  index.ts
  students/
    activity.ts
    dashboard.ts
  teachers/
    dashboard.ts
  classes/
    dashboard.ts
    enrollment.ts
    schedule.ts
  subjects/
    dashboard.ts
  levels/
    dashboard.ts
  academics/
    dashboard.ts
  __tests__/
```

The package is server-only and may depend on `@repo/database`. It must not be imported
by the mobile bundle. Inputs must explicitly include tenant and actor context; service
queries must not accept an unscoped record ID by itself.

### 4.2 Service responsibilities

| Service/module | Responsibility |
|---|---|
| `StudentDashboardService` | Accurate overview totals, primary guardian, recent records, trends |
| `StudentActivityService` | Consistent event writes and student timeline reads |
| `TeacherDashboardService` | Distinct students, active classes, weekly minutes, subjects, schedule, workload |
| `ClassDashboardService` | Capacity, attendance, billed revenue, outstanding fees, enrollment trend |
| `ClassEnrollmentService` | Enroll, bulk enroll, transfer, update fee, and end enrollment transactions |
| `ClassScheduleService` | Time parsing, teacher and room conflict validation, grouped schedule queries |
| `SubjectDashboardService` | Classes, students, teachers, and attendance rate |
| `LevelDashboardService` | Students, classes, distinct subjects, and distinct teachers |
| `AcademicDashboardService` | Level/subject/class hierarchy query |

Avoid class wrappers when plain exported functions are sufficient. The service names
above describe ownership, not a requirement to implement JavaScript classes.

---

## 5. Delivery Plan

Work is ordered by dependency rather than following the source document literally.
Each work item should be delivered as a reviewable vertical slice with tests.

### Phase 0 - Baseline and Contracts

**Goal:** Establish a known baseline and lock ambiguous metric/workflow behavior.

| ID | Task | Verification |
|---|---|---|
| 0.1 | Record `git status`; run `bun test`, `bun check`, and relevant package type checks | Existing failures are recorded separately from new work |
| 0.2 | Add shared enrollment input schemas to `packages/schemas/enrollments.ts` and export them | Web and API can consume the same enroll/transfer/end contracts |
| 0.3 | Add pure metric helpers for attendance percentages, schedule duration, workload category, and money totals | Boundary-value unit tests pass, including empty data and Light/Medium/Heavy thresholds |
| 0.4 | Confirm the metric, capacity, timeline, and hierarchy decisions in Section 3 with product stakeholders | No unresolved definition blocks dashboard implementation |

**Exit criteria:** Baseline is documented, shared contracts compile, and metric helper
tests pass.

### Phase 1 - Shared Domain Foundation

**Goal:** Create the minimum shared foundation required by all later phases.

#### 1.1 Create `@repo/domain`

- Add `packages/domain/package.json`, `tsconfig.json`, exports, and test script.
- Add `@repo/domain` to `apps/app/package.json` and `packages/api/package.json`.
- Enforce the server-only boundary and do not expose this package to Expo.
- Add unit tests for pure calculations and mocked/repository-level tests for scoped
  queries.

#### 1.2 Centralize enrollment commands

- Move reusable enrollment validation and mutations from:
  - `apps/app/app/(workspace)/classes/actions.ts`
  - `packages/api/routers/classes.ts`
- Implement `enrollStudent`, `bulkEnrollStudents`, `transferStudent`,
  `updateEnrollment`, and `endEnrollment` in `classes/enrollment.ts`.
- Use Prisma transactions for transfer and event writes.
- Enforce tenant scope, active records, duplicate prevention, and capacity policy.
- Keep existing web actions and tRPC procedures as thin adapters to avoid behavior
  regressions.

#### 1.3 Centralize schedule rules

- Move time parsing, overlap checks, schedule validation, and teacher-conflict rules
  from web/API copies into `classes/schedule.ts`.
- Add room-conflict validation using `ClassSchedule.roomId`.
- Preserve the current schema limitation of one schedule per class per weekday.
- Return structured conflicts so the UI can name the conflicting class, teacher/room,
  day, and time.

#### 1.4 Add activity producers

Update the shared commands or transport adapters that own these mutations:

- `students/actions.ts` and `packages/api/routers/students.ts`
- class enrollment commands
- `attendance/actions.ts` and `packages/api/routers/attendance.ts`
- `invoices/actions.ts`
- `payments/actions.ts`

Writes that change domain data and create events must share a transaction where
possible. Attendance bulk marking should write one concise event per student/session,
not duplicate events on an unchanged upsert.

#### 1.5 Add dashboard query modules

- Query aggregate totals separately from limited recent-item lists.
- Use database aggregation where practical; do not load entire histories merely to
  calculate a count or sum.
- Include `organizationId` in every root query.
- Return UI-ready domain values, but keep presentation formatting in the app.

**Exit criteria:** Existing create/update/enroll/end behavior uses shared rules; transfer
is atomic; event producers exist; dashboard query tests prove tenant scoping and metric
definitions.

### Phase 2 - Quick-Win Dashboards

**Goal:** Complete and correct the five existing academic management surfaces.

#### 2.1 Student dashboard and actions

Primary files:

- `apps/app/app/(workspace)/students/[studentId]/page.tsx`
- `apps/app/app/(workspace)/components/student-profile-actions.tsx`
- new `students/[studentId]/student-activity-timeline.tsx`
- new `students/[studentId]/enroll-student-dialog.tsx`
- new `students/[studentId]/transfer-student-dialog.tsx`
- new `students/[studentId]/print/page.tsx`

Tasks:

- Replace totals based on the latest six invoices/eight attendance records with
  `StudentDashboardService` aggregates.
- Preserve limited recent lists for display only.
- Show student code, academic level, active class count, attendance rate,
  outstanding balance, and primary guardian in the overview.
- Add an Activity tab with event type, timestamp, actor, summary, and linked entity.
- Add quick actions for enroll, transfer, archive/restore, and print profile.
- Disable transfer when the student has no active enrollment.
- Remove or wire the currently inert "Create invoice" button; do not leave a
  non-functional primary action.
- Make the print route use print CSS and omit workspace navigation/actions.

Acceptance criteria:

- Financial and attendance metrics remain correct with more than six invoices and
  eight attendance records.
- Enrollment and transfer can be completed without leaving the student profile.
- The timeline shows newly generated enrollment, attendance, invoice, and payment
  events in reverse chronological order.
- Print preview contains identity, guardian, level, and active-class details.

#### 2.2 Teacher dashboard

Primary files:

- new `apps/app/app/(workspace)/teachers/[teacherId]/page.tsx`
- `teachers/teachers-page-client.tsx`
- `teachers/teachers-table.tsx`
- new teacher metric, weekly schedule, and workload components colocated under
  `teachers/[teacherId]/`

Tasks:

- Add a dedicated teacher route and link table/side-panel actions to it.
- Display distinct active students, active classes, weekly teaching hours, and
  distinct subjects.
- Render a Monday-Sunday timetable from `ClassSchedule`, including class, subject,
  room, start, and end.
- Display the class-count workload category and explain its threshold.
- Fix the current side-panel student count, which can double-count students enrolled
  in multiple classes taught by the same teacher.

Acceptance criteria:

- Direct URL access is tenant-scoped and returns `notFound()` for another tenant's
  teacher.
- Weekly hours match schedule durations.
- Workload changes at 6 and 11 active classes.
- A student enrolled in two of the teacher's classes is counted once.

#### 2.3 Class dashboard

Primary files:

- `apps/app/app/(workspace)/classes/[classId]/page.tsx`
- `classes/components/classes-table.tsx`
- `classes/page.tsx`
- new class dashboard/enrollment components under `classes/[classId]/`

Tasks:

- Convert the detail page from a two-column edit screen into a class dashboard with
  Overview, Students, Schedule, Billing, and Settings tabs.
- Show `current active students / capacity`, utilization percentage, and full/near
  capacity status.
- Add Add Student, Bulk Add Students, Transfer Student, and End Enrollment actions.
- Show attendance rate, billed revenue, outstanding fees, and active student count.
- Keep the existing edit form under Settings rather than deleting it.
- Remove hard-coded growth text from `classes/page.tsx` unless backed by a real query.

Acceptance criteria:

- Capacity is visible on list and detail views.
- Full classes reject normal and bulk enrollment with a clear message.
- All enrollment actions update metrics and roster after success.
- Revenue is explicitly labeled "Billed revenue".

#### 2.4 Subject dashboard completion

Primary file: `apps/app/app/(workspace)/subjects/[subjectId]/page.tsx`.

- Keep the existing classes, students, and teacher metrics.
- Add subject attendance rate using the shared attendance definition.
- Add period context to the metric description.
- Ensure only active, non-archived classes contribute to dashboard metrics.

Acceptance criteria: the four proposed subject metrics are accurate and tenant-scoped.

#### 2.5 Academic level overview

Primary files:

- new `apps/app/app/(workspace)/academic-levels/[levelId]/page.tsx`
- `academic-levels/page.tsx`
- `academic-levels/academic-levels-list.tsx`

Tasks:

- Make active levels navigable.
- Display students, classes, distinct subjects, and distinct teachers.
- Show the classes grouped by subject with links to class and subject dashboards.
- Derive subjects and teachers through active classes; document this in empty states.

Acceptance criteria: each active level has a direct overview URL with all four counts
and usable hierarchy links.

**Phase 2 exit criteria:** All original Phase 1 UX items are implemented, existing
working profile features remain available, and each dashboard has scoped query tests
plus key component/workflow tests.

### Phase 3 - Workflow Centers

**Goal:** Reduce multi-screen academic operations to guided, validated workflows.

#### 3.1 Student Enrollment Center

Add:

- `apps/app/app/(workspace)/enrollment/page.tsx`
- `apps/app/app/(workspace)/enrollment/enrollment-center.tsx`
- `apps/app/app/(workspace)/enrollment/actions.ts`
- `packages/api/routers/enrollments.ts`
- enrollment router registration in `packages/api/routers/index.ts`
- sidebar entry in `apps/app/app/(workspace)/components/sidebar.tsx`

The default single-screen flow is:

1. Select an active student.
2. Select an available active class.
3. Configure the start date and optional custom fee.
4. Review capacity, default fee, schedule, teacher, and conflicts.
5. Confirm enrollment.

The same page exposes modes for bulk add, transfer, and end enrollment. Use URL state
only where it improves deep-linking, for example `?mode=transfer&studentId=...`.

Acceptance criteria:

- A normal enrollment requires no more than two primary action clicks after student
  and class selection.
- Success keeps the user on the center and shows links to student and class.
- Duplicate, capacity, archived-record, and cross-tenant attempts fail server-side.
- Transfer is all-or-nothing under simulated destination failure.
- Bulk add reports selected, enrolled, skipped, and failed counts.

#### 3.2 Academic Planner

Add:

- `apps/app/app/(workspace)/academics/page.tsx`
- `apps/app/app/(workspace)/academics/academic-planner.tsx`
- sidebar entry for `/academics`

Tasks:

- Query all active levels once through `AcademicDashboardService`.
- Render expandable Level -> Subject -> Class navigation.
- Show compact counts and status at each node.
- Link nodes to existing detail routes rather than duplicating edit forms.
- Support search by level, subject, class name, and code.
- Provide honest empty states for levels with no operational classes.

Acceptance criteria: an admin can navigate from level to subject to class without
returning to separate list screens.

#### 3.3 Schedule Management

Add:

- `apps/app/app/(workspace)/schedules/page.tsx`
- `schedules/schedule-calendar.tsx`
- `schedules/schedule-filters.tsx`
- sidebar entry for `/schedules`

Tasks:

- Provide Teacher, Room, and Class groupings over the same weekly schedule data.
- Include level, subject, class, teacher, room, and time filters.
- Link schedule blocks to class and teacher detail pages.
- Surface teacher and room conflicts rather than silently rendering overlaps.
- Keep schedule editing in class Settings for the first release.

The current schema cannot represent multiple meetings for the same class on one
weekday, recurrence exceptions, or holidays. These are explicitly out of scope unless
the schedule product requirements change.

Acceptance criteria: all active schedules can be inspected by teacher, room, and class
with no duplicated query implementation.

**Phase 3 exit criteria:** `/enrollment`, `/academics`, and `/schedules` are linked from
navigation, role-gated, responsive, and covered by workflow tests.

### Phase 4 - Analytics

**Goal:** Add decision-support trends after dashboard definitions and events are stable.

#### 4.1 Student analytics

Add to the existing student profile:

- attendance trend by month;
- recorded payment trend by month;
- full enrollment history, including starts, ends, and transfers.

Use persisted enrollments for history and activity events to label transfers. Do not
infer a transfer solely from adjacent enrollment timestamps.

#### 4.2 Teacher analytics

Add to the teacher detail route:

- weekly teaching-load trend;
- attendance completion rate;
- distinct student-count trend.

Attendance completion must initially be labeled **completion for created sessions**:
completed sessions divided by non-cancelled sessions that exist in `ClassSession`.
The system cannot identify schedules for which a session was never generated. A true
expected-session completion metric requires automated session generation and holiday/
exception modeling.

#### 4.3 Class analytics

Add to the class dashboard:

- billed revenue trend;
- attendance trend;
- enrollment starts/ends trend;
- capacity-utilization trend.

Capacity utilization can only be historically exact after the system records snapshots
or reconstructs enrollment counts by date from `startsOn`/`endsOn`. Implement the
reconstruction query first; add snapshots only if performance measurements require it.

#### 4.4 Chart implementation

- Reuse the design-system chart primitives and patterns in existing dashboard chart
  components.
- Keep charts server-data-driven with small client presentation components.
- Include accessible labels, tabular/summary fallback text, and empty states.
- Default to six months and allow a supported period selector where useful.

**Phase 4 exit criteria:** Every chart has a documented denominator/time range, handles
empty data, and agrees with the corresponding aggregate metric.

### Phase 5 - API Convergence and Mobile Parity

**Goal:** Complete the original architecture cleanup and expose stabilized workflows to
other clients.

#### 5.1 Finish transport convergence

- Migrate remaining student, teacher, class, subject, and level business logic from
  `actions.ts` and tRPC router bodies into `@repo/domain` where reuse is concrete.
- Consolidate duplicated teacher-profile resolution currently under `apps/app/lib`
  and `packages/api/lib`.
- Keep Next.js revalidation/redirect behavior in server actions.
- Keep tRPC error mapping, input parsing, and role middleware in `@repo/api`.
- Add dashboard read procedures with stable response schemas.

#### 5.2 Mobile delivery order

Follow the resume condition in `docs/mobile-readiness-plan.md`: only port workflows
after web behavior is stable.

1. Student detail overview and activity timeline.
2. Teacher dashboard and weekly schedule.
3. Class capacity and health overview.
4. Admin enrollment/transfer workflow.
5. Academic hierarchy browser.
6. Invoice/payment views after shared billing routers exist.

Mobile must consume tRPC contracts and never import `@repo/domain` or
`@repo/database`.

**Phase 5 exit criteria:** Shared operations have one business-rule implementation;
API tenant-isolation tests pass; prioritized mobile screens match stable web behavior.

---

## 6. Database and Migration Impact

The first implementation should avoid schema expansion where current models are
sufficient.

### Required without schema changes

- Add `AuditEvent` writes using structured metadata.
- Use existing `Enrollment` date/status fields for history.
- Use `InvoiceLineItem.classId` for billed class revenue.
- Use `ClassSchedule` for weekly teacher hours and calendar views.

### Possible follow-up migrations

Only add these after the corresponding product requirement is confirmed:

| Need | Possible schema change |
|---|---|
| Planned curriculum independent of classes | Level-to-Subject join model |
| Multiple same-day class meetings | Replace `@@unique([classId, dayOfWeek])` with a recurrence model |
| Schedule holidays/exceptions | Academic calendar and schedule-exception models |
| Exact class collected revenue | Payment allocations to invoice line items or a defined allocation ledger |
| First-class transfer reporting | `EnrollmentTransfer` model linked to source and destination enrollments |
| Fast historical capacity charts | Daily/monthly class metric snapshots |

Every schema change requires a checked-in migration, Prisma generation, and a fresh
migration-deploy verification against a disposable PostgreSQL database.

---

## 7. Testing Strategy

### 7.1 Domain tests

Add tests under `packages/domain/__tests__` for:

- attendance denominator and rounding;
- workload boundaries at 5/6 and 10/11 classes;
- schedule duration and overlap;
- teacher and room conflict detection;
- capacity enforcement;
- duplicate enrollment prevention;
- transfer transaction behavior;
- distinct teacher/student counts;
- dashboard money aggregation;
- organization scoping on every query.

### 7.2 API tests

Extend `apps/api/__tests__` using the existing router caller pattern:

- OWNER/ADMIN can mutate enrollments;
- TEACHER cannot use admin enrollment procedures;
- Org A cannot read or mutate Org B dashboards/enrollments;
- transfer returns structured validation errors;
- dashboard procedures preserve response contracts.

Add real PostgreSQL integration coverage for active-enrollment uniqueness and transfer
atomicity when `TEST_DATABASE_URL` is available.

### 7.3 Web tests

Extend `apps/app/__tests__` with React Testing Library for:

- enrollment center step/state behavior;
- bulk enrollment result summary;
- dashboard empty/loading/error states;
- workload and capacity indicators;
- timeline rendering;
- schedule filters/groupings;
- print profile content.

### 7.4 Manual acceptance

Test at desktop and mobile web widths with OWNER, ADMIN, and TEACHER accounts:

- enroll a student from profile and enrollment center;
- transfer between classes and verify both rosters and timeline;
- attempt enrollment into a full class;
- inspect teacher schedule and hours;
- compare student/class metrics to invoice and attendance source records;
- navigate Level -> Subject -> Class;
- inspect schedules by teacher, room, and class;
- print a student profile;
- verify archived and cross-tenant entities cannot be selected.

### 7.5 Verification commands

Run targeted tests during each work item, then complete:

```bash
bun test
bun check
bun run build
```

Also run package-specific type checks if the affected workspace exposes a `typecheck`
script. Do not use the full build as a substitute for domain and workflow tests.

---

## 8. Rollout and Observability

- Deliver each phase in vertical slices; do not hide all work behind one long-lived
  branch.
- Deploy event producers before relying on activity timeline adoption metrics.
- Add structured error reporting for failed enrollment/transfer commands without
  logging student private data.
- Track workflow completion and failures using the existing analytics/observability
  packages where available.
- Prefer releasing new routes to OWNER/ADMIN first, then expand TEACHER/mobile access
  after authorization and usability checks.
- Preserve old entry points during rollout by linking them to the new workflow; remove
  duplicate controls only after the replacement is stable.

Recommended product measurements:

- enrollment-center starts, completions, validation failures, and cancellations;
- median time and primary-action clicks to enroll;
- transfer completion/failure count;
- class-full rejection count;
- dashboard and academic-hierarchy usage;
- schedule conflict count detected before save.

---

## 9. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Dashboard totals disagree with current screens | Loss of trust | Lock definitions first; test against seeded source records; replace truncated calculations |
| Shared package becomes a broad rewrite | Delays visible UX | Extract only logic used by current slices; keep transport-specific concerns outside |
| Timeline appears historically incomplete | User confusion | State that activity is available from deployment date; synthesize only student creation |
| Partial payments make class revenue misleading | Incorrect reporting | Use and label billed revenue; defer collected revenue until allocation semantics exist |
| Capacity introduces behavior change | Enrollment blockers | Confirm policy, show remaining seats, and return actionable validation messages |
| Schedule model is too limited | Calendar cannot reflect reality | Ship current weekly view; require explicit schema decision for recurrence exceptions/multiple meetings |
| Teacher completion metric hides missing sessions | Misleading analytics | Label metric as completion for created sessions; defer true expected-session metric |
| Web/API behavior diverges | Mobile parity regressions | Route both transports through shared commands and query modules; contract-test procedures |
| Large aggregate queries slow profile pages | Poor UX | Aggregate in SQL, index measured bottlenecks, bound trend periods, and avoid loading full relation graphs |

---

## 10. Definition of Done

A work item is complete only when:

- behavior matches the metric and workflow contracts in Section 3;
- every read/write is tenant-scoped and role-authorized server-side;
- shared business rules are not duplicated between web and API;
- responsive UI has complete loading, empty, success, and error states;
- relevant unit, API, integration, and component tests pass;
- accessibility basics are covered: labels, keyboard operation, focus handling, and
  non-color-only status indicators;
- affected documentation and API contracts are updated;
- `bun test`, `bun check`, and `bun run build` pass or pre-existing failures are
  explicitly documented.

---

## 11. Success Criteria Traceability

| Original success criterion | Implementation evidence |
|---|---|
| Reduce enrollment clicks by 50% | Enrollment center interaction measurement and two-primary-action acceptance target |
| Manage students without multiple screens | Student overview, timeline, enroll, transfer, archive, and print actions on profile |
| Provide teacher workload visibility | Teacher metrics, weekly hours, timetable, and Light/Medium/Heavy indicator |
| Provide class capacity visibility | Capacity count/utilization on class list, detail, and enrollment confirmation |
| Provide academic hierarchy navigation | `/academics` Level -> Subject -> Class browser and linked level overview |
| Prepare modules for mobile parity | Shared schemas, domain services, tRPC procedures, and phased mobile delivery |

The overall program is complete when all six criteria are demonstrably met, metric
definitions are consistent across surfaces, and the web implementation is stable
enough to resume the deferred mobile feature build-out.
