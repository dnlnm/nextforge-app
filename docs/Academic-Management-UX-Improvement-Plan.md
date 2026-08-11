# Academic Management UX Improvement Plan

## Goal

Transform the current CRUD-based academic modules into workflow-based management tools.

---

# Phase 1 — Quick Wins

## Students

### Add Student Overview Card

Display:

- Student Code
- Academic Level
- Active Classes
- Attendance %
- Outstanding Balance
- Primary Guardian

### Add Student Activity Timeline

Events:

- Student created
- Class enrolled
- Class transferred
- Attendance marked
- Invoice generated
- Payment received

### Add Quick Actions

- Enroll into Class
- Transfer Class
- Archive Student
- Print Profile

---

## Teachers

### Add Teacher Dashboard

Display:

- Total Students
- Active Classes
- Weekly Teaching Hours
- Subjects Taught

### Add Weekly Schedule View

Show all classes in timetable layout.

### Add Teacher Workload Indicator

Example:

- Light (0-5 classes)
- Medium (6-10 classes)
- Heavy (11+ classes)

---

## Classes

### Add Class Capacity Widget

Display:

Current Students / Capacity

Example:

24 / 30

### Add Enrollment Actions

- Add Student
- Bulk Add Students
- Transfer Student
- End Enrollment

### Add Class Health Metrics

Display:

- Attendance %
- Revenue
- Outstanding Fees
- Student Count

---

## Subjects

### Convert Subject Page Into Dashboard

Display:

- Total Classes
- Total Students
- Assigned Teachers
- Attendance Rate

---

## Academic Levels

### Add Level Overview Page

Display:

- Students
- Classes
- Subjects
- Teachers

for each level.

---

# Phase 2 — Workflow Improvements

## Student Enrollment Center

Create:

/enrollment

Workflow:

1. Select Student
2. Select Class
3. Configure Fee
4. Confirm

Single screen.

---

## Academic Planner

Create:

/academics

Views:

- Levels
- Subjects
- Classes

with hierarchy:

Level
 └ Subject
     └ Class

---

## Schedule Management

Create calendar views:

- By Teacher
- By Room
- By Class

Reuse existing schedule data.

---

# Phase 3 — Analytics

## Student Analytics

Display:

- Attendance trend
- Fee payment trend
- Enrollment history

## Teacher Analytics

Display:

- Teaching load
- Attendance completion rate
- Student count

## Class Analytics

Display:

- Revenue
- Attendance
- Enrollment trend
- Capacity utilization

---

# Phase 4 — Architecture Cleanup

## Introduce Domain Services

Create:

packages/domain

Structure:

packages/domain/
  students/
  teachers/
  classes/
  subjects/
  levels/

Move business logic from actions.ts into domain services.

## Introduce Shared Dashboard Queries

Create:

StudentDashboardService
TeacherDashboardService
ClassDashboardService
AcademicDashboardService

Use these across web, mobile, and future APIs.

---

# Success Criteria

- Reduce clicks required for enrollment by 50%
- Allow admins to manage students without opening multiple screens
- Provide teacher workload visibility
- Provide class capacity visibility
- Provide academic hierarchy navigation
- Prepare modules for mobile parity