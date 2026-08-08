# Packages

All packages live in `/packages/` and are imported as `@repo/<name>`.

## Authentication (`@repo/auth`)

**Provider**: Supabase Auth

Handles user authentication, organization management, and session handling.

**Key exports**:
- `AuthProvider` — wrapped inside `DesignSystemProvider`
- Supabase SSR clients for server and browser authentication
- Application-managed organization and membership helpers

**Sessions**: Supabase Auth sessions are refreshed in application middleware. Organizations and memberships are managed in the application database.

**Swappable to**: Supabase Auth, Auth.js.

## Database (`@repo/database`)

**ORM**: Prisma
**Default provider**: Supabase PostgreSQL

**Key exports**:
- `database` — Prisma client instance

**Usage**:
```typescript
import { database } from '@repo/database';
const users = await database.user.findMany();
```

**Schema**: `packages/database/prisma/schema.prisma`
**Migrations**: `bun run migrate` (format → generate → db push)

**Swappable to**: Drizzle, PlanetScale, Supabase, Turso, EdgeDB, Prisma Postgres.

## Payments (`@repo/payments`)

**Provider**: Stripe

**Key exports**:
- `stripe` — Stripe client instance (optional chaining: `stripe?.prices.list()`)

**Features**: Subscriptions, one-time payments, Stripe Radar fraud prevention.

**Webhooks**: `POST /api/webhooks/payments` handles Stripe events (payment success, subscription changes, etc.).

**Swappable to**: Paddle, Lemon Squeezy.

## Email (`@repo/email`)

**Provider**: Resend + React Email

**Key exports**:
- `resend` — Resend client instance

**Usage**:
```typescript
import { resend } from '@repo/email';
import { WelcomeEmail } from '@repo/email/templates/welcome';

await resend?.emails.send({
  from: 'hello@example.com',
  to: 'user@example.com',
  subject: 'Welcome',
  react: <WelcomeEmail />,
});
```

**Templates**: React components in the email package. Preview at `http://localhost:3003`.

## CMS (`@repo/cms`)

**Provider**: BaseHub

**Key exports**:
- `Feed`, `Body`, `TableOfContents`, `Image`, `Toolbar` — content rendering components

**Setup**: Fork the `basehub/next-forge` template, generate a Read Token, set `BASEHUB_TOKEN`.

**Features**: Type-safe content queries, Draft Mode preview, on-demand revalidation via webhooks.

**Swappable to**: Content Collections.

## Design System (`@repo/design-system`)

**Library**: shadcn/ui (New York style, neutral colors)

**Key exports**:
- `DesignSystemProvider` — wraps tooltip, toast, analytics, auth, and theme providers
- Full component library (Button, Dialog, Form, Table, etc.)
- Font configuration
- Utility hooks

**Add components**:
```bash
npx shadcn@latest add [component] -c packages/design-system
```

**Update components**:
```bash
bun run bump-ui
```

**Dark mode**: Integrated via `next-themes`. The provider handles theme switching.

## Analytics (`@repo/analytics`)

**Web analytics**: Vercel Web Analytics (enable in dashboard), Google Analytics (via `NEXT_PUBLIC_GA_MEASUREMENT_ID`).

**Product analytics**: PostHog (default).

**Key exports**:
- `analytics` from `@repo/analytics/server` — server-side tracking
- `analytics` from `@repo/analytics/posthog/client` — client-side tracking

**Usage**:
```typescript
import { analytics } from '@repo/analytics/server';
analytics?.capture({ event: 'user_signed_up', distinctId: userId });
```

**Ad-blocker bypass**: PostHog requests are reverse-proxied through Next.js rewrites (`/ingest/*`).

## Observability (`@repo/observability`)

**Error tracking**: Sentry — captures exceptions and performance data.

**Logging**: BetterStack Logs in production, console in development.

**Key exports**:
- `log` from `@repo/observability/log` — logging interface (`log.info()`, `log.error()`, etc.)
- Sentry configuration via `instrumentation.ts` and `sentry.client.config.ts`

**Uptime monitoring**: BetterStack integration.

**Sentry tunneling**: Requests proxied through rewrites to bypass ad-blockers.

## Storage (`@repo/storage`)

**Provider**: Cloudflare R2 (S3-compatible object storage), split into two buckets.

**Buckets**:
- **Public** (`R2_PUBLIC_BUCKET_NAME`) — e.g. centre logos. Public access via the custom domain `R2_PUBLIC_URL` (`https://cdn.klio.my`); the stored value is a full public URL.
- **Private** (`R2_PRIVATE_BUCKET_NAME`) — e.g. student photos, documents. No public access; the stored value is an object **key** (e.g. `Student.photoKey`), read through the authenticated proxy `GET /api/files/[...key]`.

**Flow**: Direct browser → R2 uploads via presigned PUT URLs. The server only authenticates, validates, and signs; the browser PUTs bytes straight to R2.

