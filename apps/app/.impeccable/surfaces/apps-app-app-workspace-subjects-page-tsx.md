---
version: 1
slug: "apps-app-app-workspace-subjects-page-tsx"
primary_target: "apps/app/app/(workspace)/subjects/page.tsx"
related_targets: []
---

# Surface brief: Subjects index

## Scope and mode

Surface: `apps/app/app/(workspace)/subjects` — Operate mode.

## Audience, job, action

A centre owner or administrator scans every subject and its usage (classes, students, teachers, monthly fee range) at a glance, then either expands one subject to inspect its classes in place or adds a subject without leaving the page.

## Content and proof

Per subject: name, code, description, active status; per class: name, level, branch, teacher, weekly schedule, room, enrolled students, capacity, monthly fee. Derived signals: class count, unique student count, unique teacher count, monthly fee range across classes.

## Constraints

- Visual world: Calm Control Room (DESIGN.md tokens/components). No new palette or type system.
- Server actions preserved: `createSubject`, `updateSubject`, `archiveSubject`.
- Detail and edit routes unchanged: `/subjects/[subjectId]`, `/subjects/[subjectId]/edit`.
- Add flow (name, unique 1–4 char code, description) moves into a dialog mirroring the Academic Levels `AddLevelDialog` pattern.
- WCAG 2.2 AA: expandable rows keyboard-operable with `aria-expanded`; labeled controls.

## Direction

Expandable Subject Index (surface seed 9b07f21a, candidate 5). Full-width card, search toolbar, collapsed subject rows showing scan signals; one subject expands in place (accordion) to reveal its classes with teacher/level/schedule/students/fee; profile/edit/archive actions in the expanded panel.

## Unresolved decisions

None outstanding.
