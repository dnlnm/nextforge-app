# Overhaul `/rooms` Page from Scratch — Implementation Plan & Recommendations

## Overview & Background

The current [`/rooms`](file:///c:/Users/Daniel%20Naim/.local/share/opencode/worktree/5036723e1db32eae161f7e6f91fb45e936947464/quick-gopher/apps/app/app/(workspace)/rooms/page.tsx) page is a basic prototype consisting of a fixed 360px sidebar form and a plain HTML table. It lacks operational depth, search/filtering, timetable visualization, utilization insights, capacity safety checks, and modern dialog-driven UX patterns established in the rest of the application (such as [`academic-levels`](file:///c:/Users/Daniel%20Naim/.local/share/opencode/worktree/5036723e1db32eae161f7e6f91fb45e936947464/quick-gopher/apps/app/app/(workspace)/academic-levels)).

This plan outlines a complete ground-up overhaul of the `/rooms` experience to make it a central, calm, and actionable venue & classroom management hub for Malaysian tuition centre owners and administrators.

---

## Key Recommendations & Architectural Design

### 1. Unified Dashboard with Summary Stats & Capacity Indicators
Instead of a cramped 2-column layout with a permanent sidebar form, the overhauled page will feature:
- **Hero / Header**: Clean page title, descriptive subtitle, and primary `+ Add Room` button triggering a modal dialog.
- **Venue Metrics Bar**:
  - **Total Active Rooms** & overall seating capacity (e.g. *6 rooms · 128 total seats*).
  - **Weekly Venue Hours** (aggregated scheduled class time across all rooms).
  - **Capacity Alerts** (instantly flags if any class assigned to a room has enrolled students exceeding room capacity).
  - **Highest Utilized Room** (quick insight into peak venue usage).

### 2. Dual View Modes: Grid Cards & Detailed Table
Provide a quick switcher to cater to different operational needs:
- **Card / Grid View (Default)**: Visual room cards featuring capacity badges, location tags, weekly schedule chips, utilization progress bar, and class roster summary.
- **Table View**: Compact, sortable data table for high-density review of capacity, locations, assigned schedules, and quick actions.
- **Search & Filter Bar**: Instant client-side search by room name or location, plus filters for capacity range (Small, Medium, Large) and status (Active vs Archived).

### 3. Room Timetable & Schedule Drawer (`RoomDetailSheet`)
Clicking any room card or table row opens a slide-over Sheet detailing:
- Room metadata (Capacity, Location, Status, Creation Date).
- **Weekly Schedule Matrix**: Monday–Sunday timetable showing which classes are held in this room, start/end times, assigned teachers, and active student enrollment vs room capacity.
- Direct quick links to view the class details or edit the room.

### 4. In-Place Dialogs for Zero-Friction Management
- **`AddRoomDialog`**: Clean modal with room name, capacity, location, and optional venue notes with instant `toastManager` feedback.
- **`EditRoomDialog`**: In-place edit modal without navigating away to a separate page.
- **`ArchiveRoomDialog`**: Smart confirmation dialog that checks for active class schedules and provides actionable warnings before archiving.
- **`RestoreRoomDialog`**: One-click reactivation for archived rooms.

### 5. Type-Safe Schemas & Robust Actions
- Add `packages/schemas/rooms.ts` with Zod schemas for room validation (`createRoomInputSchema`, `updateRoomInputSchema`, `archiveRoomInputSchema`).
- Upgrade `apps/app/app/(workspace)/rooms/actions.ts` with structured error handling, Zod validation, and tenant safety.

---

## User Review Required

> [!IMPORTANT]
> **Page Structure & URL Routing**:
> - We recommend replacing the separate `/rooms/[roomId]/edit` full page with an in-place modal dialog (`EditRoomDialog`), while keeping `/rooms/[roomId]/edit` as a clean server redirect back to `/rooms` to preserve backward compatibility.
> - We will maintain full parity with both English (`en`) and Bahasa Malaysia (`ms`) conventions.

> [!TIP]
> **Capacity Warning Invariant**:
> If a class has 24 active enrolled students but is scheduled in a room with capacity 20, the UI will display a distinct amber badge (`Overflow warning: 24/20 students`) to prevent classroom overcrowding.

---

## Open Questions

> [!NOTE]
> Please review and confirm your preferences on the following:
> 1. **Room Types / Categories**: Should rooms support an optional "Venue Type" tag (e.g., *Classroom, Science Lab, Computer Lab, Studio, Seminar Hall, Online*) or keep it simple with name, capacity, and location?
> 2. **Default View Mode**: Do you prefer the **Grid Card View** or the **Table List View** as the default when navigating to `/rooms`?

---

## Proposed Changes

```
packages/schemas/
├── [NEW] rooms.ts
└── [MODIFY] index.ts

apps/app/app/(workspace)/rooms/
├── [MODIFY] page.tsx
├── [MODIFY] actions.ts
├── [NEW] rooms-page-client.tsx
├── [NEW] room-card.tsx
├── [NEW] room-detail-sheet.tsx
├── [NEW] add-room-dialog.tsx
├── [NEW] edit-room-dialog.tsx
├── [NEW] archive-room-dialog.tsx
├── [NEW] restore-room-dialog.tsx
├── [NEW] room-stats.tsx
├── [NEW] loading.tsx
└── [roomId]/edit/
    └── [MODIFY] page.tsx
```

---

### Package: `@repo/schemas`

#### [NEW] [rooms.ts](file:///c:/Users/Daniel%20Naim/.local/share/opencode/worktree/5036723e1db32eae161f7e6f91fb45e936947464/quick-gopher/packages/schemas/rooms.ts)
- Define Zod input schemas:
  - `createRoomInputSchema`: `name` (required, trimmed), `capacity` (optional int >= 1), `location` (optional string).
  - `updateRoomInputSchema`: `roomId` (required cuid/nanoid), `name`, `capacity`, `location`.
  - `archiveRoomInputSchema`: `roomId` (required).
  - `restoreRoomInputSchema`: `roomId` (required).

#### [MODIFY] [index.ts](file:///c:/Users/Daniel%20Naim/.local/share/opencode/worktree/5036723e1db32eae161f7e6f91fb45e936947464/quick-gopher/packages/schemas/index.ts)
- Export `* from "./rooms"`.

---

### Application: `apps/app` — Workspace `/rooms`

#### [MODIFY] [rooms/actions.ts](file:///c:/Users/Daniel%20Naim/.local/share/opencode/worktree/5036723e1db32eae161f7e6f91fb45e936947464/quick-gopher/apps/app/app/(workspace)/rooms/actions.ts)
- Refactor actions to use `@repo/schemas/rooms` Zod validation.
- Return structured action results `{ success: boolean, error?: string, data?: any }` for client toast integration.
- Ensure case-insensitive unique room name validation per organization.
- Prevent archiving if room is attached to active schedules, returning the exact number and names of blocking classes.

#### [MODIFY] [rooms/page.tsx](file:///c:/Users/Daniel%20Naim/.local/share/opencode/worktree/5036723e1db32eae161f7e6f91fb45e936947464/quick-gopher/apps/app/app/(workspace)/rooms/page.tsx)
- Fetch active and archived rooms along with rich schedule relations:
  - `schedules`: include `dayOfWeek`, `startsAt`, `endsAt`, and `class` (`id`, `name`, `code`, `capacity`, `teacher`, `subject`, active enrollment count).
- Compute room statistics server-side (total capacity, weekly scheduled hours, capacity alerts, utilization).
- Render `<Header />` and pass structured data to `<RoomsPageClient />`.

#### [NEW] [rooms/rooms-page-client.tsx](file:///c:/Users/Daniel%20Naim/.local/share/opencode/worktree/5036723e1db32eae161f7e6f91fb45e936947464/quick-gopher/apps/app/app/(workspace)/rooms/rooms-page-client.tsx)
- Main client container managing:
  - Active vs Archived tabs.
  - Search query & capacity filters.
  - View switcher (Grid vs Table).
  - Stat cards display.
  - Dialog states (`AddRoomDialog`, `EditRoomDialog`, `ArchiveRoomDialog`, `RestoreRoomDialog`, `RoomDetailSheet`).
  - Rich empty states using `@repo/design-system/components/ui/empty`.

#### [NEW] [rooms/room-card.tsx](file:///c:/Users/Daniel%20Naim/.local/share/opencode/worktree/5036723e1db32eae161f7e6f91fb45e936947464/quick-gopher/apps/app/app/(workspace)/rooms/room-card.tsx)
- Visual room card with:
  - Room name and door/building icon.
  - Capacity pill (with warning color if any class exceeds room capacity).
  - Location tag.
  - Weekly schedule count & total hours.
  - Assigned class chips.
  - Dropdown menu for View Schedule, Edit, and Archive/Restore.

#### [NEW] [rooms/room-detail-sheet.tsx](file:///c:/Users/Daniel%20Naim/.local/share/opencode/worktree/5036723e1db32eae161f7e6f91fb45e936947464/quick-gopher/apps/app/app/(workspace)/rooms/room-detail-sheet.tsx)
- Slide-over sheet showing complete room info:
  - Weekly Monday–Sunday timetable matrix.
  - Detailed list of assigned classes with teacher, subject, schedule time, and enrolled students vs room capacity.
  - Quick action buttons (Edit room, Archive room).

#### [NEW] [rooms/add-room-dialog.tsx](file:///c:/Users/Daniel%20Naim/.local/share/opencode/worktree/5036723e1db32eae161f7e6f91fb45e936947464/quick-gopher/apps/app/app/(workspace)/rooms/add-room-dialog.tsx)
- Modal dialog for adding new rooms with client validation, pending state, and `toastManager` notifications.

#### [NEW] [rooms/edit-room-dialog.tsx](file:///c:/Users/Daniel%20Naim/.local/share/opencode/worktree/5036723e1db32eae161f7e6f91fb45e936947464/quick-gopher/apps/app/app/(workspace)/rooms/edit-room-dialog.tsx)
- In-place modal dialog for updating existing rooms with prefilled data.

#### [NEW] [rooms/archive-room-dialog.tsx](file:///c:/Users/Daniel%20Naim/.local/share/opencode/worktree/5036723e1db32eae161f7e6f91fb45e936947464/quick-gopher/apps/app/app/(workspace)/rooms/archive-room-dialog.tsx)
- Confirmation alert dialog for archiving a room safely, alerting if any classes are assigned.

#### [NEW] [rooms/restore-room-dialog.tsx](file:///c:/Users/Daniel%20Naim/.local/share/opencode/worktree/5036723e1db32eae161f7e6f91fb45e936947464/quick-gopher/apps/app/app/(workspace)/rooms/restore-room-dialog.tsx)
- Confirmation alert dialog for restoring an archived room.

#### [NEW] [rooms/room-stats.tsx](file:///c:/Users/Daniel%20Naim/.local/share/opencode/worktree/5036723e1db32eae161f7e6f91fb45e936947464/quick-gopher/apps/app/app/(workspace)/rooms/room-stats.tsx)
- Responsive 4-column metric cards highlighting active rooms, total seats, scheduled hours/week, and capacity warnings.

#### [NEW] [rooms/loading.tsx](file:///c:/Users/Daniel%20Naim/.local/share/opencode/worktree/5036723e1db32eae161f7e6f91fb45e936947464/quick-gopher/apps/app/app/(workspace)/rooms/loading.tsx)
- Skeleton loading component matching the new stats, filter bar, and grid layout.

#### [MODIFY] [rooms/[roomId]/edit/page.tsx](file:///c:/Users/Daniel%20Naim/.local/share/opencode/worktree/5036723e1db32eae161f7e6f91fb45e936947464/quick-gopher/apps/app/app/(workspace)/rooms/[roomId]/edit/page.tsx)
- Redirect to `/rooms?edit=[roomId]` or provide a streamlined single-room fallback that uses the updated server actions.

---

## Verification Plan

### Automated Tests
- Run `bun check` / `ultracite check` to ensure zero Biome lint or type errors across packages and apps.
- Run `bun test` to verify no regressions across workspace test suites.

### Manual Verification
1. **Room Creation**: Open Add Room dialog, submit new room (e.g. "Lab 2", capacity 20, "Level 1"), verify optimistic/toast feedback and card appear immediately.
2. **Search & Filter**: Search by room name and location, test capacity filter dropdown, verify instant filtering.
3. **View Switcher**: Toggle between Grid Cards and Table View, check layout integrity and responsiveness.
4. **Room Detail Drawer**: Click a room with scheduled classes, verify that Monday–Sunday time slots, teachers, subjects, and student counts display accurately.
5. **Capacity Warning**: Schedule a class with 25 enrolled students in a 20-seat room, verify amber capacity overflow badge displays.
6. **In-place Editing**: Open Edit Room dialog from card/table action menu, update capacity/name, verify immediate update.
7. **Safe Archiving & Restoring**: Attempt to archive a room with active class schedules (verify blocking error), archive an unassigned room, verify it moves to the "Archived" tab, then restore it.
