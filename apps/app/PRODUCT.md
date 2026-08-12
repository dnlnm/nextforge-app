# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user is the owner-operator of a small Malaysian tuition centre. They are responsible for setting up the centre and keeping staff, student records, classes, attendance, fees, and reporting under control, often with limited administrative support.

Centre administrators are secondary users who run daily records, schedules, enrolment, billing, payment recording, and reporting. Teachers have a deliberately focused workflow for today's classes, rosters, and attendance. Parents, guardians, and students are represented in centre records but are not authenticated product users; parent and student portals are not currently committed.

## Product Purpose

KLIO.MY is a staff-facing operating system for small Malaysian tuition centres. It replaces fragmented spreadsheets and disconnected tools with one coherent workflow spanning student and guardian records, academic setup, classes and schedules, enrolment, attendance, monthly invoicing, payment recording, and operational reporting.

Success means an owner-operator can understand and run the centre from one reliable source of truth with less administrative effort and fewer gaps between records, daily operations, and money owed or received.

## Positioning

KLIO.MY is built around the actual end-to-end workflow of a small tuition centre rather than adapting enterprise school software to a smaller organization. It favors a calm, opinionated operating model without the configuration burden and institutional complexity of enterprise systems.

Malaysia-first operation is a durable part of that model, including MYR, Malaysian time and academic context, local payment terminology, and English and Bahasa Malaysia support.

## Operating Context

The main domain, `klio.my`, is used for account access, centre selection and setup, centre settings, and subscription management. Each centre operates in a tenant-scoped workspace at `<slug>.klio.my`. A user can belong to multiple centres with different roles, while the current product permits a user to own one active centre.

The centre workflow includes:

- setting up academic levels, subjects, rooms, teachers, classes, fees, and weekly schedules;
- maintaining student and guardian records, including photos and contact details;
- importing students from staged Excel workbooks with validation and duplicate review;
- enrolling students, transferring enrolments, and applying student-specific monthly fees;
- creating scheduled class sessions and recording Present, Absent, Late, or Excused attendance;
- generating monthly invoices, recording off-platform payments, tracking outstanding balances, and issuing receipts;
- reviewing dashboards and tenant-scoped reports and exporting operational data as CSV;
- using WhatsApp links as an existing guardian-contact affordance.

The responsive web application is the primary product. A separate mobile application is an early, focused operational companion for authentication, centre switching, classes, rosters, and attendance; it is not yet a full administrative equivalent of the web product.

## Capabilities and Constraints

- KLIO.MY is a multi-tenant SaaS with centre-scoped data and role-based access for Owner, Admin, and Teacher. Owner access includes Admin capabilities; Teacher access is intentionally narrow.
- Tuition payments are recorded after being received through external methods. KLIO.MY does not currently process guardian tuition payments. Stripe is used for each centre's KLIO.MY subscription.
- Supported recorded payment methods include Cash, Bank Transfer, DuitNow, FPX, Card, and Other.
- Monetary values are stored as integer sen and presented in MYR. Product time assumptions use `Asia/Kuala_Lumpur`.
- Centre logos are public assets. Student photos and documents use private authenticated storage.
- The current commercial plans and limits are Trial, Starter, and Pro as defined in `packages/payments/plans.ts`; future surfaces must read plan truth from the implementation rather than restating potentially stale values.
- Authenticated-product content must provide English and Bahasa Malaysia parity.
- Visible product language uses `centre`, not `center`. The choice between `enrolment` and `enrollment` remains open and should be resolved before terminology is normalized across visible UI.
- The relationship among a centre, a legal business, a physical branch, and a subscription remains an open product decision. The current implementation supports one branch record per organization and one actively owned centre per user; future work must not imply multi-branch operation without a confirmed change.
- Automated session generation, parent communications beyond existing WhatsApp links, broader mobile scope, announcements, customer-facing webhooks, and real-time collaboration are not confirmed product commitments.
- KLIO.MY is operational administration software, not confirmed accounting or tax-compliance software. Future work must not make accounting, tax, data-residency, or regulatory-certification claims without evidence.

## Brand Commitments

The product name is KLIO.MY. Existing public identity uses a blue graduation-cap mark and KLIO.MY wordmark. The established product voice is calm, direct, and practical, using Malaysian and British English terms such as `centre`.

The durable verbal promise is one calm place to run a centre: keep students, classes, attendance, invoices, and payments in sync without enterprise complexity. This is product positioning, not a requirement to preserve any particular visual treatment.

## Evidence on Hand

- Product identity and tenant-domain configuration: `packages/config/brand.ts`, `apps/app/.env.example`, and the repository `README.md`.
- Existing authenticated workflows and route implementations: `apps/app/app`.
- Role hierarchy and authorization behavior: `packages/auth/roles.ts`.
- Data model and operational invariants: `packages/database/prisma/schema.prisma`.
- English and Bahasa Malaysia product copy: `packages/internationalization/dictionaries/en.json` and `packages/internationalization/dictionaries/ms.json`.
- Subscription plans and usage limits: `packages/payments/plans.ts` and `packages/payments/billingsdk-plans.ts`.
- Student import workflow: `docs/features/student-bulk-import.md`.
- Current mobile scope and deferred work: `apps/mobile/README.md` and `docs/mobile-readiness-plan.md`.
- Existing brand assets include the app icon, Apple icon, Open Graph image, mobile icon and splash assets, and the brand component at `apps/app/components/brand.tsx`.
- No confirmed testimonials, customer logos, case studies, press coverage, outcome benchmarks, tax-compliance claims, accessibility certification, or regulatory certification were identified. Future work must not fabricate them.

## Product Principles

1. **Serve the owner-operator first.** Make the whole centre legible and manageable without assuming specialist administrative staff.
2. **Keep one operational truth.** Student, class, attendance, invoice, and payment state should remain connected rather than recreating spreadsheet silos inside the product.
3. **Fit small-centre reality.** Prefer an opinionated, low-configuration workflow over enterprise breadth and complexity.
4. **Be Malaysia-first.** Treat local language parity, currency, time, academic context, and payment conventions as core product behavior.
5. **Earn trust with staff and student data.** Make permissions, financial state, privacy, and consequential actions explicit and dependable.

## Accessibility & Inclusion

The web application must meet WCAG 2.2 Level AA. Future work must preserve semantic labeling, complete keyboard operation, visible focus, sufficient contrast, reduced-motion behavior, accessible status communication, and nonvisual equivalents for charts and color-coded information.

English and Bahasa Malaysia must have parity in the authenticated product, including navigation, forms, validation, errors, empty states, financial documents, and operational status labels.

KLIO.MY must handle personal data in accordance with Malaysia's Personal Data Protection Act 2010 (PDPA). Product work involving student and guardian records, photos, documents, exports, retention, deletion, consent, or third-party processors must treat privacy and data handling as explicit requirements. The repository does not currently establish certification, legal review, retention periods, data-residency commitments, or a complete compliance implementation; those remain to be defined and must not be claimed.
