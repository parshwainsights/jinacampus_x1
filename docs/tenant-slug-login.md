# School ID Login

Date: 2026-06-02

Status: implemented for Base MVP school-scoped login.

## Decision

JinaCampus uses user login with a server-resolved school/tenant context. Schools, institutions, branches, and roles do not have separate login identities.

The customer-facing login code is **School ID**. Internally, the value is still stored in `Tenant.slug` so the existing database model and indexes remain stable.

## Supported Login URLs

- `/login`
  - Shows a School ID field.
  - User enters School ID, email, and password.
- `/login?schoolId=jinacampus-demo`
  - Locks the School ID from the query parameter.
  - Shows school branding when the school is valid and active.
- `/t/jinacampus-demo/login`
  - School ID-specific login URL.
  - Locks the School ID from the route segment.
  - Shows school branding when the school is valid and active.

The previous `/login?tenant=jinacampus-demo` query and `tenantSlug` request key remain compatibility aliases only.

## Server Behavior

Login posts to `/api/auth/login` with:

```json
{
  "schoolId": "jinacampus-demo",
  "email": "user@example.test",
  "password": "..."
}
```

The API validates and normalizes the School ID, resolves an active tenant server-side, and then looks up the user by tenant plus email. The client cannot select tenant, branch, role, or permission by sending IDs in the request.

On success, the server creates a session, stores only the session token hash, sets the session cookie, audits the login, and returns a role-aware redirect path.

On failure, the response is always generic:

```json
{
  "error": "Invalid School ID, email, or password."
}
```

This generic response is used for malformed School ID, missing/inactive school, unknown email, inactive user, and invalid password.

## Administrator Login

JinaCampus Super Admin / Administrator users use a separate portal:

- `/administrator/login`
- `/administrator`
- `/administrator/schools`

Administrator login accepts email and password only. It does not ask for School ID and rejects non-platform users with `Invalid administrator credentials.`

## Session Context

After login, the session context resolves:

- tenant
- user
- active institution
- active branch
- accessible branches
- active academic year
- role labels and role codes
- effective permissions
- institution display name and logo

Server-side RBAC and tenant scoping remain authoritative. Navigation filtering is only a UX layer.

## Branding Behavior

School-specific login pages display active institution branding when available:

- institution display name
- institution logo URL
- fallback initials when no logo exists

Invalid, inactive, or unknown School IDs do not expose school existence. The UI falls back to JinaCampus branding and the login API still returns only the generic error.

## Security Rules

- Do not trust client-provided `tenantId`, `branchId`, `actorUserId`, role, or permission fields.
- Do not expose school existence through public login errors.
- Do not reveal whether an email exists.
- Do not expose `passwordHash`, session secrets, bearer tokens, token hashes, or internal IDs in login responses.
- Do not store plaintext passwords.
- Do not log submitted passwords.

## QA Checklist

- `/login` shows School ID, email, password, forgot password, and show/hide password controls.
- `/login?schoolId=jinacampus-demo` locks the School ID and keeps the hidden School ID value.
- `/t/jinacampus-demo/login` locks the School ID and shows valid branding when seed data is present.
- `/administrator/login` is separate and does not show School ID.
- Valid principal/admin school login lands on the dashboard.
- Valid class teacher login lands on student attendance marking.
- Wrong School ID, unknown email, inactive school, inactive user, and wrong password all return the same safe error.
- Client-supplied tenant IDs are ignored.
- Logout still clears the session and redirects to `/login`.

## Deferred

- Tenant discovery by email alone.
- Email-based invite and reset-token flows.
