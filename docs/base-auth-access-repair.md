# Base Auth and Access Repair

Date: 2026-07-30

Status: five-role governance, platform/school administrator separation, mandatory password change, and Teacher assigned-class scope repaired and verified.

## Decision

JinaCampus authentication is user-based.

Institutions do not log in. Roles do not log in. A user signs in, then the server resolves tenant, institution, branch, academic-year, role, permission, and branding context from tenant-scoped assignments.

## Access Model

- Tenant is the data boundary.
- Institution belongs to a tenant.
- Branch belongs to a tenant and institution.
- User belongs to a tenant.
- User branch access is granted through `UserBranchAccess`.
- User permissions come from active tenant/branch/academic-year role assignments.
- The active branch is selected from authorized branch access. Platform-admin contexts may operate across tenant branches.

## Role Matrix

| Role | Intended access |
| --- | --- |
| `ADMINISTRATOR` | JinaCampus platform operator for tenant lifecycle and platform audit/governance through the separate Administrator Portal. |
| `PRINCIPAL` | Institution/branch operations, user creation, password reset, branch assignment, and safe school-role assignment inside their accessible scope. |
| `OFFICE_STAFF` | Branch operations for StaffBoard attendance support, QR generation, correction, and reports. No user/role governance. |
| `TEACHER` | Assigned class-section/student access, student attendance marking/reporting, own staff QR scan, and own attendance status. |
| `STAFF` | Own staff QR scan, own attendance status, and minimal account access. |

Existing `TENANT_OWNER`, `SUPER_ADMIN`, and `ADMIN` assignments are treated as
Principal compatibility aliases. Existing `CLASS_TEACHER` assignments are
treated as Teacher aliases. They are not shown or assignable as new roles.
Parent/student account roles remain deferred.

## Principal User-Management Rules

Principals can create and manage users only in their tenant and assigned branch scope. A principal-created user must be assigned to at least one branch the principal can access. They can assign only school-operational roles:

- `OFFICE_STAFF`
- `TEACHER`
- `STAFF`

Principals cannot assign:

- `ADMINISTRATOR`
- `PRINCIPAL`
- any legacy alias
- any deferred parent/student account role

Teacher and staff roles do not receive user-management permissions.

## Administrator Governance

JinaCampus Administrator users use `/administrator/login`. This login is separate from school user login and accepts email/password only.

The administrator portal supports:

- `/administrator`
- `/administrator/schools`
- `/administrator/schools/create`
- `/administrator/schools/[tenantId]`
- `/administrator/schools/[tenantId]/edit`

Administrator receives explicit platform governance permissions:

- `platform.dashboard.view`
- `platform.tenant.manage`
- `platform.institution.manage`
- `platform.school.view`
- `platform.school.create`
- `platform.school.update`
- `platform.school.deactivate`
- `platform.school.delete`
- `platform.school.update_school_id`
- `platform.user.manage`
- `platform.audit.view`

Platform-style permissions are seeded as `SYSTEM` permissions and do not create an institution or role login. The Administrator role is operator-provisioned and is never offered in school user-management forms.

## Login / Logout

- `/login` accepts School ID and either employee code or email.
- Registered users may use a passkey as the preferred fast-login option.
- A case-sensitive password remains available as a permanent fallback.
- `/login?schoolId=<schoolId>` and `/t/<schoolId>/login` preselect the School ID server-side and show active institution branding when available.
- The legacy `/login?tenant=<schoolId>` query and `tenantSlug` request key remain compatibility aliases only.
- Invalid school login returns the safe generic error: `Invalid School ID, email, or password.`
- Invalid administrator login returns the safe generic error: `Invalid administrator credentials.`
- Platform Administrators are rejected by the school password and passkey login
  paths even if a tenant-scoped identifier is supplied.
- Valid login creates a server session and stores only the session token hash server-side.
- Login returns a server-derived destination: Principal and Office Staff land on the role-aware dashboard; Teacher lands on assigned student attendance; Staff lands on QR scan.
- Logout is available from the account/topbar menu.
- Logout revokes the session, clears the cookie, audits the event, and redirects to `/login`.
- Protected route families include dashboard, CampusCore, Academia, StaffBoard, and account pages.
- Administrator routes are protected separately and unauthenticated users are sent to `/administrator/login`.

