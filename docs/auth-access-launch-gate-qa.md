# Auth/Access Launch Gate QA

## QA Date / Status

- Date: 2026-06-09
- Status: Passed for JinaCampus Web v1.0 controlled pilot launch
- Scope: Authentication, School ID login, Administrator Portal access, role boundaries, password UX/policy, and sensitive-output checks
- Tenant used: `jinacampus-demo`
- Native mobile status: remains release-candidate; device/backend QA is not part of this gate

## DB / Seed Status

Docker/PostgreSQL was running and reachable through the project database configuration.

Verified:

- `npx prisma migrate status` reported 7 migrations and the database schema was up to date.
- `npm run db:seed` completed.
- `npm run demo:qa:reset` completed for the demo QR/staff QA fixture.
- Demo School ID `jinacampus-demo` exists and is active.
- Seeded Administrator, Principal, Teacher, Staff, and Office Staff users exist.
- Seeded roles, active role assignments, active branch assignments, one branch, two academic years, active enrollments, and linked active staff profiles exist.

Seed verification counts:

| Area | Count |
| --- | ---: |
| Seeded login users checked | 5 |
| Roles | 11 |
| Branches | 1 |
| Academic years | 2 |
| Active role assignments | 30 |
| Active branch access rows | 25 |
| Linked active staff profiles | 5 |
| Active enrollments | 18 |

No passwords, session tokens, reset tokens, QR payloads, provider secrets, or private URLs are documented.

## Browser Method

The in-app Browser runtime was attempted first, but initialization failed because its local runtime assets path was not available in this session. The final gate used the established local Chrome DevTools/CDP browser smoke method against `127.0.0.1:3000` without adding a new e2e dependency.

Screenshots were not committed, and no screenshot artifacts containing credentials, cookies, tokens, QR payloads, or secrets were added.

## Roles Tested

| Role | Result | Notes |
| --- | --- | --- |
| Administrator / Super Admin | Pass | Administrator login, administrator dashboard, school registry, selected-school dashboard, and non-admin rejection passed. |
| Principal | Pass | School ID login, dashboard, institution-scoped users/settings, notification controls, and responsive checks passed. |
| Teacher | Pass | Teacher landing and admin boundary checks passed. |
| Staff | Pass | Staff scan allowed; staff attendance admin and QR generation denied safely. |
| Office Staff | Pass | Staff operations allowed; CampusCore settings boundary denied safely. |

## Administrator Result

Passed for the launch-gate browser rerun.

Verified:

- `/administrator/login` rendered the administrator login experience without School ID.
- Administrator login reached the Administrator Overview.
- School registry rendered with School ID wording.
- Selected-school Administrator View rendered return navigation and did not impersonate a school user.
- Principal credentials were rejected from the administrator portal with the safe generic message.
- No `passwordHash`, `tokenHash`, role-enumerating details, or internal errors appeared.

School create/edit/update/deactivate flows were not repeated destructively in this final gate; they remain covered by the existing Administrator School ID browser QA and current regression suite.

## School ID Login Result

Passed.

Verified:

- `/login` rendered School ID, email, password, forgot-password, and password visibility controls.
- School ID login worked for seeded Principal, Teacher, Staff, and Office Staff paths exercised by the browser smoke.
- Login redirects matched role expectations:
  - Teacher to student attendance marking.
  - Staff to staff QR scan.
  - Principal/Office/Admin-style users to dashboard.
- Invalid public recovery/login states remained safe and non-enumerating.
- UI uses School ID wording, not tenant slug wording.

## Principal Result

Passed.

Verified:

- Principal reached the school dashboard.
- Institution branding context rendered.
- User management and settings pages rendered in institution scope.
- Attendance notification settings displayed DRY_RUN/provider-not-configured status without provider secrets.
- Mobile-width layout did not horizontally overflow on checked pages.

Principal role/branch assignment and password reset mutation flows were not repeated destructively in this final browser run. They remain covered by the DB-backed auth/access browser QA evidence and by current regression tests for assignable role boundaries, duplicate assignment handling, branch scope, and reset-password permission guards.

## Teacher Result

Passed.

Verified:

