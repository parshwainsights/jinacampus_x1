# Native Mobile Phase 4

## Status

- Date: 2026-05-26
- Status: DB-backed mobile API smoke re-run passed; Expo local Metro boot smoke passed; real Android/iOS device QA pending
- Tenant used: `jinacampus-demo`
- App path: `apps/mobile`

No passwords, bearer tokens, QR payloads, private URLs, tunnel secrets, screenshots, or production secrets are documented here.

## DB / Docker / Seed Status

- Docker Desktop was started locally for the current re-run.
- Local PostgreSQL was started with the project Docker Compose service.
- PostgreSQL health check reported healthy.
- `DATABASE_URL` was confirmed to point at the local PostgreSQL instance.
- Prisma migration status reported the database schema is up to date.
- Demo seed ran successfully.
- Demo QA reset ran before live QR scan smoke to clear scoped same-day staff attendance for the configured demo teacher/staff profiles.
- Demo QA reset ran again after live QR scan smoke to clean up the scoped same-day QR attendance record created by the smoke run.

Seeded data confirmed:

- active demo tenant
- admin/principal/office-style users for QR generation
- teacher user with class-teacher role
- staff user with staff role
- linked staff profiles for admin, office, principal, teacher, and staff users
- active branch
- active academic year
- class sections
- students
- active enrollments
- staff profiles

## API Base URL Setup

The Expo app must use:

```txt
EXPO_PUBLIC_API_BASE_URL
```

Local examples:

```txt
# desktop/local simulator
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000

# Android emulator
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000

# physical device
EXPO_PUBLIC_API_BASE_URL=https://<approved-host>
```

Do not commit private tunnel URLs, credentials, bearer tokens, QR payloads, or secrets.

## Seeded Roles Tested

- Teacher/class-teacher user for login, `/me`, StaffBoard self-scan, My Attendance, class-section loading, student loading, and student attendance submit.
- Staff user for login and logout token revocation smoke.
- Admin context was used only server-side by the smoke harness to generate live StaffBoard QR tokens through the existing service.

No credentials are documented.

## DB-Backed API Smoke Results

Current re-run passed:

- `POST /api/mobile/auth/login`
  - valid teacher login
  - valid staff login
  - invalid login safe error
  - response did not expose `passwordHash` or `tokenHash`
- `GET /api/mobile/me`
  - returned user context
  - returned capability flags
  - returned institution, branch, and academic-year context
  - did not expose sensitive hashes or internals
- `POST /api/mobile/auth/logout`
  - logout succeeded
  - revoked token was rejected by subsequent `/me`
- `POST /api/mobile/staff-attendance/scan`
  - bearer token required
  - invalid QR token returned safe error
  - client-supplied `tenantId`, `branchId`, and `staffId` were rejected
  - live `CHECK_IN` QR succeeded
  - live `CHECK_OUT` QR succeeded
  - duplicate `CHECK_OUT` returned safe conflict
  - no `tokenHash` or raw internals were returned
- `GET /api/mobile/staff-attendance/my-status`
  - authenticated staff profile status loaded safely
  - no other staff data was exposed
- `GET /api/mobile/teacher/class-sections`
  - returned seeded class-teacher class section after context fix
- `GET /api/mobile/teacher/class-sections/[classSectionId]/students`
  - returned active enrolled students
  - inaccessible class-section ID was rejected safely
- `POST /api/mobile/student-attendance/submit`
  - invalid status rejected safely
  - duplicate student IDs rejected safely
  - safe QA-date attendance submit succeeded and returned a summary
  - client tenant/actor context remained server-derived

The current re-run used a sanitized temporary smoke harness and removed it after execution. The harness did not print bearer tokens, QR payloads, passwords, token hashes, or private URLs.

## Expo App QA Results

Completed locally in the current re-run:

- Expo Metro boot smoke reached the waiting state with `EXPO_PUBLIC_API_BASE_URL` set to the local backend URL.
- No interactive Expo Go session was run because no Android or iOS device/emulator target is attached to this workspace.

Historical Phase 4 setup notes already completed:

- Expo dependency setup was checked.
- Missing `expo-asset` dependency was found during Metro boot and added with Expo's version-aware installer.
- A zero-byte read-only `apps/mobile/.gitignore` blocked Expo type-generation updates; the read-only flag was cleared and normal Expo ignores were added.
- Expo local start then reached Metro's waiting state on a local port.

Not completed in this environment:

- Interactive Expo Go login.
- SecureStore restore on a running device.
- QR scanner camera flow.
- My Attendance UI interaction.
- Teacher Attendance UI interaction.
- Logout UI interaction.

These remain pending until an Android/iOS device or emulator is attached with a reachable backend URL.

## Android QA Status

- Status: Pending.
- ADB is available, but `adb devices` reported no attached Android device or running emulator.
- Required follow-up: run login, session restore, QR scan or invalid manual token, My Attendance, Teacher Attendance, and logout against a reachable backend URL.

## iOS QA Status

- Status: Pending.
- iOS simulator/device tooling is not available from this Windows workspace.
- Required follow-up: run the same flow as Android, including camera permission behavior if live QR scanning is tested.

## Bugs Found / Fixed

Current re-run:

- No new bugs were found or fixed.

Historical Phase 4 fixes already present in the codebase:

1. Mobile teacher class-section API returned an empty seeded list.
   - Cause: auth context selected the newest active academic year at tenant scope, which could choose another active institution's year when multiple institutions existed in the same demo tenant.
   - Fix: web and mobile auth context now resolve the active academic year through the active institution for the current branch/fallback institution.
   - Regression test: added coverage that mobile auth resolves academic year by branch institution.

2. Expo Metro could not start because `expo-asset` was missing.
   - Fix: added SDK-compatible `expo-asset` to `apps/mobile`.

3. Expo Metro could not update generated type ignores because `apps/mobile/.gitignore` was read-only and empty.
   - Fix: cleared the read-only flag and added normal Expo/mobile ignore entries.

## Security Output Check

No smoke output or documentation includes:

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
- private URLs or tunnel secrets

The temporary smoke harness printed only sanitized pass/fail rows and was removed.

## Remaining Risks / TODOs

- Real Android Expo Go or development-build QA remains pending.
- Real iOS Expo Go or development-build QA remains pending.
- Native camera QR scan against live generated QR remains pending on physical devices.
- SecureStore restore and logout need real-device confirmation.
- Expo audit advisories remain deferred; do not force-upgrade Expo in this phase.
- `npm audit --omit=dev` still reports 19 Expo dependency-chain advisories and the automated force-fix path would install a breaking Expo upgrade.
- A dedicated Expo/Node dependency maintenance phase should decide whether to upgrade beyond the current Node 20.8.0-compatible Expo line.
- Offline drafts, native admin, push notifications, FeeDesk, GradeBook, SchoolCast, parent app, student app, biometric/GPS, payroll/leave/appraisal, and exports/charts remain out of scope.

## Recommended Next Native Phase

Native Mobile Phase 5: Android/iOS Expo Go device QA with a reachable backend URL, including live QR CHECK_IN/CHECK_OUT scan, SecureStore session restore, My Attendance, Teacher Attendance submit, and logout.
