# Pre-Deployment Access and Attendance Readiness

Date: 2026-07-30

## Scope

This gate completes the approved five-role access model before deployment:

- Administrator remains a separately provisioned JinaCampus platform operator.
- Principal manages school governance.
- Office Staff receives permission-based operations.
- Teacher receives assigned-class workflows and own attendance.
- Staff receives own attendance and account workflows.

It does not add a new product module or weaken server-side tenant, branch, role,
or permission checks.

## StaffProfile and User Lifecycle

Teacher, Office Staff, and Staff login accounts must be created from Staff
Profiles. CampusCore no longer presents a second school-staff creation form.
The Staff Profile flow creates the linked User, temporary password credential,
branch access, and tenant role in one transaction.

Disabling login access deactivates the linked User, revokes active sessions,
and preserves the StaffProfile/User link. An authorized Principal can reactivate
the same linked account after confirming the staff profile is active and that
valid branch and role assignments still exist. Setting employment to a
non-active state also deactivates the linked login and revokes sessions.

Password values are passed exactly as entered to the existing hashing utility.
Raw passwords and password hashes are not written to audit metadata.

## Self-Attendance

The dashboard loads personal attendance through the same tenant-scoped,
user-derived query used by the protected mobile API. Self-only permissions do
not enable branch-wide staff attendance metrics.

Teacher, Staff, and Office Staff navigation can expose Scan QR, My Attendance,
and account/passkey settings. Office Staff retains only the broader attendance
operations present in its effective permissions.

## Fast Attendance Login

`/attendance-login` is the approved quick path:

1. Enter School ID and employee code or email.
2. Use a registered passkey when supported.
3. Use the account password as a permanent fallback.
4. Continue to the protected Staff QR scanner.

The path reuses the existing tenant-scoped WebAuthn challenge and session
services. It does not create a trust cookie or store biometric data. A pending
mandatory password change always overrides the scanner redirect.

Passkeys can be registered or removed under Account settings after current
password verification. Deployment requires an exact approved HTTPS
`WEBAUTHN_ORIGIN` and matching `WEBAUTHN_RP_ID`.

## Workspace Selection

`/account/workspaces` shows only destinations derived from the authenticated
user's server-resolved roles and effective permissions:

- School Administration
- Office Operations
- Teaching
- My Attendance

The selection changes navigation only. It cannot add roles, permissions,
branch access, or tenant access. Users with multiple operational role families
are sent to the chooser after normal login; single-role users keep the shortest
approved redirect.

## School Readiness

Principals can open `/campus-core/readiness`. The report is tenant-scoped and
checks:

- active institution and branch context
- active academic year
- canonical school roles
- an active Principal with branch access
- StaffProfile/User linkage and account status
- pending mandatory password changes
- active class sections and class-teacher assignments
- active student enrollments
- per-branch attendance settings and Staff QR enablement
- WebAuthn HTTPS configuration

The report returns counts and safe operational summaries only. It does not
render tenant IDs, branch IDs, password hashes, token hashes, database URLs, or
WebAuthn secrets.

Staff profiles without app accounts are valid because login access is optional.
They produce a review warning, not a blocker. An operational Teacher, Staff, or
Office Staff account without a linked StaffProfile remains a blocker. Active
class sections without a class teacher are also reported as a warning; Teacher
queries still return only explicitly assigned class sections.

## DB-Backed Browser QA

The 2026-07-30 browser pass used the isolated local Docker PostgreSQL database,
the development seed, desktop Chromium, and a 390 by 844 mobile viewport.
Credentials were supplied from local environment variables and were not printed
or written to this document.

Passed:

- development seed completed twice without changing another user's phone
- invalid quick-attendance login returned the generic safe error
- Staff quick login redirected directly to the protected QR scanner
- Staff navigation exposed Scan QR and My Attendance without admin routes
- Staff My Attendance returned the authenticated user's safe empty state
- manual invalid QR submission returned a safe error and cleared the payload
- camera startup reached a terminal no-camera state rather than hanging
- Principal Staff Profiles showed Enabled and No app access distinctly
- Principal could inspect disable, reset, and deactivation controls without a
  duplicate CampusCore school-staff creation form
- Teacher attendance exposed only the assigned Class 1-A
- Teacher student list returned only the six active students in Class 1-A
- direct Teacher access to CampusCore Users returned a safe permission state
- Office Staff mobile navigation exposed permission-derived attendance actions
  without user governance
- the school-readiness report returned zero blockers and four follow-up warnings
- Teacher attendance, Staff scanner, and Office dashboard had no horizontal
  overflow at the 390px viewport
- browser console contained no password, session, QR payload, token hash, or
  database error

The four local warnings are expected review items: optional staff profiles
without app access, temporary-password onboarding, unassigned class sections,
and replacing localhost WebAuthn configuration with the approved HTTPS origin.

## Verification Status

Completed:

- focused StaffProfile/User lifecycle tests
- role assignment boundary tests
- self-attendance and Office Staff navigation tests
- attendance fast-login and workspace tests
- tenant-scoped school-readiness tests
- TypeScript validation
- isolated DB migration status and repeatable development seed
- DB-backed Principal, Office Staff, Teacher, and Staff browser smoke
- mobile-width role navigation, attendance, scanner, and overflow checks
- full Vitest suite: 86 files and 747 tests
- optimized Next.js production build: 61 static pages generated
- Prisma format, validate, generate, and Git whitespace checks

Still required before deployment approval:

- approved-HTTPS browser smoke for `/attendance-login`
- staging migration and environment verification
- physical Android Chrome and iOS Safari passkey/device QA

Physical-device QA must remain recorded as pending when the devices and approved
HTTPS environment are not attached to the QA session.
