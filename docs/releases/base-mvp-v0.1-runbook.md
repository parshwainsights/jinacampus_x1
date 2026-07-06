# JinaCampus Base MVP Foundation v0.1 Runbook

> Current pilot launch reference: use `docs/releases/base-mvp-v1.0-runbook.md` for JinaCampus Web v1.0 Base MVP controlled pilot launch. This v0.1 runbook remains historical release evidence and earlier stabilization notes.

## Release

- Release name: JinaCampus Base MVP Foundation v0.1
- Release date: 2026-05-19
- Release status: Release candidate, ready for internal QA and ready for next module preparation after this runbook is accepted.
- Scope rule: no FeeDesk, GradeBook, full SchoolCast, exports/charts, native app, offline/PWA, payroll, leave management, appraisal, or biometric integration is included in this release. Staff QR browser camera scanning is included as a mobile-web feature. The WhatsApp attendance notification foundation is included as disabled-by-default SchoolCast Lite infrastructure only.

## Completed Scope

The base MVP foundation checkpoint includes:

- CampusCore foundation
- Administrator Portal for School ID and tenant management
- Administrator selected-school dashboard inspection navigation
- Institution profile and edit flows
- Branch profile and edit flows
- User and account management
- User role assignment and removal
- User branch assignment and removal
- Admin password reset
- User change-password flow
- Academia base records
- Class-wise student details
- Student create/edit flows
- Guardian and enrollment list/edit flows
- Student Attendance mark flow
- Student Attendance Reports
- StaffBoard Lite staff profiles
- Staff QR Display
- Staff QR Scan browser camera and manual input flows
- Staff Attendance Admin
- Staff Attendance Correction
- Staff Attendance Reports
- Dashboard
- Navigation polish
- Form, table, empty-state, loading-state, and error-state polish
- Mobile UI foundation
- Demo seed data
- WhatsApp attendance notification foundation
- Notification outbox, template, delivery log, communication preference, and WhatsApp integration setting schema
- Student attendance notification queue hook, disabled by default and non-blocking
- Staff monthly attendance summary queue helper, disabled by default
- WhatsApp provider dry-run abstraction and webhook status foundation
- Demo QR QA reset helper
- Base smoke, debugging, mobile QA, and browser QA documentation
- App shell navigation polish, favicon replacement, and PWA manifest/icon metadata

## Deferred Scope

The following work is intentionally deferred:

- FeeDesk
- GradeBook
- Full SchoolCast
- Live WhatsApp sending until approved provider credentials and secret storage are configured
- Notification scheduler and admin outbox review UI
- Full native mobile parity and native Administrator Portal. A focused Native Mobile v0.1 staff/teacher Expo app is tracked separately and remains release-candidate with physical-device QA pending.
- Offline/PWA service worker
- Exports/charts
- Payroll
- Leave management
- Appraisal
- Biometric integration
- Real-device Android Chrome and iOS Safari QA
- Real-device QR scanner CHECK_IN/CHECK_OUT confirmation until physical devices and a secure mobile URL are available
- Wrong-branch QR browser test until a multi-branch demo seed exists

## Environment Setup

Use the repo's existing npm, Docker, PostgreSQL, Prisma, and Next.js conventions.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure local environment:

   ```bash
   cp .env.example .env
   ```

   Review `.env` and set local-only values. Do not commit secrets.

3. Start local PostgreSQL:

   ```bash
   docker compose up -d postgres
   ```

4. Confirm Prisma can reach the database:

   ```bash
   npx prisma validate
   npx prisma migrate status
   ```

5. Apply local migrations if needed:

   ```bash
   npm run db:migrate
   ```

6. Generate Prisma client:

   ```bash
   npx prisma generate
   ```

7. Seed demo data:

   ```bash
   npm run db:seed
   ```

8. Start the local app:

   ```bash
   npm run dev
   ```

9. Open the app:

   ```txt
   http://localhost:3000/login
   ```

If Prisma client generation or build hits a Windows file-lock on `query_engine-windows.dll.node` or `.next/trace`, stop the dev server and rerun the command.

## Demo Data

Demo tenant:

- School ID: `jinacampus-demo`
- Main branch: `MAIN`
- Active academic year: `2026-27`

Demo roles available through seed:

- Admin
- Principal
- Teacher
- Staff
- Office staff
- Future-ready roles such as parent/student where seeded by the role map

Demo data coverage:

- Classes
- Sections
- Class sections
- Subjects
- Students
- Guardians
- Active enrollments
- Student attendance records
- Staff profiles
- Staff profiles linked to demo login users
- Staff attendance records
- Staff QR attendance settings
- Staff QR token rows with stored hashes only

Password policy:

