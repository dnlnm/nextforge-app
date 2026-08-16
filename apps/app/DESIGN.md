---
name: KLIO.MY
description: Calm, precise operational clarity for Malaysian tuition centres.
colors:
  background: "oklch(0.985 0.002 260)"
  foreground: "oklch(0.13 0.028 260)"
  card: "oklch(1 0 0)"
  card-foreground: "oklch(0.13 0.028 260)"
  primary: "oklch(0.488 0.185 264)"
  primary-foreground: "oklch(0.985 0 0)"
  secondary: "oklch(0.958 0.008 264)"
  secondary-foreground: "oklch(0.25 0.03 264)"
  muted: "oklch(0.955 0.006 264)"
  muted-foreground: "oklch(0.50 0.015 264)"
  accent: "oklch(0.955 0.012 264)"
  accent-foreground: "oklch(0.25 0.03 264)"
  destructive: "oklch(0.577 0.245 27.325)"
  success: "oklch(50.8% 0.118 165.612)"
  border: "oklch(0.920 0.005 264)"
  input: "oklch(0.920 0.005 264)"
  ring: "oklch(0.488 0.185 264)"
  sidebar: "oklch(0.975 0.004 264)"
  sidebar-accent: "oklch(0.955 0.012 264)"
typography:
  display:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.333
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.556
  body:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.429
  label:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.429
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.429
  brand:
    fontFamily: "Chillax, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.025em"
rounded:
  sm: "2px"
  md: "4px"
  lg: "6px"
  xl: "10px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  3xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.xl}"
    padding: "24px"
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "36px"
  badge-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  sidebar-item-active:
    backgroundColor: "{colors.sidebar-accent}"
    textColor: "{colors.accent-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px"
    height: "32px"
---

# Design System: KLIO.MY

## Overview

**Creative North Star: "The Calm Control Room"**

KLIO.MY is calm, precise, and assured. Its interface behaves like a well-run operational control room: the whole centre can be scanned quickly, consequential state is explicit, and the next useful action is close at hand. Density is compact but not cramped, with a near-white canvas, crisp bounded surfaces, and a cool indigo reserved for authority and action.

The system is compact and dependable rather than expressive for its own sake. Familiar controls, restrained geometry, clear status language, and structurally faithful loading states create confidence across records, attendance, billing, and reporting. Marketing spectacle is the anti-reference for routine product work: gradients, glass, decorative noise, oversized statements, and dramatic elevation must not compete with operational information.

**Key Characteristics:**

- Cool-indigo actions against quiet blue-neutral surfaces.
- Compact 14px controls and body text with disciplined 500/600 weight hierarchy.
- Thin borders and low shadows that separate information without making every panel float.
- Responsive shells that stack controls, preserve tables, and move navigation into sheets.
- Explicit hover, focus, selected, disabled, invalid, loading, empty, and dark-mode states.

## Colors

The palette is a cool operational neutral field with one assured indigo voice and localized semantic status color.

> **Implementation note (token drift — DECISION NEEDED):** the frontmatter tokens below and the sections that follow specify **Control Indigo** as the primary action color, focus ring, and chart palette. As currently implemented in `packages/design-system/styles/globals.css`, `--primary`/`--ring`/`--chart-1..5` are **neutral/grayscale** (not indigo). This is either a deliberate "calm neutral" pivot that supersedes this spec, or an unintended drift. Until a confirm-and-reconcile decision is made, treat the **implemented tokens in `globals.css` as the source of truth** for new UI work and do not re-apply indigo primaries/focus-rings.

### Primary

- **Control Indigo:** Main actions, checked controls, links, the brand mark, focus rings, and selected emphasis. It should signal authority and progress, not wash entire routine surfaces.
- **Clear Mark:** High-contrast foreground used on Control Indigo actions and the brand icon tile.

### Secondary

- **Quiet Indigo Wash:** Low-emphasis controls, role badges, and nested surfaces that need distinction without primary-action weight.
- **Deep Utility Ink:** Foreground for secondary and accent surfaces.

### Tertiary

- **Operational Green:** Confirmed success, healthy collection, and positive trend states. Use it locally with text, iconography, or a restrained tint rather than as a broad decorative field.
- **Consequence Red:** Destructive actions, invalid controls, and negative states. Invalid fields require both border and focus-ring treatment.

### Neutral

- **Cool Canvas:** The app background; nearly white in light mode and black in dark mode.
- **Control Ink:** Primary text, headings, and high-value row content.
- **Paper Surface:** Cards, dialogs, popovers, and bounded content.
- **Muted Field:** Quiet nested regions, skeletons, and low-emphasis grouping.
- **Reference Gray:** Descriptions, timestamps, helper text, and secondary identifiers.
- **Hairline Structure:** Borders, dividers, table rules, and inactive input edges.
- **Sidebar Mist:** A subtly differentiated navigation plane with its own semantic token family.

**The One Voice Rule.** Control Indigo carries action and selection; do not introduce competing general-purpose accent hues.

**The Semantic Surface Rule.** Standard backgrounds, text, borders, and controls use semantic tokens so light and dark modes remain paired. Literal colors are restricted to verified status treatments.

