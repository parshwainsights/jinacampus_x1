# Auth Roles and Fast Login

Date: 2026-07-30

Status: approved model implemented; local migration and HTTPS Chrome passkey QA passed. Production-domain and physical-device QA remain pending.

## Decision

JinaCampus uses one user account per human and five canonical operational roles.
Institutions and roles never log in. The server resolves tenant, branch,
academic year, roles, and effective permissions after authentication.

## Five-Role Model

| Role | Scope and default purpose |
| --- | --- |
| `ADMINISTRATOR` | JinaCampus platform operator. Manages tenant lifecycle through the separate Administrator Portal. Provisioned separately. |
| `PRINCIPAL` | School governance, users, branches, academics, staff, attendance, and reports within authorized scope. |
| `OFFICE_STAFF` | Permission-based school office and attendance operations. No user governance by default. |
| `TEACHER` | Assigned class/student access, student attendance, own QR attendance, and own attendance status. |
| `STAFF` | Own QR attendance, own attendance status, and account access. |

Principals may assign only Office Staff, Teacher, and Staff. They cannot assign
Principal or Administrator. Teachers and Staff cannot manage users or roles.
The ordinary school user-management flow cannot create another platform
Administrator.

Existing `TENANT_OWNER`, `SUPER_ADMIN`, and `ADMIN` assignments remain Principal
compatibility aliases. Existing `CLASS_TEACHER` assignments remain Teacher
aliases. They are hidden from new operational role lists and are not assignable.
Parent and student portals and account roles remain deferred.

## Multiple Responsibilities

A person who teaches and performs office work keeps one `User` record with two
role assignments. Active permissions are merged. JinaCampus must not create
separate accounts for each job unless the records represent different people.

No login screen role selector grants access. A future workflow selector may help
a multi-role user choose a task, branch, or institution, but every route and
service must still authorize against server-derived context.

## Fast Login

The school login requires:

1. School ID
2. Employee code or email
3. A passkey, when registered, or the account password

Employee codes resolve only through an active StaffProfile linked to an active
User in the selected tenant. Email lookup is also tenant-scoped. Passwords are
case-sensitive and are never normalized.

The former phone-OTP login and public OTP reset endpoints are not exposed.
Public password recovery is non-enumerating and administrator-assisted; it is
not an additional login method.

After password verification, the server creates the session, audits the login,
and redirects from server-derived roles. A temporary credential with
`mustChange=true` goes to `/account/change-password` before any other protected
workflow.

Teachers, Office Staff, and Staff are provisioned through Staff Profiles so the
employee code, linked User, branch access, and operational role remain one
governed lifecycle. Disabling app access preserves that link, deactivates the
User, and revokes sessions; reactivation reuses the same account after branch
and role validation.

## Attendance Quick Sign-In

`/attendance-login` is a focused attendance entry point. It uses the existing
School ID plus employee-code/email identity, offers passkey first, retains the
password fallback, and prefers the protected Staff QR scanner after successful
authentication. It never overrides a mandatory-password-change redirect.

The route does not create a separate attendance account, role login, device
token, or client-selected role. The scanner remains protected by
`staffboard.attendance.self_scan`.

## Workspace Selection

`/account/workspaces` provides manual selection for users with more than one
authorized operational workspace. Cards are derived from server-resolved roles
and effective permissions. Selecting a workspace changes navigation only and
cannot grant tenant, branch, role, or permission access.

## Passkey Security

- Passkeys use WebAuthn through `@simplewebauthn/server` and
  `@simplewebauthn/browser`.
- Registration requires an authenticated session and current password.
- Registration is blocked while a mandatory password change is outstanding.
- Authentication requires School ID plus employee code or email so the
  credential lookup remains tenant-scoped.
- The WebAuthn relying-party ID and allowed origin are server configuration.
- User verification and resident-key-capable registration are required.
- Challenges expire after five minutes, are rate-limited, tenant-scoped, and
  consumed once.
- Identity metadata stored with a challenge is HMAC-protected.
- The database stores the credential public key, counter, transports, and safe
  device metadata. It does not store biometric data.
- Authentication counters and last-used timestamps are updated after successful
  verification.
- Removing a passkey requires the current password.
- Password fallback remains available and is not removed by passkey enrollment.

## Environment

Set these server-side deployment variables:

```text
APP_URL=https://approved-domain
WEBAUTHN_ORIGIN=https://approved-domain
WEBAUTHN_RP_ID=approved-domain
```

`WEBAUTHN_ORIGIN` must be the exact approved HTTPS origin. `WEBAUTHN_RP_ID` is
the domain only, without scheme, port, path, or wildcard. Preview domains need
an explicit approved strategy; a passkey registered for one unrelated RP ID
cannot be used on another.

Do not expose session secrets, password peppers, challenge values, credential
public keys, or database connection strings in public environment variables.

## Database Rollout

The migration adds `PasskeyCredential`, `PasskeyChallenge`, and the
`staffboard.attendance.self_view` permission. It also narrows legacy school-admin
role permissions to Principal scope and gives Teacher/Staff the approved self
attendance permissions.

Run the normal deployment gates against the intended database:

```bash
npx prisma migrate status
npx prisma migrate deploy
npx prisma generate
```

Never use `prisma migrate reset` against staging or production.

On 2026-07-30, the migration was applied successfully to the isolated local
Docker PostgreSQL QA database and `prisma migrate status` reported the schema
up to date. Staging and production deployment remain separate operator gates.

## Local HTTPS QA Result

The 2026-07-30 local HTTPS pass used installed Chrome, an isolated virtual
platform authenticator, and an app-local certificate that was not installed in
the Windows trust store.

Passed:

- Secure-context and WebAuthn availability detection
- Password login for a seeded Teacher
- Authenticated passkey registration with current-password verification
- Passkey login using School ID and tenant-scoped identity
- Rejection of a replayed, consumed authentication challenge
- Password fallback after passkey enrollment
- Mandatory password-change redirect and passkey-enrollment suppression
- Logout, protected-route redirect, and cleanup of the QA-created credential

The browser automation used environment-only QA credentials. Passwords,
session tokens, challenge values, and credential internals were not printed or
written to documentation.

## QA Gate

Before enabling passkey login for a pilot:

- Repeat registration with current password over the approved production-like
  HTTPS domain.
- Verify passkey login by both employee code and email.
- Verify password fallback remains functional.
- Verify a forced-password-change account cannot register a passkey.
- Verify an unknown School ID or identity returns the same safe login failure.
- Verify a passkey from another tenant/account cannot authenticate.
- Verify challenge expiry; replay rejection passed in local HTTPS QA.
- Verify logout and protected-route redirects.
- Verify iOS Safari, Android Chrome, Windows Hello, and installed PWA behavior
  where those clients are part of the pilot.
- Verify `/attendance-login` preserves mandatory-password-change enforcement
  and opens the scanner only for accounts with self-scan permission.
- Verify `/account/workspaces` never shows a destination that is absent from
  the user's effective permissions.

## Deferred

- Email invitation and recovery delivery
- Forced passkey enrollment
- Passkey-only accounts
- Global cross-tenant operator identity redesign
- Parent/student account portals
- A redesigned multi-institution/branch workflow switcher
