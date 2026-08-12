# project

2026-08-12. Migration of `@repo/design-system` and its consumers from source-owned shadcn `new-york`/Radix wrappers to coss/Base UI, adopting the full coss neutral visual system. Whole-web-workspace, progressive bottom-up. Radix stays installed until the last wrapper is migrated.

## Preflight

- Package manager: bun 1.3.14 (repo pins bun@1.3.10).
- shadcn CLI 4.16.1 installed at `C:\Users\DANIEL~1\AppData\Local\Temp\opencode\shadcn-cli` because `bunx shadcn@latest` fails to resolve its bin on this Windows setup.
- `shadcn info --json -c packages/design-system` (authoritative): base `radix`, style `new-york`, tailwind v4, aliases `@repo/design-system/{components,lib,utils,hooks}`, ui dir `components/ui`, rsc true, icons lucide.
- Config is legacy `new-york` (no `base-new-york` counterpart), so the golden-pair strategy does not apply; the transformation engine + coss registry is the path.
- Target: coss registry (`@coss/<component>`), full coss style chosen by user. Web only; `apps/mobile` (HeroUI Native) untouched.
- Baseline typecheck of `packages/design-system` passed before any changes.
- Pre-existing (verified at HEAD, NOT caused by this migration):
  - `apps/web` typecheck: `app/[locale]/contact/components/contact-form.tsx(82,23)` — `initialFocus` not accepted by installed react-day-picker DayPickerProps.
  - `apps/storybook` typecheck: implicit `any` on `args`/`Story` params across many stories (TS7006).

## Dependencies installed

- `@base-ui/react@1.7.0` added to `packages/design-system` (Radix retained for now).
- shadcn CLI applied `@coss/colors-neutral` (50 coss CSS vars into `globals.css`, no component files) and `@coss/button` (overwrites `components/ui/button.tsx`, `components/ui/spinner.tsx`, adds 2 CSS vars).

## Theme

- `globals.css` now carries the coss neutral token set for `:root` and `.dark` (background/foreground/card/popover/primary/secondary/muted/accent/destructive/border/input/ring + destructive-foreground/info/success/warning families), radius 0.5rem.
- KLIO brand tokens kept as additives: `hover`, `active`, `accent-blue`, `accent-blue-hover`, `link`, custom type scale, custom shadow utilities, self-hosted Geist Sans/JetBrains Mono/Chillax fonts.
- Font contract extended with `--font-heading: var(--font-sans)` (coss components rely on it).
- Radix accordion keyframes still present; removed when Accordion is migrated.

## Status by family

| Family | Status |
|---|---|
| Theme tokens (coss neutral) + font contract | DONE |
| cn/utils split | DONE |
| Button + Spinner | DONE (coss) |
| Display foundations (Card, Alert, Avatar, Separator, Progress, Empty, Kbd, Skeleton, Badge, Breadcrumb, Label) | DONE |
| Form controls (Input, Textarea, Field, Fieldset, Checkbox, RadioGroup, Switch, Slider) | DONE |
| Disclosure (Accordion, Collapsible, Tabs, Toggle, ToggleGroup) | DONE |
| Overlays (Tooltip, Popover, Dialog, AlertDialog, Sheet, PreviewCard, ScrollArea) | DONE |
| Menus (Menu facade for dropdown-menu, ContextMenu + aliases) | DONE |
| Select | DONE |
| Toast (sonner -> coss toastManager) | DONE |
| NavigationMenu, Sidebar full coss, ModeToggle (partially: coss primitives integrated, wrapper still shadcn-based) | pending |
| OTP field, Command, DatePicker, Stat, Table, AspectRatio | pending |
| Niko Table, BillingSDK deep migration | pending (primitives underneath migrated) |

## Verification (2026-08-12)

