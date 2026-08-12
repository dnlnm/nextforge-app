# menu (dropdown-menu / context-menu)

2026-08-12. coss registry source. Verdict: migrated to coss Menu (Base UI), keeping `DropdownMenu*` / `ContextMenu*` names via aliases so consumer component names survive.

## Changed

- `packages/design-system/components/ui/menu.tsx` — coss Menu. Exports canonical `Menu*` names AND `DropdownMenu*` aliases (DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal).
- `packages/design-system/components/ui/dropdown-menu.tsx` — now `export * from "./menu"` (facade).
- `packages/design-system/components/ui/context-menu.tsx` — coss ContextMenu; added aliases `ContextMenuContent`, `ContextMenuSubContent`, `ContextMenuLabel` for Niko Table compatibility.
- Consumer conversions:
  - Trigger `asChild` → `render` (22 sites): mode-toggle, user-menu, organization-switcher, sidebar-user-menu, student-profile-actions, students/columns, teachers/columns, academic-levels-list, storybook sidebar story, web language-switcher, packages/auth client.
  - Menu-item `asChild` → `render` for link items (`render={<Link/>}`).
  - `onSelect` → `onClick` on menu items (user-menu signOut, sidebar-user-menu, organization-switcher, student-profile-actions, students/columns). Radix `event.preventDefault()` (keep-open-while-opening-dialog) removed — Base UI closes then opens the dialog; `setIsXOpen(true)` still fires.
  - `forceMount` on DropdownMenuContent → `portalProps={{ keepMounted: true }}` (user-menu).
- Internal design-system: billingsdk (PopoverTrigger), navbar1 (SheetTrigger/DropdownMenuTrigger), Niko Table filters (PopoverTrigger, DropdownMenuTrigger, ContextMenuTrigger render), mode-toggle, data-table-row-context-menu `render={anchoredTrigger}`.

## Behavior deltas (flagged)

- Radix menu items closed on click (unless prevented); Base UI regular items also close by default. Checkbox/Radio menu items default `closeOnClick={false}` — none in this codebase were affected.
- Niko `CommandItem onSelect` handlers remain cmdk (command not migrated) — correct.
- `event.preventDefault()` semantics differ between Radix and Base UI; dialog-opening menu items no longer keep the menu mounted while the dialog opens.

## Follow-up fix (runtime error)

- `Base UI: MenuGroupContext is missing. Menu group parts must be used within <Menu.Group> or <Menu.RadioGroup>.` — the coss `DropdownMenuLabel` alias pointed at Base UI `Menu.GroupLabel`, which throws unless wrapped in a group. Radix allowed floating labels. Added standalone `MenuLabel` / `ContextMenuLabel` components (plain styled `div`, no group context required) in `menu.tsx` and `context-menu.tsx`, and re-pointed the `DropdownMenuLabel` / `ContextMenuLabel` aliases to them. `Menu.GroupLabel` / `ContextMenuGroupLabel` remain for in-group usage (aria-labelledby preserved there).

## Verify by hand

- Menu opens at anchor, items click, keyboard nav + typeahead, submenus, destructive variants, menu→dialog focus flow. Labels render without console errors in both standalone and in-group positions.
