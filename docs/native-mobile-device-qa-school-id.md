# Native Mobile Device QA: School ID Login

## External Preconditions Rerun - 2026-06-06

- Status: Blocked by backend/device setup
- Runtime used: Not run; Expo Go/development build device QA did not start because hard preconditions were not met.
- Rerun trigger: request to re-run Native Mobile Device QA once external preconditions are available.
- Tenant target: `jinacampus-demo`
- Backend setup type: not verified in this rerun; Docker/PostgreSQL was not reachable and no approved HTTPS mobile API base URL was configured in this workspace.

This rerun stopped at the hard-precondition gate. The attached QA instructions require Docker/PostgreSQL or a staging DB, a seeded backend, an approved HTTPS backend URL configured through `EXPO_PUBLIC_API_BASE_URL`, a physical Android device, iOS device or supported iOS bridge, and desktop web QR generation before interactive native device QA can begin.

### Hard Preconditions Checked

| Requirement | Result | Notes |
|---|---|---|
| Docker/PostgreSQL | Blocked | `docker ps` could not connect to the Docker daemon from this session. |
| Migrations | Blocked | Migration status check was attempted and could not complete because Docker/PostgreSQL was unavailable. |
| Seed | Blocked | Seed was not run because Docker/PostgreSQL was unavailable. |
| Demo tenant/users/data | Blocked | Not reverified in this rerun because the DB was unavailable. Previous reruns verified `jinacampus-demo` when Docker was running. |
| Backend running | Blocked | No listener was found on port 3000 before QA. Backend device smoke was not started because the DB and device prerequisites were missing. |
| Approved HTTPS backend URL | Blocked | `EXPO_PUBLIC_API_BASE_URL` was not present in root or mobile env files. |
| Physical Android device | Blocked | ADB was available but listed no attached devices. |
| Physical iOS device or supported simulator | Blocked | `xcrun`, `simctl`, `xcodebuild`, and `idevice_id` were not available on this Windows host. |
| Desktop web QR route | Blocked | Not reverified because DB/backend preconditions were unavailable. |
| Expo app launch on devices | Blocked | Device and approved HTTPS backend URL preconditions were not met. |

### Device Flow Results

| Flow | Result | Notes |
|---|---|---|
| Android app launch | Blocked | No physical Android device was attached. |
| iOS app launch | Blocked | No iOS device/simulator bridge was available from this Windows host. |
| School ID login UI | Blocked | Requires Expo runtime on a device with a reachable approved HTTPS backend. |
| SecureStore restore | Blocked | Requires successful device login. |
| Role-aware home | Blocked | Requires successful device login. |
| Manual QR fallback | Blocked | Requires successful device login. |
| QR CHECK_IN scan | Blocked | Requires physical camera device, web-generated QR, seeded backend, and approved HTTPS backend URL. |
| QR CHECK_OUT scan | Blocked | Requires physical camera device, web-generated QR, seeded backend, and approved HTTPS backend URL. |
| My Attendance UI | Blocked | Requires successful device login. |
| Teacher Attendance submit | Blocked | Requires successful teacher device login and seeded backend. |
| Logout UI | Blocked | Requires successful device login. |

### Security-Output Check

No passwords, bearer tokens, token hashes, password hashes, raw QR payloads, private HTTPS URLs, tunnel secrets, provider secrets, credentials, Prisma errors, SQL errors, stack traces, tenant IDs, or actor IDs are documented in this rerun.

### Readiness

Final readiness status remains:

- Blocked by backend/device setup

The next rerun must provide Docker/PostgreSQL or a staging DB, an approved HTTPS backend URL configured through `EXPO_PUBLIC_API_BASE_URL`, a physical Android device, and a physical iOS device or supported iOS bridge. If those are available outside this workspace, expose them to this session before re-running the native device QA.

## Latest Approved HTTPS / Physical Device Rerun - 2026-06-05

- Status: Blocked by backend/device setup
- Runtime used: Not run; Expo Go/development build device QA did not start because hard device preconditions were not met.
- Rerun trigger: approved HTTPS backend URL, physical Android/iOS access, and desktop web QR generation request.
- Tenant target: `jinacampus-demo`
- Backend setup type: local HTTP backend verified for DB/API/web QR smoke only; approved HTTPS mobile API base URL was not configured in this workspace.

This latest rerun followed the approved-HTTPS physical-device QA instructions. Docker/PostgreSQL, migrations, seed, local mobile API smoke, and authenticated desktop web QR route access were verified. Physical Android/iOS Expo flows, SecureStore restore, interactive mobile UI, and live QR camera CHECK_IN/CHECK_OUT scanning did not run because the approved HTTPS backend URL and physical device access were unavailable to this workspace.

