# Physical Attendance Pilot Plan

## Status

- Date: 2026-06-28
- Applies to: JinaCampus Web v1.0 Base MVP controlled physical attendance pilot
- Pilot environment type: Local School Network Pilot
- Current status: blocked before Day 0 DB-backed setup by local Docker/PostgreSQL availability
- Final pilot recommendation: do not begin physical attendance use until the pilot/staging DB is reachable, reset/seeded, and browser smoke passes

This plan does not include FeeDesk, GradeBook, full SchoolCast, live WhatsApp sending, native production app, payroll, leave management, exports/charts, offline sync, push notifications, biometric/GPS attendance, or new product modules.

Do not include passwords, session cookies, raw QR payloads, private URLs, real Aadhaar values, bank account values, or sensitive student/staff data in pilot notes, screenshots, or feedback.

## Pilot Scope

The controlled physical pilot is limited to:

- teacher daily student attendance
- staff QR attendance using browser/PWA scan page or manual fallback
- admin/principal attendance correction with reason
- student and staff attendance reports
- role-based access verification
- manual register comparison

This is not a full production rollout. Keep a manual attendance register throughout the pilot, and do not use pilot attendance for payroll, discipline, or statutory reporting until the school signs off after the pilot.

## Local School Network Access

Option A runs JinaCampus on a local laptop, desktop, or server connected to the school Wi-Fi/LAN.

Access URL format:

```txt
http://<local-ip>:3000
```

Example format only:

```txt
http://192.168.1.25:3000
```

Do not commit private LAN URLs, credentials, session cookies, or QR payloads to docs. The local IP can be checked on the pilot machine using the operating system network settings or `ipconfig`.

Prerequisite status from the latest local check:

| Item | Status |
| --- | --- |
| Node.js | Installed; local check returned Node `v20.8.0`. |
| npm | Installed; local check returned npm `10.1.0`. |
| Project dependencies | Present; `node_modules` and `package-lock.json` exist. |
| Local LAN IP | Available on Wi-Fi, but not committed to docs. |
| App port 3000 | No listener was running at the time of check. |
| Firewall / phone reachability | Not verified because the app server was not started. |

## Required School Setup

Start with a small controlled group:

| Area | Target |
| --- | --- |
| Branches | 1 branch |
| Academic year | 1 active academic year |
| Classes | 2 classes |
| Sections | 2 sections |
| Students | 40-80 demo/pilot-safe students |
| Teachers | 4-6 teacher users |
| Staff | 8-15 staff users |
| Admin users | principal plus office/admin user |

Required data:

- School ID
- institution profile and branding
- branch
- active academic year
- principal user
- teacher users
- staff users
- office/admin user
- classes, sections, and class sections
- students, guardians, and enrollments
- staff profiles linked to staff/teacher users where QR scan is tested
- student and staff attendance settings

## Day 0 Setup Result

Status: blocked.

Environment checks:

| Check | Result |
| --- | --- |
| `DATABASE_URL` target | Local PostgreSQL on `localhost:55432`, database `jinacampus`; secrets were not printed. |
| Docker container check | Blocked: Docker daemon unavailable. |
| PostgreSQL TCP check | Failed: no listener on `localhost:55432`. |
| `docker compose up -d postgres` | Failed because the Docker daemon pipe was unavailable. |
| `npx prisma migrate status` | Failed because configured PostgreSQL was unavailable. |
| `npx prisma format` | Passed. |
| `npx prisma validate` | Passed. |
| `npx prisma generate` | Passed. |
| `npm run typecheck` | Passed. |
| `npm test` | Passed, 76 files / 662 tests. |
| `npm run build` | Passed. |
| `git diff --check` | Passed. |
| `npm pkg get scripts.lint` | Returned `{}`; no root lint script exists. |

Latest Option A local-network rerun:

| Check | Result |
| --- | --- |
| Local app server | Not started because DB setup is blocked. |
| Server-machine browser smoke | Not run because DB setup is blocked. |
| Teacher/staff phone reachability | Not run because the app server was not started. |
| Local School ID login | Not run because DB-backed seed/login is unavailable. |
| WhatsApp mode | Must remain DRY_RUN/non-live before any pilot. |

Quality gate summary:

