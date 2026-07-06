# Academia and StaffBoard Profile Flow Fixes

## Status

- Repair date: 2026-05-19
- Status: Complete for the confirmed profile-flow issue addressed in this pass
- Environment: Local Windows development environment
- Tenant used for reference QA: `jinacampus-demo`
- Browser framework added: none

No passwords, session tokens, raw QR payloads, reset values, or secrets are documented here.

## Roles Tested / Referenced

- Admin
- Teacher
- Staff

The latest browser QA reference remains `docs/academia-staffboard-profile-browser-qa.md`.

## Confirmed Issues Reviewed

The latest browser QA notes already recorded these confirmed issues as fixed in the current branch:

1. Academia and StaffBoard edit routes needed explicit permission-state gating before loading edit forms.
2. Staff profile duplicate employee-code update conflicts needed field-level safe action errors.
3. Section edit needed to accept seeded single-letter section codes.

Source and tests were rechecked for those fixes. They remain present.

## Academia Fixes Applied

No new Academia code fix was required in this pass.

Verified current behavior from source/tests:

- Class, section, subject, student, guardian, and enrollment edit routes exist.
- Edit routes require auth and render safe permission states before edit forms for unauthorized users.
- Student duplicate admission number maps to a safe field-level action error.
- Section schemas accept one-character section codes.
- Class-wise student listing uses current enrollment data and includes the helpful selected-class-section empty state.

## StaffBoard Fixes Applied

One adjacent confirmed-flow gap was fixed:

- Staff profile create now uses an action-state form instead of a raw server action form.
- Duplicate employee-code conflicts on staff creation now return a safe action state.
- The duplicate employee-code field error is attached to `employeeCode`.
- The user-facing duplicate message is:
  "A staff member with this employee code already exists. Please use a different employee code."
- Unknown staff creation/update failures still map to generic safe form messages.
- Staff profile creation still resolves tenant context server-side and does not accept tenant or actor identity from client input.

## Class-Wise Student Result

No code change was required.

Current branch status:

- The Students page has a class-section filter.
- Current class-section and roll number render in the student table.
- Class-wise listing is backed by active enrollment data.
- The selected empty class-section message exists: "No students are enrolled in this class-section yet."
- The existing demo seed has students in all seeded class sections, so browser QA still has not exercised that empty selected-class-section state with live demo data.

## Visual / UX Observations

- Staff create now follows the same safe form feedback pattern as the student create form.
- Staff create field-level validation can render near the employee-code field.
- No new browser/e2e framework was added.

## Remaining Risks / TODOs

- This pass was a targeted code/test repair, not a full repeat of local Chrome browser click-through QA.
- Real-device Android Chrome and iOS Safari QA remain recommended.
- The selected empty class-section browser state remains unexercised because the current demo seed has students in every seeded class section.
- Guardian phone/email validation was not re-mutated in browser QA.
- Enrollment duplicate active-enrollment conflict was not browser-mutated to avoid broad enrollment data disruption.
- FeeDesk, GradeBook, SchoolCast, exports/charts, camera scanner, native app, and offline/PWA work remain deferred.

## Recommended Next Repair Task

Continue base stabilization only if another confirmed runtime or browser issue appears. If none is confirmed, return to Base MVP Foundation v0.1 freeze/runbook acceptance before starting the next approved product module.
