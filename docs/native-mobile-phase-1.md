# Native Mobile Phase 1

## Status

- Date: 2026-05-25
- Status: foundation added; backend mobile APIs pending
- App path: `apps/mobile`
- Native app scope: focused v0.1 shell for staff QR attendance and teacher attendance
- Expo SDK: 52, selected to remain compatible with this repo's Node 20.8.0 environment

No passwords, tokens, raw QR payloads, private URLs, signing credentials, or production secrets are documented here.

## What Was Built

- Expo Router app shell.
- Login screen with tenant, email, and password fields.
- SecureStore-backed session wrapper.
- Auth context that restores session and clears invalid sessions.
- Role-aware mobile home.
- Staff QR scanner screen using Expo Camera.
- Manual token fallback for QR scanning.
- Teacher attendance shell.
- My Attendance status shell.
- Typed mobile API client and contracts.
- EAS build config placeholders.
- Utility tests for QR parsing, role actions, API base URL validation, and SecureStore usage.
- Local Metro config extending `expo/metro-config`.

## How To Run

From the mobile app folder:

```bash
cd apps/mobile
npm install
npm run start
```

Use Expo Go first. Development builds are only needed if a future dependency requires custom native code.

`npm run doctor` should report passing Expo checks. The current machine may still print a Node advisory from Expo tooling because Node 20.8.0 is older than the latest recommended Node LTS patch level.

## Environment Variables

Create a local mobile environment file from:

```bash
cp .env.example .env
```

Required:

```txt
EXPO_PUBLIC_API_BASE_URL=<http-or-https JinaCampus web API URL>
```

Do not place secrets in `EXPO_PUBLIC_` variables. These values are bundled into the client app.

## Backend API Status

Phase 2 implemented the required mobile backend APIs:

- `POST /api/mobile/auth/login`
- `POST /api/mobile/auth/logout`
- `GET /api/mobile/me`
- `POST /api/mobile/staff-attendance/scan`
- `GET /api/mobile/staff-attendance/my-status`
- `GET /api/mobile/teacher/class-sections`
- `GET /api/mobile/teacher/class-sections/[classSectionId]/students`
- `POST /api/mobile/student-attendance/submit`

Phase 3 wires the Expo app to these APIs. The native app does not fake data. If endpoints are unavailable, the UI shows safe pending-backend or network messages.

## Known Blockers

- DB-backed mobile API smoke with seeded demo users is still recommended.
- Live QR CHECK_IN/CHECK_OUT device QA over HTTPS is still required.
- Real Android/iOS device QA is still required.
- Offline support is intentionally deferred.

## Next Phase

Native Mobile Phase 3 wires the Expo app against the tenant-safe backend API surface:

1. Auth login/logout/session restore.
2. SecureStore token persistence and 401 cleanup.
3. Staff QR scan submission and My Attendance refresh.
4. Teacher class-section, student-list, and attendance submit.
5. Android/iOS QA and seeded API smoke.