- Teacher login reached the expected student attendance marking workflow.
- Teacher user/admin boundary checks returned safe forbidden states for CampusCore users and settings.
- Teacher attendance marking loaded Class 1-A active students, supported Mark All Present, individual status changes, submit, duplicate/update handling, and mobile overflow checks.
- Teacher could use Staff QR self-scan through the manual-token flow where seeded permissions allow it.

## Staff Result

Passed.

Verified:

- Staff login reached Staff Attendance Scan.
- Staff scan route rendered and stayed protected.
- Staff attendance admin and QR generation routes returned safe forbidden states.
- Unauthenticated direct access to the scan route redirected to login or showed the login surface.

## Office Staff Result

Passed.

Verified:

- Office Staff login succeeded.
- Staff attendance operations rendered according to seeded permissions.
- CampusCore settings returned a safe forbidden state.
- No administrator portal access was granted through the school-user path.

## Forgot / Change / Reset Password Result

Passed as a layered verification.

Browser-rerun verified:

- Forgot-password link on `/login`.
- Password hidden by default.
- Show password and hide password controls.
- `/forgot-password` safe public response for an unknown account.
- No role, account existence, reset token, or password hash was exposed.

Regression and prior DB-backed browser QA cover:

- Admin/Principal reset route permission protection.
- Password reset hashing behavior.
- Change-own-password current-password validation.
- Confirmation mismatch validation.
- Teacher/staff reset-route forbidden state.

This final gate did not mutate demo passwords through the browser to avoid changing seeded credentials after the launch seed.

## Role / Branch Assignment Result

Passed as a layered verification.

Browser-rerun verified:

- Principal user-management page access.
- Teacher/staff/office governance boundary checks through direct route attempts.

Regression and prior DB-backed browser QA cover:

- Allowed role assignment.
- Duplicate role assignment safe handling.
- Role removal.
- Principal cannot assign Super Admin.
- Allowed branch assignment.
- Duplicate branch assignment safe handling.
- Branch removal.
- Principal branch option scoping.
- Teacher/staff cannot assign roles or branches.

Current demo data has one branch, so broader multi-branch negative browser coverage remains pending fixture expansion.

## Navigation Result

Passed for current MVP.

Verified:

- Administrator Portal navigation remained separate from school login.
- Principal, Teacher, Staff, and Office Staff reached role-appropriate entry points.
- Hidden/forbidden school governance routes were backed by safe server-side denial states.
- No unsupported future-module or native-mobile navigation was introduced in this gate.

## Tenant / School Isolation Result

Passed within available seeded data.

Verified:

- School ID selected login context only; authorization still came from server-derived user, tenant, role, branch, and academic-year context.
- User and settings surfaces were institution-scoped for Principal.
- Teacher, Staff, and Office Staff direct URL attempts to governance routes failed safely.
- StaffBoard and Academia checked flows used seeded tenant/branch data.

Current limitation: the local seed has one launch demo school/branch, so broader cross-tenant and multi-branch negative browser QA still needs additional fixture coverage.

## Sensitive-Output Result

Passed.

Browser-visible output and the dev-server logs from the gate smoke did not expose:

- `passwordHash`
- raw password
- reset token
- session secret
- bearer/mobile token
- `tokenHash`
- raw QR token outside the intended manual-entry/QR context
- WhatsApp provider token
- webhook secret
- provider secret
- `actorUserId`
- Prisma/SQL errors
- stack traces
- private URLs
- credentials

## Bugs Found / Fixed

No product code bugs were found in this launch-gate run.

No application code was changed.

Operational notes:

- The Browser plugin path was unavailable in this session, so local Chrome/CDP fallback was used.
- One ad hoc seed-verification helper command was corrected after using an invalid local Prisma field in the helper query. This did not affect application code.

## Launch Readiness Recommendation

Recommendation: JinaCampus Web v1.0 Base MVP auth/access gate is passed for controlled pilot launch with documented limitations.

This recommendation does not certify:

- Native mobile production readiness.
- Physical-device QR camera scanning.
- Live WhatsApp sending.
- Multi-tenant/multi-branch negative browser coverage beyond available demo fixtures.

## Recommended Next Task

Proceed with the controlled Web v1.0 pilot using the v1.0 runbook, then add a second safe demo school/branch fixture for broader cross-tenant and multi-branch negative QA before wider rollout.