**Key exports**:
- `createPresignedUploadUrl({ bucket, key, contentType })` from `@repo/storage` — server-side signing; returns `{ uploadUrl, key, url? }` (`url` only for the public bucket)
- `createSignedDownloadUrl({ key })` / `getPrivateObject(key)` from `@repo/storage` — private reads
- `uploadToR2(file, endpoint)` from `@repo/storage/client` — browser two-step upload; returns `{ key, url? }`
- `privateFileUrl(key)` from `@repo/storage/client` — builds the `/api/files/<key>` proxy src for rendering private objects

**Env**: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_BUCKET_NAME`, `R2_PUBLIC_URL`, `R2_PRIVATE_BUCKET_NAME`. Both buckets need a CORS policy allowing `PUT` from the app origins.

## Security (`@repo/security`)

**Provider**: Arcjet

**Features**: Bot detection, Shield WAF (SQL injection, XSS, OWASP Top 10 prevention), rate limiting, IP geolocation.

**Configuration**: Central client at `@repo/security`, extended per app with specific rules.

**Bot policy**: Allows search engines and preview generators; blocks scrapers and AI crawlers.

**Web app**: Security middleware runs on all non-static routes.
**Main app**: Security checks in the authenticated layout.

**Usage**:
```typescript
const decision = await aj.protect(request);
if (decision.isDenied()) {
  // handle denial
}
```

## SEO (`@repo/seo`)

**Key exports**:
- `createMetadata` from `@repo/seo/metadata` — generates Next.js metadata with deep merge

**Usage**:
```typescript
import { createMetadata } from '@repo/seo/metadata';
export const metadata = createMetadata({
  title: 'Page Title',
  description: 'Page description',
});
```

**Sitemap**: Auto-generated at build time. Scans `/app`, `/content/blog`, `/content/legal`. Filters `_` and `()` directories.

**JSON-LD**: Structured data support for search engines.

**Security headers**: Nosecone integration via `@repo/security/middleware`.

## Feature Flags (`@repo/feature-flags`)

**System**: Vercel Flags SDK + PostHog

**Define flags** in `packages/feature-flags/index.ts`:
```typescript
export const myFlag = createFlag('myFlagKey');
```

**Usage**:
```typescript
const isEnabled = await myFlag();
```

Flags require an authenticated user context. Override flags in development via the Vercel Toolbar.

## Internationalization (`@repo/internationalization`)

**Provider**: Languine

**Configuration**: `languine.json` defines source and target locales.

**Dictionaries**: TypeScript files per locale. Non-source locales are auto-translated.

**Usage**:
```typescript
const dict = await getDictionary(locale);
```

**Routing**: Language-specific paths (`/en/about`, `/fr/about`) with automatic language detection.

**Middleware**: `internationalizationMiddleware` configured for the `web` app.

**Translate**: `bun run translate`

## Webhooks (`@repo/webhooks`)

### Inbound
- **Stripe**: `POST /api/webhooks/payments` — payment and subscription events
- **Supabase Auth**: sessions are refreshed through middleware; user records are provisioned by application code
- **Local testing**: Stripe CLI auto-forwards to localhost

### Outbound
**Provider**: Svix

**Key exports**:
- `webhooks.send(eventType, data)` — send a webhook event
- `webhooks.getAppPortal()` — get embeddable webhook management portal URL

Uses organization ID as the Svix app UID (stateless design).

## Cron Jobs (`@repo/cron`)

**Platform**: Vercel Cron

**Location**: `apps/api/app/cron/[job-name]/route.ts`

**Configuration**: `apps/api/vercel.json`

```json
{ "path": "/cron/keep-alive", "schedule": "0 1 * * *" }
```

Cron routes must use the `GET` HTTP method. Test locally via direct HTTP GET.

## Notifications (`@repo/notifications`)

**Provider**: Knock

**Key exports**:
- `notifications.workflows.trigger(workflowKey, { recipients, data })` — trigger a notification
- `<NotificationsTrigger>` — renders in-app notification feed

**Channels**: In-app, email, SMS, push, and chat — configured via Knock workflows.

## Collaboration (`@repo/collaboration`)

**Provider**: Liveblocks

**Features**: Real-time presence indicators, multiplayer document editing, threaded comments.

**Hooks**: `useOthers()`, `useStorage()`, `useMutation()`, `useThreads()`

**Components**: `<Thread>`, `<Composer>`, `<InboxNotification>`

**Editor integration**: Tiptap or Lexical for collaborative rich text editing.

Requires `LIVEBLOCKS_SECRET` environment variable.

## AI (`@repo/ai`)

AI/LLM integration package for adding AI-powered features to the application.

## Rate Limit (`@repo/rate-limit`)

Rate limiting utilities used in conjunction with `@repo/security` for request throttling.

## Next Config (`@repo/next-config`)

Shared Next.js configuration applied across apps:
- Image optimization (AVIF, WebP)
- Supabase image domains can be added to `packages/next-config` when external avatars are enabled
- Prisma webpack plugin for monorepo builds
- PostHog reverse proxy rewrites (`/ingest/*`)
- OpenTelemetry webpack compatibility fix
- Bundle analyzer support

## TypeScript Config (`@repo/typescript-config`)

Shared TypeScript configurations extended by all apps and packages.
