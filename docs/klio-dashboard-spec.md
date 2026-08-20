# KLIO.MY Main Dashboard — Implementation Specification

## 1. Objective

Redesign the KLIO.MY tuition-centre management SaaS dashboard from a passive "system status" dashboard into an **owner/operator command centre**.

The dashboard should answer these questions within ~5 seconds:

1. What is happening at the centre today?
2. What classes are happening next?
3. How is attendance today?
4. How much tuition fee has been collected?
5. What money is still outstanding?
6. What needs my attention right now?
7. What actions can I perform immediately?

The implementation should preserve the existing KLIO.MY dark visual identity and navigation structure while improving information hierarchy, density, and actionability.

---

## 2. Design Principles

### Primary principle

Optimize for:

> "What does the centre owner need to know and do in the next 5 minutes?"

Do not optimize primarily for:

> "What information does the database contain?"

### Product principles

- Today-first
- Action-oriented
- High information density without visual clutter
- Strong hierarchy between primary metrics and secondary information
- Every important problem should have a clear next action
- Empty states should guide setup instead of merely saying "no data"
- Use real business terminology: students, classes, attendance, fees, invoices, teachers
- Keep the UI consistent with the existing KLIO.MY visual system

---

## 3. Target Page Structure

```text
Sidebar
  ├─ Overview
  │   ├─ Dashboard
  │   ├─ Today
  │   ├─ Enrollment
  │   ├─ Academic Planner
  │   └─ Schedules
  ├─ Centre Setup
  │   ├─ Students
  │   ├─ Teachers
  │   ├─ Classes
  │   ├─ Rooms
  │   ├─ Subjects
  │   ├─ Academic Levels
  │   └─ Members
  ├─ Operations
  │   ├─ Attendance
  │   ├─ Invoices
  │   ├─ Payments
  │   └─ Reports
  └─ Account
      └─ Settings

Main content
  ├─ Header + date + notifications + profile
  ├─ Quick actions
  ├─ KPI row
  ├─ Today's Classes
  ├─ Needs Attention
  ├─ Fee Collection
  ├─ Attendance
  ├─ Recent Activity
  └─ Announcements
```

---

# 4. Header

## Layout

Left:

- `Good morning, Daniel 👋`
- Supporting text:
  - `Here's what's happening at your centre today.`

Right:

- Current date
- Calendar icon/button
- Notification icon with unread badge
- User/avatar dropdown

Below or alongside header:

- `+ Student`
- `+ Class`
- `+ Invoice`
- `Mark Attendance`

### Behaviour

All quick-action buttons should open the relevant creation/action flow directly.

Do not require navigating through sidebar first.

---

# 5. KPI Row

Use exactly 5 primary KPI cards.

Recommended metrics:

### KPI 1 — Total Students

- Label: `Total Students`
- Main value: `124`
- Supporting value: `+5 this month`
- Optional mini sparkline/trend

### KPI 2 — Classes Today

- Label: `Classes Today`
- Main value: `8`
- Supporting value: `2 in progress`
- Optional mini sparkline

### KPI 3 — Attendance Today

- Label: `Attendance (Today)`
- Main value: `92%`
- Supporting value: `110 / 120 present`
- Optional trend

### KPI 4 — Fees Collected

- Label: `Fees Collected (This Month)`
- Main value: `RM18,450`
- Supporting value: `82% of RM22,500 target`
- Include a compact progress bar

### KPI 5 — Outstanding Fees

- Label: `Outstanding Fees`
- Main value: `RM4,280`
- Supporting value: `12 invoices overdue`
- Include a compact severity/progress indicator

## KPI rules

- Main number must dominate visually.
- Label is smaller than value.
- Supporting text is secondary.
- Do not use "Total Revenue" as the primary financial KPI; tuition-centre owners care more about fees collected.
- `Outstanding Fees` should be visually more urgent than neutral metrics.
- Values must come from real backend data; never hard-code example values in production.

