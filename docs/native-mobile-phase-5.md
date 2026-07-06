# Native Mobile Phase 5

## Status

- Date: 2026-05-26
- Status: re-run blocked by device/backend setup; local backend and Expo readiness verified
- Tenant used for setup verification: `jinacampus-demo`
- App path: `apps/mobile`

No passwords, bearer tokens, QR payloads, private URLs, tunnel secrets, screenshots, or production secrets are documented here.

## Re-run Summary - 2026-05-26

Readiness status: Blocked by backend/device setup.

This re-run verified local backend, seed, mobile API, and Expo startup readiness again, but did not execute Android/iOS Expo Go QA because the hard device preconditions were not available.

Preconditions verified:

- Docker/PostgreSQL was running.
- Project PostgreSQL health check was healthy.
- Prisma migration status reported the database schema is up to date.
- Demo seed ran successfully.
- Demo tenant `jinacampus-demo` exists.
- Active branch, active academic year, class sections, active students, active enrollments, and linked staff profiles exist.
- Mobile login API works for the demo teacher and staff users.
- Local Next.js backend started and `/login` was reachable.
- Expo Metro boot smoke reached the waiting state with a local backend URL.

Blocked preconditions:

- Android device/emulator was not available; `adb devices` listed no attached targets.
- iOS device/simulator access was not available; `xcrun` is not available from this Windows workspace.
- A device-reachable backend URL was not confirmed. The checked mobile environment example is local-only.

No credentials, bearer tokens, QR payloads, private URLs, or tunnel secrets were printed or documented.

## Backend URL Setup

Device QA requires the Expo app to use:

```txt
EXPO_PUBLIC_API_BASE_URL
```

Current setup type verified in this workspace:

- Local backend URL for desktop/Metro boot smoke.
- No approved HTTPS tunnel, staging URL, or LAN device URL was provided to this workspace.
- No private API URL was committed or documented.

For physical devices, use a same-network LAN URL or approved HTTPS tunnel/staging URL through `EXPO_PUBLIC_API_BASE_URL`. Do not hardcode private URLs in source.

## DB / Seed Status

- Docker Desktop was started locally.
- The project PostgreSQL Compose service was running and healthy.
- Prisma migration status reported the database schema is up to date.
- Prisma schema validation passed.
- Demo seed ran successfully.
- Local Next.js backend started and `/login` was reachable.
- Expo Metro boot smoke reached the waiting state with the local backend URL configured.

Seed preconditions from Phase 4 remain available for `jinacampus-demo`:

- admin/principal/office-style users for web QR generation
- teacher user
- staff user
- linked staff profiles
- active branch
- active academic year
- class sections
- active students and enrollments

## Android Expo Go Results

Status: blocked in the current re-run.

- ADB is installed and started successfully.
- `adb devices` reported no attached Android device or running emulator.
- No Android Expo Go app launch was possible.
- Expo Go login, session restore, QR camera scan, My Attendance, Teacher Attendance, and logout were not run on Android.

## iOS Expo Go Results

Status: blocked in the current re-run.

- iOS simulator/device tooling is not available from this Windows workspace.
- No physical iOS Expo Go device bridge was available.
- Expo Go login, session restore, QR camera scan, My Attendance, Teacher Attendance, and logout were not run on iOS.

## Login / Session Restore Results

Device result: pending.

- Phase 4 DB-backed API smoke passed for mobile login, `/me`, and logout.
- Phase 5 re-run local backend and Metro startup passed.
- SecureStore session restore still needs Android/iOS Expo Go confirmation.

## QR CHECK_IN / CHECK_OUT Results

Device result: pending.

- Phase 4 DB-backed API smoke passed live CHECK_IN and CHECK_OUT through generated QR tokens at the API/service layer.
- Phase 5 re-run did not run camera scanning through Expo Go because no physical device/emulator target was available.
- Duplicate scan behavior remains verified at API smoke level, not device UI level.

## My Attendance Results

Device result: pending.

- Phase 4 API smoke confirmed authenticated My Attendance status returns safely and does not expose other staff data.
- Phase 5 re-run did not verify the native UI on a device.

## Teacher Attendance Results

Device result: pending.

- Phase 4 API smoke confirmed seeded class sections, active students, validation errors, and safe-date attendance submit.
- Phase 5 re-run did not verify the native Teacher Attendance screen on a device.

## Logout Results

Device result: pending.

- Phase 4 API smoke confirmed logout revokes the mobile bearer token and subsequent `/me` fails safely.
- Phase 5 re-run did not verify native logout UI or SecureStore clearing on Android/iOS.

## Bugs Found / Fixed

- No new application bugs were confirmed.
- No code fixes were applied.

## Security Output Check

No Phase 5 command output or documentation includes:

- passwords
- bearer tokens
- raw QR payloads
- `passwordHash`
- `tokenHash`
- raw passwords
- session secrets
- tenant IDs in normal mobile UI notes
- actor IDs
- Prisma/SQL errors
- stack traces
- private API URLs or tunnel secrets

## Known Risks / TODOs

- Android Expo Go device QA remains pending.
- iOS Expo Go device QA remains pending.
- SecureStore session restore needs device confirmation.
- Native camera QR CHECK_IN/CHECK_OUT needs device confirmation.
- My Attendance native UI needs device confirmation.
- Teacher Attendance native UI and submit workflow need device confirmation.
- Logout UI and local SecureStore clearing need device confirmation.
- Expo audit advisories remain deferred to a dependency maintenance phase.
- Node 20.8.0 outdated advisory remains; do not force-upgrade Expo in this QA phase.
- Offline drafts, native admin, push notifications, FeeDesk, GradeBook, SchoolCast, parent app, student app, biometric/GPS, payroll/leave/appraisal, and exports/charts remain out of scope.

## Readiness Status

Native mobile remains release-candidate for device use.

The backend APIs and local Expo startup are ready, but Android/iOS Expo Go QA cannot be marked complete until physical devices or approved emulators are available with a reachable backend URL.

## Recommended Next Native Phase

Native Mobile Phase 5 re-run with:

1. Android device or emulator attached and visible to ADB.
2. iOS device or macOS/iOS simulator access.
3. `EXPO_PUBLIC_API_BASE_URL` set to a device-reachable backend URL.
4. Live CHECK_IN and CHECK_OUT QR scan from Expo Go.
5. SecureStore restore, My Attendance, Teacher Attendance submit, and logout verified on both platforms.
