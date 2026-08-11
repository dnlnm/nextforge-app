# KLIO.MY — MVP Implementation Specification

## 1. Mission

You are the lead engineer responsible for getting this repository to a **usable MVP of KLIO.MY**, a multi-tenant SaaS for Malaysian tuition centres.

Your job is **not** to redesign the architecture or build every planned feature.

Your job is to:

1. Inspect the existing repository.
2. Understand what is already implemented.
3. Preserve working architecture and code.
4. Identify the gaps blocking the MVP.
5. Implement those gaps systematically.
6. Verify the complete product flow end-to-end.
7. Keep tenant isolation and authorization secure.

The repository is the source of truth for the current implementation.

Do not blindly recreate functionality that already exists.

---

# 2. Product Model

KLIO.MY has **two distinct product layers**:

### SaaS platform layer

This manages:

- KLIO account
- subscription
- billing
- plan
- account settings
- owned tuition centre

### Tuition-centre operational layer

This manages:

- workspaces
- students
- classes
- enrolments
- attendance
- today's classes
- teachers/admins

Do not mix these authorization domains.

---

# 3. Core Account / Ownership Rules

A KLIO account represents a person using the SaaS.

The following rules are critical:

### Rule 1 — One account can own only one tuition centre

An account may own:

```text
0..1 Tuition Centre
```

It must be impossible for one account to create two tuition centres.

This must be enforced server-side and, where practical, with a database constraint.

Do not rely only on hiding the "Create Tuition Centre" button.

### Rule 2 — One account can belong to many workspaces

An account can have multiple workspace memberships.

For example:

```text
Account A
├── Workspace ABC → Admin
├── Workspace XYZ → Teacher
└── Workspace DEF → Teacher
```

### Rule 3 — Workspace role is contextual

The same account can have different roles in different workspaces.

Example:

```text
Account A
├── Workspace ABC → Admin
└── Workspace XYZ → Teacher
```

Do not assume:

```text
one account = one workspace
```

or:

```text
one account = one role
```

---

# 4. Recommended Domain Model

Conceptually:

```text
KLIO Account
│
├── SaaS Subscription
│
├── Owned Tuition Centre (0..1)
│   │
│   └── Workspace(s)
│       │
│       ├── Members
│       ├── Students
│       ├── Classes
│       └── Attendance
│
└── Workspace Memberships (0..many)
```

A workspace represents an operational environment.

Do not automatically equate:

```text
Tuition Centre = Workspace
```

They are separate domain concepts.

The tuition centre is the business/tenant owned by the account.

The workspace is the operational context in which members work.

If the existing schema already models this differently, inspect it carefully and adapt the implementation without unnecessary rewrites.

---

# 5. Roles

At minimum, support these conceptual roles.

## Owner

The account owner of the tuition centre.

Can:

- manage the tuition centre
- manage SaaS subscription
- manage billing
- manage workspaces
- manage members
- perform owner-level administration
- access operational data

## Admin

Operational administrator.

Can:

- manage students
- manage classes
- manage enrolments
- manage attendance
- manage operational members/settings where permitted

An admin does **not** automatically receive SaaS billing/subscription access.

## Teacher

Operational user.

Can:

- view permitted classes
- view students in permitted classes
- take attendance
- view relevant student information

Teacher should not automatically access:

- SaaS subscription
- billing
- owner settings
- owner-only administration

Follow the existing authorization model where one already exists.

---

# 6. First Step: Inspect Before Coding

Before making significant changes:

- Inspect the entire monorepo.
- Identify all apps.
- Identify all packages.
- Inspect database schema.
- Inspect migrations.
- Inspect authentication.
- Inspect API/tRPC implementation.
- Inspect existing routers.
- Inspect web pages.
- Inspect mobile screens.
- Inspect shared UI components.
- Inspect tests.
- Inspect environment/configuration.
- Read existing architecture and feature documentation.

Determine what is:

- complete
- partially implemented
- broken
- missing
- unnecessary for MVP

Run the existing checks and applications where practical.

Create an internal implementation checklist based on the actual repository.