---

# 6. Today's Classes

## Position

Large primary panel directly below KPI row.

### Header

- `Today's Classes`
- Right action: `View Schedule`

### Table fields

| Field | Description |
|---|---|
| Time | Start time |
| Class | Class name / academic level |
| Subject | Optional secondary text |
| Teacher | Teacher avatar + name |
| Students | Enrolled/expected student count |
| Status | Upcoming / Starting soon / In progress / Completed |

### Example visual state

```text
4:00 PM   Form 4 Maths       Mr. Ali      18     Starting in 20m
5:30 PM   English Language   Ms. Sarah    14     Upcoming
7:00 PM   Physics            Mr. Tan      12     Upcoming
```

### Status behaviour

Use a status badge.

Possible statuses:

- `Starting in 20m`
- `Upcoming`
- `In progress`
- `Completed`
- `Cancelled`

### Interaction

Clicking a class row should navigate to class/session details.

### Empty state

If no classes exist today:

Title:
`No classes today`

Description:
`Create a class session from the schedule to start managing today's attendance.`

CTA:
`Create Class`

Do not leave a large blank card with only text.

---

# 7. Needs Attention

This is a high-priority dashboard component.

## Header

- `Needs Attention`
- Right action: `View All`

## Alert rows

Each issue should have:

- Icon
- Title
- Supporting description
- Count badge
- Chevron/action indicator

Recommended alert categories:

### Overdue Invoices

Example:

`12 invoices from 11 students`

Action:
`View invoices`

### Low Attendance Students

Example:

`3 students below 75% attendance`

Action:
`Review attendance`

### Classes Without Teacher

Example:

`Assign a teacher to 2 classes`

Action:
`Manage classes`

### Upcoming Class

Example:

`Form 4 Maths starts in 20 minutes`

Action:
`Open class`

## Priority

Sort by urgency:

1. Time-sensitive events
2. Financial overdue items
3. Operational configuration problems
4. Student attendance concerns

Allow future expansion of alert types.

---

# 8. Fee Collection Panel

## Header

- `Fee Collection`
- Period label: `(This Month)`
- Right action: `View Report`

## Main summary

Show:

- Collected amount
- Expected/target amount
- Outstanding amount
- Overdue invoice count

Example:

```text
RM18,450
Collected
82% of RM22,500 target

RM4,280
Outstanding
12 invoices overdue
```

## Chart

Use a line/area chart showing:

- Collected
- Target

X-axis:
- Dates within current period

Y-axis:
- RM values

### Requirements

- Tooltips on hover
- Responsive
- Use real API data
- If no data exists, show a meaningful zero-state chart rather than a broken/empty chart
- Avoid decorative chart data

---

# 9. Attendance Panel

## Header

- `Attendance`
- Period: `(This Month)`
- Right action: `View Report`

## Main metric

Large:

`92%`

Supporting:

`Overall attendance`

Secondary:

`+4% vs last month`

## Trend chart

Show weekly/monthly attendance trend.

Example:

```text
Week 1   89%
Week 2   91%
Week 3   94%
Week 4   92%
```

## Bottom summary

Show:

`8 students absent today`

Then small student avatars, with `+N` overflow.

CTA:

`View Attendance →`

### Behaviour

Clicking the panel or CTA should navigate to the attendance reporting page.

---

# 10. Recent Activity

## Header

`Recent Activity`

Right:
`View All`

Show the latest meaningful centre activity.

Preferred activities:

- Student enrolled
- Payment received
- Attendance marked
- Invoice generated
- Announcement published
- Class created
- Teacher assigned

Example:

```text
Daniel Naim enrolled in Form 4 Maths       7h ago
RM120 payment received from Aina Qistina   5h ago
Mr. Tan marked 17/18 students present     3h ago
New announcement published                 1h ago
```

## Important

Do not prioritize low-value system events such as:

`record_created`