## Typography

**Display Font:** Geist Sans (with system sans-serif fallbacks)  
**Body Font:** Geist Sans (with system sans-serif fallbacks)  
**Label/Mono Font:** JetBrains Mono for compact numeric and code-like output  
**Brand Font:** Chillax Semibold for the KLIO.MY wordmark only

**Character:** Geist gives the product a neutral, highly legible operating voice. Chillax provides a single proprietary signature at the wordmark, while JetBrains Mono and tabular numerals align money, counts, chart values, and technical identifiers when precision benefits from fixed rhythm.

### Hierarchy

- **Display** (600, 48px, 1): Reserved for exceptional onboarding or setup statements, not workspace pages.
- **Headline** (600, 24px, 1.333): Standard workspace page title with tight tracking.
- **Title** (600, 18px, 1.556): Card, dialog, and prominent section titles.
- **Body** (400, 14px, 1.429): Default product copy, descriptions, tables, and field support. Mobile inputs use 16px text to avoid viewport zoom.
- **Label** (500, 14px, 1.429): Buttons, labels, navigation, active rows, and important metadata.
- **Compact Metadata** (400-500, 12px, 1.333): Badges, timestamps, trend details, and secondary identifiers.
- **Metric** (600, 24-30px, tight tracking): Dashboard counts and financial totals; use tabular numerals where values align or update.

**The Quiet Weight Rule.** Routine hierarchy uses 400 for body, 500 for controls, and 600 for headings and metrics. Do not default product UI to bold 700+ weights.

**The Wordmark Boundary Rule.** Chillax belongs to the KLIO.MY wordmark, never to headings, buttons, or decorative pull quotes.

## Layout

Workspace screens use a full-width operational shell with a 256px desktop sidebar, a 48px collapsed rail, a 64px header, and 16px page insets. Major dashboard regions use a 20px gap; dense stat groups use 12px. Cards default to 24px internal padding, while data-dense operational cards may reduce this to 16px without changing the outer visual language.

Main-domain account and centre-management screens use centered containers between 768px and 1152px wide, 16px mobile gutters, 24px gutters from the small breakpoint, and 32-40px vertical padding. Title-and-action rows stack on small screens and align horizontally from 768px when space permits.

Responsive behavior follows the system's standard breakpoints: 640px, 768px, 1024px, 1280px, and 1536px. Below 768px the workspace sidebar becomes a 288px sheet. Main navigation switches to a sheet below 1024px. Dense tables preserve their tabular structure with horizontal scrolling and non-wrapping cells; toolbars wrap, and pagination stacks below 768px.

Dashboard composition reveals information progressively. Stats move from one column to two, three, then five at the widest breakpoint. Large chart and activity regions stay single-column until enough width exists for intentionally proportioned multi-column grids. Loading skeletons must mirror the final grid, card heights, and row geometry.

**The Operational Rhythm Rule.** Start with 16px page insets, 20px between major regions, 12-16px inside dense groups, and 24px for default card/dialog padding. Depart only when content density gives a concrete reason.

**The Table Integrity Rule.** Preserve genuine row-and-column relationships on narrow screens through horizontal overflow; do not automatically turn operational tables into disconnected cards.

## Elevation & Depth

The system uses layered restraint. Borders establish most structure, low ambient shadows separate bounded surfaces, muted tonal fills identify nested regions, and stronger elevation is reserved for overlays or responsive hover emphasis. Default cards must remain grounded rather than appearing as a field of floating tiles.

### Shadow Vocabulary

- **Hairline Lift** (`0 1px 2px oklch(0 0 0 / 0.04)`): Inputs and outline controls that need slight separation from the canvas.
- **Resting Surface** (`0 1px 3px oklch(0 0 0 / 0.06), 0 1px 2px oklch(0 0 0 / 0.04)`): Default cards, stats, and active segmented controls.
- **Raised Surface** (`0 4px 8px -2px oklch(0 0 0 / 0.08), 0 2px 4px -2px oklch(0 0 0 / 0.04)`): Menus, popovers, and restrained card hover.
- **Overlay Surface:** Dialogs and sheets may use stronger elevation together with a black 50% overlay because they temporarily sit above the operating context.

**The Border-Before-Shadow Rule.** Use a semantic border and tonal contrast to define a surface before increasing its shadow.

**The Grounded Card Rule.** Strong shadows are transient or exceptional. Routine cards rest at low elevation.

## Shapes

Geometry is modest and functional. Controls and navigation items use gently curved 4px corners; dialogs and compact stat tiles use 6px corners; cards use 10px corners. Badges, avatars, and status dots may be circular or pill-shaped because their compact silhouette communicates category or identity.

Borders are thin, semantic, and structurally meaningful. Dashed borders are reserved for empty or drop-style regions. Icons are predominantly 16px, reducing to 12px inside badges and increasing to 20px only for prominent empty-state or stat contexts.

**The Modest Corner Rule.** Pills belong to badges, avatars, and status markers, not buttons, inputs, cards, or navigation rows.

## Components

Components are compact and dependable: efficient dimensions, explicit state handling, and no ornamental behavior that obscures the task.