- Do not document passwords, reset values, session cookies, or secrets in release docs.
- Use the existing local seed/auth convention when performing developer QA.

Repeatable QR QA:

```bash
npm run demo:qa:reset
```

This reset is local/demo-only and targets `jinacampus-demo` / Main Branch / known demo QR QA staff profiles. It does not delete other tenants or broad demo data.

## Quality Gate Commands

Run these commands before accepting the release checkpoint:

```bash
npx prisma format
npx prisma validate
npx prisma generate
npm run typecheck
npm test
npm run build
git diff --check
npm pkg get scripts.lint
```

Current lint status:

- `package.json` has no lint script.
- `npm pkg get scripts.lint` returns `{}`.

## Smoke Test Checklist

Authentication:

- `/login` loads.
- `/login` requires School ID, email, and password.
- Invalid login shows a safe message.
- Demo users can authenticate.
- Protected routes redirect unauthenticated users to `/login`.
- `/administrator/login` loads for JinaCampus Super Admin / Administrator users.
- Non-platform school users cannot use `/administrator/login`.
- `/administrator/schools` lists schools for authorized administrators.
- `/administrator/schools/[tenantId]/dashboard` opens a selected-school Administrator View without impersonation.
- Selected-school Administrator View can return to `/administrator` and `/administrator/schools`.
- School ID create/update/deactivate/delete-safe controls are permission-gated and audited.

Dashboard:

- `/dashboard` loads.
- Cards show seeded counts.
- Quick actions point to real routes.
- No sensitive output appears.

CampusCore:

- `/campus-core/institutions` loads.
- Institution detail and edit routes work.
- `/campus-core/branches` loads.
- Branch detail and edit routes work.
- `/campus-core/users` loads.
- User detail and edit routes work.
- Role assignment and removal work for authorized admins.
- Branch assignment and removal work for authorized admins.
- Admin password reset works.
- `/account/change-password` works.
- `/campus-core/roles` loads.
- `/campus-core/settings` loads.
- `/campus-core/audit-logs` loads for authorized users.

Academia:

- `/academia` loads.
- `/academia/classes`, `/academia/sections`, `/academia/class-sections`, and `/academia/subjects` load.
- Edit routes for implemented class, section, and subject flows load and save.
- `/academia/students` loads.
- Class-wise student filter shows active enrolled students.
- Student create/edit handles duplicate admission numbers safely.
- `/academia/guardians` loads.
- `/academia/enrollments` loads.
- Enrollment edit works where implemented.

Student attendance:

- `/academia/attendance/mark` loads.
- Date and class-section selectors work.
- Active enrolled students load.
- Mark All Present works.
- Individual status changes work.
- Submit and repeat update are safe.
- `/academia/attendance/reports` loads.
- Daily summary, absent, late, class-not-marked, student history, and monthly percentage sections render data or safe empty states.

StaffBoard Lite:

- `/staffboard` loads.
- `/staffboard/staff` loads.
- Staff create/edit handles duplicate employee codes safely.
- `/staffboard/categories` loads.
- `/staffboard/attendance/qr` loads for authorized users.
- Check-in QR generation works.
- Check-out QR generation works.
- `/staffboard/attendance/scan` loads for staff/teacher users.
- Browser camera scanner controls render on `/staffboard/attendance/scan`.
- Manual token input handles blank, invalid, expired, success, and duplicate states safely.
- `/staffboard/attendance` loads for authorized users.
- Filters, summary cards, table, and correction entry points work.
- Staff attendance correction requires a reason, rejects invalid times, saves valid corrections, and excludes `NOT_MARKED` from correction statuses.
- `/staffboard/attendance/reports` loads and renders daily, teacher, non-teaching, late, half-day, monthly, and correction report sections.

Mobile/responsive:

- Priority routes work at 360, 390, 414, 768, and desktop widths.
- Tables scroll inside their wrappers.
- Filters stack safely.
- Primary actions remain tappable.
- Success/error states are readable.

## Security Checklist

Before accepting the freeze, verify:

- Tenant isolation is preserved.
- Branch access checks are preserved.
- Academic-year scoping is preserved for academic records.
- RBAC remains server-enforced.
- Hidden navigation is not treated as authorization.
- Critical mutations write audit logs.
- Protected routes redirect unauthenticated users.
- Safe permission states render for unauthorized users.
- No `tokenHash` appears in user-facing output.
- Raw QR tokens are not stored.
- Raw QR payloads are returned only for intended QR rendering/manual scan use.
- No `passwordHash` appears in UI output.
- Raw passwords are not stored or logged.
- Reset password values are not logged.
- Prisma, SQL, stack trace, internal path, tenant ID, and actor ID details are not exposed in user-facing errors.
- Demo QA reset targets only `jinacampus-demo` and known demo QR QA staff profiles.

