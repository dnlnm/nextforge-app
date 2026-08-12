# select

2026-08-12. coss registry source. Verdict: migrated to coss Select (Base UI `@base-ui/react/select`), alias facade preserved.

## Changed

- `packages/design-system/components/ui/select.tsx` — replaced with coss Select. `SelectContent` aliased to `SelectPopup`. `SelectScrollUp/DownButton` removed (no consumers). Adds `SelectButton`, `selectTriggerVariants`, `selectTriggerIconClassName`.
- BEHAVIOR: `onValueChange` now emits `string | null` (Base UI). Consumer handlers that bound `Dispatch<SetStateAction<string>>` directly or `(value: string) => void` were wrapped:
  - `classes/new/create-class-form.tsx` (setTeacherId, setSubjectId, setLevelId, setAcademicYear)
  - `enrollment/enrollment-center.tsx` (setEnrollClassId, setBulkClassId, setTransferEnrollmentId, setTransferClassId, setEndEnrollmentId)
  - `classes/[classId]/class-enrollment-actions.tsx` (setSelectedStudentId)
  - `students/[studentId]/enroll-student-dialog.tsx` (setClassId)
  - `students/[studentId]/transfer-student-dialog.tsx` (setSourceEnrollmentId, setDestinationClassId)
  - `classes/components/classes-table.tsx` (inline subject/level filters)
  - `classes/components/schedule-builder.tsx` (room select)
  - `schedules/schedule-calendar.tsx` (FilterSelect onChange)
  All wrapped as `(value) => setX(value ?? "")`.

## Left alone

- Select options still rendered children-style (`<SelectItem value="x">`); the coss items-first pattern is recommended but not required for correctness. SSR/hydration should be validated in Next routes.

## Verify by hand

- Select opens, keyboard navigation works, selected value renders in trigger, form submission serializes the hidden input value.
