# Academia and StaffBoard Profile Browser QA

## Status

- Date: 2026-05-18
- Status: Complete for local Chrome browser click-through QA
- Environment: Local Windows development environment, Docker PostgreSQL, Next.js dev server
- Browser path used: local Chrome through DevTools protocol
- Tenant used: `jinacampus-demo`
- Screenshots committed: none

No passwords, session tokens, raw QR values, or reset values are documented here.

## Roles Tested

- Admin
- Teacher
- Staff

## Preconditions Verified

- Local PostgreSQL compose service was running and healthy.
- Prisma schema validation passed.
- Prisma migrations were up to date.
- Prisma client generation passed.
- Existing seed command completed.
- Demo tenant `jinacampus-demo` existed.
- Demo academic records existed: classes, sections, class sections, subjects, students, guardians, and active enrollments.
- Demo StaffBoard records existed: staff profiles, linked teacher/staff profiles, staff attendance records, and reports data.

## Academia Flows Tested

### Overview

- Route: `/academia`
- Page loaded cleanly.
- Completed area links were visible and pointed to real routes.
- No sensitive output appeared in visible browser output.
- Desktop and 390px mobile checks had no page-level horizontal overflow.

### Classes

- Routes: `/academia/classes`, `/academia/classes/[classId]/edit`
- Seeded classes appeared in the list.
- Edit route loaded and prefilled existing values.
- A harmless class-name update saved successfully.
- The original demo value was restored through the same browser edit flow.
- Save/cancel actions were visible and usable.
- No internal fields were editable.

### Sections

- Routes: `/academia/sections`, `/academia/sections/[sectionId]/edit`
- Seeded sections appeared in the list.
- Edit route loaded and prefilled existing values.
- Browser QA found the seeded single-letter section code `A` could not be saved because the schema required at least two characters.
- Fix applied: section schemas now accept single-letter section codes, matching the seed and UI examples.
- A harmless section-name update then saved successfully.
- The original demo value was restored through the same browser edit flow.

### Subjects

- Routes: `/academia/subjects`, `/academia/subjects/[subjectId]/edit`
- Seeded subjects appeared in the list.
- Edit route loaded and prefilled existing values.
- A harmless subject-name update saved successfully.
- The original demo value was restored through the same browser edit flow.
- No internal fields were editable.

### Students

- Routes: `/academia/students`, `/academia/students/[studentId]/edit`
- Student list loaded with seeded students.
- Search returned the expected seeded matching student.
- Current Class Section and Roll Number columns rendered.
- Edit route loaded and prefilled existing values.
- Duplicate admission number returned the safe message:
  "A student with this admission number already exists. Please use a different admission number."
- No runtime AppError appeared for duplicate admission number.
- A harmless student-name update saved successfully.
- The original demo value was restored through the same browser edit flow.

### Guardians

- Routes: `/academia/guardians`, `/academia/guardians/[guardianId]/edit`
- Guardian list loaded with seeded guardians.
- Edit route loaded and prefilled existing values.
- A harmless guardian-name update saved successfully.
- The original demo value was restored through the same browser edit flow.
- No internal fields were editable.

### Enrollments

- Routes: `/academia/enrollments`, `/academia/enrollments/[enrollmentId]/edit`
- Enrollment list loaded with seeded enrollments.
- Student, class-section, and roll-number data displayed correctly.
- Edit route loaded and prefilled existing values.
- A harmless roll-number update saved successfully.
- The original demo value was restored through the same browser edit flow.
- Tenant, branch, and academic-year fields were not exposed as unsafe editable fields.

## Class-Wise Student QA

- Route: `/academia/students`
- Class-section filtering displayed active enrolled students for Class 1-A.
- Current class-section values rendered in the table.
- Search continued to work after class-wise listing checks.
- No branch or academic-year mismatch crash occurred during the checked flow.
- The current demo seed has students in all seeded class sections, so the "No students are enrolled in this class-section yet" state was not exercised by browser QA.

## StaffBoard Flows Tested

### Overview

- Route: `/staffboard`
- Page loaded cleanly.
- Completed area links were visible and pointed to real routes.
- No stale coming-soon text appeared for completed checked flows.
- Desktop and 390px mobile checks had no page-level horizontal overflow.

### Staff Profiles

- Routes: `/staffboard/staff`, `/staffboard/staff/[staffId]/edit`
- Seeded staff profiles appeared in the list.
- Search returned the expected seeded matching employee.
- Edit route loaded and prefilled existing values.
- Duplicate employee code returned the safe message:
  "A staff profile with this employee code already exists. Please use a different employee code."
- A harmless staff-name update saved successfully.
- The original demo value was restored through the same browser edit flow.
- No tenant, user, password, or internal fields were editable.

### Staff Categories

- Route: `/staffboard/categories`
- Category page loaded.
- Labels were school-friendly.
- No broken links or sensitive output appeared in the checked browser output.

### Staff Attendance Admin

- Route: `/staffboard/attendance`
- Profile-related surface loaded.
- Seeded staff names and employee codes displayed correctly.
- Correction entry points remained visible where expected.
- No `tokenHash` or raw token output appeared.

### Staff Reports

- Route: `/staffboard/attendance/reports`
- Staff report page loaded.
- Staff names/codes and teacher/non-teaching report surfaces displayed safely.
- No exports/charts were expected or added.
- No `tokenHash` or raw token output appeared.

## Permission Checks

- Teacher account could not access student edit.
- Teacher account could not access staff profile edit.
- Staff account could not access staff profile edit.
- Denied pages rendered the safe permission state text instead of a runtime/internal error.

## Visual / UX Observations

- Lists and edit forms rendered cleanly in local Chrome.
- Labels and required fields were clear.
- Save and cancel/back actions were visible and tappable.
- Success and error messages were understandable.
- Tables used safe responsive wrappers.
- At 390px mobile width, checked pages had no page-level horizontal overflow.
- Final browser run had no relevant captured Chrome console warnings or runtime exceptions.

## Bugs Found and Fixed

1. Academia and StaffBoard edit routes could rely on view-level queries before explicitly gating edit access.
   - Fix: edit routes now check effective update/manage permissions and render `PermissionState` for unauthorized users.
   - Regression tests added.

2. Staff profile duplicate employee-code conflicts mapped to generic action errors.
   - Fix: staff profile update action now maps `STAFF_EMPLOYEE_CODE_EXISTS` to a safe field-level employee-code message.
   - Regression tests added.

3. Section edit rejected seeded single-letter section codes.
   - Fix: section schema now accepts one-character section codes, matching the product UI and seed data.
   - Regression test added.

## Sensitive Output Check

Visible browser output did not expose:

- `tenantId`
- `actorUserId`
- `passwordHash`
- raw password
- reset token
- `tokenHash`
- raw QR token
- Prisma/SQL errors
- stack traces
- local file paths
- secrets

## Remaining Risks / TODOs

- This was local Chrome browser automation, not real-device Android Chrome or iOS Safari QA.
- No browser test framework was added.
- The demo seed currently has students in every seeded class section, so the empty selected class-section browser state remains unexercised.
- Guardian phone/email validation was not mutated beyond the safe edit/save path.
- Enrollment duplicate active-enrollment conflict was not mutated in browser QA to avoid broad enrollment data disruption.
- FeeDesk, GradeBook, SchoolCast, exports/charts, camera scanner, native app, and offline/PWA work remain deferred.

## Recommended Next Repair Task

Continue base stabilization with the next confirmed runtime or browser usability issue. If none is already known, run focused browser QA for attendance mark/report and StaffBoard QR/attendance correction flows.