- `packages/design-system`, `apps/app`, `apps/web`, `apps/api` typechecks all pass.
- `apps/storybook` typecheck: pre-existing implicit-`any` story errors only (unrelated).
- `bun run test`: 3 tasks pass (app 10, api 49+3 skipped, domain).
- `bun run --cwd apps/app build`: SUCCESS (all routes).
- `bun run --cwd apps/web build`: SUCCESS after removing the pre-existing `initialFocus` error in the contact form (react-day-picker v10 dropped the prop; this error pre-dated the migration and blocked the web build).
- `bun run check`: repo-wide lint was already failing at HEAD (~9578 diagnostics, unrelated debt). Migration adds a small number of new diagnostics, dominated by `lint/a11y/useAnchorContent` false positives on the standard Base UI `render={<a/>}` pattern (content is merged at runtime).
- `sonner` dependency removed from `packages/design-system`.

## Phase 2 complete (2026-08-13)

- `radix-ui` and `@radix-ui/react-icons` removed from all packages — no Radix imports remain in the repo (web only; mobile untouched).
- Remaining families migrated:
  - **OTP field**: `input-otp` -> coss `otp-field.tsx` (`OTPField`, `OTPFieldInput`, `OTPFieldSeparator`); story rewritten; `input-otp` dep removed.
  - **Table**: coss `table.tsx`; added `TableComponent` bare-table export for Niko Table compatibility.
  - **Sidebar**: full coss `sidebar.tsx`; 2 consumer `SidebarMenuButton asChild` -> `render`.
  - **Calendar**: coss `calendar.tsx` (`@daypicker/react`); `react-day-picker` dep removed.
  - **Drawer**: coss `drawer.tsx`; `vaul` dep removed.
  - **HoverCard**: `hover-card.tsx` is now a facade over `preview-card.tsx`.
  - **AspectRatio**: Radix primitive replaced with a plain CSS `aspect-ratio` div.
  - **ModeToggle + web icons**: `@radix-ui/react-icons` -> `lucide-react`.
  - **NavigationMenu**: removed — web header now uses a plain `<nav>`; app main-nav uses `Button` links + coss `DropdownMenu` for "My Workspaces"; unused `navbar1.tsx` deleted.
  - **Menubar**: removed (storybook-only, no coss counterpart).
  - **Slot-based wrappers**: `form.tsx`, `item.tsx`, `sortable.tsx` (dnd-kit), `button-group.tsx` now use a local `cloneElement` slot / `useRender` instead of Radix `Slot`.

## Remaining non-coss (intentionally kept)

Command (cmdk — skill rule), Chart (recharts), Carousel (embla), Resizable (react-resizable-panels), DatePicker + Stat (custom composites now on coss parts), Niko Table + BillingSDK (surface refactors; their primitives are coss). `apps/mobile` untouched.

## Verification (Phase 2)

- `packages/design-system`, `apps/app`, `apps/web`, `apps/api` typechecks pass.
- `apps/app` and `apps/web` production builds pass.
- `bun run test` passes (3 tasks).

## Remaining Radix wrappers (derived via grep)

Accordion, AlertDialog, AspectRatio, Avatar, Badge, Breadcrumb, Calendar, Card, Chart, Checkbox, Collapsible, Command, ContextMenu, Dialog, Drawer, DropdownMenu, HoverCard, Input, Label, Menubar, NavigationMenu, Popover, Progress, RadioGroup, ScrollArea, Select, Separator, Sheet, Skeleton, Slider, Switch, Table, Tabs, Toggle, ToggleGroup, Tooltip + sidecar composables (date-picker, resizable, sortable, button-group, input-group, item, stat, field, form, input-otp, sonner).

## Not touched by design (coss has no direct replacement or is third-party)

dropdown-menu (replaced by coss menu), hover-card (coss preview-card), menubar, navigation-menu, aspect-ratio, carousel (embla), chart (recharts), date-picker, resizable (react-resizable-panels), sortable (dnd-kit), sonner (coss toast), input-otp (coss otp-field), stat, button-group, item, Niko Table, BillingSDK, mobile.
