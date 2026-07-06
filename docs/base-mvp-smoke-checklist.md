# Phase 9.9 Final Base MVP Smoke Checklist

Status: completed on 2026-05-15 for the local demo environment.

This checklist records the final base MVP smoke pass before starting any next product module. It covers the completed JinaCampus foundation only: CampusCore, Academia, Daily Full-Day Student Attendance, Student Attendance Reports, StaffBoard Lite, QR Staff Attendance, Staff Attendance Admin, Staff Attendance Correction, Staff Attendance Reports, Dashboard, navigation polish, error/state polish, mobile readiness, and demo seed data.

No FeeDesk, GradeBook, SchoolCast, native mobile app, camera scanner, exports, charts, payroll, leave management, appraisal, biometric integration, or new backend module work was included.

## Demo Environment

- Demo tenant: `jinacampus-demo`.
- Local PostgreSQL was reachable.
- Prisma migration status reported the database schema is up to date.
- Existing seed flow was run with `npm run db:seed`.
- Smoke testing focused on the Phase 9.8 demo tenant. Older local demo data was not deleted.

Seed verification after the smoke pass:

| Area | Count |
| --- | ---: |
| Users | 5 |
| Roles | 8 |
| Permissions | 34 |
| Branches | 1 |
| Active academic years | 1 |
| Class sections | 3 |
| Active students | 20 |
| Guardians | 18 |
| Active enrollments | 18 |
| Active staff profiles | 13 |
| Staff profiles linked to users | 5 |
| Student attendance records | 81 |
| Staff attendance records | 52 |
| QR token rows | 6 |
| QR-enabled attendance settings | 1 |

The student/staff/QR counts include local smoke QA records created during the Phase 9.9 pass.

## Roles Tested

The following demo roles authenticated successfully through the normal app login flow:

- Admin
- Principal
- Teacher
- Staff
- Office staff

No passwords, session cookies, raw QR payloads, or screenshots are stored in this document.

## Route Smoke Results

Public route:

| Route | Result |
| --- | --- |
| `/login` | Passed, returned 200. |

Unauthenticated protected-route redirect check:

| Scope | Result |
| --- | --- |
| 12 protected routes | Passed, each returned 307 to `/login`. |

Routes checked unauthenticated:

- `/dashboard`
- `/academia`
- `/academia/students`
- `/academia/attendance`
- `/academia/attendance/mark`
- `/academia/attendance/reports`
- `/staffboard`
- `/staffboard/staff`
- `/staffboard/attendance`
- `/staffboard/attendance/qr`
- `/staffboard/attendance/scan`
- `/staffboard/attendance/reports`

Authenticated role route checks:

| Role | Routes | Result |
| --- | ---: | --- |
| Admin | 8 | Passed |
| Principal | 8 | Passed |
| Teacher | 4 | Passed |
| Staff | 2 | Passed |
| Office staff | 5 | Passed |

2026-05-15 rerun details:

- Authenticated role route smoke checked 27 role/route combinations across admin, principal, teacher, staff, and office staff.
- Extended admin setup/list route smoke checked 14 CampusCore, Academia, and StaffBoard routes.
- Edit route smoke checked 7 seeded edit routes with actual record IDs.
- All checked authenticated routes returned 200 and had no sensitive-output hits for QR token hash, password hash, Prisma, SQL, or environment-secret patterns.

Extended admin setup/list route checks:

| Scope | Routes | Result |
| --- | ---: | --- |
| CampusCore setup/list pages | 7 | Passed |
| Academia setup/list pages | 6 | Passed |
| StaffBoard category page | 1 | Passed |

Edit route checks with actual seeded IDs:

| Route Pattern | Result |
| --- | --- |
| `/academia/classes/[id]/edit` | Passed |
| `/academia/sections/[id]/edit` | Passed |
| `/academia/subjects/[id]/edit` | Passed |
| `/academia/guardians/[id]/edit` | Passed |
| `/academia/enrollments/[id]/edit` | Passed |
| `/academia/students/[id]/edit` | Passed |
| `/staffboard/staff/[id]/edit` | Passed |

## Functional Smoke Results

Dashboard:

- Dashboard loaded for authenticated demo roles.
- Cards and quick actions rendered with seeded data.
- Quick actions were checked through route smoke and point to existing routes.
- No token hash, raw QR token, tenant ID field, actor ID field, Prisma error, or DB error string appeared in route output.

Academia:

- Students list loaded.
- Classes, sections, subjects, guardians, enrollments, and class-section routes loaded.
- Edit pages loaded for seeded class, section, subject, guardian, enrollment, student, and staff records.
- Create/edit smoke for student and staff completed with deterministic fake local QA records.

Student Attendance:

- Mark attendance page loaded for admin/principal/teacher.
- Seeded class-section and active enrollment data exists.
- Service-layer submit smoke completed on a safe future smoke date with 6 submitted teacher class-section records.
- Mark-all/status behavior is covered by the existing tests and prior UI QA; destructive repeated browser submission was not performed during this final pass.

Student Attendance Reports:

- Reports page loaded.
- Seeded daily and recent attendance data exists.
- Report pages showed data or safe empty states without sensitive output.

StaffBoard Lite:

- Staff profiles list loaded.
- Seeded staff profiles appeared through route smoke.
- Staff edit route loaded.
- Staff categories page loaded.

Staff QR Generation:

