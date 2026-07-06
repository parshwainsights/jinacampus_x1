# Base Auth and Access Repair

Date: 2026-05-30

Status: implementation repaired with explicit Super Admin governance permissions, role-aware login destinations, and focused RBAC tests. Native mobile work remains frozen until this Base MVP access model is accepted.

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
| `TENANT_OWNER` | Platform-level owner access for the tenant. Can assign all roles. |
| `SUPER_ADMIN` | JinaCampus Super Admin access with all Base MVP permissions, including administrator school governance. |
| `ADMINISTRATOR` | JinaCampus Administrator access for platform dashboard, school tenant management, School ID updates, and platform audit visibility. |
| `ADMIN` | Existing Base MVP admin access retained for compatibility. Can manage institutions, branches, users, roles, audit, Academia, StaffBoard Lite, and platform school governance where seeded. |
| `PRINCIPAL` | Institution/branch operations, user creation, password reset, branch assignment, and safe school-role assignment inside their accessible scope. |
| `OFFICE_STAFF` | Branch operations for StaffBoard attendance support, QR generation, correction, and reports. No user/role governance. |
| `CLASS_TEACHER` | Student attendance marking/report access for permitted class-section workflows and own staff QR scan. |
| `TEACHER` | Teacher/student view and own staff QR scan. |
| `STAFF` | Own staff QR scan and minimal account access. |
| `PARENT` / `STUDENT` | Deferred access model placeholders only. |

## Principal User-Management Rules

Principals can create and manage users only in their tenant and assigned branch scope. A principal-created user must be assigned to at least one branch the principal can access. They can assign only school-operational roles:

- `OFFICE_STAFF`
- `CLASS_TEACHER`
- `TEACHER`
- `STAFF`
- `PARENT`
- `STUDENT`

Principals cannot assign:

- `TENANT_OWNER`
- `SUPER_ADMIN`
- `ADMINISTRATOR`
- `ADMIN`
- `PRINCIPAL`

Teacher and staff roles do not receive user-management permissions.

## Administrator / Super Admin Governance

JinaCampus Super Admin / Administrator users use `/administrator/login`. This login is separate from school user login and accepts email/password only.

The administrator portal supports:

- `/administrator`
- `/administrator/schools`
- `/administrator/schools/create`
- `/administrator/schools/[tenantId]`
- `/administrator/schools/[tenantId]/edit`

Super Admin receives explicit platform governance permissions:

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

Super Admin also receives CampusCore, Academia, and StaffBoard Lite permissions needed for Base MVP operations. Platform-style permissions are seeded as `SYSTEM` permissions and do not create an institution or role login.

## Login / Logout

- `/login` accepts School ID, email, and password.
- `/login?schoolId=<schoolId>` and `/t/<schoolId>/login` preselect the School ID server-side and show active institution branding when available.
- The legacy `/login?tenant=<schoolId>` query and `tenantSlug` request key remain compatibility aliases only.
- Invalid school login returns the safe generic error: `Invalid School ID, email, or password.`
- Invalid administrator login returns the safe generic error: `Invalid administrator credentials.`
- Valid login creates a server session and stores only the session token hash server-side.
- Login returns a server-derived destination: Super Admin, Principal, Teacher, and Office Staff land on the role-aware dashboard; Class Teacher lands on student attendance marking; Staff lands on QR scan.
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

## Password Behavior

- Initial passwords and reset passwords are hashed before storage.
- Password reset is scoped to authorized user managers through `campuscore.user.reset_password`; it is separate from generic `campuscore.user.update`.
- Change-own-password verifies current password before replacing it.
- `/forgot-password` provides a safe non-enumerating recovery request and guidance flow.
- Teacher, staff, and office recovery remains administrator-assisted through Principal/Admin reset.
- Public reset-token email delivery is deferred until email provider/reset-token infrastructure is approved.
- Password fields include show/hide controls for login, user creation, reset, and own-password change.
- Passwords and password hashes are not included in UI payloads, audit metadata, or API responses.
- Invite email flow and forced-password-change UX remain future improvements.

## Institution Branding

- Institution profile supports legal/name, display name, and URL-based logo.
- The app shell shows display name first, then institution name, then tenant/product fallback.
- Missing logo falls back to initials.
- Teacher/staff can view branding but cannot edit it without `campuscore.institution.manage`.
- File upload/storage abstraction remains deferred.

## Security Rules

- Do not trust client-provided tenant, branch, actor, role, permission, or staff IDs.
- Role options are filtered server-side using assignment boundaries.
- User mutations use tenant-scoped lookups and non-platform users are limited by branch overlap or records they created.
- Platform-admin role contexts can operate across tenant branches.
- Known governance actions are audited without raw passwords, password hashes, session secrets, QR tokens, or token hashes.
- Public School ID is stored internally in `Tenant.slug`; user-facing UI and docs should say School ID.

## Remaining Risks / TODOs

- Administrator school management is available through the new portal, but DB-backed browser QA is still recommended.
- A true global operator identity model can be revisited later if platform operations must be independent of a tenant session.
- Dedicated invite email flow is deferred.
- Full branch/institution switcher UX for multi-branch users remains a future polish item.
- Re-run authenticated browser QA for admin, principal, teacher, staff, and office users after Docker/PostgreSQL is available and the seed can be applied.

## Recommended Next Task

Run authenticated browser QA for Base MVP auth/access governance across platform admin, principal, teacher, staff, and office users, including user creation, role assignment boundaries, branch assignment, password reset/change, institution branding, and logout.