### Hard Preconditions Checked

| Requirement | Result | Notes |
|---|---|---|
| Docker/PostgreSQL | Pass | Project PostgreSQL container was running and healthy. |
| Migrations | Pass | Prisma migration status reported the database schema is up to date. |
| Seed | Pass | Demo seed completed successfully. |
| Demo tenant/users/data | Pass | `jinacampus-demo` data was available for teacher, staff, and desktop web QR route smoke. |
| Backend running | Pass | Local Next.js backend served `/login` successfully. |
| Local mobile API smoke | Pass | School ID login, `/me`, my-status, teacher class sections/students, invalid QR, and logout passed against local backend. |
| Desktop web QR route | Pass | Authenticated local access to `/staffboard/attendance/qr` returned the QR page. |
| Approved HTTPS backend URL | Blocked | No `EXPO_PUBLIC_API_BASE_URL` value was configured in root or mobile env files. |
| Physical Android device | Blocked | ADB showed only an Android emulator target, not a physical Android device. |
| Physical iOS device or supported simulator | Blocked | `xcrun`, `simctl`, `xcodebuild`, and `idevice_id` were not available on this Windows host. |
| Expo app launch on devices | Blocked | Physical Android/iOS device and approved HTTPS backend URL preconditions were not met. |

### Local API / Web Smoke Results

| Area | Result | Notes |
|---|---|---|
| Teacher School ID login | Pass | Mobile auth response succeeded. Bearer token was not printed or documented. |
| Staff School ID login | Pass | Mobile auth response succeeded. Bearer token was not printed or documented. |
| Invalid login | Pass | Invalid School ID/password returned a safe unauthenticated response. |
| `/api/mobile/me` | Pass | Returned safe teacher context. |
| Staff My Attendance | Pass | Returned safe authenticated staff status payload. |
| Teacher class sections | Pass | Returned one seeded class section. |
| Teacher students | Pass | Returned six active enrolled students for the seeded teacher class section. |
| Invalid QR scan | Pass | Returned a safe client error. |
| Mobile logout | Pass | Returned successful logout response. |
| Desktop web QR route | Pass | Authenticated local route `/staffboard/attendance/qr` loaded. |

### Device Flow Results

| Flow | Result | Notes |
|---|---|---|
| Android app launch | Blocked | No physical Android device was attached. |
| iOS app launch | Blocked | No iOS device/simulator bridge was available from this Windows host. |
| School ID login UI | Blocked | Requires Expo runtime on device with a reachable approved HTTPS backend. |
| SecureStore restore | Blocked | Requires successful device login. |
| Role-aware home | Blocked | Requires successful device login. |
| Manual QR fallback | Blocked | Requires successful device login. |
| QR CHECK_IN scan | Blocked | Requires physical camera device, web-generated QR, and approved HTTPS backend URL. |
| QR CHECK_OUT scan | Blocked | Requires physical camera device, web-generated QR, and approved HTTPS backend URL. |
| My Attendance UI | Blocked | Requires successful device login. |
| Teacher Attendance submit | Blocked | Requires successful teacher device login. |
| Logout UI | Blocked | Requires successful device login. |

### Expo Go / Development Build Status

- Expo Go was not launched because physical-device and approved HTTPS backend preconditions were missing.
- Development build was not attempted.
- No Expo Go-specific issue was confirmed in this rerun.
- Development build requirement remains undecided until device QA can run.
- Expo audit advisories and the Node environment advisory remain deferred to a dedicated dependency maintenance phase.

### Security-Output Check

No passwords, bearer tokens, token hashes, password hashes, raw QR payloads, private HTTPS URLs, tunnel secrets, provider secrets, credentials, Prisma errors, SQL errors, stack traces, tenant IDs, or actor IDs are documented in this rerun.

### Readiness

Final readiness status remains:

- Blocked by backend/device setup

The next rerun must provide a physical Android device, a physical iOS device or supported iOS bridge, and an approved HTTPS backend URL configured through `EXPO_PUBLIC_API_BASE_URL`. Local DB/API/web QR readiness is verified as of this rerun.

## Device QA Attempt - 2026-06-05

- Status: Blocked by backend/device setup
- Runtime used: Not run; Expo Go/development build device QA did not start because hard device preconditions were not met.
- Tenant target: `jinacampus-demo`
- Backend setup type: local HTTP backend verified for DB/API/web QR smoke only; approved HTTPS mobile API base URL was not configured in this workspace.

