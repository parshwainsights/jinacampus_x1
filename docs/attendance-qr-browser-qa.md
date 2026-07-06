# Attendance and StaffBoard QR Browser QA

## Status

- Date: 2026-05-19
- Status: Complete for local Chrome browser click-through QA
- Environment: Local Windows development environment, Docker PostgreSQL, Next.js dev server
- Browser method: local Chrome through DevTools protocol
- Tenant used: `jinacampus-demo`
- Screenshots committed: none

No passwords, session tokens, raw QR payloads, QR tokens, token hashes, or reset values are documented here.

## Preconditions Verified

- Docker PostgreSQL was started and reported healthy.
- Prisma schema validation passed.
- Prisma migrations were up to date.
- Prisma client generation passed after rerunning it without a concurrent Prisma process.
- Existing seed command completed.
- Demo tenant `jinacampus-demo` existed.
- Demo data existed for users, class sections, students, active enrollments, staff profiles, and staff attendance records.
- `npm run demo:qa:reset` was used before the final QR browser run. It was scoped to `jinacampus-demo` / Main Branch and the known demo QR QA staff profiles only.

## Roles Tested

- Admin
- Teacher
- Staff

## Student Attendance Mark QA

- Route: `/academia/attendance/mark`
- Teacher login and dashboard redirect worked.
- Date input was usable.
- Class-section selector loaded seeded Class 1-A.
- Load Students displayed active enrolled students.
- Mark All Present worked.
- Individual status changes worked for Present, Absent, Late, Half Day, On Leave, and Excused.
- Remarks input worked.
- Submit Attendance completed successfully.
- Repeated submit/update completed safely.
- 390px mobile overflow check passed.
- No runtime overlay, tenant/internal ID, Prisma error, or sensitive output appeared.

## Student Attendance Reports QA

- Route: `/academia/attendance/reports`
- Page loaded for admin.
- Date, class-section, status, student, and date-range filters were usable.
- Daily Summary, Absent Students, Late Students, Classes Not Marked, Student History, and Monthly Percentage sections rendered.
- 390px mobile overflow check passed.
- No Prisma/internal errors or sensitive output appeared.

## Staff QR Display QA

- Route: `/staffboard/attendance/qr`
- Page loaded for admin.
- Check-in purpose selection worked.
- Check-out purpose selection worked.
- Generate QR worked for Check-in.
- Generate QR worked for Check-out.
- Current QR card rendered.
- Regenerate QR action rendered after generation.
- `tokenHash` was not visible.
- Raw QR values were not documented or logged by the QA report.
- No unsafe error output appeared.

## Staff QR Scan QA

- Route: `/staffboard/attendance/scan`
- Page loaded for teacher and staff users.
- Manual token input was usable.
- Blank token validation rendered a safe message.
- Invalid token rendered a safe message.
- Expired token rendered a safe message.
- Live Check-in QR token submission succeeded after demo QA reset.
- Duplicate check-in rendered a safe message.
- Live Check-out QR token submission succeeded.
- Success result card showed purpose, attendance date, status, check-in/check-out time, and working minutes.
- Duplicate check-out rendered a safe message.
- No `tokenHash`, raw internal secret, Prisma error, or runtime overlay appeared.

## Staff Attendance Admin QA

- Route: `/staffboard/attendance`
- Page loaded for admin.
- Date filter worked.
- Staff type filter worked.
- Status filter worked.
- Search input worked.
- Summary cards rendered total staff, checked in, present, late, half day, absent/not marked, and leave/holiday counts.
- Attendance table displayed seeded staff rows with names, employee codes, status badges, working minutes, source, and correction actions.
- Correction action was visible for authorized admin.
- 390px mobile overflow check passed.
- No token hash, raw QR token, or internal error appeared.

## Staff Attendance Correction QA

- Correction UI opened from `/staffboard/attendance`.
- Current staff attendance row summary displayed.
- `NOT_MARKED` was not offered as a correction status.
- Blank correction reason validation rendered safely.
- Check-out before check-in was rejected safely.
- Valid correction saved successfully with a QA reason.
- Updated values were visible after correction.
- No raw token, token hash, password, or internal IDs appeared in user-facing text.

## Staff Attendance Reports QA

