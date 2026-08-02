# Auth Password Recovery and Mandatory Password Change

Date: 2026-07-30

Status: administrator-assisted public recovery and central `mustChange` enforcement implemented.

## Login Model

JinaCampus uses user-based login. Institutions and roles do not log in. School
users enter School ID plus employee code or email and authenticate with a
registered passkey or case-sensitive password. Platform Administrators use the
separate Administrator Portal.

The public phone-OTP login and public OTP password-reset routes are not exposed.

## Public Forgot Password Behavior

The login page links to `/forgot-password`. The public form accepts:

- School ID
- Account email

For any syntactically valid request, the public response remains generic and
does not reveal whether the school, email, or user exists:

```text
If this account is eligible for password recovery, instructions will be provided. Institution staff should contact their Principal/Admin for password reset.
```

No email or OTP delivery is claimed because no approved delivery provider or
reset-token flow exists. The route does not accept tenant IDs, user IDs, roles,
permissions, passwords, or reset tokens from the client.

When an active account can be resolved inside the submitted School ID, the
server may write a safe `auth.password_recovery_requested` audit record. Unknown
accounts return the same public shape without creating an account-specific
record.

## Administrator-Assisted Reset

Authenticated Principal user management remains the supported operational
recovery flow for school users:

- `/campus-core/users/[userId]/reset-password`

The reset requires `campuscore.user.reset_password` and server-derived tenant
and branch scope. A Principal cannot reset a platform Administrator or a user
outside the Principal's governance scope. Teacher, Staff, and Office Staff do
not receive reset authority by default.

A successful administrative reset:

- hashes the new temporary password
- sets `mustChange=true`
- revokes all active sessions for the target user
- removes target-user passkeys
- activates an invited user where applicable
- writes a safe audit event without password material

Removing passkeys on administrative reset prevents a previously enrolled
credential from bypassing the newly issued temporary-password lifecycle.

## Mandatory Password Change

`mustChange` is enforced centrally by tenant-context resolution, not only by
navigation hiding.

- Password and passkey login return the change-password route for a temporary credential.
- Protected web contexts reject the session until the password is changed.
- Mobile protected-token resolution rejects a temporary credential.
- `/api/auth/me` exposes only the safe `passwordChangeRequired` flag.
- Logout and the change-own-password route remain available.
- Passkey registration is unavailable until the temporary password is replaced.

A successful own-password change:

- verifies the current password
- hashes the new password
- clears `mustChange`
- keeps the current session where it can be identified
- revokes the user's other active sessions
- writes `user.password_changed` with safe metadata

## Show Password UX

Password inputs include a keyboard-accessible show/hide control on:

- `/login`
- `/account/change-password`
- `/campus-core/users/[userId]/reset-password`
- CampusCore user creation where an initial password is present

The toggle is a non-submit button, defaults to hidden, and does not log or
persist the password.

## Security Rules

- Do not reveal public account, role, school, or recovery eligibility.
- Do not store plaintext passwords.
- Do not expose password hashes, session tokens, OTP hashes, or reset tokens.
- Do not log passwords or WebAuthn credential payloads.
- Do not trust tenant, user, role, permission, or branch claims from clients.
- Do not permit school login for a platform Administrator.
- Do not let public recovery change a password.
- Do not weaken Principal reset scope.

## Audit

Relevant audit actions include:

- `auth.password_recovery_requested`
- `auth.login.password_success`
- `auth.login.passkey_success`
- `user.password_reset`
- `user.password_changed`
- `user.passkey_registered`
- `user.passkey_removed`

Audit metadata may contain safe outcome, authentication-method, session-revoke,
and passkey-removal counts. It must not contain raw passwords, password hashes,
session tokens, WebAuthn challenges, OTPs, or reset secrets.

## Deferred

- Email provider integration
- Signed reset-token email flow
- SMS recovery provider
- Password reset request queue and operator inbox
- Invite-based onboarding
- Forced passkey enrollment