unless they represent a meaningful business action.

---

# 11. Announcements

## Header

`Announcements`

Right:
`View All`

Display the latest announcement with:

- Announcement icon
- Title
- Short description
- Published time/date
- Optional `New` badge

Example:

```text
Mid Term Revision Schedule                     New

Revision classes will start from 25 August.
Please check the schedule and make sure your
child attends.

Published 2 hours ago
```

### Empty state

Title:
`No announcements`

Description:
`Centre notices and announcements will appear here.`

CTA:
`Create Announcement`

---

# 12. New-Centre Empty State / Onboarding

When a centre has little or no data, do not display a dashboard full of blank panels.

Show an onboarding/setup section.

Example:

## Get your centre ready

```text
✓ Centre profile
✓ First student
○ Create a class
○ Assign a teacher
○ Set fee structure
```

Progress:

`2 of 5 complete`

Primary CTA:
`Continue Setup`

This should be shown prominently for newly created centres and automatically disappear/reduce once the centre becomes operational.

---

# 13. Responsive Layout

## Desktop

Use a 12-column grid.

Suggested structure:

```text
KPI row:
12 / 12

Today's Classes:
7 / 12

Needs Attention:
5 / 12

Fee Collection:
7 / 12

Attendance:
5 / 12

Recent Activity:
7 / 12

Announcements:
5 / 12
```

## Tablet

- KPI cards wrap to 2–3 per row
- Two-column content becomes one/two columns based on width
- Tables may horizontally scroll or switch to compact row cards

## Mobile

- Single column
- Sticky top header if appropriate
- Quick actions become horizontally scrollable or collapse into `+`
- KPI cards become compact cards
- Today's Classes switches from table to stacked session cards
- Charts remain readable without forcing horizontal page overflow

---

# 14. Visual Design

Preserve KLIO.MY's current dark theme.

## Style

- Dark charcoal page background
- Slightly lighter surface/card backgrounds
- Subtle 1px borders
- Rounded corners
- High-contrast white primary text
- Muted gray secondary text
- Accent colors for semantic meaning

Suggested semantic usage:

- Blue: primary actions / neutral information
- Green: success / collected / present
- Yellow/orange: warning / upcoming
- Red: overdue / urgent
- Purple: secondary system categories

Do not overuse accent colours.

## Typography hierarchy

Approximate hierarchy:

```text
Page heading       28–32px / semibold
Section heading    16–18px / semibold
KPI value          28–32px / bold
Body               13–14px
Secondary text     12–13px
```

Use the project's existing font stack rather than introducing a new font unnecessarily.

---

# 15. Spacing and Density

The current dashboard has too much empty area in large cards.

Target:

- Reduce unnecessary vertical whitespace.
- Keep cards compact but breathable.
- Use consistent internal padding.
- Prefer meaningful content over large empty-state containers.
- Do not make cards visually huge merely to fill the grid.

Recommended base spacing system:

```text
4px
8px
12px
16px
20px
24px
32px
```

Avoid arbitrary spacing values unless required by the existing design system.

---

# 16. Sidebar

Keep the existing navigation hierarchy.

Improve only where useful:

### Overview
- Dashboard
- Today
- Enrollment
- Academic Planner
- Schedules

### Centre Setup
- Students
- Teachers
- Classes
- Rooms
- Subjects
- Academic Levels
- Members

### Operations
- Attendance
- Invoices
- Payments
- Reports

### Account
- Settings

### Sidebar behaviour

- Active dashboard item should have obvious selected state.
- Show counts only when they are genuinely actionable.
- Example:
  - Students: total count can be secondary
  - Overdue invoices: actionable count can be useful
- Support collapsed sidebar on desktop if the existing app supports it.

---

# 17. Data Requirements

The dashboard must be data-driven.

Create/consume dashboard API data for:

