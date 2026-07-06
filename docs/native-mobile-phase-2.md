# Native Mobile Phase 2

## Status

- Date: 2026-05-26
- Status: backend mobile APIs implemented for v0.1 integration
- Tenant used for future QA: `jinacampus-demo`
- Scope: tenant-safe JSON APIs for auth, StaffBoard QR attendance, staff attendance status, and teacher student attendance

No passwords, raw bearer tokens, raw QR payloads, token hashes, tunnel URLs, signing credentials, or production secrets are documented here.

## APIs Added

Auth:

- `POST /api/mobile/auth/login`
- `POST /api/mobile/auth/logout`
- `GET /api/mobile/me`

StaffBoard Lite:

- `POST /api/mobile/staff-attendance/scan`
- `GET /api/mobile/staff-attendance/my-status`

Teacher attendance:

- `GET /api/mobile/teacher/class-sections`
- `GET /api/mobile/teacher/class-sections/[classSectionId]/students`
- `POST /api/mobile/student-attendance/submit`

## Auth Token Model

Phase 2 reuses the existing `Session` table instead of adding a separate `MobileSession` model. The existing session model already supports the required mobile token properties:

- tenant-scoped user session
- `tokenHash`
- `expiresAt`
- `revokedAt`
- `lastUsedAt`
- user agent and IP metadata

Login generates a high-entropy session token, stores only its hash, and returns the raw bearer token once to the mobile app. Protected mobile APIs require:

```txt
Authorization: Bearer <token>
```

Logout revokes the current token by setting `revokedAt`.

## Security Notes

- Mobile clients never send `tenantId`, `branchId`, `staffId`, or `actorUserId`.
- Server-side mobile auth resolves tenant, user, branch access, role labels, institution branding, and active academic year from the bearer token.
- Staff QR scan reuses the existing StaffBoard QR scan service.
- Teacher attendance submit reuses the existing Academia attendance service.
- Protected APIs return safe JSON errors only.
- API payloads do not expose `passwordHash`, `tokenHash`, raw QR token values, Prisma errors, SQL errors, stack traces, or internal file paths.
- Raw bearer tokens are not audited or stored in the database.
- Raw passwords are never logged or returned.

## Request And Response Shape

Login request:

```json
{
  "schoolId": "school-id",
  "email": "user@example.test",
  "password": "..."
}
```

`schoolId` is the public mobile contract. The backend maps it to the existing tenant slug internally. The legacy `tenantSlug` request key remains accepted server-side only for compatibility.

Login success:

```json
{
  "success": true,
  "token": "...",
  "user": {
    "name": "Demo Teacher",
    "email": "teacher@example.test",
    "roles": [{ "code": "CLASS_TEACHER", "label": "Class Teacher" }],
    "capabilities": {
      "canScanStaffQr": true,
      "canViewMyAttendance": true,
      "canMarkStudentAttendance": true
    }
  },
  "institution": {
    "displayName": "JinaCampus Demo",
    "name": "Jina Campus School",
    "logoUrl": "https://example.test/logo.png"
  },
  "branch": {
    "name": "Main Branch",
    "code": "MAIN"
  },
  "academicYear": {
    "name": "2026-27"
  }
}
```

Safe error:

```json
{
  "success": false,
  "error": "Invalid School ID, email, or password."
}
```

Staff QR scan request:

```json
{
  "token": "<decoded QR token>"
}
```

Staff QR scan success:

```json
{
  "success": true,
  "purpose": "CHECK_IN",
  "attendanceDate": "2026-05-26",
  "status": "PRESENT",
  "checkInAt": "2026-05-26T09:00:00.000Z",
  "checkOutAt": null,
  "workingMinutes": null,
  "message": "Check-in successful"
}
```

Student attendance submit request:

```json
{
  "classSectionId": "class-section-id",
  "attendanceDate": "2026-05-26",
  "entries": [
    {
      "studentId": "student-id",
      "status": "PRESENT",
      "remarks": ""
    }
  ]
}
```

## Mobile App Integration Status

The Expo app API contracts and client now match the backend response shape:

- login receives a bearer token and safe mobile user context
- logout expects a JSON success response
- `/me` restores current mobile context
- staff QR scan submits only the decoded token
- my attendance status reads the authenticated staff user's own status
- teacher attendance client helpers are ready for class-section, student-list, and submit calls

SecureStore remains the mobile-side token storage mechanism.

## Remaining Blockers

- Real Android and iOS device QA is still required.
- Expo dependency-chain audit advisories remain in the mobile app dependency tree; the force-fix path would require a newer Expo line and a newer Node patch level than the current Node 20.8.0 environment.
- Native offline attendance drafts remain deferred.
- Native Administrator Portal, native admin, FeeDesk, GradeBook, SchoolCast, parent app, and student app remain out of scope.

## Test And QA Plan

Code-level tests cover:

- safe invalid login response
- raw token returned once and hashed token stored
- bearer token required for `/me` and protected APIs
- revoked and expired tokens rejected
- logout revokes the session
- QR scan ignores client tenant/branch/staff IDs and calls the existing StaffBoard service
- my-status returns only the authenticated staff user's attendance
- teacher class-section/student APIs use existing scoped queries
- attendance submit rejects client tenant/actor IDs and calls the existing Academia service
- safe forbidden and QR errors

Runtime smoke still recommended after local DB seed:

1. `POST /api/mobile/auth/login`
2. `GET /api/mobile/me`
3. `POST /api/mobile/auth/logout`
4. `POST /api/mobile/staff-attendance/scan` with an invalid QR token
5. `GET /api/mobile/staff-attendance/my-status`
6. Expo app login and session restore
7. Expo QR scanner submit against the live backend
