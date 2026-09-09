# Redesign Centre Settings (`/centres/[id]/settings`) — Implementation Plan & Specification

## Overview & Context

The [`/centres/[id]/settings`](file:///c:/Users/Daniel%20Naim/.local/share/opencode/worktree/5036723e1db32eae161f7e6f91fb45e936947464/fluid-test/apps/app/app/(main)/centres/%5Bid%5D/settings/page.tsx) page is the primary settings portal on `klio.my` for tuition centre owner-operators. It allows owners to manage their centre's profile, contact details, branding, and workspace configuration.

### The Current Flaws & Pain Points

1. **The "Paste an Image URL" Anti-Pattern**:
   - The logo field is currently a raw text input (`<input placeholder="https://example.com/logo.png" />`).
   - Forcing a Malaysian tuition centre owner to upload an image to an external hosting service and paste a URL is a major friction point. The repository already has direct Cloudflare R2 presigned uploads (`uploadToR2`) and client-side optimization (`optimizeImageFile`), but this page does not use them.
2. **Missing Branch & Contact Fields**:
   - Tuition centres in Malaysia are physical premises. The Prisma schema already contains `Branch` and `OrganizationSettings` models with phone, address, city, state, and postcode, but the current settings page only exposes `name` and `imageUrl`.
   - Owners cannot update their centre's phone number or street address from their primary SaaS portal.
3. **Passive, Dead-End Subdomain Box**:
   - The workspace URL is displayed in a static code block with a generic text note. It lacks one-click copy, workspace testing links, and helpful context on invitation links and bookmarks.
4. **The "Disabled Fake Button" Danger Zone**:
   - A disabled red button without explanation of why it is locked, what prerequisites exist, or what archiving a centre entails.
5. **Legacy Component Drift**:
   - Still uses legacy `CardShell` and legacy `Button` rather than the updated Fluid UI components (`fluid-card`, `fluid-button`, `fluid-input`, etc.).

---

## The Target Experience: The Comprehensive Centre Settings Hub

Transform `/centres/[id]/settings` into an intuitive, polished management surface divided into 4 clear functional cards:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  ← Back to My Centre                                                                        │
│                                                                                             │
│  Bright Mind Academy — Settings                                      [ Save Changes ]       │
│  Configure your centre branding, branch details, and workspace URL                          │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│  CARD 1: CENTRE IDENTITY & LOGO                                                             │
│                                                                                             │
│  Logo             [ 📷 80x80 Preview ]   [ Upload New Logo ]   [ Remove ]                   │
│                                         Supports PNG, JPG, WebP up to 2MB                   │
│                                                                                             │
│  Centre Name      [ Bright Mind Academy                                    ]                │
│                   Official centre name shown on receipts, invoices, and portal              │
│                                                                                             │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│  CARD 2: CONTACT & PHYSICAL LOCATION                                                        │
│                                                                                             │
│  Official Email   [ contact@brightmind.edu.my                              ]                │
│  Contact Phone    [ +60 12-345 6789                                        ]                │
│  Street Address 1 [ 42, Jalan SS 2/67                                      ]                │
│  Street Address 2 [ Level 2, Commercial Block (optional)                   ]                │
│  City & Postcode  [ Petaling Jaya                ]  [ 47300                ]                │
│  State            [ Selangor                                             ▼ ]                │
│                                                                                             │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│  CARD 3: WORKSPACE SUBDOMAIN & ACCESS                                                       │
│                                                                                             │
│  Workspace URL    [ brightmind.klio.my                     ] [ 📋 Copy ] [ Visit ↗ ]        │
│                   Staff and teachers sign in directly through your subdomain                │
│                                                                                             │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│  CARD 4: DANGER ZONE                                                                        │
│                                                                                             │
│  Archive Centre   Make this centre inaccessible to staff. Preserves financial audit logs.   │
│                   Requires active subscription cancellation & typing centre name to confirm.│
│                   [ Archive Centre... ]                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Architectural & Technical Breakdown

### 1. Data Schema & Synchronization (`actions.ts`)
The server action will update both the primary Organization entity and its associated operational settings and branch in a single database transaction:
- **`Organization`**: `name`, `imageUrl`
- **`OrganizationSettings`**: `email`, `phone`, `addressLine1`, `addressLine2`, `city`, `state`, `postcode`
- **`Branch`**: Synchronize address and phone to the default branch record for full consistency across invoices, receipts, and reports.
- **`archiveCentre(organizationId, confirmationName)`**:
  - Validates that `confirmationName === organization.name`.
  - Ensures the user is an active `OWNER`.
  - Soft-archives the organization (`status: "ARCHIVED"`, `archivedAt: new Date()`).
  - Revalidates paths and redirects to `/centres`.

### 2. Direct Cloudflare R2 Logo Upload (`centre-logo-uploader.tsx`)
- Allows drag-and-drop or file selection for images.
- Optimizes images client-side via `optimizeImageFile(file, { maxSizeMB: 1, maxWidthOrHeight: 512 })`.
- Uploads directly to Cloudflare R2 public bucket via `/api/uploads/centre-logo` using `uploadToR2`.
- Instant local object URL preview during upload, with error handling and fallback to the original image.

### 3. Malaysian Location & Contact Formatting
- Dropdown for Malaysian States:
  - *Selangor, WP Kuala Lumpur, Johor, Pulau Pinang, Perak, Kedah, Melaka, Negeri Sembilan, Pahang, Kelantan, Terengganu, Perlis, Sabah, Sarawak, WP Putrajaya, WP Labuan*.
- 5-digit postcode and standard phone format.

### 4. Interactive Danger Zone Confirmation Dialog
- Built using `@repo/design-system/components/ui/fluid-dialog`.
- Outlines exact consequences:
  - Centre workspace will be locked.
  - Historical student attendance and invoice records remain securely preserved for PDPA/tax compliance.
  - Active Stripe subscriptions must be canceled prior to archiving.
- Enforces typing the exact centre name before the destructive action button enables.

### 5. Fluid Design System Upgrade
- Replaces legacy `CardShell` with elevated `Card` from `@repo/design-system/components/ui/fluid-card`.
- Replaces legacy buttons with `Button` from `@repo/design-system/components/ui/fluid-button`.
- Integrated toast feedback via `toastManager` with loading indicators.

---

## Proposed Changes

### Component Layer: `apps/app/app/(main)/centres/[id]/settings`

| Action | Path | Description |
| :--- | :--- | :--- |
| **[MODIFY]** | [`page.tsx`](file:///c:/Users/Daniel%20Naim/.local/share/opencode/worktree/5036723e1db32eae161f7e6f91fb45e936947464/fluid-test/apps/app/app/(main)/centres/[id]/settings/page.tsx) | Query organization with settings, branch, and subscription status; render redesigned settings shell. |
| **[MODIFY]** | [`actions.ts`](file:///c:/Users/Daniel%20Naim/.local/share/opencode/worktree/5036723e1db32eae161f7e6f91fb45e936947464/fluid-test/apps/app/app/(main)/centres/[id]/settings/actions.ts) | Transactional update across Organization, OrganizationSettings, and Branch; add `archiveCentre` server action. |
| **[MODIFY]** | [`centre-settings-form.tsx`](file:///c:/Users/Daniel%20Naim/.local/share/opencode/worktree/5036723e1db32eae161f7e6f91fb45e936947464/fluid-test/apps/app/app/(main)/centres/[id]/settings/centre-settings-form.tsx) | Rewrite using Fluid cards, logo uploader, contact fields, subdomain copy, and archive dialog. |
| **[NEW]** | `centre-logo-uploader.tsx` | Specialized logo uploader with client optimization, R2 upload, and live preview. |
| **[NEW]** | `centre-archive-dialog.tsx` | Safety confirmation dialog with name verification before archiving. |

---

## Verification Plan

### Automated Checks
- Run Biome / Ultracite linter:
  ```powershell
  bun run check
  ```
- Run TypeScript type checks:
  ```powershell
  bun x tsc --noEmit -p apps/app/tsconfig.json
  ```
- Run unit test suite:
  ```powershell
  bun --cwd apps/app test
  ```

### Manual Verification
1. **Logo Upload**: Test selecting a local PNG/JPG file, verify client optimization and successful R2 upload. Verify preview updates and persists upon saving.
2. **Contact & Location Details**: Update address, city, state, phone, and email; verify saving reflects in database for both `OrganizationSettings` and `Branch`.
3. **Workspace URL**: Test one-click copy and "Open Workspace" link opening `<slug>.klio.my`.
4. **Archive Dialog**: Open dialog, ensure button remains disabled until exact centre name is typed.
