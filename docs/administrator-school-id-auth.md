# Administrator Portal and School ID Login

Date: 2026-06-02

Status: implemented for Base MVP platform-school governance.

## Decision

Schools, institutions, branches, and roles do not log in. Users log in.

There are now two login experiences:

- School users use `/login` with School ID, email, and password.
- JinaCampus Super Admin / Administrator users use `/administrator/login` with email and password.

The public term is **School ID**. The database can continue to store this value in `Tenant.slug` to avoid an unnecessary migration.

## Administrator Portal

Routes:

- `/administrator/login`
- `/administrator`
- `/administrator/schools`
- `/administrator/schools/create`
- `/administrator/schools/[tenantId]`
- `/administrator/schools/[tenantId]/dashboard`
- `/administrator/schools/[tenantId]/edit`

Administrator login rejects non-platform users with the generic message:

```txt
Invalid administrator credentials.
```

The portal is protected by session middleware and server-side platform permissions.

The selected-school dashboard route is an Administrator View inspection page. It does not impersonate school users and does not mutate the administrator's school, branch, or role context. Administrators open it from the Schools registry through **Open School Dashboard** and return through **Return to Administrator Dashboard** or **Back to Schools**.

## School ID Login

School login accepts:

- School ID
- email
- password

Supported URLs:

- `/login`
- `/login?schoolId=jinacampus-demo`
- `/t/jinacampus-demo/login`

The legacy request key `tenantSlug` remains accepted by the login API for compatibility, but UI and docs should say School ID.

All school-login failures return:

```txt
Invalid School ID, email, or password.
```

## School ID Rules

School ID is normalized by trimming and lowercasing.

Validation:

- required
- 3 to 50 characters
- lowercase letters, numbers, and single hyphens only
- reserved values blocked: `admin`, `administrator`, `platform`, `api`, `app`, `www`, `login`, `logout`, `dashboard`, `support`, `help`, `root`, `system`

Changing a School ID changes the login code and tenant-specific login URL for that school.

## RBAC

Platform permissions:

- `platform.dashboard.view`
- `platform.school.view`
- `platform.school.create`
- `platform.school.update`
- `platform.school.deactivate`
- `platform.school.delete`
- `platform.school.update_school_id`
- `platform.user.manage`
- `platform.audit.view`

Platform roles:

- `TENANT_OWNER`
- `SUPER_ADMIN`
- `ADMINISTRATOR`
- existing `ADMIN` remains platform-capable for Base MVP compatibility

Principal remains a school role and is not the same as JinaCampus Administrator.

## School Management

Administrator can:

- create a school tenant
- create default institution and branch
- seed default tenant roles and permissions
- create an optional principal account with hashed password
- edit school profile and branding
- update School ID with explicit confirmation
- deactivate/reactivate school
- attempt hard delete only when no dependent data exists

Hard delete is intentionally conservative. Deactivation is the operational path when users, roles, institutions, branches, audit logs, attendance, or notifications exist.

## Security

- Do not trust client-provided tenant, branch, actor, role, or permission IDs.
- Do not expose `passwordHash`, `tokenHash`, session secrets, raw passwords, or reset tokens.
- Do not reveal whether a School ID or email exists from public login errors.
- Do not allow school users to bypass their tenant context.
- Do not allow principal users to access the administrator portal.
- Do not let administrators deactivate/delete the school that owns their current admin session.

## Audit

Audited actions include:

- `administrator.login_success`
- `administrator.logout`
- `school.created`
- `school.updated`
- `school.school_id_updated`
- `school.deactivated`
- `school.reactivated`
- `school.delete_blocked`
- `school.deleted`
- `principal.created`

Audit metadata must not contain raw passwords, password hashes, token hashes, reset tokens, or secrets.

## Migration

No schema migration was required. The public School ID is backed by the existing unique `Tenant.slug` column.

## QA Checklist

- `/administrator/login` accepts administrator email/password only.
- School principal/teacher/staff users cannot log in to `/administrator/login`.
- `/login` shows School ID, email, password, forgot password, and show/hide password controls.
- `/login?schoolId=jinacampus-demo` locks School ID when valid.
- `/t/jinacampus-demo/login` works as a School ID-specific URL.
- Administrator can list, create, view, edit, deactivate, reactivate, and attempt safe delete of schools.
- Administrator can open a selected school dashboard from the school registry without impersonating a school user.
- School ID update requires confirmation and audits old/new values.
- Public login errors remain non-enumerating.

## Remaining Risks / TODOs

- DB-backed browser QA for the administrator portal is still recommended.
- A true global operator identity model can be revisited later if platform operations must be independent of a tenant session.
- Email invite and reset-token flows remain deferred.
