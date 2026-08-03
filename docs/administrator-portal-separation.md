# Administrator Portal Separation

Date: 2026-08-03

## Root Cause

The previous Administrator Portal authenticated an ordinary tenant `User`, required a tenant `ADMINISTRATOR` role, created a tenant `Session`, and wrote portal audit events into that tenant's `AuditLog`. As a result, the platform operator was coupled to a school tenant and school lifecycle actions could affect the operator session.

## Repaired Model

The platform operator is now a separate entity:

```txt
PlatformAdministrator
  -> PlatformAdministratorCredential
  -> PlatformAdministratorSession
  -> PlatformAuditLog
```

There is no relation from these models to `Tenant`, `Institution`, `Branch`, `AcademicYear`, `User`, or school roles.

School users continue to use the existing tenant session/context model. School Principal/Admin compatibility roles are school-scoped and are not JinaCampus platform administrators.

## Authorization Boundary

- `/administrator/*` requires the platform session cookie and platform context.
- `/dashboard`, `/campus-core`, `/academia`, `/staffboard`, and `/account` require the school session cookie and tenant context.
- School role assignments cannot grant platform access.
- Platform sessions do not grant access to school routes.
- Portal services accept only a server-derived `PlatformAdministratorContext`.

## School Lifecycle

The portal is limited to school registry CRUD and lifecycle operations. It does not expose school attendance or operational dashboards.

Permanent deletion requires exact confirmation `Delete School`. It performs a tenant-scoped transactional teardown and stores the final audit record outside the deleted tenant. Network/database failures roll back the transaction rather than leaving partial data.

School provisioning bulk-creates the four school roles and their permission links inside one bounded transaction. This avoids long serial permission-query loops over a managed database connection while preserving atomic provisioning.

## Credential Provisioning

Existing active tenant Administrator credentials are migrated by hash and marked according to their current `mustChange` state. Tenant sessions are revoked and tenant Administrator assignments are disabled.

Clean environments use `npm run platform-admin:provision` with temporary environment variables. The script hashes the temporary password, sets `mustChange=true`, revokes existing platform sessions, and never prints the password or hash.

No credential value belongs in Git, documentation, migration SQL, Vercel build logs, or chat transcripts.

## Deployment Order

1. Back up the Supabase database.
2. Apply `20260802223000_separate_platform_administrator` through the direct migration URL.
3. Verify the migrated/provisioned platform profile and credential without selecting `passwordHash`.
4. Run disposable-school create/populate/delete DB smoke.
5. Deploy the application.
6. Verify administrator login, forced password change, school CRUD, logout, and school-role denial.

## Supabase Verification - 2026-08-03

- Migration `20260802223000_separate_platform_administrator` was applied successfully and Prisma reports all 12 migrations up to date.
- A non-sensitive verification confirmed one active independent platform administrator profile with a credential record. No password hash or session token was selected.
- The first disposable-school provisioning attempt exposed the default five-second Prisma interactive-transaction timeout. The transaction rolled back without creating a partial school.
- A second attempt confirmed that increasing the timeout alone was insufficient because per-permission queries caused excessive managed-database round trips. Role and role-permission provisioning was converted to fixed-count bulk queries.
- The final disposable-school smoke created default tenant dependencies, invoked exact-confirmation permanent deletion, found zero remaining tenant-owned rows across all tenant-scoped models, and confirmed that the platform audit row remained.
- The independent platform administrator was reprovisioned through the guarded command, prior platform sessions were revoked, and a non-sensitive read-only check confirmed `ACTIVE`, `mustChange=true`, and a retained provisioning audit. Credentials are not stored in this document.

## Rollback Note

Application rollback after this migration is not recommended because the old build expects a tenant Administrator role and tenant session. If deployment smoke fails, retain the new schema and fix/roll forward the application. Do not reactivate the old tenant Administrator role as a shortcut.
