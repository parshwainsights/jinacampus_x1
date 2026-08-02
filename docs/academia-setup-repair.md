# Academia Setup and Student Registration Repair

Status: implementation and local DB-backed Principal/Teacher browser QA complete, including embedded registration and second-institution negative coverage.

Date: 2026-07-31

## Governance Decision

- New tenants, schools, and their first institution are provisioned only through the JinaCampus Administrator Portal.
- A school Principal can view and update institution profiles represented by the Principal's assigned branches.
- A Principal cannot create a second institution from the school workspace or target an institution outside assigned branch scope.
- Branch and academic-year mutations validate the target institution against the actor's server-derived branch access.

## Academic Setup Workflow

`/academia/setup` is the primary Principal workflow:

1. Create class levels.
2. Create reusable section labels.
3. Map one class and section for the active branch and academic year.
4. Maintain the subject master.

Class-section creation derives branch and academic year from authenticated context. The client supplies only the selected class, section, optional teacher, display name, and capacity. The service verifies tenant, branch, academic year, active class/section, and teacher branch access before writing and auditing.

Standalone Class, Section, Class Section, and Subject URLs remain available as secondary list/edit views. Guardians and Enrollments are no longer primary navigation items because their normal create workflows are embedded in student registration and student profiles.

Subjects remain simple CRUD. They are not required for daily attendance, but they are retained for future timetable, teaching assignment, GradeBook, and reporting work.

## Student Registration

Student registration now supports:

- primary guardian relation and contact details;
- an audited normalized `Guardian` and `StudentGuardianLink`;
- optional initial active-year class-section assignment;
- optional roll number and enrollment date.

The student, newly created guardian when needed, primary guardian link, and optional enrollment are committed in one Prisma transaction. Existing tenant guardians can be reused by normalized phone or email. Conflicting contact matches fail safely.

The student profile exposes **Assign Class** when no enrollment exists for the student's current active academic year. The server resolves branch and academic-year scope from the student and selected class-section; it does not accept tenant, branch, or academic-year IDs from the form.

## Security and Audit

- Tenant, actor, branch, and academic-year context remain server-derived or server-validated.
- Institution reads and updates are limited to institutions represented by accessible branches.
- Class-section teacher options contain only active teacher users with access to the active branch.
- Student, guardian, guardian-link, enrollment, class, section, class-section, subject, institution, branch, and academic-year mutations retain permission checks and audit events.
- Full Aadhaar and bank account values are still converted to masked references before persistence.
- No password hash, token hash, raw QR token, or internal tenant identifier is rendered by these workflows.

## QA Checklist

- [x] Principal can create Class through Academic Setup.
- [x] Principal can create Section through Academic Setup.
- [x] Principal can create Subject through Academic Setup.
- [x] Principal can create Class Section for the active branch/year.
- [x] Principal can update and deactivate Class, Section, Subject, and Class Section records.
- [ ] Class-section mapping rejects a mismatched institution academic year.
- [ ] Teacher options exclude users without teacher role or branch access.
- [x] Principal registration creates Student, primary Guardian, and link.
- [x] Optional class assignment creates one active-year Enrollment.
- [ ] Student profile Assign Class works when no current-year enrollment exists.
- [ ] Duplicate admission, guardian contact conflict, duplicate roll number, and duplicate enrollment return safe messages.
- [x] Teacher attendance loads only assigned class-sections in the seeded browser fixture.
- [x] Principal cannot create an institution from the school workspace.
- [x] Principal cannot read or mutate another institution through direct IDs.

## Local DB-Backed Browser QA - 2026-07-31

- Docker PostgreSQL was healthy on the repository's isolated local QA port.
- All 11 repository migrations were applied; no schema change was required for this repair.
- The local-only demo seed completed with Principal and Teacher users, one active branch/year, Classes, Sections, Class Sections, Subjects, Students, Guardians, and active Enrollments.
- Principal login passed and the school workspace displayed the Administrator Portal provisioning boundary without a create-institution action.
- Principal browser submissions created one disposable local-QA Class, Section, Subject, and active-year Class Section through `/academia/setup`.
- Teacher login passed; `/academia/attendance/mark` exposed one seeded assigned class-section.
- Teacher access to Academic Setup did not expose its mutation controls.
- Checked browser output did not expose password hashes, token hashes, tenant IDs, actor IDs, or Prisma internals.
- No credentials, session cookies, or sensitive values are recorded in this document.

## Local DB-Backed Negative and Embedded Registration QA - 2026-07-31

- Reused the isolated Docker PostgreSQL database; all 11 repository migrations remained applied.
- Principal browser actions updated and deactivated the disposable QA Class Section, Class, Section, and Subject in dependency-safe order.
- Database verification confirmed all four records were `INACTIVE` and each update/deactivate audit action was present.
- Principal browser registration created a disposable Student with one primary `FATHER` Guardian link and one active-year Enrollment in an accessible class-section.
- Database verification confirmed Student, Guardian, and Enrollment creation audit events and matching tenant/branch/year scope.
- Aadhaar and bank account inputs were persisted only as masked references plus last four digits; raw values and internal identifiers were not rendered after submission.
- A second active institution and branch were added only to the disposable local QA database, without granting the Principal branch access.
- The inaccessible branch was absent from Student Registration, and the inaccessible institution was absent from the school Institution list.
- Direct institution profile/edit IDs returned the safe not-found surface without a mutation form. The inaccessible branch ID returned the safe permission state without branch details or an edit action.
- This fixture verifies an inaccessible branch in a second institution within the same tenant. A separate second-tenant fixture remains advisable for broader cross-tenant penetration QA.

## Remaining Work

- Run the Student Profile **Assign Class** browser flow for a student intentionally registered without an initial Enrollment.
- Add focused duplicate admission, guardian contact conflict, duplicate roll-number, and duplicate Enrollment browser cases.
- Add a separate tenant fixture for broader cross-tenant negative penetration QA.
- Keep multi-institution switching and bulk student import outside this repair.
- No Prisma schema migration was required.