```ts
type DashboardData = {
  students: {
    total: number
    addedThisMonth: number
  }

  classesToday: {
    total: number
    inProgress: number
    sessions: ClassSession[]
  }

  attendance: {
    todayPercentage: number
    presentToday: number
    expectedToday: number
    monthlyPercentage: number
    monthlyTrend: AttendancePoint[]
    absentStudentsToday: StudentSummary[]
  }

  fees: {
    collectedThisMonth: number
    targetThisMonth: number
    outstanding: number
    overdueInvoiceCount: number
    collectionTrend: FeePoint[]
  }

  attention: AttentionItem[]

  recentActivity: ActivityItem[]

  announcements: Announcement[]
}
```

Do not compute important business metrics inconsistently across frontend components.

Prefer server/API-derived values for financial and reporting metrics.

---

# 18. Loading States

Every dashboard section must support loading state.

Use skeletons instead of abrupt empty cards.

Example:

- KPI skeleton
- Table row skeleton
- Chart skeleton
- Activity row skeleton

Avoid blocking the entire dashboard when only one widget is loading.

Each widget should ideally load independently.

---

# 19. Error States

If a single widget fails:

Show:

`Unable to load attendance`

CTA:

`Retry`

Do not replace the entire dashboard with a generic error page.

---

# 20. Empty States

Every widget needs a distinct empty state.

Examples:

### No classes

`No classes today`

`Create a class session to start scheduling.`

CTA:
`Create Class`

### No attendance

`No attendance marked yet`

`Attendance records will appear after teachers mark today's classes.`

CTA:
`Open Attendance`

### No outstanding fees

`You're all caught up`

`There are no overdue invoices.`

### No activity

`No recent activity`

`Centre activity will appear here as your team starts using KLIO.MY.`

---

# 21. Interaction Requirements

### KPI cards

Where useful, clicking a KPI navigates to the relevant detailed page.

Examples:

- Students → Students
- Classes Today → Today/Schedules
- Attendance → Attendance
- Fees Collected → Payments/Reports
- Outstanding Fees → Invoices

### Tables

Rows should be clickable where appropriate.

### Attention items

Clicking should take the user directly to the fix, not merely to a generic page.

Bad:
`Needs attention → Reports`

Good:
`Overdue invoices → filtered overdue invoices`

---

# 22. Accessibility

Requirements:

- WCAG-aware contrast
- Keyboard navigation for interactive controls
- Visible focus state
- Buttons must have accessible labels
- Icons must not be the only way to communicate meaning
- Charts should have accessible textual summaries
- Colour must not be the only indicator of status

Example:

Do not use only a red dot.

Use:

`Overdue • 12 invoices`

---

# 23. Performance

The dashboard should feel fast even with large centres.

Requirements:

- Avoid unnecessary API calls
- Aggregate dashboard data where possible
- Paginate activity where appropriate
- Lazy-load lower-priority sections if necessary
- Avoid rendering huge student lists in the dashboard
- Cache dashboard data where appropriate
- Use optimistic UI only where safe

Target:

- First meaningful dashboard content should render quickly
- Primary KPIs should not wait on secondary widgets

---

# 24. Business Logic Notes

### Attendance

Attendance percentage should be based on the centre's defined attendance rules.

Do not blindly calculate:

`present / students`

when the system excludes students, cancelled sessions, excused absences, etc.

Use the existing attendance business rules.

### Fees

Clearly distinguish:

- Invoiced
- Collected
- Outstanding
- Overdue

Do not label outstanding balances as revenue.

### Classes Today

Only include sessions actually scheduled for the selected date.

Respect:

- cancelled sessions
- rescheduled sessions
- holidays
- timezone
- room/teacher assignments

---

# 25. Date and Time

Use the centre's configured timezone.

The dashboard should calculate:

- today
- current time
- class countdown/status

from the centre timezone, not from arbitrary browser timezone assumptions.

Use the existing application date/time utilities if available.

---

# 26. Security / Permissions

The dashboard must respect user permissions.