Do not replace working systems just because a different architecture may be theoretically better.

---

# 7. MVP Success Definition

The MVP is a coherent product when the following complete flow works:

### New owner

1. User creates/signs into a KLIO account.
2. User creates a tuition centre.
3. The account becomes the owner.
4. The account cannot create a second tuition centre.
5. User enters the tuition-centre workspace.
6. User creates students.
7. User creates a class.
8. User enrols students into the class.
9. User opens Today.
10. User sees today's classes.
11. User opens a class.
12. User sees enrolled students.
13. User records attendance.
14. User saves attendance.
15. User later reopens the class.
16. User sees saved attendance.
17. User can edit attendance.

### SaaS management

18. Owner can open the SaaS dashboard.
19. Owner can see subscription state.
20. Owner can see plan/billing information supported by the current billing integration.
21. Owner can perform supported subscription management actions.

### Multi-workspace

22. The account can belong to multiple workspaces.
23. The user can switch workspaces.
24. Operational data changes according to the active workspace.
25. The same account can have different roles in different workspaces.

### Security

26. A user cannot access a workspace they are not a member of.
27. A user cannot access another tuition centre's data.
28. A teacher cannot access owner-only SaaS functionality.
29. Authorization is enforced server-side.

### Mobile

30. The core Today → Class → Student roster → Attendance flow works through the React Native application/API.

This is the minimum coherent product.

---

# 8. Authentication

Authentication must work end-to-end.

Requirements:

- User can sign in.
- Authenticated requests reach the API.
- API identifies the current account/user.
- Protected requests reject unauthenticated users.
- Current workspace can be resolved safely.
- Current workspace membership can be resolved safely.

Do not trust client-provided identity or role information.

---

# 9. Application Context

The backend should have a clear conceptual context containing:

```text
currentUser
currentAccount
currentWorkspace
workspaceMembership
workspaceRole
```

For example:

```ts
{
  user,
  account,
  workspace,
  membership,
  role
}
```

Adapt this to the existing architecture.

The active workspace must never be trusted merely because the client supplied a `workspaceId`.

The API must verify that the current account/user has access to the requested workspace.

---

# 10. Authorization Layers

Use separate conceptual authorization layers.

## Account/platform authorization

Used for:

- account
- subscription
- billing
- owned tuition centre
- SaaS settings

Conceptually:

```text
requireAccount()
requireTuitionCentreOwner()
```

## Workspace authorization

Used for:

- students
- classes
- enrolments
- attendance
- operational members
- workspace settings

Conceptually:

```text
requireWorkspace()
requireWorkspaceMembership()
requireWorkspaceRole()
```

Do not use one generic authorization check for everything.

---

# 11. Multi-Tenancy and Security

Tenant isolation is a **P0 requirement**.

A user from Tuition Centre A must never be able to access Tuition Centre B's data.

This includes:

- students
- classes
- enrolments
- attendance
- workspace data
- members
- settings
- any future tenant-scoped resources

Do not rely on frontend filtering.

Do not trust IDs from the client.

Every protected database query must be scoped appropriately.

---

# 12. Workspace Security

A user may belong to:

```text
Workspace A → Admin
Workspace B → Teacher
```

While operating in Workspace A, they must not accidentally access Workspace B's operational data unless the user explicitly switches to Workspace B and is authorized there.

Test:

- member can access their workspace
- non-member cannot access workspace
- teacher cannot perform admin-only actions
- workspace data is isolated
- role is resolved from membership, not client input

---

# 13. SaaS Dashboard

The SaaS dashboard is part of the MVP.

It is separate from the operational tuition-centre dashboard.

Conceptually:

```text
KLIO
│
├── SaaS / Account
│   ├── Overview
│   ├── Subscription
│   ├── Billing
│   └── Account
│
└── Workspace
    ├── Today
    ├── Students
    ├── Classes
    └── Attendance
```

The exact navigation can follow the existing UI architecture.

---

# 14. Subscription / Billing

The owner should be able to:

