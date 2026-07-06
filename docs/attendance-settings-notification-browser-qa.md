# Attendance Settings Notification Browser QA

## Status

- QA date: 2026-06-01
- Status: Passed after focused stabilization
- Scope: CampusCore attendance settings and WhatsApp attendance notification controls only
- Tenant used: `jinacampus-demo`
- Real WhatsApp sending: not configured and not tested
- Browser method: local headless Chrome DevTools automation against the running Next.js app

No passwords, provider tokens, webhook secrets, private URLs, QR payloads, or real phone numbers are included in this document.

## Docker / PostgreSQL Status

- Docker PostgreSQL was running and healthy.
- The project database was reachable through the configured local database URL.
- Prisma migration status reported seven migrations and the database schema was up to date.

## Migration / Seed Status

- `npm run db:seed` completed for the local demo data.
- Verified demo data:
  - `jinacampus-demo` tenant exists.
  - Main Branch exists.
  - Active academic year `2026-27` exists.
  - Admin, principal, teacher, staff, and office staff demo users exist and are active.
  - Two active WhatsApp attendance notification templates exist.
  - Attendance notification settings exist for Main Branch.
  - WhatsApp integration is DRY_RUN / provider-not-configured for local QA.

## Routes Tested

- `/campus-core/settings`
- `/academia/attendance/mark`
- `/staffboard/attendance/scan`
- `/staffboard/attendance/qr`

## Roles Tested

- Admin
- Principal
- Teacher
- Staff
- Office staff

## Admin / Principal Result

Passed.

- Admin can open `/campus-core/settings`.
- Admin can see student attendance notification mode controls.
- Admin can see student WhatsApp alerts toggle.
- Admin can see staff monthly WhatsApp summary controls.
- Admin can update notification settings and see a safe success state.
- Updated values persisted after the save.
- Principal can open `/campus-core/settings`.
- Principal can update and restore the notification settings.
- Settings were restored to the seeded demo values after QA.

## Teacher Result

Passed.

- Teacher direct access to `/campus-core/settings` shows a safe permission state.
- Teacher does not see notification settings controls.
- Teacher can still load the permitted student attendance workflow.
- No internal permission details or runtime error appeared in the checked UI.

## Staff Result

Passed.

- Staff direct access to `/campus-core/settings` shows a safe permission state.
- Staff does not see notification settings controls.
- Staff can still load the permitted Staff QR scan workflow.
- No internal permission details or runtime error appeared in the checked UI.

## Office Staff Result

Passed for current seeded permissions.

- Office staff direct access to `/campus-core/settings` shows a safe permission state.
- Office staff does not see notification settings controls.
- Office staff can still load the permitted Staff QR generation workflow.
- No provider-secret controls appeared.

## Notification Controls Result

Passed after stabilization.

- WhatsApp notification status is visible to authorized settings users.
- The UI clearly shows DRY_RUN / provider-not-configured status for local QA.
- The UI states that DRY_RUN queues and processes messages without sending real WhatsApp messages.
- Student and staff template mapping status is visible.
- No provider token, webhook secret, provider secret, or real-send promise appears in the UI.

## Settings Persistence Result

Passed.

- Admin temporarily enabled student WhatsApp alerts, set student notification mode to `ALL_STATUSES`, and enabled staff monthly WhatsApp summary.
- The settings save redirected back with a safe success message.
- Principal restored the original seeded values.
- Final restored values:
  - Student WhatsApp alerts disabled.
  - Student attendance notification mode `EXCEPTION_ONLY`.
  - Staff monthly WhatsApp summary disabled.
  - Staff monthly summary day `1`.
  - Staff monthly summary time `09:00`.

## RBAC Result

Passed.

- `/campus-core/settings` now renders `PermissionState` instead of relying on the route error boundary for users without `campuscore.settings.manage`.
- Notification setting changes are also guarded by `notifications.settings.manage` when notification fields change.
- Admin and principal have notification governance permissions in the seeded role policy.
- Teacher, staff, and office staff cannot view or update notification settings in the checked browser flows.

## Tenant / Branch Scoping Result

Passed for the single-branch demo fixture.

- Settings loaded for `jinacampus-demo` and Main Branch.
- Settings updates used server-derived tenant context and branch-scoped attendance settings.
- The settings form does not expose tenant selection.

Broader cross-tenant and wrong-branch negative coverage remains pending additional fixture coverage.

## UI / UX Observations

Passed after stabilization.

- Student attendance settings and staff attendance settings remain grouped under branch attendance settings.
- WhatsApp notification controls are labeled clearly.
- EXCEPTION_ONLY and ALL_STATUSES helper text is visible.
- DRY_RUN status is understandable and does not imply live sending.
- Success state appears after tenant or attendance settings save.

## Bugs Found / Fixed

1. Settings route relied on the dashboard error boundary for denied users.
   - Fix: changed `/campus-core/settings` to use `getEffectivePermissions` and render `PermissionState`.

2. Notification controls did not display DRY_RUN / provider-not-configured status.
   - Fix: added safe notification status data and UI copy without selecting provider secrets.

3. Notification fields were controlled only by the broader CampusCore settings permission.
   - Fix: added a server-side `notifications.settings.manage` check when notification settings change.

## Sensitive Output Check

Passed.

Browser QA did not expose:

- WhatsApp access token
- webhook verify token
- provider secret
- raw phone numbers in unsafe output
- password hash
- raw password
- reset token
- session secret
- bearer/mobile token
- token hash
- raw QR token
- Prisma/SQL errors
- stack traces
- private URLs
- secrets

## Remaining Risks / TODOs

- Broader cross-tenant and wrong-branch settings negative QA needs additional fixtures.
- Live Meta Cloud sending remains deferred.
- Approved provider secret storage/decryption remains deferred.
- Scheduler/cron production wiring remains deferred.
- Outbox review UI remains deferred.
- Full SchoolCast remains deferred.
- Real-device Staff QR camera QA remains pending outside this attendance settings pass.

## Recommended Next Task

Run final customer-demo browser QA across the Base MVP after accepting the attendance notification settings controls, or proceed to dependency/Node maintenance if the release owner wants to address the Expo/Node advisory before any further mobile work.
