# Native Phase R3: Release Candidate Hardening

## Status

- Hardening date: 2026-06-05
- Status: release-candidate hardening completed; physical-device QA still blocked by setup
- App path: `apps/mobile`
- Native v0.1 readiness: Release-candidate, device QA pending

No passwords, bearer tokens, raw QR payloads, private URLs, tunnel secrets, signing credentials, screenshots, or production secrets are documented here.

## Native v0.1 Scope

Native v0.1 remains focused on daily school workflows:

- School ID, email, and password login.
- SecureStore-backed session restore.
- Role-aware home.
- Staff QR attendance scan with camera support where available.
- Manual QR token fallback.
- My Attendance.
- Teacher Attendance.
- Logout.
- Institution branding and JinaCampus product identity.

## Out Of Scope

The release candidate does not include:

- Native Administrator Portal.
- Principal full admin workflows.
- User, role, institution, or branch management.
- FeeDesk, GradeBook, SchoolCast, parent app, or student app.
- Offline sync.
- Push notifications.
- Biometric/GPS attendance.
- Payroll, leave, appraisal.
- Exports, charts, file uploads, live WhatsApp sending, or store submission.

## App Config Status

`apps/mobile/app.json` is configured for release-candidate readiness:

- app name: `JinaCampus`
- description: `The Complete School OS`
- slug: `jinacampus-mobile`
- version: `0.1.0`
- scheme: `jinacampus`
- orientation: portrait
- Android package: placeholder-safe `com.parshavinsights.jinacampus.mobile`
- iOS bundle identifier: placeholder-safe `com.parshavinsights.jinacampus.mobile`
- camera permission copy is scoped to staff attendance QR scanning
- EAS build profiles exist for development, preview, and production

No production signing credentials or store-submission configuration are committed.

## Branding Status

Native UI uses the current JinaCampus identity:

- `JinaCampus`
- `The Complete School OS`
- `powered by Parshav Insights`
- School ID wording for login, not tenant-slug wording
- modern glass SaaS palette aligned with the Base MVP web UI

Admin/Principal-heavy flows remain web-first. The mobile home shows a disabled web-admin note instead of linking to fake native admin screens.

## Icon And Splash Status

The Expo app now references approved existing brand/PWA assets copied into `apps/mobile/assets`:

- `assets/icon.png`
- `assets/adaptive-icon.png`
- `assets/splash.png`

These assets reuse the existing JinaCampus public brand set. Final app-store icon and splash treatment should still receive a design review before public store release.

## Environment Config Status

The native app requires:

```txt
EXPO_PUBLIC_API_BASE_URL
```

`apps/mobile/.env.example` documents a placeholder approved backend URL and warns not to commit private tunnel URLs, credentials, bearer tokens, or secrets.

The API client fails safely when the variable is missing or malformed. Local/private URLs are not hardcoded in source.

## Auth And Session Status

Current behavior:

- Login submits School ID, email, and password.
- Invalid login maps to the safe message `Invalid School ID, email, or password.`
- The bearer token is stored only in Expo SecureStore.
- AsyncStorage is not used for bearer tokens.
- App launch reads SecureStore and calls `/api/mobile/me`.
- Protected API `401` responses clear the local token and route back to login.
- Logout calls backend logout where possible, clears SecureStore, and returns to login.
- Tokens and passwords are not logged.

Physical-device SecureStore restore still needs Android/iOS confirmation.

## API Client Status

The mobile API client:

- reads `EXPO_PUBLIC_API_BASE_URL`
- trims trailing slashes
- requires `http://` or `https://`
- adds `Authorization: Bearer <token>` only when a token is available
- sends and receives JSON
- times out stuck requests
- maps `401` to the configured session-clear handler
- maps `5xx` failures to generic mobile-safe text
- does not log tokens, passwords, or QR tokens

## Role-Aware Routing Status

Role-aware home actions are driven by backend capability flags:

- `canScanStaffQr` shows Scan QR.
- `canViewMyAttendance` shows My Attendance.
- `canMarkStudentAttendance` shows Mark Student Attendance.

