# Native Mobile App R&D

## Strategy

JinaCampus native mobile starts as a focused React Native + Expo app, not a full web parity rebuild. The base web MVP remains the system of record for administration, settings, profile management, reporting, correction workflows, and demo QA.

Native mobile v0.1 focuses on daily field workflows:

- School ID based school-user login.
- Staff QR attendance scanning.
- Teacher student attendance marking.
- Role-aware mobile home.
- Secure user login/session storage.
- Online-first backend API integration.

## v0.1 Scope

- Expo Router app shell.
- Secure School ID login screen.
- SecureStore-backed session token storage.
- Role-aware home actions for staff, teachers, and scoped school users.
- Staff QR scanner with Expo Camera and manual token fallback.
- Staff QR scanner submission to the mobile backend API.
- My Attendance status backed by the mobile backend API.
- Teacher attendance class-section, student-list, and submit flow backed by the mobile backend API.
- EAS build config placeholders for Android and iOS.

## Out Of Scope

- FeeDesk mobile.
- GradeBook mobile.
- SchoolCast mobile.
- Parent app.
- Student app.
- Native Administrator Portal or native admin panel.
- Offline sync.
- Push notifications.
- Biometric or GPS attendance.
- Payroll, leave, appraisal.
- Exports and charts.

## Architecture

The mobile app is isolated under `apps/mobile` because the current repository is not workspace-ready. It has its own `package.json`, `tsconfig.json`, Expo config, and EAS config. The existing Next.js web app remains unchanged as a standalone root npm app.

The current Expo app follows the project-local mobile package configuration under `apps/mobile`. Node and Expo dependency upgrade decisions remain deferred to a dedicated maintenance phase.

Mobile source layout:

```txt
apps/mobile/
  app/                  Expo Router routes
  src/api/              API client and mobile contracts
  src/auth/             SecureStore session wrapper and auth context
  src/components/       Native UI primitives
  src/features/         Staff attendance and teacher attendance features
  src/lib/              Theme and role-action helpers
```

The mobile app includes a local Metro config that extends `expo/metro-config`.

Mobile environment configuration uses:

```txt
EXPO_PUBLIC_API_BASE_URL
```

## API Requirements

Backend endpoints for full v0.1 functionality:

- `POST /api/mobile/auth/login`
- `POST /api/mobile/auth/logout`
- `GET /api/mobile/me`
- `POST /api/mobile/staff-attendance/scan`
- `GET /api/mobile/staff-attendance/my-status`
- `GET /api/mobile/teacher/class-sections`
- `GET /api/mobile/teacher/class-sections/[classSectionId]/students`
- `POST /api/mobile/student-attendance/submit`

Phase 2 implements these endpoints as tenant-safe JSON APIs. The APIs reuse the existing web service layer for RBAC, tenant isolation, branch access, academic-year scoping, StaffBoard QR scanning, and Academia student attendance submission.

Phase 3 wires the Expo app to these endpoints for login, session restore, logout, staff QR scan, my attendance status, and teacher attendance submission.

Phase 4 ran DB-backed seeded smoke against these endpoints. It confirmed mobile login, `/me`, logout, StaffBoard QR scan/status, teacher class-section/student loading, and teacher attendance submit against `jinacampus-demo`. The smoke also confirmed that academic-year context must be resolved through the active branch institution, not only tenant scope, because a tenant can contain more than one active institution.

## Auth And Session

- Users log in; institutions and roles do not log in directly.
- Native school users log in with School ID, email, and password.
- School ID is the user-facing label; the backend may map it to the existing internal tenant slug.
- The legacy `tenantSlug` request key remains server-side compatibility only and is not used in native UI.
- Administrator / Super Admin remains web-first; native v0.1 does not include a native Administrator Portal.
- Session tokens come from mobile backend auth APIs.
- The backend reuses the existing `Session` table for mobile bearer tokens.
- Only token hashes are stored server-side.
- Tokens are stored only in Expo SecureStore.
- Passwords are never stored.
- Tokens are not logged or displayed.
- Unauthorized API responses should return the app to login.

## QR Scanner

