# Auth Password Recovery

Date: 2026-05-28

Status: MVP auth UX repair implemented.

## Login Model

JinaCampus uses user-based login. Institutions and roles do not log in directly. A user signs in, then the server resolves tenant, institution, branch, academic-year, role, permission, and branding context.

## Forgot Password Behavior

The login page includes a `Forgot password?` link to `/forgot-password`.

The public forgot-password form accepts only an email address. The response is intentionally non-enumerating:

```txt
If this account is eligible for password recovery, instructions will be provided. Institution staff should contact their Principal/Admin for password reset.
```

The public response does not reveal whether the email exists, whether the user is active, or which role the user has.

## Admin / Principal Reset Responsibility

Authenticated Admin/Principal password reset from CampusCore user management remains the supported operational recovery flow for institution users.

Supported route:

- `/campus-core/users/[userId]/reset-password`

The reset flow remains tenant-scoped, branch-aware, permission-protected, hashed, and audited.

## Teacher / Staff / Office Policy

Teacher, staff, and office users do not receive unsafe public self-service password reset in this MVP. They use the forgot-password page for safe guidance, then contact their Principal/Admin for a password reset.

## Show Password UX

Password inputs now include a keyboard-accessible show/hide control:

- `/login`
- `/account/change-password`
- `/campus-core/users/[userId]/reset-password`
- CampusCore user create initial-password fields

The toggle is a non-submit button, defaults to hidden password input, and stores no password value.

## Security Rules

- Do not reveal whether a forgot-password email exists.
- Do not reveal role or account status from the public recovery response.
- Do not store plaintext passwords.
- Do not expose password hashes.
- Do not log raw passwords.
- Do not create or log reset tokens in the current MVP.
- Do not allow public password reset for institution staff roles.
- Do not weaken admin/principal reset RBAC or tenant scope.

## Audit

When a matching active user is found, a safe audit event is written:

- `auth.password_recovery_requested`

Audit metadata records only safe policy information. It does not include passwords, password hashes, reset tokens, or secrets. Unknown emails do not create account-specific audit rows.

## Deferred

- Email provider integration
- Reset-token email flow
- Invite-based onboarding
- Forced password change UX
- Dedicated password reset request queue