## Institution / Branch Context

After login, session context resolves:

- tenant
- user
- active branch
- accessible branches
- active academic year
- institution name/display name/logo
- role labels and server-side role codes

If a user has no usable branch access, branch-scoped pages show safe empty/setup states rather than exposing internal identifiers. Multi-branch switching remains limited to the existing selected-branch cookie behavior.

New schools and institutions are provisioned only through the JinaCampus
Administrator Portal. The school workspace exposes assigned institution
profiles for viewing and authorized branding/profile updates, but it does not
offer institution creation. Principal institution, branch, and academic-year
queries and mutations are limited to institutions represented by the
Principal's server-derived branch access.

## Password Behavior

- Initial passwords and reset passwords are hashed before storage.
- Password reset is scoped to authorized user managers through `campuscore.user.reset_password`; it is separate from generic `campuscore.user.update`.
- Administrative reset sets `mustChange=true`, revokes target-user sessions, and
  removes target-user passkeys.
- Change-own-password verifies current password before replacing it.
- `/forgot-password` provides a safe non-enumerating recovery request and guidance flow.
- Teacher, staff, and office recovery remains administrator-assisted through Principal/Admin reset.
- Public reset-token email delivery is deferred until email provider/reset-token infrastructure is approved.
- Password fields include show/hide controls for login, user creation, reset, and own-password change.
- Passwords and password hashes are not included in UI payloads, audit metadata, or API responses.
- Invite email delivery and richer first-login onboarding remain future improvements.
- Temporary-password users are now forced through `/account/change-password` before other protected workflows.
- Passkey enrollment requires the current password and is unavailable until a required password change is complete.

`mustChange` is enforced by the central tenant-context and mobile-token
resolvers. It is not only a navigation rule. Logout, `/api/auth/me`, and the
change-own-password workflow remain safely available while the restriction is
active.

## Teacher Data Scope

Teacher-only contexts can list and open students only through active
enrollments in class-sections assigned through `classTeacherUserId`. Direct
class-section and student identifiers are revalidated server-side. Teacher
dashboard student, enrollment, class, guardian, and attendance metrics use the
same assigned-class boundary.

## Institution Branding

- Institution profile supports legal/name, display name, and URL-based logo.
- The app shell shows display name first, then institution name, then tenant/product fallback.
- Missing logo falls back to initials.
- Teacher/staff can view branding but cannot edit it without `campuscore.institution.manage`.
- File upload/storage abstraction remains deferred.

## Security Rules

- Do not trust client-provided tenant, branch, actor, role, permission, or staff IDs.
- Do not trust a client-selected role. Multiple role permissions are merged from active server-side assignments.
- Role options are filtered server-side using assignment boundaries.
- User mutations use tenant-scoped lookups and non-platform users are limited by branch overlap or records they created.
- Platform-admin role contexts can operate across tenant branches.
- Known governance actions are audited without raw passwords, password hashes, session secrets, QR tokens, or token hashes.
- Public School ID is stored internally in `Tenant.slug`; user-facing UI and docs should say School ID.

## Remaining Risks / TODOs

- Apply the passkey migration to staging/production through the approved
  deployment process and configure the final WebAuthn origin/RP ID.
- Local HTTPS Chrome virtual-authenticator QA passed. Approved-domain,
  Windows Hello, Android Chrome, iOS Safari, and installed-PWA QA remain.
- Administrator school management is available through the portal, but DB-backed browser QA is still recommended.
- A true global operator identity model can be revisited later if platform operations must be independent of a tenant session.
- Dedicated invite email flow is deferred.
- Full branch/institution switcher UX for multi-branch users remains a future polish item.
- Add a second-tenant fixture for cross-tenant passkey and broader negative
  teacher-scope browser QA.

## Recommended Next Task

Deploy the passkey migration and exact WebAuthn origin/RP ID to an approved
staging HTTPS domain, then run Windows Hello, Android Chrome, iOS Safari, and
installed-PWA passkey registration/login QA.