- view current plan
- view subscription status
- view trial status if applicable
- view renewal information where available
- view billing information supported by the billing provider
- manage subscription using the existing billing integration
- upgrade/downgrade if supported
- cancel if supported

Do not build a custom payment system if a payment provider is already integrated.

Use the provider's customer/subscription model.

Subscription state should be represented centrally.

Conceptual states may include:

```text
trialing
active
past_due
cancelled
expired
```

Use the actual states of the selected provider.

Do not hard-code simplistic checks such as:

```ts
subscription === "paid"
```

when the provider exposes richer states.

Conceptually provide reusable server-side functions such as:

```text
getSubscription()
requireActiveSubscription()
getPlanLimits()
```

Adapt naming to the repository.

---

# 15. Subscription vs Workspace Permissions

Subscription ownership and workspace permissions are different concerns.

Example:

```text
Account
  subscription = active

Workspace
  role = teacher
```

The teacher must not automatically gain billing access.

Likewise:

```text
Account
  subscription = active

Workspace
  role = admin
```

The admin can manage operational data but should not automatically manage billing unless explicitly authorized.

---

# 16. One Tuition Centre Constraint

Enforce the invariant:

```text
Account → at most one owned Tuition Centre
```

Conceptually:

```text
Account A
├── Tuition Centre 1
└── Tuition Centre 2 ❌
```

The API must reject the second creation attempt.

Add a test specifically proving this.

If the existing database architecture supports a unique nullable relation, use an appropriate database constraint.

---

# 17. Workspace Membership

A workspace membership should conceptually contain:

```text
account/user
workspace
role
status
```

Use the existing identity model if it already distinguishes users/accounts.

Support multiple memberships.

Example:

```text
Account A
├── Workspace 1 → Admin
├── Workspace 2 → Teacher
└── Workspace 3 → Teacher
```

Do not overbuild an enterprise invitation system unless it is already substantially implemented.

If invitations are needed to complete the existing architecture, implement the smallest reliable version.

---

# 18. Workspace Switching

Provide a workspace switcher for users with multiple memberships.

Example:

```text
ABC Tuition
XYZ Tuition
DEF Academy
```

Switching workspace changes:

- students
- classes
- attendance
- today's schedule
- permitted actions
- operational context

The server must independently validate the selected workspace.

---

# 19. Students

Students are a core MVP entity.

Implement/complete:

- student list
- student detail
- create student
- edit student
- archive/deactivate student
- student ID
- name
- contact information
- parent/guardian information where supported
- profile photo where supported
- student status
- class enrolments

The UI should support:

- search
- basic filtering
- pagination where appropriate

Requirements:

- proper validation
- duplicate student ID handling
- archived students should not accidentally appear as active
- avoid destructive deletion unless the existing domain explicitly requires it

---

# 20. Classes

Implement/complete:

- class list
- create class
- edit class
- archive/deactivate class
- class name
- subject where applicable
- teacher/instructor where supported
- day/time
- capacity where supported
- student enrolment

The product must make it easy to answer:

> Which students are in this class?

and:

> Which classes is this student enrolled in?

---

# 21. Attendance

Attendance is a P0 feature.

Implement:

- select class
- select date/session
- display enrolled students
- mark attendance
- present
- absent
- other statuses only if already supported
- save attendance
- edit attendance
- view attendance history

Attendance must be correctly scoped by:

- workspace/tenant
- class
- student
- session/date

Prevent duplicate attendance according to the database/domain model.

The workflow should be fast enough for a teacher using a phone.

---

# 22. Today Dashboard

Implement a practical operational "Today" experience.

Show:

- today's classes
- class times
- number of students
- attendance status
- classes requiring attendance
- useful quick actions

Prioritize operational information over analytics.

Do not spend MVP time on complicated charts.

---

# 23. Web Application

The web application should provide the complete administration experience.

Minimum areas:

### Authentication

- sign in

### SaaS

- SaaS overview
- subscription
- billing/account management

### Workspace

- workspace switcher
- Today
- Students
- Classes
- Attendance
- relevant settings

Use existing design-system components.

Do not introduce another UI framework unnecessarily.

---

# 24. Mobile Application

