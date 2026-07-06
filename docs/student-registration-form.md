# Student Registration Form

Status: implemented for Base MVP Web v1.0 candidate.

DB-backed smoke status: passed on 2026-06-12 after applying and seeding the student registration migration. See `docs/student-registration-db-smoke.md`.

## Scope

The Academia student registration flow now follows an Indian school admission-sheet structure. It is not a new module; it upgrades the existing student create/edit/profile workflow.

Routes:

- `/academia/students`
- `/academia/students/create`
- `/academia/students/[studentId]`
- `/academia/students/[studentId]/edit`

## Form Sections

The registration form is grouped into:

- Admission Details
- Student Personal Details
- Parent / Guardian Details
- Identity Documents
- Social / Demographic
- Address Details
- Bank Details
- System Details

## Required Fields

Create requires:

- Scholar / admission number
- Admission date
- Full name
- Date of birth
- Father name
- Mother name
- Aadhaar number input
- Religion
- Caste
- Category
- Nationality
- City
- State / UT

Optional fields include father occupation, guardian name, family ID, SSSM ID, APAAR ID, current/permanent address, pincode, blood group, bank account number, bank branch, IFSC, joined date, and left date.

## Sensitive Data Decision

Full Aadhaar and bank account numbers are not stored in the database for this MVP.

Behavior:

- Aadhaar input must be 12 digits on create.
- Bank account input is optional.
- The server derives masked values and last-four digits.
- The raw submitted values are discarded before Prisma create/update.
- Student list and profile pages show masked values only.
- Audit logs use the persisted masked fields only and must not contain raw Aadhaar or bank account values.

Deferred:

- Approved encrypted sensitive-field storage.
- Permissioned full-value reveal with audit.
- Document upload/storage abstraction.

## RBAC And Tenant Safety

- Student create requires `academia.student.create`.
- Student update requires `academia.student.update`.
- Student view/profile requires `academia.student.view`.
- Branch selection is limited to accessible branches.
- Server actions do not accept client `tenantId`, `actorUserId`, password hashes, token hashes, or internal role/permission claims.

## List And Profile Behavior

Student list shows:

- Scholar / admission number
- Student name
- Current class-section
- Father / guardian summary
- Category
- Status
- View/Edit actions

When no class-section filter is selected, the list includes active student profiles that are not enrolled yet and labels them as `Not enrolled`. When a class-section filter is selected, the result remains strictly scoped to active enrollments in that class-section.

Student profile shows admission, personal, parent/guardian, identity, demographic, address, bank, and enrollment sections. Aadhaar and bank account values are masked.

## QA Checklist

- Register a student with all required fields.
- Confirm invalid Aadhaar is rejected.
- Confirm invalid pincode is rejected.
- Confirm IFSC is uppercased and validated.
- Confirm list shows no full Aadhaar or full bank account number.
- Confirm profile shows masked sensitive values only.
- Confirm edit can update non-sensitive fields.
- Confirm edit can replace Aadhaar/bank account values and still stores masked references only.
- Confirm duplicate admission number fails safely.
- Confirm unauthorized roles cannot create or edit students.
- Confirm branch-scoped access remains enforced.

## DB-Backed Smoke Result

The 2026-06-12 DB-backed smoke verified:

- Docker/PostgreSQL was running and reachable.
- Prisma reported all 8 migrations applied, including `20260612120000_student_registration_admission_sheet`.
- Demo seed completed for `jinacampus-demo`.
- Login, create, validation, duplicate admission handling, list search, profile, edit, and class-section filter flows passed in local headless Chrome DevTools automation.
- Browser output did not show raw Aadhaar values, raw bank account values, password hashes, token hashes, Prisma/SQL errors, stack traces, or private URLs.

Bug fixed during smoke: newly registered students without current enrollments were not visible from `/academia/students`. The list now shows non-enrolled active student profiles as `Not enrolled` when no class-section filter is selected.

## Remaining Limitations

- City remains a text field until a city master/searchable location dataset is added.
- Full sensitive-field encryption and permissioned reveal are deferred.
- Guardian contact details remain in the existing Guardian module; parent names on student registration are admission-sheet summary fields.
