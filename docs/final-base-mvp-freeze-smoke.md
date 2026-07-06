# Final Base MVP Freeze Smoke

## Status

- QA date: 2026-06-09
- Status: Passed for Web Base MVP controlled pilot launch
- Tenant used: `jinacampus-demo`
- Scope: Base MVP web release candidate only
- Native mobile: parked; no native mobile work was performed
- Browser method: local Chrome DevTools automation against the running Next.js app. The in-app Browser connector failed to initialize its local runtime assets in this session, so the established local Chrome DevTools fallback was used without adding an e2e dependency.
- Screenshots: not committed. No screenshots containing credentials, session cookies, QR payloads, tokens, private URLs, or secrets were added.

## DB, Docker, And Seed Status

Docker Desktop was initially unavailable, then was started from the Windows workspace. The project PostgreSQL container became healthy and reachable.

Verified:

- `npx prisma migrate status` reported seven migrations and the database schema was up to date.
- `npm run db:seed` completed successfully.
- Demo tenant `jinacampus-demo` exists and is active.
- Demo branch, active academic year, class sections, active students, active enrollments, linked staff profiles, notification templates, and WhatsApp settings exist.
- `npm run demo:qa:reset` was run before Staff QR browser smoke. It was scoped to the demo tenant, Main Branch, and known demo QR QA staff profiles.

Current local demo counts after smoke:

| Area | Count |
| --- | ---: |
| Users | 25 |
| Tenant roles | 11 |
| Branches | 1 |
| Academic years | 2 |
| Class sections | 3 |
| Students | 20 |
| Active enrollments | 18 |
| Staff profiles | 13 |
| Linked staff profiles | 5 |
| Student attendance records | 420 |
| Staff attendance records | 292 |
| Notification templates | 2 |
| Notification outbox rows | 5 |
| WhatsApp integration settings | 1 |

## Static Quality Gate

Passed before browser smoke and again after freeze documentation updates:

| Command | Result |
| --- | --- |
| `npx prisma format` | Passed |
| `npx prisma validate` | Passed |
| `npx prisma generate` | Passed |
| `npm run typecheck` | Passed |
| `npm test` | Passed, 75 files / 656 tests |
| `npm run build` | Passed |
| `git diff --check` | Passed |
| `npm pkg get scripts.lint` | Returned `{}`; no root lint script is configured |

No root lint script is configured yet; all available static gates passed.

## Browser Smoke Result

| Area | Result | Notes |
| --- | --- | --- |
| Administrator Portal | Pass | Administrator login, school registry, selected-school dashboard navigation, and non-admin administrator-login rejection passed. The selected-school dashboard remained read-only and did not impersonate a school user. |
| School ID login | Pass | `/login` rendered School ID, email, password, forgot-password link, and show/hide password control. School login worked for seeded role users without exposing internals. |
| Login UX | Pass | Password field was hidden by default, show/hide worked, and the toggle did not submit the form. |
| Forgot password | Pass | Public recovery response stayed non-enumerating and did not reveal user existence or role. |
| Principal access | Pass | Dashboard, user management, CampusCore settings, attendance notification controls, and institution-scoped settings rendered without provider secrets. |
| Office access | Pass | Staff operations rendered; CampusCore settings returned a safe permission state. |
| Teacher access | Pass | Teacher landing and attendance workflows rendered; CampusCore users/settings returned safe forbidden states. |
| Staff access | Pass | Staff QR scan was allowed; staff attendance admin and QR generation returned safe forbidden states. |
| Student Attendance | Pass | Class 1-A active students loaded. Mark All Present, individual status changes, submit, duplicate update, and mobile overflow checks passed on a future safe QA date. A stale/today locked-date attempt correctly returned the auto-lock error. |
| Student Attendance Reports | Pass | Daily summary, absent/late sections, classes-not-marked, student history, monthly percentage, filters, and mobile overflow checks passed. |
| Staff QR Display | Pass | Authorized CHECK_IN and CHECK_OUT QR generation rendered without exposing `tokenHash`. |
| Staff QR Scan / Manual Fallback | Pass | Blank payload, invalid token, expired QR, CHECK_IN, duplicate CHECK_IN, CHECK_OUT, and duplicate CHECK_OUT states returned safe messages through browser manual-token flow. |
| Staff Attendance Admin | Pass | Filters, summary cards, table rows, correction entry points, and mobile overflow checks passed. |
| Staff Attendance Correction | Pass | Reason validation, invalid time validation, valid correction, and hidden `NOT_MARKED` correction option checks passed. |
| Staff Reports | Pass | Daily, teacher, non-teaching, late, half-day, monthly summary, and correction report sections rendered. |
| Permission boundaries | Pass | Staff admin QR/admin attendance denial, teacher admin denial, office settings denial, and unauthenticated protected-route redirect passed. |
| Responsive layout | Pass | Priority flows were checked at mobile and desktop widths with no page-level horizontal overflow in tested surfaces. |
| Sensitive output | Pass | Browser-visible output did not expose password hashes, raw passwords, reset tokens, session secrets, bearer/mobile tokens, token hashes, raw QR internals outside intended QR/manual entry contexts, provider secrets, Prisma/SQL errors, stack traces, private URLs, or secrets. |

## WhatsApp DRY_RUN Foundation

`npm run smoke:notifications:whatsapp` passed in `DRY_RUN` mode.

Verified:

- Database shape, enums, indexes, and seed data.
- Demo context for tenant, branch, and academic year.
- Student attendance notification queueing.
- Staff monthly summary queueing.
- Outbox processor dry-run delivery logs.
- Webhook signature handling.
- Multi-tenant negative fixture.
- Tenant, branch, and RBAC smoke.

No live WhatsApp provider call was made.

## Bugs Found And Fixed

No product code bug was found during the final pass.

QA harness adjustments only:

- The temporary browser harness was aligned to the current School ID login field.
- Student attendance submit smoke was moved from a locked date to a future safe QA date so the lock policy remained enabled.

## Remaining Limitations

- Physical Android Chrome and iOS Safari live QR camera QA over approved HTTPS remains pending.
- Wrong-branch QR negative QA needs an additional branch/staff fixture.
- Broader cross-tenant browser-negative QA needs additional fixture coverage.
- Multi-branch switcher UX remains limited to current branch-cookie behavior.
- Global cross-tenant operator console remains deferred.
- Live Meta Cloud WhatsApp sending, provider secret management, scheduler wiring, and outbox review UI remain deferred.
- FeeDesk, GradeBook, full SchoolCast, exports/charts, offline sync, push notifications, and native mobile release remain out of scope for this Web Base MVP pilot.

## Launch Readiness Decision

Decision: Ready for controlled Web Base MVP pilot launch with documented limitations.

This decision covers the web Base MVP release candidate for a controlled pilot/demo. It does not certify physical-device QR camera scanning or live WhatsApp sending.

## Recommended Next Step

Run the controlled pilot with the documented web scope, then complete real-device Staff QR camera QA over approved HTTPS before claiming full QR camera readiness.