The React Native application does not need every web feature for MVP.

Prioritize:

```text
Today
  ↓
Class
  ↓
Student roster
  ↓
Attendance
```

The mobile app must use the same API/domain rules as the web application.

Minimum mobile API capabilities:

### Today

- fetch today's classes
- fetch attendance status

### Students

- list students
- search students
- view student
- create/edit where appropriate

### Attendance

- fetch class roster
- submit attendance
- update attendance
- view attendance

---

# 25. API / tRPC

Follow the existing API architecture.

The minimum critical API domains are conceptually:

```text
account
subscription
tuitionCentre
workspace
students
classes
attendance
today
```

If the repository already has routers, preserve them.

Prioritize:

- auth/context
- organization/tenant context
- workspace context
- subscription
- students
- classes
- attendance
- today

A reusable workspace-scoped procedure/middleware should be used where appropriate.

Every protected router must use the correct authorization context.

---

# 26. Database

Inspect the current schema before changing it.

Prefer extending the existing schema rather than redesigning it.

Requirements:

- proper foreign keys
- unique constraints where required
- appropriate indexes
- correct relations
- tenant/workspace scoping
- one-owner-one-tuition-centre invariant

Pay attention to indexes for:

- account/user ownership
- organization/tenant
- workspace
- student ID
- class
- enrolment
- attendance date/session

Do not introduce unnecessary database complexity.

---

# 27. UX Requirements

The MVP should feel like a real product.

Handle:

- loading states
- empty states
- errors
- form validation
- success feedback
- destructive-action confirmation
- mobile-friendly layouts
- disabled states
- API/network failures

Avoid excessive animation and visual complexity.

Prioritize speed and clarity.

---

# 28. Testing

Do not only test happy paths.

## Authentication

- unauthenticated request rejected
- authenticated request accepted

## Account ownership

- account can create first tuition centre
- account cannot create second tuition centre

## Subscription

- owner can access subscription
- unauthorized role cannot access owner-only billing functionality
- subscription state is handled correctly

## Workspace

- member can access workspace
- non-member cannot access workspace
- user can belong to multiple workspaces
- same account can have different roles in different workspaces

## Role authorization

- teacher cannot perform admin-only actions
- admin cannot perform owner-only SaaS actions unless explicitly authorized

## Tenant isolation

- tenant A can access its own data
- tenant B can access its own data
- tenant A cannot access tenant B data

## Students

- create
- update
- list
- search
- archive
- tenant/workspace isolation

## Classes

- create
- update
- list
- enrol student
- workspace isolation

## Attendance

- create attendance
- update attendance
- duplicate attendance protection
- tenant/workspace isolation

## API

Test important procedures end-to-end where practical.

---

# 29. Student Bulk Import

Bulk import is useful but must not block the core MVP.

If the repository already has substantial import functionality, complete it.

Otherwise:

- keep it isolated
- do not allow it to delay the core workflow
- implement it after core Students → Classes → Attendance is stable

---

# 30. WhatsApp

WhatsApp is an important future feature for Malaysian tuition centres.

It is not required for the first usable MVP.

Do not spend significant implementation time on WhatsApp before the core product works.

---

# 31. Features Explicitly Out of MVP

Do not let these distract from the core MVP unless already substantially implemented:

- advanced analytics
- complex reporting
- payroll
- accounting
- full payment collection features
- Stripe Connect
- advanced WhatsApp automation
- SMS automation
- complex parent portal
- marketing website
- white-label custom domains
- sophisticated enterprise permission systems
- advanced branch management
- AI features
- advanced notification centre
- complex timetable builder
- advanced import/export systems
- enterprise billing
- advanced audit logs

These can be implemented after MVP.

If an existing feature already works, do not remove it.

---

# 32. Code Quality

Follow repository conventions.

Before creating a new abstraction:

1. Search the repository.
2. Check whether an existing abstraction solves the problem.
3. Reuse it where appropriate.

Avoid:

- duplicate utilities
- duplicate API clients
- duplicate validation
- duplicate components
- unnecessary wrappers
- premature abstractions
- massive files
- business logic inside UI components

