# Date and time conventions

All date/time utilities live in `packages/date` (`@repo/date`), built on `date-fns` v4 and `@date-fns/tz`. Import from `@repo/date`; do not import `date-fns` directly in apps or other packages, and always declare `@repo/date` as a direct dependency of any workspace that uses it.

## Two date kinds

- **Calendar dates** (date of birth, class start/end, enrollment dates, attendance session dates) are stored as **UTC-midnight** `Date`s (`...T00:00:00.000Z`). Parse and serialize only through `parseCalendarDate`, `tryParseCalendarDate`, and `formatCalendarDate`. These are not "instants" — never shift them by browser/server timezone.
- **Instants** (`createdAt`, `updatedAt`, `paidAt`, `markedAt`, invitation/subscription expiry) are true timestamps. Use `new Date()` to record them and `isExpired(expiresAt, now)` for exact boundary checks.

## Malaysia timezone

Business "today", weekdays, and calendar-day arithmetic are explicitly `Asia/Kuala_Lumpur`:

- `getMalaysiaToday()`, `getMalaysiaWeekday(date)`, `getMalaysiaCalendarDate()`
- `addMalaysiaCalendarDays(date, n)` and `differenceInMalaysiaCalendarDays(a, b)`

Do not rely on the server or browser timezone for these.

## Display formatting

Use the shared display helpers in `@repo/date` (`formatShortDate`, `formatWeekdayDate`, `formatDateTime`, `formatMediumDate`, `formatLongMonthYear`, `formatTime`, `formatWallClockTime`, `formatRelativeTime`, `formatLongDate`, `formatMonthLabel`) instead of ad-hoc `Intl.DateTimeFormat` calls. Locale-aware web dates use `formatLongDate(date, locale)` and `getDateFormatLocale(locale)`.

## API and serialization

- Zod `z.iso.date()` schemas remain the input contract; validate first, then convert with `@repo/date`.
- tRPC returns `Date` instances (SuperJSON). Do not replace them with formatted strings.
- Do not change `yyyy-MM-dd` machine formats or full ISO timestamps in exports/CSV/workbook metadata.

# Chart conventions

All charts use the vendored EvilCharts components (recharts engine) in `packages/design-system/components/evilcharts`. Import the chart family components from `@repo/design-system/components/evilcharts/charts/recharts-{area,line,bar,composed,pie,radial,radar,sankey}-chart` and the shared tooltip from `.../evilcharts/ui/recharts-tooltip`. Do not import `recharts` directly in apps.

- `ChartConfig` `colors` are per-series arrays of `{ light: string[], dark: string[] }` using semantic tokens (`var(--chart-1)`…`var(--chart-5)`, `var(--primary)`, `var(--success)`, `var(--destructive)`).
- Data row types passed to `data` must be **type aliases**, not interfaces — they must satisfy the `Record<string, unknown>` constraint (interfaces lack an index signature). Mark them with `// biome-ignore lint/style/useConsistentTypeDefinitions: …` since the repo Biome config prefers interfaces.
- Storybook stories live in `apps/storybook/stories/chart.stories.tsx`; meta needs a baseline `args` when stories use `render` only.
- Pie/radial center labels are plain HTML overlays (`relative` container + absolutely-positioned `pointer-events-none` div), not recharts labels.
- Vendored evilcharts files are registry copies (re-copied by `bun run bump-ui`); they intentionally do not match the repo's strict Biome config, same as `billingsdk`/`niko-table`.
