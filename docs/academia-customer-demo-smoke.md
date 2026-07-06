# Academia Customer-Demo Smoke

## QA Date / Status

- Date: 2026-06-12
- Status: Passed
- Tenant used: `jinacampus-demo`
- Scope: short customer-demo browser smoke for Academia after the student list fix

No passwords, session cookies, raw Aadhaar numbers, raw bank account numbers, private URLs, tokens, or secrets are documented here.

## DB / Seed Status

Verified before the smoke:

- Docker/PostgreSQL was running and reachable.
- `npx prisma migrate status` reported 8 migrations and the database schema was up to date.
- `npm run db:seed` completed successfully.
- Demo tenant `jinacampus-demo` exists and is active.
- Demo Principal and Teacher users exist and are active.
- Demo classes, sections, class sections, students, guardians, and active enrollments exist.

Observed demo counts before smoke:

| Area | Count |
| --- | ---: |
| Active users | 25 |
| Classes | 3 |
| Sections | 2 |
| Active class sections | 3 |
| Students | 22 |
| Guardians | 18 |
| Active enrollments | 18 |
| Existing QA-only students | 2 |

QA-only local student records may remain in the demo database. Treat them as local test data only.

## Browser Method

The in-app Browser runtime was attempted first, but its local runtime asset path was unavailable in this session. The smoke used the established local headless Chrome DevTools/CDP fallback against the running Next.js dev server. No browser automation dependency was added.

## Roles Tested

| Role | Result | Notes |
| --- | --- | --- |
| Principal | Pass | Used for student registration, create, duplicate, list, profile, edit, enrollment, class-section filter, and attendance navigation checks. |
| Teacher | Pass | Used for attendance navigation and student-create forbidden-state check. |

## Student Registration Result

Passed.

Verified:

- `/academia/students/create` loaded without runtime error.
- Admission-sheet sections rendered: admission, personal, parent/guardian, identity documents, demographic, address, bank, and system details.
- Required fields and optional/can-add-later copy rendered.
- Religion, category, nationality, state, blood group, and gender selectors had expected options.
- Empty required form submit was blocked by browser validation.
- Malformed Aadhaar input returned safe validation.

## Create Student Result

Passed.

Verified:

- A fake local QA-only student was created successfully.
- Duplicate scholar/admission number returned a safe field-level error.
- The created student appeared in `/academia/students` search results.
- The created student was labelled `Not enrolled` because no enrollment was created for this smoke.
- Full Aadhaar and full bank account values were not visible in the list.

## Edit Student Result

Passed.

Verified:

- `/academia/students/[studentId]/edit` opened for the created QA student.
- Existing masked-field guidance was visible.
- A harmless city update saved successfully.
- The saved value persisted in the database.
- Sensitive fields remained masked or safely handled.

## Student Profile Result

Passed.

Verified:

- `/academia/students/[studentId]` opened for the created QA student.
- Profile sections rendered for admission, personal, parent/guardian, identity, demographic, address, and bank details.
- Masked Aadhaar and masked bank references were visible.
- Full sensitive values were not visible.

## Enrollment Result

Passed for seeded data.

Verified:

- A seeded enrolled student profile showed class-section enrollment context.
- `/academia/enrollments` loaded without internal errors.
- Current seeded enrollment data remained consistent with the student list/class-section filter.

No new enrollment feature was built or changed in this smoke.

## Class-Section Filter Result

Passed.

Verified:

- `/academia/students?classSectionId=...&search=...` returned a seeded active enrolled student.
- Class-section context displayed correctly.
- The student list fix preserved enrollment-scoped behavior when a class-section filter is selected.

## Attendance Navigation Result

Passed.

Verified:

- `/academia/attendance` loaded.
- `/academia/attendance/mark` loaded.
- `/academia/attendance/reports` loaded.
- Teacher could reach the attendance marking route.
- No deep attendance mutation regression was run in this short smoke.

## Sensitive-Output Result

Passed.

Checked browser-visible output did not expose:

- full Aadhaar values
- full bank account values
- `passwordHash`
- raw passwords
- reset tokens
- `tokenHash`
- raw QR tokens
- WhatsApp provider tokens
- `tenantId` in normal UI
- `actorUserId`
- Prisma/SQL errors
- stack traces
- private URLs or secrets

## Issues Found / Fixed

No confirmed product issue was found in this pass, so no code fix was made.

Operational notes:

- The in-app Browser runtime was unavailable in this session, so local Chrome CDP fallback was used.
- One smoke helper assertion was adjusted because rendered badge text is uppercase in the browser.
- One browser session hit a transient logout/fetch context failure after the Principal smoke had passed; a fresh Teacher browser session completed the remaining Teacher checks.

## Remaining Risks / TODOs

- QA-only local student records remain in the demo database.
- City remains a free-text field; city normalization is deferred.
- Sensitive-field encryption and controlled reveal remain deferred.
- Multi-branch and cross-tenant negative browser fixture coverage remains limited by the current single demo branch/school setup.
- Physical-device Staff QR camera QA remains separate from this Academia smoke.

## Launch Readiness Recommendation

Academia is customer-demo ready for the checked Base MVP flows: student registration, student list, create/edit/profile, seeded enrollment visibility, class-section filtering, and attendance navigation.
