# toast (sonner -> coss)

2026-08-12. coss registry source. Verdict: Sonner removed; coss `toastManager` / `ToastProvider` / `AnchoredToastProvider` adopted.

## Changed

- `packages/design-system/components/ui/toast.tsx` — created (coss). Exports `toastManager`, `anchoredToastManager`, `ToastProvider`, `AnchoredToastProvider`, `ToastPrimitive`, `ToastPosition`.
- `packages/design-system/index.tsx` — `DesignSystemProvider` now wraps `ToastProvider > AnchoredToastProvider > TooltipProvider`.
- `packages/design-system/lib/error.ts` — `handleError` uses `toastManager.add({ title, type: "error" })`.
- `packages/design-system/components/ui/sonner.tsx` — deleted (no importers).
- 62 `toast.X(...)` call sites across 18 files migrated to `toastManager.add({ title, description?, type })` via codemod + review:
  account/email-form, password-form, profile-form, center-setup-form, centre-settings-form, subscription-management-wrapper, class-enrollment-actions, archive/delete/restore-student-dialog, enrollment-center, student-create-form, student-import-upload, import-runner, enroll/transfer-student-dialog, add-subject-dialog, edit-subject-form.
- `apps/storybook/.storybook/preview.tsx` — provider tree updated (removed Sonner `Toaster`).
- `apps/storybook/stories/sonner.stories.tsx` — rewritten as coss toast demo (`toastManager.add` + `actionProps`).
- `packages/design-system/package.json` — `sonner` dependency removed.

## Behavior deltas (flagged)

- Sonner `toast(...)` had no icon/type; coss `toastManager.add` uses `type` for iconography. Every success/error call was mapped with an explicit type.
- Sonner `action: { label, onClick }` maps to `actionProps: { children, onClick }` (only used in the story).
- Toast position default is bottom-right.

## Verify by hand

- Success/error toasts appear and dismiss; error icon uses destructive color; providers present in app + web layouts and Storybook.