This attempt followed the Native Mobile Device QA preconditions for the release-candidate Expo app. Local Docker/PostgreSQL, migrations, seed, mobile API smoke, and authenticated desktop web QR route access were verified again. Physical Android/iOS Expo flows and live QR camera scanning did not run because the approved HTTPS backend URL and physical devices were unavailable to this workspace.

### Device QA Preconditions Checked

| Requirement | Result | Notes |
|---|---|---|
| Docker/PostgreSQL | Pass | Project PostgreSQL container was running and healthy. |
| Migrations | Pass | Prisma migration status reported the database schema is up to date. |
| Seed | Pass | Demo seed completed successfully. |
| Demo tenant/users/data | Pass | `jinacampus-demo` data was available for teacher, staff, and web QR route smoke. |
| Backend running | Pass | Local Next.js backend served `/login` successfully. |
| Local mobile API smoke | Pass | School ID login, `/me`, my-status, teacher class sections/students, invalid QR, and logout passed against local backend. |
| Desktop web QR route | Pass | Authenticated local web access to `/staffboard/attendance/qr` returned the QR page. |
| Approved HTTPS backend URL | Blocked | No `EXPO_PUBLIC_API_BASE_URL` value was configured in root or mobile env files. |
| Physical Android device | Blocked | ADB showed only an Android emulator target, not a physical Android device. |
| Physical iOS device or simulator | Blocked | `xcrun`, `simctl`, `xcodebuild`, and `idevice_id` were not available on this Windows host. |
| Expo app launch on devices | Blocked | Physical Android/iOS device preconditions were not met. |

### Local API / Web Smoke Results

| Area | Result | Notes |
|---|---|---|
| Teacher School ID login | Pass | Mobile auth response succeeded. Bearer token was not printed or documented. |
| Staff School ID login | Pass | Mobile auth response succeeded. Bearer token was not printed or documented. |
| Invalid login | Pass | Wrong password returned a safe unauthenticated response. |
| `/api/mobile/me` | Pass | Returned safe teacher context. |
| Staff My Attendance | Pass | Returned safe authenticated staff status payload. |
| Teacher class sections | Pass | Returned one seeded class section. |
| Teacher students | Pass | Returned six active enrolled students for the seeded teacher class section. |
| Invalid QR scan | Pass | Returned a safe client error. |
| Mobile logout | Pass | Returned successful logout response. |
| Desktop web QR route | Pass | Authenticated local route `/staffboard/attendance/qr` loaded. |

### Device Flow Results

| Flow | Result | Notes |
|---|---|---|
| Android app launch | Blocked | Physical Android device was not attached. |
| iOS app launch | Blocked | No iOS device/simulator bridge was available. |
| School ID login UI | Blocked | Requires Expo runtime on reachable device backend. |
| SecureStore restore | Blocked | Requires successful device login. |
| Role-aware home | Blocked | Requires successful device login. |
| Manual QR fallback | Blocked | Requires successful device login. |
| QR CHECK_IN scan | Blocked | Requires physical camera device, web-generated QR, and approved HTTPS backend URL. |
| QR CHECK_OUT scan | Blocked | Requires physical camera device, web-generated QR, and approved HTTPS backend URL. |
| My Attendance UI | Blocked | Requires successful device login. |
| Teacher Attendance submit | Blocked | Requires successful teacher device login. |
| Logout UI | Blocked | Requires successful device login. |

### Expo Go / Development Build Status

- Expo Go was not launched because the required physical-device and HTTPS backend preconditions were missing.
- Development build was not attempted.
- No Expo Go-specific app bug was confirmed in this run.
- Development build requirement remains undecided until physical-device Expo Go QA can run.

### Security-Output Check

No passwords, bearer tokens, token hashes, password hashes, raw QR payloads, private HTTPS URLs, tunnel secrets, provider secrets, or credentials are documented in this run.

### Readiness

Final readiness status remains:

- Blocked by backend/device setup

The next run must provide a physical Android device, a physical iOS device or supported iOS simulator, and an approved HTTPS backend URL configured through `EXPO_PUBLIC_API_BASE_URL`. Local DB/API/web QR readiness is verified as of this attempt.

## Rerun Status - 2026-06-05

- Status: Blocked by backend/device setup
- Runtime used: Not run; Expo Go/development build device QA did not start because hard preconditions were not met.
- Tenant target: `jinacampus-demo`
- Backend setup type: local HTTP backend verified for API/web smoke only; approved HTTPS mobile API base URL was not configured in this workspace.

This rerun checked the hard preconditions required for physical-device QA. Docker/PostgreSQL, migrations, seed, local mobile API smoke, and authenticated desktop QR route smoke were verified. Native interactive flows and live QR camera scanning did not run because physical Android/iOS devices and an approved HTTPS backend URL were not available.

