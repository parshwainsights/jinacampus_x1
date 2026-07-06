# Demo QA Reset

Date added: 2026-05-16

## Purpose

The demo QA reset makes staff QR check-in/check-out QA repeatable for the local JinaCampus base MVP without deleting unrelated local data.

Use it when a demo teacher or staff user has already checked in or checked out today and you need a clean state for another QR scan test.

## Safety Boundary

The reset is demo/local only.

It targets exactly this tenant:

```txt
jinacampus-demo
```

It is disabled when `NODE_ENV=production`.

It does not create a production reset UI and must not be exposed to school users.

## Command

Run:

```bash
npm run demo:qa:reset
```

Recommended full demo QA prep:

```bash
npm run db:seed
npm run demo:qa:reset
```

## What Gets Reset

The command deletes today's `StaffAttendanceRecord` rows only for these known demo QR QA staff profiles inside `jinacampus-demo` / Main Branch:

- `JD-TCH-001` - demo teacher profile linked to the teacher login
- `JD-STF-001` - demo staff profile linked to the staff login

The delete is scoped by:

- demo tenant ID resolved from `jinacampus-demo`
- Main Branch ID
- known demo staff profile IDs
- today's attendance date in `Asia/Kolkata`

## What Is Not Reset

The command does not delete or modify:

- tenants other than `jinacampus-demo`
- users
- roles
- permissions
- branches
- academic years
- students
- guardians
- enrollments
- staff profiles
- student attendance
- historical staff attendance
- QR token rows
- audit logs

Older local demo data outside `jinacampus-demo` is left untouched.

## Expected Output

The command prints a safe JSON summary like:

```json
{
  "tenantSlug": "jinacampus-demo",
  "branchCode": "MAIN",
  "attendanceDate": "2026-05-16",
  "staffEmployeeCodes": ["JD-TCH-001", "JD-STF-001"],
  "matchedStaffProfiles": 2,
  "deletedStaffAttendanceRecords": 2
}
```

No passwords, session cookies, raw QR payloads, token hashes, or raw tokens are printed.

## Manual QR Browser QA Steps

Use the normal app UI after running the reset.

1. Start the dev server with `npm run dev`.
2. Sign in as an admin or principal demo user.
3. Open `/staffboard/attendance/qr`.
4. Generate a `CHECK_IN` QR.
5. Copy the displayed QR payload for manual QA use. Do not save it in docs or commit it.
6. Sign out, or use another browser/profile, then sign in as the demo teacher or staff user.
7. Open `/staffboard/attendance/scan`.
8. Paste the payload into the manual token input and submit.
9. Confirm check-in succeeds and no token hash or internal error appears.
10. Sign in as admin/principal again and generate a `CHECK_OUT` QR.
11. Sign in as the same teacher/staff user and submit the check-out payload.
12. Confirm check-out succeeds.
13. Try submitting the same check-in/check-out state again and confirm the duplicate error is safe and human-readable.

## Service Smoke Alternative

If browser copy/paste is not practical, use the service-layer smoke approach from the base smoke/debugging passes:

- Run the reset.
- Generate live CHECK_IN and CHECK_OUT QR payloads through the existing QR service.
- Scan them with the seeded teacher or staff tenant context.
- Verify duplicate scans still fail safely.

Do not store raw QR payloads in source control, docs, or logs.

## Remaining Limitations

- This reset is for local/demo QA only.
- It does not implement camera scanning.
- It does not replace real-device Android Chrome or iOS Safari QA.
- It does not clear non-demo tenants or older local demo data outside `jinacampus-demo`.
- It does not reset all attendance reports; report demo data remains seeded for dashboard and report QA.