- Static gates passed: Prisma format, Prisma validate, Prisma generate, typecheck, tests, build, and diff check.
- DB gate failed: `npx prisma migrate status` could not connect to local PostgreSQL at `localhost:55432`.
- Browser/LAN smoke was not run because the DB gate failed.

Because the DB is unavailable, these Day 0 items were not verified:

- migrations applied
- seed complete
- app login against seeded users
- School ID login
- principal/teacher/staff login
- class-section filter
- staff QR display route with seeded user
- staff scan page with seeded user
- student attendance mark page with seeded class-section

## Day 1 Shadow Test Result

Status: not started.

Run only after Day 0 passes.

Student attendance shadow plan:

1. Teacher logs in.
2. Teacher opens Mark Attendance.
3. Teacher selects class-section.
4. Teacher marks all present.
5. Teacher changes exceptions.
6. Teacher submits.
7. Manual register is maintained in parallel.
8. End-of-day report is compared with manual register.

Staff attendance shadow plan:

1. Admin/principal generates CHECK_IN QR.
2. Staff scan QR or use manual fallback.
3. Manual staff register is maintained in parallel.
4. Admin/principal generates CHECK_OUT QR.
5. Staff scan checkout.
6. End-of-day report is compared with manual register.

## Day 2 Correction And Report Result

Status: not started.

Run only after Day 1 is stable.

Test scenarios:

- staff forgot checkout
- teacher marked wrong student status
- late staff
- absent student
- expired QR
- correction with reason
- reports after correction

Expected:

- correction reason is required
- audit behavior remains available where visible
- reports update correctly
- no attendance records are deleted to fix mistakes

## Day 3-5 Controlled Live Pilot Result

Status: not started.

Use JinaCampus as the primary attendance tool only after Day 1-2 are stable. Continue manual backup. Review reports daily. Fix only launch-blocking defects.

## QR Camera QA Status

Status: pending.

Physical Android Chrome and iOS Safari QR camera QA was not run because DB/backend setup is blocked and no approved HTTPS URL/device pass was available in this session.

For the local HTTP LAN pilot, browser camera support may be limited on physical phones because camera APIs generally require secure context. If only local HTTP is available, use manual token fallback and do not claim full QR camera readiness.

Until QR camera QA passes:

- use manual token fallback for staff attendance pilot checks where appropriate
- keep manual register backup
- do not claim full physical QR camera readiness

## Manual Fallback Status

Status: pending DB-backed verification.

Manual fallback remains the recommended backup path for the physical pilot if camera QA is unavailable, but it must be tested after the DB is reachable and seed/pilot data exists.

## Role Access QA Plan

Verify after DB-backed setup:

| Role | Expected access |
| --- | --- |
| Principal | Dashboard, reports, correction, allowed user management, own school only. |
| Teacher | Student attendance workflows; no admin user management. |
| Staff | QR scan/manual fallback and own attendance surfaces; no student/admin management. |
| Office staff | Permission-scoped operational access only. |

## Reports To Verify

Student reports:

- daily summary
- absent students
- late students
- student history
- class-wise report

Staff reports:

- daily staff attendance
- late staff
- half-day staff
- monthly summary
- correction report

## Issues Found

| Severity | Issue | Status | Next step |
| --- | --- | --- | --- |
| Launch blocker | Docker/PostgreSQL unavailable, so Day 0 DB-backed setup and browser smoke cannot run. | Open | Start Docker Desktop or provide a reachable pilot/staging DB. |
| Launch blocker | Local network app server was not started because DB setup is blocked. | Open | Start DB, seed data, then run `npm run dev -- -H 0.0.0.0` or the approved production start command. |

## Fixes Applied

No application fixes were applied. This pass only added the physical pilot plan and feedback log.

## Final Pilot Recommendation

Do not begin physical school attendance pilot operations yet.

Next required gate:

1. Start Docker Desktop or provide approved pilot/staging PostgreSQL.
2. Run migration status.
3. Reset/rebuild the clean pilot DB if safe.
4. Seed pilot/demo data.
5. Start the app on the LAN using the project startup path.
6. Verify `http://<local-ip>:3000/login` from a teacher/staff device on the same Wi-Fi/LAN.
7. Run School ID login and attendance browser smoke.
8. Start Day 1 shadow testing with manual register backup.