- QR display page loaded for admin/principal/office roles.
- Service-layer smoke generated live CHECK_IN and CHECK_OUT QR payloads.
- QR token rows store hashes only; raw tokens were not stored.
- QR generation audit metadata did not contain raw token, token hash, or QR payload.

Staff QR Scan:

- Staff scan page loaded for teacher/staff roles.
- Manual token input rendered and is usable from prior mobile QA.
- Service-layer live QR scan smoke completed for check-in and check-out.
- Duplicate check-in and invalid token paths returned safe domain errors.
- Duplicate check-out remains covered by the existing QR security tests.
- Full camera scanning remains out of scope.

Repeatable QR QA:

- Phase 10.2 added `npm run demo:qa:reset` for local/demo QR QA.
- The reset targets only `jinacampus-demo` and clears today's staff attendance records for the linked demo teacher and staff profiles.
- This allows CHECK_IN and CHECK_OUT manual browser copy/paste QA to be repeated without deleting unrelated tenants or broad demo data.
- See `docs/demo-qa-reset.md` for the reset scope, safety notes, and manual QR QA steps.

Staff Attendance Admin and Correction:

- Staff attendance admin page loaded.
- Seeded staff attendance records exist.
- Correction smoke updated an existing seeded record with a reason.
- Correction reason behavior and NOT_MARKED safety remain covered by existing tests.

Staff Attendance Reports:

- Staff reports page loaded.
- Seeded report data exists for daily, teacher/non-teaching, late, half-day, monthly, and correction scenarios.
- No exports or charts are expected in the base MVP.

## Mobile Smoke Summary

Authenticated responsive smoke was run against these priority routes:

- `/dashboard`
- `/academia/attendance/mark`
- `/academia/attendance/reports`
- `/staffboard/attendance/scan`
- `/staffboard/attendance/qr`
- `/staffboard/attendance`
- `/staffboard/attendance/reports`

Viewports checked:

- 360 x 800
- 390 x 844
- 414 x 896
- 768 x 1024
- 1280 x 800

Result: the 2026-05-15 responsive smoke checked 35 route/viewport combinations and passed with no page-level horizontal overflow, sensitive visible text, or missing primary actions.

Real-device Android Chrome and iOS Safari QA are still recommended before production rollout.

## Sensitive Output Check

Searches and route-output checks covered:

- `tokenHash`
- `passwordHash`
- `tenantId`
- `actorUserId`
- `createdById`
- `updatedById`
- Prisma error strings
- query engine strings
- SQLSTATE / database error strings
- environment-secret strings

Route-output checks passed for the current 2026-05-15 rerun. The current branch also retains earlier Phase 9.9 hardening that keeps list/setup DTOs display-safe while preserving tenant/branch filters in the `where` clauses.

Current verification:

- Priority authenticated role routes passed sensitive-output checks.
- Extended CampusCore, Academia, StaffBoard setup/list routes passed sensitive-output checks.
- Seeded edit routes passed sensitive-output checks.
- QR token hash/raw token were not exposed.
- Tenant and actor IDs were not serialized in checked route output.

Authorized route IDs and form option values may still appear where needed for normal edit/action URLs and hidden form inputs. They are not shown as user-facing labels.

## Issues Found And Fixed

No new application defect was found or fixed during the current 2026-05-15 rerun.

Current branch hardening already includes:

- Replaced raw CampusCore list/query results with display-safe selects for institutions, branches, academic years, users, roles, tenant settings, and attendance settings.
- Replaced raw Academia list/detail query results with display-safe selects for classes, sections, subjects, class sections, guardians, and enrollments.
- Updated regression tests to assert query DTOs do not select tenant or actor-owned internal fields.
- Added `min-w-0` shrink constraints to shared responsive tables and attendance report sections so wide report tables do not create page-level overflow on mobile/tablet widths.
- Added a source regression test for the responsive table/report shrink behavior.

No route-protection, RBAC, tenant-scope, QR scan, or build-blocking application defect remained after the smoke pass.

## Commands And Checks

| Command | Result |
| --- | --- |
| `npx prisma migrate status` | Passed; 4 migrations found and database schema is up to date. |
| `npm run db:seed` | Passed. |
| `npx prisma format` | Passed. |
| `npx prisma validate` | Passed. |
| `npx prisma generate` | Passed. |
| `npm run typecheck` | Passed. |
| `npm test` | Passed; 53 files / 455 tests. |
| `npm run build` | First attempt hit the known Windows Prisma DLL file lock; after stopping the dev server, rerun passed. |
| `git diff --check` | Passed. |
| `npm pkg get scripts.lint` | Returned `{}`; no lint script exists. |

No lint script exists in `package.json`; `npm pkg get scripts.lint` returns `{}`.

## Remaining Risks And TODOs

- Older local demo data may still exist in the developer database; this pass focused on `jinacampus-demo`.
- Real-device Android Chrome and iOS Safari QA should be completed before production.
- QR check-in/check-out browser copy/paste QA can now be repeated with `npm run demo:qa:reset`; full real-device QA remains recommended.
- Camera QR scanner, native mobile app, offline/PWA service worker, manifest/icons, exports/charts, FeeDesk, GradeBook, and SchoolCast remain intentionally deferred.

## Phase 9.9 Result

Phase 9.9 is complete for the local demo environment.

Recommended next phase: freeze the base MVP foundation, then choose the next product module intentionally. FeeDesk or GradeBook can start next only after confirming the product priority.