### Buttons

- **Shape:** Gently curved rectangle (4px radius), normally 36px high with 16px horizontal padding and an 8px icon gap.
- **Primary:** Control Indigo with Clear Mark text; use for the main action in a local decision context.
- **Hover / Focus:** Hover darkens through restrained opacity. Keyboard focus adds a semantic border and a 3px ring at 50% opacity. Disabled controls retain their shape at 50% opacity.
- **Secondary / Outline / Ghost / Link:** Secondary uses Quiet Indigo Wash; outline uses the canvas with a hairline border and shadow; ghost is transparent until interaction; link uses Control Indigo and underlines on hover.
- **Sizes:** 32px for compact toolbars, 36px by default, 40px for high-emphasis actions, and square equivalents for icon-only controls.

### Chips

- **Style:** Pill-shaped, 12px medium text, 8px horizontal and 2px vertical padding, with a reserved transparent border slot to prevent state shifts.
- **State:** Default, secondary, destructive, outline, ghost, and link variants mirror the button hierarchy. Role and status meaning must not rely on color alone.

### Cards / Containers

- **Corner Style:** Restrained panel curve (10px radius); compact stat tiles use 6px.
- **Background:** Paper Surface on Cool Canvas, with semantic foreground text.
- **Shadow Strategy:** Resting Surface by default; stronger lift only on interactive hover or overlays.
- **Border:** One-pixel Hairline Structure.
- **Internal Padding:** 24px by default; 16px for verified dense operational compositions.

### Inputs / Fields

- **Style:** 36px high, 4px radius, one-pixel input border, transparent canvas fill, 12px horizontal padding, and Hairline Lift.
- **Focus:** Semantic border plus a 3px Control Indigo ring at 50% opacity.
- **Error / Disabled:** Invalid controls use both destructive border and ring. Disabled controls are non-interactive, not-allowed, and 50% opaque. Supporting errors use destructive text.
- **Typography:** 16px below 768px and 14px from 768px to preserve mobile usability and desktop density.

### Navigation

- **Workspace sidebar:** 32px rows with 8px padding, 8px icon gap, 16px icons, 4px corners, and 14px text. Active items use Sidebar Mist accent and 500 weight.
- **Main navigation:** 36px rows with 16px horizontal padding and 500-weight labels. Inactive links lower foreground emphasis; hover uses a muted semantic surface.
- **Mobile:** Navigation moves into sheets rather than compressing labels into an unusable rail. Selection and focus remain explicit.

### Tables

- **Structure:** 14px text, 40px headers, 8px cells, one-pixel row dividers, muted row hover, and muted selected state.
- **Composition:** A bounded container combines wrapping toolbar, horizontal table viewport, and bordered pagination footer.
- **Hierarchy:** Primary cells use 500 weight; secondary identifiers and timestamps use 12px Reference Gray; category and status values use badges.

### Dashboard Stats

- **Structure:** Compact 16px-padded card with a two-column label/icon row, 24px metric, and 12px detail or trend.
- **Indicator:** A 32px bordered icon well may use a restrained semantic tint. Status color is local and always supported by text or iconography.
- **Behavior:** Interactive stat tiles may increase shadow on hover without changing scale or displacing surrounding layout.

### Dialogs and Sheets

- **Dialog:** Centered, at most 512px wide, 24px padded, 6px radius, strong overlay elevation, and black 50% backdrop. Mobile actions stack; desktop actions align right.
- **Sheet:** Used for mobile navigation and edge-bound tasks. Entry and exit motion follows the opening edge and never distracts from content.

## Do's and Don'ts

### Do:

- **Do** use semantic surface, foreground, border, status, and focus tokens so light and dark modes remain coherent.
- **Do** preserve the 400/500/600 type-weight hierarchy and use 14px as the operational body and control baseline.
- **Do** use 36px controls by default, 32px in compact toolbars, and 40px for exceptional emphasis.
- **Do** keep cards bordered and low-elevation at rest.
- **Do** preserve keyboard focus, selected, disabled, invalid, empty, loading, and reduced-motion states.
- **Do** stack action rows on mobile, move navigation into sheets, and keep true tables horizontally scrollable.
- **Do** align money, counts, and changing metrics with tabular numerals or JetBrains Mono when precision benefits.
- **Do** make skeletons structurally match their loaded surfaces.

### Don't:

- **Don't** introduce arbitrary gray values for standard surfaces, text, or borders; use the semantic palette.
- **Don't** add gradients, glass effects, decorative noise, oversized marketing typography, or dramatic elevation to routine operational screens.
- **Don't** use literal status tints as general-purpose panel colors or copy light-only status treatments without verified dark-mode behavior.
- **Don't** make every card float with large shadows or animate layout shifts.
- **Don't** use 700+ weights as the default hierarchy or Chillax outside the wordmark.
- **Don't** use pill corners for buttons, inputs, cards, or navigation rows.
- **Don't** replace operational tables with mobile cards unless the information model itself changes.
- **Don't** create local substitutes for shared button, card, input, badge, navigation, or table primitives without a concrete missing capability.