### Preconditions Checked

| Requirement | Result | Notes |
|---|---|---|
| Docker Desktop/PostgreSQL | Pass | Project PostgreSQL container was running and healthy. |
| Migrations | Pass | Prisma migration status reported the database schema is up to date. |
| Seed | Pass | Demo seed completed successfully. |
| Demo tenant/users/data | Pass | `jinacampus-demo` existed with five expected demo users, linked staff profiles, class sections, active students, and active enrollments. |
| Local mobile API smoke | Pass | School ID login, `/me`, my-status, teacher class sections/students, invalid QR, and logout passed against local backend. |
| Desktop web QR route | Pass | Authenticated local web access to `/staffboard/attendance/qr` returned the QR page. |
| Physical Android device | Blocked | ADB showed an Android emulator target only, not a physical Android device. |
| Physical iOS device or iOS simulator access | Blocked | `xcrun`, `simctl`, `xcodebuild`, and `idevice_id` were not available on this Windows host. |
| Approved HTTPS backend URL | Blocked | `EXPO_PUBLIC_API_BASE_URL` was not configured in root or mobile env files. No private URL is documented. |
| Expo app launch on devices | Blocked | Physical Android/iOS device preconditions were not met. |

### Rerun Results

| Flow | Result | Notes |
|---|---|---|
| Android app opens | Blocked | No physical Android device was attached. |
| iOS app opens | Blocked | No iOS device/simulator bridge was available. |
| School ID login | Blocked | Requires device runtime and backend database. |
| SecureStore restore | Blocked | Requires successful device login. |
| Role-aware home | Blocked | Requires successful device login. |
| QR CHECK_IN scan | Blocked | Requires physical camera device, web-generated QR, and approved HTTPS backend URL. |
| QR CHECK_OUT scan | Blocked | Requires physical camera device, web-generated QR, and approved HTTPS backend URL. |
| Manual fallback | Blocked | Requires successful device login. |
| My Attendance | Blocked | Requires successful device login and backend database. |
| Teacher Attendance submit | Blocked | Requires successful teacher device login and backend database. |
| Logout | Blocked | Requires successful device login. |

### Local Backend Smoke Results

| Area | Result | Notes |
|---|---|---|
| Teacher School ID login | Pass | Returned a successful mobile auth response. Bearer token was not printed or documented. |
| Staff School ID login | Pass | Returned a successful mobile auth response. Bearer token was not printed or documented. |
| Invalid School ID | Pass | Returned a safe unauthenticated response. |
| Wrong password | Pass | Returned a safe unauthenticated response. |
| `/api/mobile/me` | Pass | Returned safe teacher context. |
| Staff My Attendance | Pass | Returned safe authenticated staff status payload. |
| Teacher class sections | Pass | Returned one seeded class section. |
| Teacher students | Pass | Returned six active enrolled students for the seeded teacher class section. |
| Invalid QR scan | Pass | Returned a safe client error. |
| Mobile logout | Pass | Returned successful logout response. |
| Web QR route | Pass | Authenticated desktop web route `/staffboard/attendance/qr` loaded locally. |

### Rerun Security-Output Check

No passwords, bearer tokens, token hashes, password hashes, raw QR payloads, private HTTPS URLs, tunnel secrets, provider secrets, or credentials were documented in this rerun.

### Rerun Readiness

Final readiness status remains:

- Blocked by backend/device setup

The next rerun must provide a physical Android device, a physical iOS device or supported iOS bridge, and an approved HTTPS backend URL configured through `EXPO_PUBLIC_API_BASE_URL`. The local database, seed, local API smoke, and local web QR route are ready as of this rerun.

## QA Status

- QA date: 2026-06-03
- Status: Blocked by device setup
- Tenant used: `jinacampus-demo`
- Scope: Native Expo app School ID login, SecureStore restore, role-aware home, Staff QR scan, My Attendance, Teacher Attendance, and logout.

This pass did not include native feature development. It was limited to DB-backed smoke, Android emulator launch/render checks, and device-readiness verification.

## DB And Backend Status

- Docker/PostgreSQL was running.
- Prisma migration status reported the local database schema as up to date.
- Demo seed completed successfully.
- The Next.js backend was already reachable from the development host.
- Demo tenant, branch, active academic year, seeded users, staff profiles, class-section data, students, and active enrollments were available through seeded backend smoke.

## Device-Reachable Backend Setup

- Android emulator setup used the emulator host-loopback URL pattern through `EXPO_PUBLIC_API_BASE_URL`.
- An approved physical-device HTTPS URL was not available in this pass.
- No private URL, tunnel URL, credential, bearer token, or QR payload is documented here.

