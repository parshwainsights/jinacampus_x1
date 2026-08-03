# Administrator Portal and School ID Login

Date: 2026-08-02

Status: independent platform administrator identity implemented; DB migration and production browser verification required before release.

## Decision

Schools, institutions, branches, and roles do not log in. Users log in.

JinaCampus now has two deliberately independent identity boundaries:

- School users use `/login` with School ID, employee code or email, and a passkey or password.
- JinaCampus platform administrators use `/administrator/login` with email and password.

A platform administrator is not a tenant `User`, has no school role assignment, branch access, institution context, or academic-year context, and cannot enter a school workspace through the portal session.

## Platform Identity

Platform authentication uses server-only tables:

- `platform_administrators`
- `platform_administrator_credentials`
- `platform_administrator_sessions`
- `platform_audit_logs`

The platform session uses a distinct `jc_platform_session` cookie by default and a domain-separated token hash. School routes continue to use the school session cookie. The proxy and server guards validate the appropriate cookie independently.

The migration copies eligible existing active tenant `ADMINISTRATOR` credentials by password hash, revokes their tenant sessions, and deactivates their tenant Administrator role assignment. Raw passwords are never copied, logged, or stored.

For a clean environment, provision the platform profile through the guarded operator command:

```powershell
$env:PLATFORM_ADMIN_BOOTSTRAP_ENABLED = "true"
$env:PLATFORM_ADMIN_EMAIL = "<approved-email>"
$env:PLATFORM_ADMIN_TEMP_PASSWORD = Read-Host "Temporary password"
$env:PLATFORM_ADMIN_DISPLAY_NAME = "JinaCampus Administrator"
npm run platform-admin:provision
Remove-Item Env:PLATFORM_ADMIN_TEMP_PASSWORD
```

The temporary password is hashed with the existing password utility, `mustChange` is set to `true`, existing platform sessions are revoked, and no secret is printed.

## Portal Scope

Supported routes:

- `/administrator/login`
- `/administrator`
- `/administrator/profile`
- `/administrator/account/change-password`
- `/administrator/schools`
- `/administrator/schools/create`
- `/administrator/schools/[tenantId]`
- `/administrator/schools/[tenantId]/edit`

The portal performs platform registry and school lifecycle work only:

- create a school tenant and default setup
- optionally create the initial Principal account
- list and inspect school identity/setup counts
- update school profile, branding, status, and School ID
- deactivate or reactivate a school
- permanently delete a school after exact confirmation

The former `/administrator/schools/[tenantId]/dashboard` operational inspection route now redirects to the school detail record. The portal does not read attendance operations, impersonate school users, or open school dashboards.

## Permanent School Deletion

The administrator must type the case-sensitive phrase:

```txt
Delete School
```

The server resolves the target tenant from the validated record ID and deletes all tenant-owned dependencies in one Prisma transaction before deleting the tenant. Dependency counts are review information; configured school data no longer blocks deletion.

If any database operation fails, the transaction rolls back and no partial deletion is committed. The deletion audit is written to `platform_audit_logs`, which has no tenant foreign key and remains available after the tenant and tenant audit history are gone.

This operation is irreversible. Confirm backups and the intended School ID before executing it in production.

## School ID Login

School login accepts:

- School ID
- employee code or email
- passkey when registered, or a case-sensitive password fallback

Supported URLs:

- `/login`
- `/login?schoolId=<school-id>`
- `/t/<school-id>/login`

The legacy request key `tenantSlug` remains accepted by the school login API for compatibility. UI and documentation use **School ID**.

## Security

- Platform administrator authorization comes only from `PlatformAdministratorSession`.
- Tenant users and tenant role assignments cannot authorize Administrator Portal routes.
- The legacy tenant `ADMINISTRATOR` role has no tenant permissions and is not assignable through school user management.
- School branch checks no longer contain a platform-role bypass.
- Client-provided tenant, branch, actor, role, permission, or attendance claims are never trusted.
- Password hashes, token hashes, raw passwords, session secrets, and database errors are not exposed.
- Platform password changes use `/administrator/account/change-password`, revoke other platform sessions, and audit safe metadata only.
- New platform tables have RLS enabled with no public anon/authenticated policies.

## Audit Events

Platform audit actions include:

- `platform.administrator.login_success`
- `platform.administrator.logout`
- `platform.administrator.password_changed`
- `platform.school.created`
- `platform.school.updated`
- `platform.school.school_id_updated`
- `platform.school.deactivated`
- `platform.school.reactivated`
- `platform.school.deleted`
- `platform.school.principal_created`

## QA Checklist

- Run `prisma migrate deploy` and verify all migrations are applied.
- Verify the approved platform profile exists independently of `users`.
- Verify its credential has `mustChange=true` after migration/provisioning.
- Verify administrator login sets only the platform session cookie.
- Verify a school Principal/Teacher/Staff session cannot open `/administrator`.
- Verify platform logout revokes only the platform session.
- Verify forced platform password change uses the platform credential.
- Create, update, deactivate, reactivate, and permanently delete a disposable school.
- Populate the disposable school with dependent records before deletion.
- Verify the tenant and all tenant-owned rows are gone.
- Verify the `platform.school.deleted` audit remains.
- Verify the platform administrator can still log in after deleting every school tenant.
- Verify public errors remain non-enumerating and contain no sensitive fields.

## Remaining Risks

- The production migration and DB-backed destructive-delete fixture must pass before deployment promotion.
- Permanent deletion should be paired with an external backup/retention policy before broad commercial use.
- Platform administrator recovery remains an operator-controlled process; public reset-token email delivery remains deferred.