Examples:

- Owner/admin can see fees and reports.
- Teacher may see attendance/classes but not financial data if permissions disallow it.
- Members should only see data allowed by their role.

Do not simply hide UI after fetching restricted financial data.

The backend/API must enforce authorization.

---

# 27. Suggested Component Structure

Adapt to the project's actual framework, but conceptually:

```text
DashboardPage
├── DashboardHeader
│   ├── DatePicker
│   ├── NotificationButton
│   └── QuickActions
│
├── DashboardKpis
│   ├── StudentsKpi
│   ├── ClassesTodayKpi
│   ├── AttendanceKpi
│   ├── FeesCollectedKpi
│   └── OutstandingFeesKpi
│
├── DashboardGrid
│   ├── TodaysClassesCard
│   ├── NeedsAttentionCard
│   ├── FeeCollectionCard
│   ├── AttendanceCard
│   ├── RecentActivityCard
│   └── AnnouncementsCard
│
└── NewCentreSetupCard
```

Keep widgets reusable and independently testable.

---

# 28. Implementation Strategy

## Phase 1 — Layout

Implement the new page hierarchy and responsive grid using existing design-system components.

Do not change backend logic yet unless necessary.

## Phase 2 — Data

Connect each widget to real data.

Replace all placeholder example metrics.

## Phase 3 — States

Implement:

- loading
- empty
- error
- populated

for every widget.

## Phase 4 — Interactions

Wire up:

- quick actions
- KPI navigation
- table row navigation
- attention item actions
- view-all links

## Phase 5 — Permissions

Verify every widget against role/permission rules.

## Phase 6 — Polish

Tune:

- spacing
- typography
- hover states
- focus states
- responsive behaviour
- chart legibility
- animation only where useful

---

# 29. Acceptance Criteria

The implementation is considered complete when:

- [ ] Dashboard is clearly "today-first"
- [ ] KPI row contains Students, Classes Today, Attendance, Fees Collected, Outstanding Fees
- [ ] Quick actions are visible without sidebar navigation
- [ ] Today's Classes is a prominent operational widget
- [ ] Needs Attention exists and contains actionable issues
- [ ] Fee collection shows collected vs target
- [ ] Attendance shows current metric and trend
- [ ] Recent Activity shows business-relevant events
- [ ] Announcements have a useful empty state
- [ ] New centres receive meaningful setup guidance
- [ ] No widget contains hard-coded production metrics
- [ ] All widgets have loading/error/empty/populated states
- [ ] Financial terminology distinguishes collected, invoiced, outstanding, and overdue
- [ ] Role-based permissions are enforced
- [ ] Desktop, tablet, and mobile layouts work without horizontal page overflow
- [ ] Interactive controls are keyboard accessible
- [ ] Dashboard remains visually consistent with KLIO.MY
- [ ] No large decorative empty areas are used when a compact actionable state is possible

---

# 30. Reference Design Direction

Use the provided dashboard reference image as the visual direction for:

- overall hierarchy
- KPI layout
- two-column content sections
- table density
- attention/alert treatment
- chart placement
- dark theme
- quick actions
- overall information density

Reference image:

`/mnt/data/a_wide_dark_mode_dashboard_ui_screenshot_web_app.png`

Use it as a **design reference**, not as an instruction to hard-code the exact sample data shown in the image.

The final implementation should use KLIO.MY's actual components, routes, API contracts, business rules, permissions, and design tokens wherever they already exist.

---

# 31. Important Non-Goals

Do not:

- Rebuild the entire application navigation unnecessarily
- Replace the existing dark theme
- Add charts just for decoration
- Add metrics that do not help centre operations
- Hard-code mock financial numbers into production
- Introduce a new component library if the project already has one
- Create duplicate API logic for metrics already available elsewhere
- Make the dashboard unnecessarily animated or flashy

The goal is a **more useful operational dashboard**, not merely a more visually complex dashboard.
