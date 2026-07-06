# Native Mobile Phase 3

## Status

- Date: 2026-05-26
- Status: Expo auth/session integration implemented; DB-backed and real-device QA pending
- App path: `apps/mobile`
- Backend API dependency: Phase 2 mobile APIs

No passwords, bearer tokens, raw QR payloads, private URLs, tunnel secrets, signing credentials, or production secrets are documented here.

## API Base URL Setup

The Expo app reads the backend URL from:

```txt
EXPO_PUBLIC_API_BASE_URL
```

Examples:

```txt
# local simulator or desktop web
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000

# Android emulator
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000

# physical device through an approved HTTPS tunnel or staging URL
EXPO_PUBLIC_API_BASE_URL=https://<approved-host>
```

Do not commit private tunnel URLs, credentials, bearer tokens, or secrets. `EXPO_PUBLIC_` values are bundled into the mobile app and must be treated as public configuration.

## Auth And Session Flow

1. App launch reads the bearer token from Expo SecureStore.
2. If a token exists, the app calls `GET /api/mobile/me`.
3. If `/me` succeeds, user, institution, branch, academic year, and capability context are restored.
4. If `/me` returns `401`, the app clears SecureStore and routes to `/login`.
5. Login calls `POST /api/mobile/auth/login`.
6. Login success stores the bearer token in SecureStore and routes to `/(app)/home`.
7. Logout calls `POST /api/mobile/auth/logout` when possible, clears SecureStore, and routes to `/login`.

## SecureStore Token Behavior

The mobile token wrapper exports:

- `saveMobileToken(token)`
- `getMobileToken()`
- `clearMobileToken()`

Rules preserved:

- Tokens are stored only in Expo SecureStore.
- AsyncStorage is not used for bearer tokens.
- Tokens are not logged.
- Tokens are cleared on logout and expired/unauthorized API responses.

## API Client Behavior

The mobile API client:

- reads `EXPO_PUBLIC_API_BASE_URL`
- trims trailing slashes
- sends JSON requests
- adds `Authorization: Bearer <token>` for protected calls
- maps safe server errors to mobile `ApiError`
- treats `404` as a pending-backend/mobile API availability message
- applies a simple request timeout
- calls a configured unauthorized handler on protected `401` responses

## Login And Logout

The login screen validates School ID, email, and password presence before submitting. It sends `schoolId` to the mobile login API and never uses tenant slug wording in user-facing copy. It never hardcodes demo credentials and never renders password hashes, token hashes, or internal auth errors.

Logout remains available from the mobile home screen. It clears local session state even if the network logout request fails.

## Role-Aware Home

The home screen now uses backend capability flags:

- `canScanStaffQr` shows Scan QR
- `canViewMyAttendance` shows My Attendance
- `canMarkStudentAttendance` shows Mark Student Attendance

It displays institution branding context when available:

- institution display name or name
- logo URL image if provided
- fallback initial if no logo URL is provided
- user name and email
- role labels
- branch name
- academic year name

Administrator and Super Admin remain web-first. Admin/principal-like school users do not receive fake native admin routes; the native v0.1 note directs full administration to the web dashboard where applicable.

## QR Scan Integration

The Scan QR screen:

- uses Expo Camera for QR scanning
- keeps manual token entry as fallback
- parses raw token and `STAFF_ATTENDANCE_QR` JSON payloads
- submits only the decoded token to `POST /api/mobile/staff-attendance/scan`
- shows loading, success, and safe error states
- displays purpose, attendance date, status, check-in, check-out, and working minutes when returned
- invalidates My Attendance status after successful scan

The app does not store raw QR tokens, log raw QR tokens, or expose `tokenHash`.

## My Attendance Status

`/(app)/attendance-status` calls:

```txt
GET /api/mobile/staff-attendance/my-status
```

It shows:

- attendance date
- status
- check-in time
- check-out time
- working minutes
- safe empty message when no attendance exists yet
- safe error message for missing staff profile, unauthorized access, or unavailable backend

## Teacher Attendance Integration

`/(app)/teacher-attendance` is now API-backed:

- loads class sections from `GET /api/mobile/teacher/class-sections`
- loads active students from `GET /api/mobile/teacher/class-sections/[classSectionId]/students`
- selects the first available class-section by default
- supports attendance date input
- defaults loaded students to Present
- supports Mark All Present
- supports per-student statuses:
  - Present
  - Absent
  - Late
  - Half day
  - On leave
  - Excused
- supports per-student remarks
- submits to `POST /api/mobile/student-attendance/submit`
- shows success and safe error states

Offline drafts remain deferred.

## Real-Device QA Steps

Android Chrome / Expo Go:

1. Set `EXPO_PUBLIC_API_BASE_URL` to a reachable local, staging, or HTTPS tunnel URL.
2. Start the web backend and Expo app.
3. Login as a demo teacher or staff user.
4. Confirm session restore after app reload.
5. Open Scan QR.
6. Test invalid QR/manual token safe error.
7. Scan a live generated QR if a secure URL and camera access are available.
8. Open My Attendance and verify status refresh.
9. Logout and confirm return to login.

iOS Safari / Expo Go:

Repeat the same flow. Camera scanning should be tested on a real iOS device before production use.

## Known Risks / TODOs

- Phase R1 rebased mobile auth to School ID. Legacy `tenantSlug` remains server-side compatibility only.
- DB-backed API smoke with seeded demo users is still recommended.
- Real Android/iOS device QA is still pending.
- Live QR CHECK_IN/CHECK_OUT scan over HTTPS remains pending until physical devices and a secure URL are available.
- Expo dependency-chain audit advisories remain documented; do not force-upgrade Expo in this phase.
- A dedicated Expo/Node dependency maintenance phase should decide whether to move beyond the current Node 20.8.0-compatible Expo line.
- Offline teacher attendance drafts remain deferred.
- Native admin, FeeDesk, GradeBook, SchoolCast, parent app, student app, push notifications, biometric/GPS, and exports/charts remain out of scope.
