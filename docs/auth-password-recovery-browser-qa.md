# Auth Password Recovery Browser QA

Date: 2026-05-29

Status: DB-backed focused browser QA passed.

## Environment

- QA method: local headless Chrome DevTools/CDP browser automation against the Next.js dev server.
- App URL type: local development server.
- Database: Docker PostgreSQL container was running and healthy.
- Migration status: database schema was up to date.
- Seed status: `npm run db:seed` completed before QA.
- Tenant used: `jinacampus-demo`.

No passwords, reset tokens, session cookies, private URLs, QR payloads, or secrets are documented here.

## Roles Tested

| Role / User Type | Result |
| --- | --- |
| Admin | Pass |
| Principal email in public recovery flow | Pass |
| Teacher | Pass |
| Staff | Pass |
| Disposable local QA staff user | Pass |

Office user seed coverage remains part of the broader auth/access governance QA. This focused pass did not require an office-specific reset route check.

## Login QA Result

Route: `/login`

Result: Pass.

- Login page rendered cleanly.
- Tenant slug, email, and password fields were present and usable.
- Password field was hidden by default.
- Show/hide password control switched between hidden and visible states.
- Toggle was `type="button"`, focusable, and had a meaningful aria label.
- `Forgot password?` link was visible and pointed to `/forgot-password`.
- Invalid credentials showed the safe generic message: `Invalid email or password.`
- Valid admin login reached the dashboard.
- Logout returned to `/login`.

## Forgot Password QA Result

Route: `/forgot-password`

Result: Pass.

- Page rendered cleanly.
- Email field was visible and labeled.
- Back-to-login link pointed to `/login`.
- Invalid email was blocked by browser email validation.
- Unknown, teacher, staff, admin, and principal emails all returned the same public-safe response shape.
- Public response did not reveal whether the email exists, account role, account status, or a specific tenant/institution.
- Page did not claim an email was sent.
- No reset token or password hash appeared.

## Show / Hide Password QA Result

Result: Pass.

Verified password controls on:

- `/login`
- `/campus-core/users/[userId]/reset-password`
- `/account/change-password`

Existing source/unit coverage also verifies the CampusCore user-create password fields use the same `PasswordInput` component.

For checked controls:

- input defaulted to hidden password mode.
- toggle changed the input to visible text mode.
- toggle changed back to hidden password mode where checked.
- toggle was `type="button"`.
- toggle was focusable and had a meaningful aria label.
- no password value was rendered as normal page text.

## Admin / Principal Reset QA Result

Route: `/campus-core/users/[userId]/reset-password`

Result: Pass.

- A disposable local QA staff user was prepared under the demo tenant and branch.
- Admin reset route loaded for the QA user.
- New password and confirm password fields were hidden by default.
- Show/hide toggles worked on both reset fields.
- Blank and short-password validation paths behaved safely.
- Confirmation mismatch showed a safe field error.
- Valid reset succeeded.
- Target QA user could log in with the reset password.
- No raw password or password hash appeared in browser UI.

Principal reset scope remains covered by the broader Base Auth Access Browser QA pass.

## Change Own Password QA Result

Route: `/account/change-password`

Result: Pass.

- Page loaded for the disposable QA user.
- Current, new, and confirm password fields were hidden by default.
- Show/hide toggles worked on all three fields.
- Wrong current password showed a safe error.
- Valid change succeeded.
- Logout and re-login with the changed password succeeded.
- The disposable QA user password was restored to the local demo seed value after QA.
- No raw password or password hash appeared in browser UI.

## Teacher / Staff Forbidden Reset Result

Result: Pass.

- Teacher could not access another user's reset-password route.
- Staff could not access another user's reset-password route.
- Both roles saw a safe forbidden state.
- No runtime error or internal details appeared.
- Teacher/staff public forgot-password submissions remained non-enumerating and did not directly reset passwords.

## Bugs Found / Fixed

No application bug was found during this focused browser QA pass.

The QA driver was adjusted during the run for headless Chrome timing and selector scoping. No product code changes were needed.

## Security Output Check

Checked browser UI did not expose:

- `passwordHash`
- raw password
- reset token
- session secret
- bearer/mobile token
- `tokenHash`
- tenant ID in public auth flow
- actor user ID
- Prisma/SQL errors
- stack traces
- internal file paths
- secrets

## Remaining Risks / TODOs

- Email provider integration remains deferred.
- Reset-token email flow remains deferred.
- Invite-based onboarding remains deferred.
- Forced password change UX remains deferred.
- Dedicated password reset request queue remains deferred.
- The disposable local QA user remains in the local demo database.

## Recommended Next Task

Run the final Base MVP freeze smoke pass for login/logout, role-aware navigation, CampusCore, Academia, StaffBoard Lite, attendance, QR flows, and responsive layout before starting any next product module.
