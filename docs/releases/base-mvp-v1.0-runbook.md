# Base MVP v1.0 Pilot Runbook

## Release Status

- Release: JinaCampus Web v1.0 - Base MVP Pilot
- Status: Release Candidate for controlled pilot/demo use
- Native status: JinaCampus Mobile v0.1 is release-candidate, physical-device QA pending
- Freeze date: 2026-06-09
- Release-candidate packaging date: 2026-06-12
- Handoff package date: 2026-06-14
- Latest full-demo rehearsal: 2026-06-12 passed for release-candidate packaging
- Tenant used for local QA: `jinacampus-demo`

This runbook covers the web Base MVP only. Native mobile production release, FeeDesk, GradeBook, full SchoolCast, exports/charts, offline sync, push notifications, and live WhatsApp sending are not part of this release.

Brand line:

```txt
JinaCampus - The Complete School OS
powered by Parshav Insights
```

## Release-Candidate Packaging

Packaging status: ready with documented limitations for a controlled pilot/demo.

This package includes:

- Launch scope for CampusCore, Academia, Student Attendance, StaffBoard Lite, QR attendance, dashboard, Administrator Portal, School ID login, and DRY_RUN attendance notification foundation.
- Environment and startup notes for local/pilot verification.
- Migration, seed, and demo-data notes.
- Browser smoke evidence from the final freeze, customer-demo QA, Academia smoke, and full-demo rehearsal.
- Tenant/branch safety notes and known fixture limitations.
- QR readiness status.
- WhatsApp notification readiness status.
- Customer demo script and pilot support checklist.
- Controlled pilot/demo handoff execution note.
- Pilot DB reset checklist, QR camera QA plan, and post-pilot feedback plan.
- Physical school attendance pilot plan and feedback log.

This package does not certify full production rollout, physical Android/iOS QR camera readiness, live WhatsApp delivery, native mobile production release, FeeDesk, GradeBook, full SchoolCast, exports/charts, offline sync, push notifications, payroll, leave management, or biometric/GPS attendance.

## Environment Setup

Document environment variable names only in release notes unless the value is already a safe local example in `.env.example`.

Required or supported variables:

| Variable | Purpose | Notes |
| --- | --- | --- |
| `POSTGRES_HOST_PORT` | Local Docker PostgreSQL host port | Safe local default is documented in `.env.example`. |
| `DATABASE_URL` | Prisma/PostgreSQL connection | Required for migrations, seed, app runtime, and tests that touch DB state. |
| `APP_URL` | App base URL | Used by server-side URL helpers. |
| `SESSION_COOKIE_NAME` | Session cookie name | Do not expose live session values. |
| `SESSION_TTL_DAYS` | Session lifetime | Local/pilot configuration only. |
| `PASSWORD_PEPPER` | Password hashing pepper | Must be a strong secret outside source control for non-local use. |
| `DEMO_USER_PASSWORD` | Optional local seed password override | Local/demo seed only. Do not use for production-like accounts. |
| `DEMO_STAFF_PASSWORD` | Optional local seed password override for `staff@demo.jinacampus.test` | Local/demo seed only. If unset, staff uses `DEMO_USER_PASSWORD`. |
| `NODE_ENV` | Runtime environment | Use expected Next.js/Node values. |
| `WHATSAPP_PROVIDER_MODE` | WhatsApp provider mode | Keep `DRY_RUN` for this pilot. |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN_SHA256` | WhatsApp webhook verification hash | Leave empty unless an approved provider setup exists. |
| `WHATSAPP_APP_SECRET` | WhatsApp webhook app secret | Do not commit or document real values. |
| `EXPO_PUBLIC_API_BASE_URL` | Native mobile backend URL | Native-only; mobile remains release-candidate with device QA pending. |

Do not include passwords, session cookies, provider tokens, webhook secrets, bearer tokens, raw QR payloads, private URLs, Aadhaar numbers, or bank account numbers in release docs, screenshots, or support notes.

## Local Startup Commands

Install and start local dependencies:

```bash
npm install
docker compose up -d postgres
```

Local PostgreSQL convention:

- container: `jinacampus-postgres`
- database: `jinacampus`
- default port: `5432`, overridable with `POSTGRES_HOST_PORT`

Prepare the database and app:

```bash
npx prisma migrate status
npx prisma generate
npm run db:seed
npm run dev
```

Build and production-start commands:

```bash
npm run build
npm start
```

Production deployment, rollback, TLS, secret management, and provider-secret storage must follow the approved deployment environment. This local runbook does not invent a production deployment process.

## Migration And Seed Packaging

Database checks:

```bash
npx prisma migrate status
npm run db:seed
```

Demo school:

```txt
School ID: jinacampus-demo
```

Seeded demo roles:

- Administrator / Super Admin
- Principal
- Teacher
- Staff
- Office Staff

Seeded demo modules:

- institution
- branch
- active academic year
- classes
- sections
- class sections
- students
- guardians
- enrollments
- staff profiles
- student attendance records
- staff attendance records
- notification templates/settings

Demo data warnings:

- QA-only local student rows may exist.
- Demo DB is not sanitized production-like data.
- Staff seed login is School ID + email + password. See `docs/demo-seed.md` and `docs/staff-login-credentials.md` for local-only demo credential details.
- Do not use real Aadhaar values.
- Do not use real bank account values.
- Do not use real phone numbers.
- Do not use real production credentials.
- Do not use a local/demo DB as a customer production database.

## Scope Included

- User-based school login with School ID.
- Administrator Portal for school tenant inspection and School ID management.
- Role-aware dashboards and navigation.
- CampusCore institution, branch, user, role, settings, branding, and audit surfaces.
- Academia student/class-section data, admission-sheet student registration, and student attendance.
- StaffBoard Lite staff profiles, QR attendance, correction, and reports.
- Forgot-password safe public request UX.
- Show/hide password controls.
- WhatsApp attendance notification foundation in DRY_RUN mode.
- Glass UI/app-shell modernization and responsive table wrappers.

## Controlled Pilot Checklist

Run from the project root:

```bash
docker ps
npx prisma migrate status
npm run db:seed
npm run smoke:notifications:whatsapp
npx prisma format
npx prisma validate
npx prisma generate
npm run typecheck
npm test
npm run build
git diff --check
npm pkg get scripts.lint
```

Expected:

- Docker/PostgreSQL is reachable.
- Prisma migrations are up to date.
- Demo seed completes.
- WhatsApp smoke passes in DRY_RUN mode.
- Typecheck, tests, build, and whitespace checks pass.
- `npm pkg get scripts.lint` returns `{}` until a root lint script is added.

Pilot acceptance checklist:

| Area | Required confirmation |
| --- | --- |
| Static checks | Prisma format/validate/generate, typecheck, tests, build, and diff checks pass. |
| DB checks | Migrations are applied, seed is available, demo tenant exists, and School ID login is verified. |
| Auth/access | Administrator login/logout, School ID login/logout, Principal, Teacher, Staff, Office Staff, and safe forbidden states are verified. |
| Administrator Portal | School registry, create/edit/deactivate-safe controls, and selected-school dashboard inspection are verified. |
| CampusCore | Institution branding, users, roles, branches, settings, and audit surfaces are permission-gated. |
| Academia | Student registration, list/profile/edit, class-section filter, enrollment visibility, attendance navigation, student attendance submit, locked-state behavior, and student reports are verified. |
| StaffBoard Lite | Staff profiles, QR generation, scan/manual fallback, attendance admin, correction, and reports are verified. |
| Notifications | Attendance notification settings and WhatsApp foundation are verified in DRY_RUN mode only. |
| UI/UX | Modern glass UI, scrollable nav, topbar/sidebar consistency, favicon/PWA assets, and responsive layouts are verified. |
| Security | No password hashes, token hashes, provider tokens, raw QR leaks, Prisma/SQL errors, stack traces, tenant leakage, or RBAC bypass. |

## Core Browser Smoke Status

Latest evidence: `docs/full-demo-rehearsal.md`, `docs/final-base-mvp-freeze-smoke.md`, `docs/customer-demo-browser-qa.md`, `docs/academia-customer-demo-smoke.md`, `docs/student-registration-db-smoke.md`, and `docs/administrator-school-id-browser-qa.md`.

| Category | Routes / flow | Status |
| --- | --- | --- |
| Authentication | `/administrator/login`, `/login`, `/forgot-password`, `/dashboard`, `/account/change-password` | Pass |
| Administrator | `/administrator`, `/administrator/schools`, create/view/edit/dashboard inspection routes | Pass |
| CampusCore | institutions, branches, users, roles, settings, audit logs | Pass |
| Academia | overview, students, create/profile/edit, enrollments, attendance, mark, reports | Pass |
| StaffBoard Lite | overview, staff, categories, attendance, QR display, scan/manual fallback, reports | Pass |
| Notifications | attendance notification settings in CampusCore settings | Pass, DRY_RUN only |
| Responsive UI | `/login`, `/dashboard`, Administrator schools, students, attendance mark, QR, scan, reports | Pass in documented browser spot checks |

No final packaging blocker is recorded from these route categories. Browser evidence is from controlled local DB-backed smoke and rehearsal passes; physical Android/iOS camera QA remains separate and pending.

## Tenant And Branch Safety Status

Verified for the controlled pilot:

- School users log in with School ID and receive server-resolved tenant, branch, role, and permission context.
- Administrator Portal rejects non-platform school users safely.
- Principal/Admin browser flows are scoped to the demo school/institution.
- Teacher, Staff, and Office Staff forbidden states return safe permission or redirect states.
- Class-section filters and attendance routes remain academic-year/branch aware in tested single-branch fixtures.
- Client-provided tenant/branch/actor claims remain rejected by service-layer validation and tests where covered.

Limitations:

- Wrong-branch QR negative QA needs additional second-branch/staff fixture coverage.
- Broader cross-tenant browser-negative QA remains limited by the current single demo tenant/branch setup.
- Multi-branch switcher UX remains deferred.

## QR Flow Status

Readiness label: QR Scanner is release-candidate; real-device Android/iOS QA pending.

Browser/web status:

- Staff QR display page loads for authorized users.
- CHECK_IN and CHECK_OUT QR generation were verified in browser QA.
- QR countdown/expiry UI is clear in checked flows.
- Staff scan page loads.
- Manual fallback remains available.
- Staff scan camera button has a source-level mobile/Safari repair: direct `getUserMedia` from the button click, secure-context messaging, 12-second permission timeout, rear-camera fallback, explicit `playsInline`/`webkit-playsinline` preview playback, jsQR canvas-frame decoding, stream cleanup, and a `Permissions-Policy` camera header.
- Staff scan now displays camera diagnostics for secure context, media API availability, current origin, and user agent, and includes a controlled QR image/photo fallback for camera failure cases. The fallback still uses server-side tenant, branch, QR purpose, expiry, identity, and duplicate/replay validation.
- Blank, invalid, expired, CHECK_IN, duplicate CHECK_IN, CHECK_OUT, and duplicate CHECK_OUT manual-token states returned safe messages in browser smoke.
- `tokenHash` is not shown.
- Raw QR payload is not leaked outside intended QR/manual input contexts in checked surfaces.

Do not claim physical QR camera production readiness until Android Chrome and iOS Safari pass live QR camera QA over approved HTTPS.

## WhatsApp / Communication Status

Readiness label: SchoolCast Lite WhatsApp Attendance Notification Foundation is DRY_RUN/mock-ready only.

Verified:

- Notification models, templates, settings, outbox, delivery log, provider abstraction, and webhook foundation exist.
- Student attendance and staff monthly summary smoke passed in DRY_RUN mode.
- Authorized CampusCore settings display notification controls and provider-not-configured/DRY_RUN state.
- Provider tokens/secrets are not visible.
- No real WhatsApp sending is enabled or claimed.

Deferred:

- live Meta Cloud sending
- approved templates/provider setup
- provider-secret storage
- scheduler/cron production wiring
- outbox review UI
- full SchoolCast

## Auth / Access Launch Gate

Status: passed on 2026-06-09 for controlled Web v1.0 pilot launch.

Evidence:

- `docs/auth-access-launch-gate-qa.md`
- `docs/db-backed-auth-access-browser-qa.md`
- `docs/administrator-school-id-browser-qa.md`
- `docs/auth-password-recovery-browser-qa.md`
- `docs/full-demo-rehearsal.md`

Verified:

- Administrator login remains separate from School ID login.
- School users log in with School ID, email, and password.
- Institutions and roles do not log in.
- Principal, Teacher, Staff, and Office Staff land in role-appropriate school contexts.
- Teacher, Staff, and Office Staff governance boundaries fail safely.
- Forgot-password remains public-safe and non-enumerating.
- Show/hide password controls are present and non-submit.
- Password reset/change and role/branch assignment boundaries are covered by DB-backed QA and regression tests.
- No sensitive password, token, QR, provider, Prisma, SQL, stack trace, or private URL output was found in the gate smoke.

Remaining limitation: broader cross-tenant and multi-branch negative browser QA requires an additional safe fixture beyond the single launch demo school/branch.

## Demo Login Model

School users log in at:

```txt
/login
```

Required fields:

- School ID
- Email
- Password

Administrator users log in at:

```txt
/administrator/login
```

Administrator login does not accept School ID and must reject non-platform school users safely.

Do not document passwords, session cookies, bearer tokens, QR payloads, reset tokens, provider secrets, or private URLs in release notes or screenshots.

## Core Demo Flow

1. Open `/administrator/login`.
2. Verify Administrator Portal, school registry, selected-school dashboard, and return links.
3. Open `/login`.
4. Verify School ID login, forgot-password link, and password visibility toggle.
5. Log in as school principal and verify CampusCore settings, branding, users, attendance notification controls, and role-aware navigation.
6. Log in as teacher and verify student attendance mark/report workflows.
7. Log in as staff and verify Staff QR scan/manual fallback and safe admin-route denial.
8. Log in as office staff and verify permitted StaffBoard operations and safe CampusCore settings denial.
9. Log out and verify protected routes return to login.

## Pilot School Onboarding Checklist

Use this checklist for one controlled pilot school. Do not use real production secrets in local/dev onboarding notes.

1. Create School from the Administrator Portal.
2. Assign a customer-safe School ID.
3. Create or verify institution profile.
4. Add display name and logo URL.
5. Create branch.
6. Create active academic year.
7. Create principal user.
8. Create teacher, staff, and office users as needed.
9. Assign roles and branch access.
10. Add classes, sections, and class sections.
11. Add students through the admission-sheet registration form, then add guardians and enrollments.
12. Add staff profiles and link staff users where QR/self-attendance is needed.
13. Verify teacher attendance workflow on a safe date.
14. Verify staff QR attendance workflow, using manual fallback if physical camera QA is not complete.
15. Verify student and staff reports.
16. Configure WhatsApp notification settings as DRY_RUN only unless provider approval and secret storage are completed.
17. Before any production-like customer pilot, rebuild or reset a clean pilot database. Do not reuse a QA-contaminated local demo DB.

Student registration notes:

- Required pilot fields include scholar/admission number, admission date, full name, date of birth, father name, mother name, Aadhaar input, religion, caste, category, nationality, city, and state.
- Aadhaar and bank account inputs are used only to store masked references and last-four digits. Do not capture or export plaintext sensitive numbers from the UI, logs, screenshots, or support notes.
- The Students list shows newly registered students without current enrollments as `Not enrolled` when no class-section filter is selected. Class-section filters remain enrollment-scoped.
- The 2026-06-12 Academia customer-demo smoke passed for registration, create, duplicate admission handling, profile, edit, seeded enrollment display, class-section filtering, attendance navigation, and Teacher create-route denial.
- City is currently a validated text field; a full city master/search workflow remains deferred.

## Pilot Support Checklist

Primary support references:

- `docs/pilot-support-checklist.md`
- `docs/known-limitations-v1.md`
- `docs/final-base-mvp-freeze-smoke.md`
- `docs/pilot-db-reset-checklist.md`
- `docs/physical-attendance-pilot-plan.md`
- `docs/physical-school-pilot-feedback.md`
- `docs/qr-camera-qa-plan.md`
- `docs/post-pilot-feedback-plan.md`

For pilot support:

1. Confirm whether the issue is login, permission, attendance, report, QR, notification, or UI/responsive.
2. Confirm the affected school, role, branch, and academic year through authorized admin views only.
3. Use administrator/principal reset-password flows for account recovery. Do not use public self-service reset for institution users.
4. Use deactivate/reactivate for schools and users where possible. Avoid hard delete.
5. Preserve audit logs.
6. For QR issues, check expiry, branch, purpose, duplicate scan state, and staff-profile linkage.
7. For WhatsApp questions, state that this release is DRY_RUN only and no live provider sending is enabled.

## Rollback And Recovery Notes

Local/dev recovery only:

1. Restore the latest git checkpoint if a local change must be backed out.
2. Re-run migrations with the project convention.
3. Re-run seed where local demo data must be reset.
4. Restart the Next.js server.
5. Disable or suspend the pilot school if needed.
6. Use deactivate instead of delete for schools and users with business data.
7. Preserve audit logs and attendance history.

This runbook does not invent a production deployment rollback. Use the deployment provider's approved rollback process if a production deployment is introduced.

## Post-Pilot Feedback Plan

Collect feedback on:

1. Login ease and School ID clarity.
2. Dashboard clarity.
3. Student attendance speed and locked-state clarity.
4. Staff QR attendance and manual fallback clarity.
5. Student and staff reports usefulness.
6. Mobile browser usability.
7. Performance on school office hardware/network.
8. Missing must-have fields or operational steps.
9. Overall UI/UX impression.
10. Support issues and training gaps.

Classify each item as:

- Launch blocker
- High priority
- Improvement
- Future module

Use launch blockers only for issues that prevent safe school operation, break RBAC/tenant isolation, block login/logout, or expose sensitive internals.

Detailed feedback intake, classification, and follow-up rules are maintained in `docs/post-pilot-feedback-plan.md`.

## Attendance Demo Notes

Student attendance has auto-lock policy enabled. Teacher submission after the configured cutoff returns a safe locked-attendance error. Use a safe QA date before cutoff or a future local QA date for demo mutation checks. Do not disable lock policy for release.

Staff QR browser QA verified manual-token flow, invalid/expired QR handling, duplicate check-in/out handling, correction validation, and reports. Physical camera scanning still needs approved HTTPS and real devices.

## Notification Foundation

WhatsApp attendance notifications are release-candidate ready only as a DRY_RUN foundation.

Included:

- Communication preferences.
- Notification templates.
- Notification outbox and delivery logs.
- DRY_RUN provider.
- Webhook handler smoke.
- RBAC for notification settings.

Deferred:

- Live Meta Cloud sending.
- Approved encrypted provider-secret storage.
- Scheduler/cron production wiring.
- Outbox review UI.
- Full SchoolCast.

## Security Rules

Before and during pilot:

- Do not expose `passwordHash`, `tokenHash`, raw passwords, reset tokens, session secrets, bearer tokens, raw QR tokens, provider secrets, tenant IDs in normal UI, actor IDs, Prisma/SQL errors, stack traces, private URLs, or secrets.
- Do not create institution login or role login.
- Do not weaken tenant isolation, RBAC, audit logging, QR token hashing, or branch/academic-year scoping.
- Do not hard-delete demo or pilot business data outside scoped reset utilities.

## Rollback / Pause Criteria

Pause pilot if any of these appear:

- Login/logout fails for seeded roles.
- Principal, teacher, staff, or office boundaries fail open.
- Administrator Portal permits non-platform users.
- Student/staff attendance mutation leaks cross-tenant or cross-branch data.
- Password hashes, token hashes, raw QR internals, provider secrets, Prisma errors, or stack traces appear in UI.
- Build/typecheck/tests fail after release changes.

## Evidence

See:

- `docs/full-demo-rehearsal.md`
- `docs/final-base-mvp-freeze-smoke.md`
- `docs/customer-demo-browser-qa.md`
- `docs/administrator-school-id-browser-qa.md`
- `docs/academia-customer-demo-smoke.md`
- `docs/student-registration-db-smoke.md`
- `docs/whatsapp-notification-db-smoke.md`
- `docs/known-limitations-v1.md`

## Launch Decision

JinaCampus Web Base MVP v1.0 is ready for controlled pilot/demo handoff with documented limitations.

Final release statement:

```txt
JinaCampus Web v1.0 — Base MVP Release Candidate is suitable for controlled pilot/demo use with documented limitations.
```

Do not position this release as complete for physical QR camera scanning or live WhatsApp sending until those passes are completed separately.

Use `docs/controlled-pilot-demo-handoff.md` for the final pilot/demo handoff execution order and GO/HOLD recommendation.

## Pilot Execution Attempt - 2026-06-28

Status: blocked before clean DB reset by local Docker/PostgreSQL availability.

Latest re-run note: the DB reset gate remains blocked. The configured database target is local PostgreSQL on `localhost:55432` for database `jinacampus`, but Docker daemon access fails on the missing `docker_engine` pipe and no TCP listener is available on `localhost:55432`. The latest rerun stopped at Step 1 before migration, seed, reset, and browser smoke as required when no DB is reachable. Treat this as an execution-environment blocker, not a confirmed app regression.

Results:

- `.env` points to a local PostgreSQL database at `localhost:55432` for database `jinacampus`; secrets were not printed.
- `docker ps --filter name=jinacampus-postgres` failed because the Docker daemon was not running.
- `docker compose up -d postgres` failed because the Docker daemon was not running.
- `Test-NetConnection localhost:55432` returned `TcpTestSucceeded: False`.
- `npx prisma migrate status` was not rerun in the latest pass because no database was reachable.
- No destructive DB reset was run.
- Seed, short browser smoke, deployment, controlled demo, and feedback collection were not run.
- Current static checks: Prisma format/validate/generate passed; typecheck passed; tests passed, 76 files / 662 tests; build passed; `git diff --check` passed; `npm pkg get scripts.lint` returned `{}`.

Execution position:

- Web Base MVP RC remains GO for controlled pilot/demo after target-environment DB reset, seed, and smoke pass.
- Production-wide launch remains NO.
- Widen-pilot decision remains HOLD until clean DB reset, migration/seed verification, short browser smoke, controlled demo feedback, and QR/device limitations are addressed.

Execution logs:

- `docs/pilot-execution-log.md`
- `docs/post-pilot-feedback-log.md`
- `docs/physical-attendance-pilot-plan.md`
- `docs/physical-school-pilot-feedback.md`

## Physical Attendance Pilot Attempt - 2026-06-28

Status: blocked before Day 0 DB-backed setup by local Docker/PostgreSQL availability.

The physical school attendance pilot plan was created for a controlled school run covering teacher student attendance, staff QR attendance, correction, reports, role access checks, manual register comparison, and Option A local school network access. The pilot should not start until Docker/PostgreSQL or an approved pilot/staging DB is reachable, migrations/seed pass, the app starts on the school LAN, and browser smoke confirms the selected school users and attendance routes.

Current evidence:

- `.env` points to local PostgreSQL at `localhost:55432`, database `jinacampus`; secrets were not printed.
- Docker daemon access failed on the missing `docker_engine` pipe.
- No TCP listener was available on `localhost:55432`.
- `npx prisma migrate status` failed because configured PostgreSQL was unavailable.
- `npm run typecheck`, `npm test`, and `npm run build` passed.
- Node/npm and project dependencies were present.
- A local Wi-Fi IP was available, but no private LAN URL was committed to docs.
- No app server was listening on port 3000 during the latest local-network check.

Physical pilot docs:

- `docs/physical-attendance-pilot-plan.md`
- `docs/physical-school-pilot-feedback.md`