## Backend API Smoke Results

| Area | Result | Notes |
|---|---|---|
| Staff School ID login | Pass | Seeded staff login returned a mobile bearer token. Token was not logged or documented. |
| Teacher School ID login | Pass | Seeded teacher login returned a mobile bearer token. Token was not logged or documented. |
| Invalid login | Pass | Returned a safe unauthenticated response. |
| `/api/mobile/me` | Pass | Returned safe user, role, capability, institution, branch, and academic-year context. |
| Staff My Attendance | Pass | Returned safe authenticated staff attendance payload or empty state. |
| Invalid QR scan | Pass | Returned a safe validation/error response. |
| Teacher class sections | Pass | Returned seeded teacher-scoped class-section data. |
| Teacher students | Pass | Returned active enrolled students for the seeded class-section. |
| Logout | Pass | Revoked the mobile session token. |

## Android Result

| Flow | Result | Notes |
|---|---|---|
| Expo Go app launch | Pass | Expo app opened on Android emulator. |
| Login screen render | Pass | School ID, email, password, show-password control, and sign-in action rendered. |
| Device-reachable API URL | Pass for emulator | Emulator host-loopback URL was used via environment configuration. |
| School ID login through UI | Blocked | Expo Go emulator touch/input handling was inconsistent and did not reliably deliver input to the React Native form. |
| SecureStore restore | Blocked | Requires successful interactive login on device. |
| Role-aware home | Blocked | Requires successful interactive login on device. |
| QR CHECK_IN/CHECK_OUT scan | Blocked | Requires physical camera device or configured emulator camera QR source. |
| Manual QR fallback | Blocked | Requires successful interactive login on device. |
| My Attendance UI | Blocked | Requires successful interactive login on device. |
| Teacher Attendance submit | Blocked | Requires successful interactive teacher login on device. |
| Logout | Blocked | Requires successful interactive login on device. |

## iOS Result

| Flow | Result | Notes |
|---|---|---|
| iOS simulator/device availability | Blocked | This Windows host does not provide Xcode, `xcrun`, `simctl`, or iOS simulator tooling. |
| Expo Go iOS launch | Blocked | Requires physical iOS device or macOS simulator access. |
| Camera QR scan | Blocked | Requires physical iOS camera device for live QR scan. |

## Findings

- Production-style Expo Go launch rendered the login screen cleanly.
- Expo Go development mode produced a non-fatal keep-awake warning overlay. Production-style launch avoided the overlay for QA.
- Android emulator input was inconsistent: after route relaunch the form could render, but ADB-driven taps did not reliably focus all React Native `TextInput` fields. This prevented a complete interactive School ID login flow.
- No confirmed app-code defect was isolated from this pass because the backend APIs passed and the native UI rendered correctly.

## Security-Output Check

Verified during this pass:

- No password hash was returned by the mobile API smoke.
- No token hash was returned by the mobile API smoke.
- No bearer token is included in this document.
- No raw password is included in this document.
- No raw QR token or QR payload is included in this document.
- No private URL or tunnel secret is included in this document.
- No Prisma/SQL error, stack trace, or internal file path was shown in the mobile UI evidence.

## Readiness Status

Final readiness status:

- Blocked by backend/device setup

The backend mobile API layer is smoke-ready with seeded data, and Android emulator rendering is verified. Native Mobile v0.1 device QA cannot be marked passed until a physical Android device, physical iOS device or macOS simulator, and an approved HTTPS device-reachable backend URL are available.

## Remaining Risks And TODOs

- Run physical Android Expo Go QA with approved HTTPS URL.
- Run physical iOS Expo Go QA with approved HTTPS URL.
- Confirm SecureStore restore after successful native login.
- Confirm live Staff QR CHECK_IN and CHECK_OUT camera scan on physical devices.
- Confirm manual QR fallback on authenticated native session.
- Confirm My Attendance UI after QR attendance state changes.
- Confirm Teacher Attendance load, mark-all, individual status change, submit, and success summary.
- Confirm logout clears SecureStore and does not restore a revoked session.
- Expo audit advisories and Node advisory remain deferred to dependency maintenance.

## Recommended Next Native Phase

Re-run this exact QA with:

- Physical Android device with Expo Go.
- Physical iOS device with Expo Go, or macOS simulator for non-camera flows.
- Approved HTTPS backend URL configured through `EXPO_PUBLIC_API_BASE_URL`.
- Desktop/admin web session available to generate live Staff QR CHECK_IN and CHECK_OUT codes.
