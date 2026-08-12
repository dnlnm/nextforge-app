# button

2026-08-12. coss registry source (strategy: coss CLI add, then consumer sweep). Verdict: migrated to coss Button (Base UI `useRender`-based), Spinner replaced with coss Spinner.

## Changed

- `packages/design-system/components/ui/button.tsx` — replaced with coss Button. `Button` is now `useRender`/`mergeProps`-based (`@base-ui/react/use-render`, `@base-ui/react/merge-props`). Exports `Button`, `buttonVariants`, `ButtonProps`. New props: `loading` (renders coss Spinner with `data-slot="button-loading-indicator"`), `data-loading`, `aria-disabled`. `asChild` removed; use `render`.
  - New sizes: `xl`, `icon-xl`. New variant: `destructive-outline`. Existing sizes (`xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`) and variants (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`) preserved.
  - BEHAVIOR DELTA: default `type` is now `"button"` (old shadcn Button left `type` unset → implicit `submit`). Form submit Buttons must pass `type="submit"` explicitly.
- `packages/design-system/components/ui/spinner.tsx` — replaced with coss Spinner (`export function Spinner`, `React.ComponentProps<typeof Loader2Icon>`).
- `packages/design-system/components/navbar1.tsx` — 4 `<Button asChild>` → `render={<a href=... />}`.
- Consumer sweep (80 `<Button asChild>` → `render={<Link|a ... />}` across 43 files in apps/app, apps/web):
  - `asChild` prop removed; inner element moved to `render` with its props intact; inner children became Button children.
  - `apps/web/app/[locale]/components/header/index.tsx` was corrupted by the first codemod pass (arrow-function props containing `>`); restored from git and hand-converted (5 sites, including a nested `NavigationMenuLink asChild > Button asChild > Link`).
- Submit-type sweep: added `type="submit"` to 7 buttons relying on implicit submit:
  - `apps/app/app/(workspace)/components/search.tsx` (search button)
  - `apps/app/app/(workspace)/rooms/page.tsx` (Archive, Restore)
  - `apps/app/app/(workspace)/subjects/subjects-list.tsx` (Archive)
  - `apps/app/app/(workspace)/subjects/[subjectId]/page.tsx` (Archive x2)
  - `apps/web/app/[locale]/contact/components/contact-form.tsx` (submit CTA)
  - Verified `packages/auth` sign-in/sign-up already used `type="submit"`.

## Left alone

- All other `asChild` consumers (DropdownMenuTrigger, DialogTrigger, SheetTrigger, CollapsibleTrigger, NavigationMenuLink, SidebarMenuButton, BreadcrumbLink, PopoverTrigger, AlertDialogTrigger) — still Radix-based, migrated in their own families.
- `packages/design-system/lib/error.ts` (`handleError`) — still on sonner; migrated with Toast family.
- Biome reformatted the touched design-system files to repo style (cosmetic only).

## Verify by hand

- Link-as-Button renders render exactly one `<a>` with button classes (no nested button).
- Buttons inside forms submit (Archive/Restore/search/contact CTA).
- `loading` prop shows spinner and disables.
- Ghost/outline/destructive/links contrast in light and dark.
