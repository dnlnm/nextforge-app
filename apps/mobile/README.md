# KLIO.MY Mobile App

React Native (Expo SDK 57 + expo-router) client for the KLIO.MY API.

## What's implemented

- Authentication (sign in / sign up / password reset / deep-link callbacks) via Supabase.
- Multi-centre switching (`activeOrganizationId` re-validated server-side per request).
- Role-gated tabs (`OWNER`/`ADMIN` vs `TEACHER`).
- **Core operational flow**: Today → Class → Student roster → Attendance.
  - Today lists the day's sessions; open a session to mark attendance.
  - Classes lists the user's classes; open one for the roster and "take attendance today".
  - Attendance marks Present/Absent per student and saves via the tRPC API.

## Environment

Copy `.env.example` to `.env.local` and set:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_API_URL` (the tRPC API base URL, e.g. `https://api.klio.my`)

## Development

```bash
bun install
bunx expo start
```

Use an Expo development build for native modules (`eas build --profile development`), or `bunx expo start --web` for web.

## Testing & CI

The mobile app is intentionally excluded from the monorepo Turbo `test`/`build`
graphs (EAS builds run externally). Feature work is exercised through the shared
tRPC API tests in `apps/api`; a dedicated mobile test runner is a post-MVP item.

## API

The app talks to the same tRPC API and domain rules as the web app (see
`packages/api`). No client-side authorization decisions are trusted.