## Release Risks And TODOs

Known limitations at freeze:

- Real-device Android Chrome and iOS Safari QA is still recommended before production rollout.
- Real-device Staff QR camera scanner CHECK_IN and CHECK_OUT are pending. The 2026-05-20 attempt and re-run verified local DB, seed, demo QR QA reset, QR display route, and scan route readiness, but no Android device was attached, no iOS Safari device bridge was available from the Windows workspace, and no approved staging URL or configured HTTPS tunnel command was available.
- Live QR scanner QA with an approved HTTPS URL was requested again on 2026-05-20, but the approved HTTPS URL was not available to the Codex session, ADB listed no attached Android device, and no iOS Safari device bridge was available. Local authenticated QR display/scan route smoke still passed.
- Live QR scanner QA with an approved HTTPS URL was attempted again on 2026-05-25. Docker/PostgreSQL, Prisma validation, migrations, demo seed, demo QR QA reset, and local authenticated QR display/scan route smoke passed, but no approved HTTPS URL was available to the Codex session, ADB listed no attached Android device, and no iOS Safari device bridge was available.
- Real-device Staff QR camera QA with an approved HTTPS URL was attempted again on 2026-05-30, but physical-device execution was blocked. Docker/PostgreSQL, migrations, demo seed, demo role users, linked staff profiles, and Main Branch staff QR settings were verified locally. The approved HTTPS URL was not available to this Codex session, local app configuration was HTTP-only, ADB reported 0 attached Android devices, and no iOS Safari device bridge/tooling was available from the Windows workspace.
- The 2026-05-30 real-device QA re-run request was checked again and remained blocked for the same external setup reasons: no approved HTTPS URL in this session, no attached Android device visible to ADB, and no iOS Safari device bridge/tooling from this Windows workspace. Local DB, migrations, seed, linked staff profiles, and staff QR settings remained healthy.
- On 2026-06-29 the mobile/Safari Start Camera button path was source-level repaired with direct `getUserMedia`, HTTPS-required messaging, rear-camera fallback, explicit `playsInline` preview playback, stream cleanup, and a camera permissions policy header. This does not certify physical-device readiness.
- On 2026-06-30 the scanner added visible secure-context/media API/origin/user-agent diagnostics and a controlled QR image/photo fallback. HTTP LAN/IP access should show the HTTPS-required blocked state and does not count as QR camera readiness.
- QR scanner readiness status: release-candidate, real-device QA pending. Do not mark it production-verified until Android Chrome and iOS Safari live CHECK_IN/CHECK_OUT scans pass over HTTPS.
- Customer-demo DB-backed browser QA passed on 2026-05-30 after focused StaffBoard attendance hydration and favicon console-noise fixes. The QA used local Chrome DevTools automation because the in-app Browser backend was unavailable in this session. Screenshot evidence was captured outside the repository and is not committed.
- Final customer-demo DB-backed browser QA re-run passed on 2026-06-01, including the now-verified CampusCore attendance notification settings controls. Docker/PostgreSQL, migrations, seed, login/forgot-password, role-aware routes, safe forbidden states, Staff QR manual fallback, logout/protected redirect, responsive layout, and sensitive-output checks passed in local headless Chrome DevTools automation.
- Modernized Glass UI DB-backed customer-demo browser QA re-run passed on 2026-06-02 after a focused route-loading fix. Docker/PostgreSQL, migrations, seed, login/forgot-password, role-aware admin/principal/teacher/staff/office access, CampusCore settings notification controls, student attendance, StaffBoard QR display/manual scan, attendance correction, reports, responsive layout, and sensitive-output checks passed in local Chrome DevTools automation.
- Administrator Portal and School ID DB-backed browser QA passed on 2026-06-02. Docker/PostgreSQL, migrations, seed, administrator login, non-admin administrator-login rejection, school list, disposable school create/edit, School ID update, deactivation, conservative hard-delete blocking, School ID school-user login, old School ID rejection, deactivated school rejection, RBAC, audit actions, and sensitive-output checks passed in local Chrome DevTools automation. The disposable QA school was retained in suspended state for future local QA.
- Administrator selected-school dashboard navigation was added on 2026-06-02. Administrators now open a read-only selected-school dashboard from the school registry and can return to the Administrator Dashboard or Schools list without impersonation or session context mutation. DB-backed browser QA should re-run this administrator navigation path before final freeze acceptance.
- The 2026-06-02 Glass UI QA found that the dashboard route-group `loading.tsx` fallback could leave authenticated pages visually stuck on `Loading page...` in browser QA even though the server returned the final route payload. The fallback was removed so protected customer-demo pages render final content directly on first paint.
- Wrong-branch QR browser test is pending a multi-branch demo seed.
- Full native mobile parity remains deferred; the separate Native Mobile v0.1 release candidate is scoped to staff/teacher daily workflows and still requires physical-device QA before production rollout.
- Offline/PWA service worker remains deferred; favicon, app icon, apple-touch icon, and PWA manifest/icon metadata are implemented with the current `public/brand` and `public/icons` asset set.
- Exports/charts are deferred.
- FeeDesk, GradeBook, and SchoolCast are deferred.
- DB-backed browser QA used local Chrome DevTools scripting; no browser/e2e framework is committed.
- Older local demo data may exist outside `jinacampus-demo`; release QA focuses on the demo tenant.
- WhatsApp attendance notification foundation was added on 2026-06-01. Prisma format/validate/generate and source tests passed locally.
- WhatsApp attendance notification DB-backed dry-run smoke passed on 2026-06-01 after Docker/PostgreSQL became reachable. Migrations applied, seed ran, student attendance notification queueing, staff monthly summary queueing, outbox DRY_RUN processing, delivery logs, webhook status handling, tenant/branch scope, and seeded notification RBAC passed. Live provider sending remains deferred.
- Notification provider mode defaults to dry-run. Live Meta Cloud API sending remains deferred until approved credentials, secret storage/decryption, and production QA are completed.
- CampusCore attendance settings notification browser QA passed on 2026-06-01 after focused stabilization. Admin/principal can update and restore notification controls, teacher/staff/office roles receive safe permission states, DRY_RUN/provider-not-configured status is visible, and provider secrets are not exposed.
- UI motion and delete governance were stabilized on 2026-06-02. Shared UI motion is CSS-only with reduced-motion support. User, staff, Academia, role, and branch removal flows remain soft lifecycle or assignment-removal actions with confirmation, RBAC, tenant/branch scoping, and audit logging. Broad hard deletes remain deferred.
- App shell navigation and PWA assets were polished on 2026-06-02. Metadata now references the actual PNG/ICO favicon set, apple-touch icon, and `/site.webmanifest`. Desktop sidebar supports a compact icon rail with hover/focus expansion while preserving the independent scroll region. Topbar account actions are grouped in a glass account menu. Offline/PWA service worker work remains deferred.
- Native Mobile Phase R3 release-candidate hardening completed on 2026-06-05. The Expo app now references approved JinaCampus icon/splash assets, keeps School ID login and SecureStore session behavior, improves safe API/attendance/QR states, and remains scoped to staff QR, My Attendance, Teacher Attendance, and logout. Physical Android/iOS device QA and approved HTTPS backend URL verification remain pending.

