# Native Mobile Phase R1: School ID Rebase

## Status

- Date: 2026-06-03
- Status: Expo native auth contract rebased to the finalized Base MVP School ID model
- App path: `apps/mobile`

No passwords, bearer tokens, raw QR payloads, private URLs, tunnel secrets, signing credentials, or production secrets are documented here.

## Reason For Rebase

Native mobile work was paused while the Base MVP authentication model was finalized. The web app now uses a clear split:

- school users sign in with School ID, email, and password
- Administrator / Super Admin portal remains web-first
- session context resolves tenant, institution, branch, academic year, role labels, permissions, and institution branding after login

The native v0.1 app now follows the same public login model.

## School ID Login Behavior

The Expo app login form shows:

- School ID
- Email
- Password

The mobile login request sends:

```json
{
  "schoolId": "school-id",
  "email": "user@example.test",
  "password": "..."
}
```

The backend maps School ID to the existing internal tenant slug. The legacy `tenantSlug` request key remains accepted server-side only for compatibility, but native UI and mobile contracts use `schoolId`.

Safe public failure message:

```txt
Invalid School ID, email, or password.
```

The response must not reveal whether the School ID, email, role, tenant, or institution exists.

## Administrator Native Portal

Native Administrator Portal is deferred.

Administrator and Super Admin workflows remain web-first. Native v0.1 stays focused on daily school workflows for staff, teachers, and scoped school users. If an unsupported admin-like user signs in, the native home does not expose a fake admin route and directs full administration to the web dashboard where applicable.

## API Routes Used

- `POST /api/mobile/auth/login`
- `GET /api/mobile/me`
- `POST /api/mobile/auth/logout`
- `POST /api/mobile/staff-attendance/scan`
- `GET /api/mobile/staff-attendance/my-status`
- `GET /api/mobile/teacher/class-sections`
- `GET /api/mobile/teacher/class-sections/[classSectionId]/students`
- `POST /api/mobile/student-attendance/submit`

## SecureStore Session Behavior

- Login stores the mobile bearer token only in Expo SecureStore.
- App launch reads SecureStore and calls `/api/mobile/me` to restore context.
- Logout calls the backend logout route where possible, clears SecureStore, and returns to login.
- Protected API `401` responses clear the token and return to login.
- AsyncStorage is not used for bearer tokens.
- Tokens are not logged.

## Role-Aware Home Behavior

The native home is driven by backend capability flags:

- `canScanStaffQr` shows Scan QR.
- `canViewMyAttendance` shows My Attendance.
- `canMarkStudentAttendance` shows Mark Student Attendance.

The home displays institution display name/logo when available, user identity, role labels, branch, and academic year. Unsupported product modules are not shown.

## QR Scanner Behavior

The scanner keeps the v0.1 flow:

- Expo Camera scanner
- manual token fallback
- safe invalid/expired QR errors
- success result card
- no `tokenHash`
- no raw QR token storage or logging

Only the decoded QR token is submitted to the backend scan API. The mobile app does not send tenant, branch, staff, or actor IDs.

## Teacher Attendance Behavior

Teacher Attendance remains API-backed:

- load class sections
- load active students
- Mark All Present
- change individual status
- submit attendance
- show success summary and safe errors

Offline drafts remain deferred.

## Known Blockers / TODOs

- Real Android and iOS device QA is still required.
- Live native camera CHECK_IN/CHECK_OUT QR scanning still needs a reachable secure backend URL.
- Expo audit advisories remain deferred to a dependency maintenance phase.
- Node environment advisory remains deferred to the same maintenance phase.
- Native admin, FeeDesk, GradeBook, SchoolCast, parent app, student app, offline sync, push notifications, biometric/GPS, payroll/leave/appraisal, and exports/charts remain out of scope.

## Android / iOS QA Status

Device QA is pending unless a physical Android/iOS device or simulator is attached with a reachable backend URL. Required smoke:

1. login with School ID
2. session restore
3. role-aware home
4. invalid manual QR token
5. live QR scan where camera and HTTPS URL are available
6. My Attendance
7. Teacher Attendance submit
8. logout and no stale session restore