- Uses Expo Camera in the native app.
- Parses raw staff QR tokens and `STAFF_ATTENDANCE_QR` JSON payloads.
- Submits the extracted token only to the backend scan API.
- Keeps manual token entry as fallback.
- Does not store raw QR tokens.
- Does not expose `tokenHash`.
- Does not accept `tenantId`, `branchId`, `staffId`, or `actorUserId` from mobile input.

## Offline Support Decision

Offline support is deferred.

Future offline candidate:

- Teacher student attendance drafts.

Not offline in this phase:

- Staff QR attendance.
- Fee collection.
- Password/account management.

## Android / iOS QA Plan

Initial QA should use Expo Go where possible:

- Launch with `npm run start` from `apps/mobile`.
- Test login form validation.
- Test backend login and `/me` session restore.
- Test camera permission allow/deny.
- Test QR decode and backend scan with a generated staff attendance QR where a secure URL is available.
- Verify manual fallback remains usable.
- Verify teacher class-section/student loading and attendance submit with seeded data.
- Verify no token, password, token hash, tenant ID, Prisma error, SQL error, or stack trace appears in UI output.

Development builds through EAS can follow after backend mobile APIs are available and Expo Go camera behavior is verified.

## Native Device QA Status

The 2026-06-03 School ID device QA rerun verified DB-backed backend mobile API smoke and Android emulator login-screen rendering. The 2026-06-05 rerun verified local Docker/PostgreSQL, seed, local mobile API smoke, and authenticated desktop web QR route readiness. Full interactive native device QA remains blocked because an approved physical-device HTTPS URL and physical Android/iOS device access were not available, and earlier Expo Go emulator touch/input handling was inconsistent for the login form.

Current readiness:

- Backend mobile APIs: smoke-ready with seeded data.
- Android emulator render: verified.
- Android physical device QA: pending.
- iOS device/simulator QA: pending.
- SecureStore restore, live QR camera scan, My Attendance, Teacher Attendance submit, and logout: pending real device/simulator completion.

## Phase R3 Native Release Candidate Hardening

Native R3 hardened the existing Expo app for release-candidate readiness without expanding v0.1 scope:

- Expo app config now references approved JinaCampus icon, adaptive icon, and splash assets.
- `apps/mobile/.env.example` documents `EXPO_PUBLIC_API_BASE_URL` with an approved-backend placeholder rather than a committed local URL.
- API client server-error handling returns generic safe copy for `5xx` failures.
- Staff QR manual fallback clears stale result state and clears the manual token field after successful submission.
- My Attendance now has explicit loading, empty, and refresh states.
- Teacher Attendance now guards the `YYYY-MM-DD` date format before submit.
- Basic accessibility labels/roles were added to native inputs and buttons.

R3 readiness remains release-candidate with Android/iOS physical-device QA pending.

## Phase 11 Native UI Direction

The existing Expo app foundation now uses the same restrained glass SaaS direction as the web Base MVP:

- navy/indigo/cyan palette
- glass cards and action tiles
- status badges for staff/teacher workflow states
- show/hide password control on native login
- touch-sized buttons and inputs
- safe result/error messaging

This was a UI-only modernization. It did not add native admin functionality, offline sync, push notifications, new product modules, or changes to mobile bearer-token security.

## Phase R1 School ID Rebase

The Expo app and mobile backend auth contract were rebased to the final Base MVP auth model:

- login request now uses `schoolId`, `email`, and `password`
- mobile UI says School ID, not tenant slug
- invalid mobile login uses the safe message `Invalid School ID, email, or password.`
- backend mobile auth maps School ID to the existing tenant slug internally
- legacy `tenantSlug` compatibility remains server-side only
- native Administrator Portal remains deferred

## Future Roadmap

1. Run Android and iOS Expo Go device QA against a reachable backend URL.
2. Run live QR CHECK_IN/CHECK_OUT scanner QA on physical devices.
3. Confirm SecureStore session restore/logout on Android and iOS.
4. Decide on offline teacher attendance drafts.
5. Add development-build QA through EAS if Expo Go is insufficient.