## Rollback And Recovery Notes

Local/dev recovery only:

- Restore files from git if a change should be reverted.
- Stop the dev server before Prisma generate/build if Windows file locks occur.
- Restart local PostgreSQL:

  ```bash
  docker compose up -d postgres
  ```

- Recheck migration status:

  ```bash
  npx prisma migrate status
  ```

- Rerun migrations if needed:

  ```bash
  npm run db:migrate
  ```

- Regenerate Prisma client:

  ```bash
  npx prisma generate
  ```

- Rerun seed:

  ```bash
  npm run db:seed
  ```

- Restart the app:

  ```bash
  npm run dev
  ```

This repository does not currently include production deployment rollback instructions, so no production rollback workflow is asserted here.

## Release Evidence

Reference QA and stabilization docs:

- `docs/base-mvp-smoke-checklist.md`
- `docs/base-debugging-report.md`
- `docs/mobile-qa-checklist.md`
- `docs/campuscore-account-qa.md`
- `docs/campuscore-account-browser-qa.md`
- `docs/campuscore-institution-branch-browser-qa.md`
- `docs/academia-staffboard-profile-browser-qa.md`
- `docs/attendance-qr-browser-qa.md`
- `docs/demo-qa-reset.md`
- `docs/customer-demo-browser-qa.md`
- `docs/whatsapp-attendance-notifications.md`
- `docs/whatsapp-notification-db-smoke.md`
- `docs/attendance-settings-notification-browser-qa.md`
- `docs/ui-motion-and-delete-governance.md`
- `docs/app-shell-navigation-polish.md`
- `docs/administrator-school-id-auth.md`
- `docs/administrator-school-id-browser-qa.md`
- `docs/administrator-school-dashboard-navigation.md`
- `docs/native-release-candidate-hardening.md`

## Next Recommended Product Phase

Do not start the next MVP module until this runbook is accepted.

After acceptance, the recommended next product phase is:

FeeDesk MVP

Reason: fee collection, receipts, concessions, and defaulter reports create immediate operational value for Indian schools and build on the now-stabilized CampusCore, Academia, StaffBoard, dashboard, seed, and QA foundation.