- Route: `/staffboard/attendance/reports`
- Page loaded for admin.
- Date, date range, staff type, status, and search filters were usable.
- Daily Staff Attendance, Teacher Attendance Report, Non-teaching Staff Attendance Report, Late Arrival Report, Half-day Report, Monthly Staff Attendance Summary, and Manual Correction Report sections rendered.
- 390px mobile overflow check passed.
- No token hash, raw QR token, Prisma/SQL error, or stack trace appeared.

## Permission Checks

- Staff user could access `/staffboard/attendance/scan`.
- Staff user could not access `/staffboard/attendance`; the page showed a safe error state.
- Staff user could not access `/staffboard/attendance/qr`; the page showed a safe error state.
- Unauthenticated access to `/staffboard/attendance/scan` redirected to login or showed the login page.

## Visual / UX Observations

- Checked pages loaded without a runtime overlay.
- Buttons and form controls were clear and usable.
- Status badges and report sections were readable.
- Success and error messages were school-friendly and non-technical.
- Tables and report surfaces stayed inside responsive wrappers at the sampled 390px mobile width.
- No stale coming-soon text appeared for the completed checked attendance and QR flows.

## Bugs Found / Fixed

- Staff-denied visits to `/staffboard/attendance` and `/staffboard/attendance/qr` rendered safe UI, but the dev server logged `AppError` stacks because the pages threw forbidden errors for missing authorized branch options. Fix applied: both pages now render the existing `PermissionState` directly for this no-access state while preserving service-level RBAC for real data access.
- The temporary local QA runner needed adjustments for controlled textarea input, uppercase rendered labels, and safe forbidden-state text classification. These were QA-runner fixes only, not product code changes.

## Remaining Risks / TODOs

- Live QR scanner QA with an approved HTTPS URL was attempted again on 2026-05-25, but remained blocked before physical-device execution. No approved/private HTTPS URL was available to this Codex session, ADB listed no attached Android device, and no iOS Safari device bridge was available from this Windows workspace.
- Local readiness for the 2026-05-25 pass was verified: Docker/PostgreSQL reachable, Prisma validation passed, migrations up to date, demo seed completed, demo QR QA reset completed for `jinacampus-demo`, and authenticated local `/staffboard/attendance/qr` plus `/staffboard/attendance/scan` route smoke returned 200 without sensitive QR/password/internal output.
- Live QR scanner real-device QA with an approved HTTPS URL was attempted again on 2026-05-20, but remained blocked before physical-device execution. The approved HTTPS URL was not available to this Codex session, ADB listed no attached Android device, and no iOS Safari device bridge was available from this Windows workspace.
- Local readiness for that pass was verified: PostgreSQL reachable, Prisma validation passed, migrations up to date, demo seed completed, demo QR QA reset completed, and authenticated local `/staffboard/attendance/qr` plus `/staffboard/attendance/scan` route smoke returned 200 without sensitive QR/password/internal output.
- Real-device live QR scanner re-run on 2026-05-20 remained blocked: local DB, seed, QR reset, admin QR route, and staff scan route were verified, but no attached Android device, no iOS Safari device bridge, and no approved HTTPS staging/tunnel URL were available from this workspace.
- Android Chrome live CHECK_IN and CHECK_OUT camera scans remain pending.
- iOS Safari live CHECK_IN and CHECK_OUT camera scans remain pending.
- Device-level permission-denied, duplicate scan, expired QR, and manual fallback behavior remain pending.
- This was local Chrome browser QA, not real-device Android Chrome or iOS Safari QA.
- At the time of this browser QA pass, camera scanner testing was deferred and only manual QR token/payload input was checked.
- Phase 10.5 now adds the browser camera scanner; repeat real-device Android Chrome and iOS Safari QR QA before production rollout.
- QR check-in/check-out was completed through manual token input in browser after `npm run demo:qa:reset`.
- Staff wrong-branch QR scan was not exercised in the browser because the demo seed has one branch; service tests remain the coverage point for that scenario.
- Native mobile app, offline/PWA, exports/charts, FeeDesk, GradeBook, and SchoolCast remain deferred.

## Real-Device Camera QA Follow-up - 2026-05-30

Status: blocked before physical-device execution.

The follow-up real-device Staff QR camera QA was requested with an approved HTTPS URL, Android Chrome, and iOS Safari. The local DB and seed prerequisites were healthy, but the real-device pass did not start because the hard external inputs were unavailable in this Codex session:

- Approved HTTPS URL: not available. Local app configuration is HTTP-only, no HTTPS app URL was available in local environment values, and no configured tunnel script was present.
- Android Chrome: not available. ADB is available, but it reported 0 attached Android devices.
- iOS Safari: not available. No iOS device tooling or Safari bridge is available from this Windows workspace.
- Demo data: available. Demo role users, linked staff profiles, and Main Branch staff QR settings were verified locally.

Real-device CHECK_IN, CHECK_OUT, permission-denied, manual fallback, duplicate, and expired QR behavior remain pending. Scanner readiness remains release-candidate, real-device QA pending.

### Re-run Request - 2026-05-30

Status: still blocked before physical-device execution.

The same real-device QA pass was requested again. The local DB/seed prerequisites remained healthy, but the hard device setup was still unavailable:

- Approved HTTPS URL: local configuration remains HTTP-only and no HTTPS environment value or configured tunnel script was available.
- Android Chrome: ADB is available, but it reported 0 attached devices and 0 unauthorized devices.
- iOS Safari: no iOS device tooling or Safari bridge is available from this Windows workspace.

No device scan flow was executed and no screenshots, tokens, raw QR payloads, private URLs, or secrets were documented.

## Recommended Next Repair Task

Continue base stabilization only if another confirmed runtime or browser issue appears. Otherwise, prepare a base MVP freeze/release runbook before starting the next approved product module.

## Staff QR Camera Button Repair - 2026-06-29

Status: source-level repair completed after a Safari/mobile report; real-device camera QA remains pending.

Repair completed:

- Start Camera now requests camera access directly through `getUserMedia` from the user click path.
- Non-secure phone URLs show a safe HTTPS-required state instead of appearing unresponsive.
- Rear-camera constraints fall back to a generic camera stream when constraints fail.
- The video preview is explicitly `muted`, `autoPlay`, `playsInline`, and started with `video.play()`.
- Scanner controls and media tracks are stopped on success, stop, error, and unmount.
- Safe messages cover permission denied, unsupported browser, unavailable camera, camera-in-use, invalid QR, and insecure context.
- The app sends `Permissions-Policy: camera=(self), microphone=()`.

Remaining readiness gate:

No Android Chrome or iOS Safari physical-device scan was executed in this repair pass. QR camera readiness remains pending until approved-HTTPS real-device QA passes for CHECK_IN, CHECK_OUT, invalid QR, denied permission, camera unavailable, duplicate/expired QR, normal browser mode, and installed PWA/home-screen mode. Wrong-branch QR remains pending until second-branch fixture coverage exists.

## Staff QR Safari/PWA Diagnostics Follow-up - 2026-06-30

Status: source-level diagnostic update completed; release blocker remains until real-device approved-HTTPS QA passes.

Follow-up changes:

- Start Camera now visibly enters a support-checking state before any camera API decision.
- The scan page renders secure-context, media API, current origin, and user-agent diagnostics.
- Console diagnostics are limited to camera support fields and do not include QR tokens, passwords, session cookies, tenant IDs, branch IDs, or provider secrets.
- HTTP LAN/IP access now prioritizes the HTTPS-required message instead of a generic camera unavailable message.
- A QR image/photo upload fallback was added for camera failures. It decodes locally in the browser and still submits through the same Staff QR scan server action.

QA interpretation:

If the phone address bar shows a LAN IP/HTTP URL, Safari camera access is expected to be blocked. That state is not QR readiness. Use the approved HTTPS pilot URL, then test Safari, Chrome, and installed PWA mode separately.

## Staff QR Production Scanner Hardening - 2026-07-01

Status: source-level fix completed; physical-device QR camera QA remains pending.

The Staff QR scan UI now uses a direct `getUserMedia` camera flow from the Start Camera button with secure-context detection, likely in-app browser detection, rear-camera fallback, a 12-second camera permission timeout, mobile Safari video playback attributes, and `jsQR` canvas-frame decoding. ZXing/BarcodeDetector browser decoding is no longer used for the Staff QR scanner.

The server action now accepts the raw decoded QR payload and parses it server-side before calling the existing StaffBoard scan service. Tenant/user/branch/staff context, `staffboard.attendance.self_scan`, QR token hashing, tenant/branch/purpose/expiry validation, duplicate scan protection, attendance mutation, and audit logging remain server-owned. Client-supplied tenant, branch, user, role, permission, staff, and attendance-status hints are rejected before service execution.

Readiness remains pending until approved-HTTPS real-device QA passes on Android Chrome, iOS Safari, and installed PWA mode.