Admin-like users do not receive a native Administrator Portal link. They see a safe web-dashboard note for full administration.

## QR Scanner Status

The Staff QR scanner remains online-first:

- Expo Camera scanner is available where supported.
- Camera permission denial shows a safe manual fallback message.
- Manual fallback remains visible.
- Blank manual payloads validate safely.
- Raw staff QR token strings and `STAFF_ATTENDANCE_QR` JSON payloads are parsed.
- Only the extracted token is submitted to the backend.
- Successful scans clear the manual token field.
- Scanner debounces repeat reads and stops after success.
- No `tokenHash` is rendered.
- Raw QR tokens are not logged.

Live CHECK_IN/CHECK_OUT physical-camera QA is still pending an approved HTTPS backend URL and physical Android/iOS devices.

## My Attendance Status

The My Attendance screen now includes:

- loading state
- safe empty state: `No attendance recorded yet today.`
- status badge
- check-in time
- check-out time
- working minutes
- refresh action
- safe API error copy

It shows only the authenticated user's staff attendance payload returned by the backend.

## Teacher Attendance Status

Teacher Attendance remains API-backed:

- class-section loading
- safe empty state when no class sections are available
- active student loading
- safe empty state when no students are available
- Mark All Present
- individual status changes for approved statuses only
- no `NOT_MARKED` submission option
- `YYYY-MM-DD` date format guard before submit
- submit loading state
- success summary message
- backend validation/locked/duplicate errors mapped to safe copy

Physical-device submit QA remains pending.

## UI And Accessibility Status

R3 keeps the existing modern glass UI direction and adds small accessibility hardening:

- touch-sized primary and secondary buttons
- button accessibility roles and labels
- input accessibility labels
- manual QR token input label
- readable loading/empty/error states
- safe-area-friendly scroll screens
- keyboard-aware login screen

No heavy UI library was added.

## Android QA Status

Android physical-device QA is pending.

Local backend/API smoke has passed in earlier R2/Rerun checks, and Android emulator login-screen rendering was previously verified. Physical Android Expo Go/development-build verification still requires:

- approved HTTPS backend URL through `EXPO_PUBLIC_API_BASE_URL`
- physical Android device
- desktop web QR generation for CHECK_IN and CHECK_OUT

## iOS QA Status

iOS physical-device or simulator QA is pending.

This Windows workspace does not provide Xcode, `xcrun`, `simctl`, or an iOS device bridge. iOS verification requires a physical iOS device through Expo Go/development build or a macOS simulator for non-camera flows.

## Expo Audit And Node Advisory

No Expo force upgrade was performed in R3.

Deferred to dependency maintenance:

- Expo dependency-chain audit advisories.
- Node version advisory for the Expo environment.
- Any SDK/Node upgrade decision.

## Known Risks / TODOs

- Physical Android QA pending.
- Physical iOS QA pending.
- Approved HTTPS backend URL pending.
- SecureStore restore pending on physical devices.
- Live QR CHECK_IN/CHECK_OUT pending on physical devices.
- My Attendance native UI pending on physical devices.
- Teacher Attendance submit pending on physical devices.
- Logout/SecureStore clear pending on physical devices.
- Final app-store icon/splash design review pending.
- EAS cloud build not run in this phase.
- Native Administrator Portal and full admin workflows remain web-first.

## Release Candidate Readiness

Readiness status:

- Release-candidate, device QA pending

The native app is hardened for v0.1 source/config readiness, but it must not be marked device-QA-passed until Android and iOS flows pass with an approved device-reachable backend URL.

## Recommended Next Native Phase

Run Native Mobile Device QA with:

1. approved HTTPS backend URL configured through `EXPO_PUBLIC_API_BASE_URL`
2. physical Android device
3. physical iOS device or supported iOS simulator for non-camera flows
4. desktop web QR generation for CHECK_IN and CHECK_OUT
5. School ID login, SecureStore restore, QR scan/manual fallback, My Attendance, Teacher Attendance submit, and logout