Keep business logic in the appropriate domain/API/service layer.

---

# 33. Implementation Strategy

Work in vertical slices.

## Phase 1 — Understand

- inspect repository
- understand architecture
- run existing tests
- run web application
- run mobile application where possible
- identify gaps

## Phase 2 — Identity and SaaS Foundation

- account context
- authentication
- one tuition-centre ownership
- subscription context
- SaaS dashboard
- billing/subscription integration
- owner authorization

## Phase 3 — Workspace Foundation

- workspace model
- membership
- roles
- workspace context
- workspace switching
- workspace authorization
- isolation tests

## Phase 4 — Students

- database/domain
- API
- web UI
- mobile API consumption
- tests

## Phase 5 — Classes

- database/domain
- API
- web UI
- enrolment
- tests

## Phase 6 — Attendance

- database/domain
- API
- web UI
- mobile UI
- tests

## Phase 7 — Today

- API
- web dashboard
- mobile dashboard
- attendance shortcuts

## Phase 8 — Hardening

- error handling
- loading states
- empty states
- validation
- tenant security
- workspace security
- role security
- regression tests
- typecheck
- lint
- production build

---

# 34. Agent Rules

## Rule 1 — Inspect first

Never start rewriting architecture without understanding the existing repository.

## Rule 2 — Preserve working code

If something already works, preserve it.

## Rule 3 — Fix root causes

Do not hide problems with:

```text
any
```

unnecessary casts, disabled lint rules, disabled TypeScript checks, or ignored tests.

## Rule 4 — Verify every significant change

Run appropriate:

- tests
- typecheck
- lint
- build
- application checks

## Rule 5 — Security before convenience

Never bypass authorization to make a feature work.

## Rule 6 — Same domain rules everywhere

Web and mobile must use the same API/domain authorization rules.

## Rule 7 — Do not stop at scaffolding

A feature is not complete because:

- a route exists
- a component exists
- a database table exists
- a tRPC procedure exists

It is complete when the actual user workflow works end-to-end.

## Rule 8 — Avoid scope creep

If you discover a useful future feature, document it and defer it unless it blocks MVP.

---

# 35. Final MVP Invariants

The implementation must guarantee:

1. One account can own at most one tuition centre.
2. One account can belong to many workspaces.
3. An account can have different roles in different workspaces.
4. Workspace membership is required for workspace data access.
5. Workspace data is isolated.
6. Tuition-centre/tenant data is isolated.
7. Subscription/billing is owner/account-level.
8. Operational data is workspace-level.
9. Teachers cannot automatically access SaaS billing.
10. Admins cannot automatically access owner-only SaaS functionality.
11. Authorization is enforced server-side.
12. Client-supplied IDs are never trusted for authorization.
13. Web and mobile use the same domain/API rules.
14. The core owner → workspace → students → classes → attendance workflow works end-to-end.

---

# 36. Final Deliverable

At the end of implementation, provide a concise report:

## Completed

List MVP functionality that works.

## Partially Completed

List anything still incomplete.

## Deferred

List intentionally postponed features.

## Tests

Report:

- test result
- typecheck result
- lint result
- build result

## Known Issues

List remaining bugs or technical limitations.

## Recommended Next Steps

Recommend the next development phase based on the actual repository state.

---

# 37. Most Important Instruction

Do not treat this document as a reason to blindly implement everything from scratch.

The repository is the source of truth.

Your first responsibility is to:

> **Inspect → Understand → Plan → Implement → Test → Verify**

Prioritize this product flow:

```text
Account
  ↓
SaaS Subscription
  ↓
Owned Tuition Centre
  ↓
Workspace
  ↓
Role / Membership
  ↓
Students
  ↓
Classes
  ↓
Enrolment
  ↓
Today
  ↓
Attendance
```

The MVP is complete only when this flow works reliably and the following are proven by tests:

- account ownership rules
- subscription/owner authorization
- workspace membership
- workspace role authorization
- tenant isolation
- workspace isolation
- core operational workflows
- mobile API workflow
