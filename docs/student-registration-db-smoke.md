# Student Registration DB Smoke

## QA Date / Status

- Date: 2026-06-12
- Status: Passed after one focused student-list fix
- Tenant used: `jinacampus-demo`
- Scope: DB-backed migration, seed, and authenticated browser smoke for the Academia admission-sheet student registration flow

No passwords, session cookies, raw Aadhaar numbers, raw bank account numbers, token hashes, private URLs, or secrets are documented here.

## DB / Docker / Migration Status

Docker/PostgreSQL was running locally through the project database configuration.

Verified:

- `docker ps` showed `jinacampus-postgres` running and healthy on the configured local port.
- `npx prisma migrate status` reported 8 migrations and the database schema was up to date.
- Student registration migration present: `20260612120000_student_registration_admission_sheet`.
- `npx prisma validate` passed.
- `npx prisma generate` passed.
- `npm run db:seed` completed.

Operational note: `npm run db:migrate` timed out in this PowerShell session after the database was already up to date. The leftover Prisma migrate processes were stopped, and `npx prisma migrate status` confirmed no pending migration remained.

## Seed Status

Verified seeded demo data for `jinacampus-demo`:

| Area | Result |
| --- | --- |
| Demo tenant | Pass |
| Active academic years | Pass |
| Main branch | Pass |
| Class sections | Pass |
| Seeded students | Pass |
| Active enrollments | Pass |
| Admission-sheet fields | Pass |
| Masked Aadhaar references | Pass |
| Masked bank references | Pass |

## Browser Method

The in-app Browser runtime was attempted earlier in this session, but its local runtime asset path was unavailable. This smoke used the established local headless Chrome DevTools/CDP fallback against the running Next.js dev server. No browser automation dependency was added.

## Routes Tested

| Route | Result |
| --- | --- |
| `/login?schoolId=jinacampus-demo` | Pass |
| `/academia/students/create` | Pass |
| `/academia/students` | Pass |
| `/academia/students/[studentId]` | Pass |
| `/academia/students/[studentId]/edit` | Pass |
| `/academia/students?classSectionId=...&search=...` | Pass |

## Browser Smoke Results

| Check | Result | Notes |
| --- | --- | --- |
| School ID login surface | Pass | Login page rendered with School ID context and forgot-password control. |
| Authenticated session | Pass | Principal browser session was established without documenting credentials. |
| Invalid Aadhaar validation | Pass | Malformed Aadhaar returned a safe validation state and did not create a record. |
| Create student | Pass | QA-only student profile was created in the seeded demo tenant. |
| Sensitive storage | Pass | Aadhaar and bank account inputs were stored only as masked references and last-four values. |
| Duplicate admission number | Pass | Duplicate admission number returned a safe field-level conflict message. |
| Student list search | Pass | Created non-enrolled student appeared in the list as `Not enrolled`. |
| Student profile | Pass | Profile showed masked identity and bank references only. |
| Edit student | Pass | Edit form persisted a non-sensitive field update. |
| Class-section filter | Pass | Class-section filter returned a seeded active enrollment. |

## Bug Found / Fixed

Issue: newly registered students without current enrollments did not appear on `/academia/students`, making the create flow hard to verify or use before enrollment.

Fix: `listStudentsWithCurrentEnrollment` now keeps class-section filtering enrollment-scoped, but when no class-section filter is selected it lists student profiles directly and labels students without active enrollment as `Not enrolled`.

Regression coverage: `tests/unit/student-class-wise-list.test.ts` now verifies newly registered, non-enrolled students appear in the unfiltered/searchable list and that class-section filters remain enrollment-scoped.

## Sensitive Output Check

Browser-visible output and checked DB smoke output did not expose:

- raw Aadhaar values
- raw bank account values
- `passwordHash`
- `tokenHash`
- session secrets
- bearer tokens
- `actorUserId`
- `tenantId` in normal user-facing UI
- Prisma/SQL errors
- stack traces
- private URLs or secrets

## Remaining Risks / TODOs

- QA-only local student records created during this smoke remain in the local demo database.
- City remains a text field until a city master/search workflow is added.
- Full sensitive-field encryption and permissioned reveal remain deferred.
- Multi-branch and cross-tenant negative browser fixtures remain limited by the current single demo branch setup.

## Recommended Next Task

Run a short post-fix customer-demo browser pass for Academia navigation and student registration, then proceed with controlled pilot prep if the full check suite remains green.
