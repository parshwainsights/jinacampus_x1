# Auth Password Recovery and OTP Login

Date: 2026-07-11

Status: OTP login and OTP-backed password recovery foundation implemented.

## Login Model

JinaCampus uses user-based login. Institutions and roles do not log in directly. A user signs in, then the server resolves tenant, institution, branch, academic-year, role, permission, and branding context.

## Login Methods

The login page supports two user login methods:

- School ID, email, and password.
- School ID, registered contact number, and one-time password for active tenant administrators or tenant owners.

Password values remain case-sensitive and are never normalized. School IDs, emails, and phone numbers are normalized independently. Successful password and OTP logins create the same server-managed session and resolve tenant, branch, role, and permission context on the server.

## Forgot Password Behavior

The login page includes a `Forgot password?` link to `/forgot-password`.

The public forgot-password form accepts a School ID plus an email address or contact number. The response is intentionally non-enumerating:

```txt
If the account is eligible, an OTP will be sent to the registered contact number.
```

The public response does not reveal whether the school, email, phone, or user exists; whether the user is active; or which role the user has. A matching active account must have a valid linked phone number before an OTP can be issued.

The reset step accepts the identifier, OTP, and a new password. The password must contain at least 10 characters with uppercase, lowercase, numeric, and symbol characters. A successful reset hashes the new password, clears the `mustChange` flag, consumes the OTP, and revokes existing sessions.

## Admin / Principal Reset Responsibility

Authenticated Admin/Principal password reset from CampusCore user management remains an additional supported operational recovery flow for institution users.

Supported route:

- `/campus-core/users/[userId]/reset-password`

The reset flow remains tenant-scoped, branch-aware, permission-protected, hashed, and audited.

## Teacher / Staff / Office Policy

Teacher, staff, and office users may request the same non-enumerating recovery operation. A reset can complete only with an unexpired OTP sent to the contact number already linked to that account. Authenticated Principal/Admin reset remains the operational fallback when a user has no eligible phone number. Public requests never reveal the account role or recovery eligibility.

## OTP Controls

- OTPs contain six numeric digits and expire after five minutes.
- Only an HMAC hash is stored in `login_otps`; the raw OTP is never stored.
- A user has at most five verification attempts per OTP.
- Resends have a 60-second cooldown and invalidate older unconsumed OTPs for the same purpose.
- OTPs are tenant- and user-scoped and can be consumed only once.
- Administrator OTP login is limited server-side to active users with an active `TENANT_OWNER` or `ADMIN` role.
- Development mode writes the OTP to the local server console for local QA only.
- Production mode intentionally has an SMS provider adapter placeholder and does not write raw OTPs to logs.

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
- Do not expose OTP hashes or return raw OTPs from routes.
- Do not accept tenant, user, role, or permission claims from the client.
- Do not weaken admin/principal reset RBAC or tenant scope.

## Audit

The OTP and password flows write safe audit events where an account context can be resolved:

- `auth.otp.requested`
- `auth.otp.verified`
- `auth.otp.failed`
- `auth.password.reset_requested`
- `auth.password.reset_completed`
- `auth.login.password_success`
- `auth.login.otp_success`

Audit metadata records only safe purpose and outcome information. It does not include passwords, password hashes, raw OTPs, OTP hashes, reset tokens, or secrets. Unknown identifiers do not create account-specific audit rows.

## Deferred

- Production SMS provider integration
- Delivery receipts and provider retry handling
- Email provider and reset-link flow
- Invite-based onboarding
- Forced password change UX
- Dedicated password reset request queue
