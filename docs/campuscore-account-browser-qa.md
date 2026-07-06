# CampusCore Account-Management Browser QA

## Status

- Date: 2026-05-18
- Status: Complete for local Chrome browser click-through QA
- Environment: Local Windows development environment, Docker PostgreSQL, Next.js dev server
- Browser path used: local Chrome through DevTools protocol
- Tenant used: `jinacampus-demo`
- Screenshots committed: none

## Roles Tested

- Admin
- Teacher
- Staff-style local QA account

No passwords, raw session tokens, or reset values are documented here.

## Preconditions Verified

- Local PostgreSQL compose service was running and healthy.
- Prisma schema validation passed.
- Prisma migrations were up to date.
- Prisma client generation passed.
- Existing seed command completed.
- Demo tenant `jinacampus-demo` existed.
- Demo users and the local fake account-management QA account existed.

## Browser Flows Tested

### Login

- Admin login reached the dashboard successfully.
- The login form rendered cleanly.
- Tenant slug, email, and password fields were usable.
- No password hash, token hash, Prisma output, SQL output, stack trace, local file path, or secret appeared in visible output.

### Users List

- Route: `/campus-core/users`
- Users page rendered with heading, create-user form, user table, and row actions.
- Demo QA account was visible.
- View, Edit, and Reset Password actions were visible.
- No search input is currently present on this page, so search/filter browser behavior was not applicable.
- Desktop and 390px mobile checks had no page-level horizontal overflow.

### User Detail

- Route: `/campus-core/users/[userId]`
- User detail page rendered.
- Assigned roles card rendered.
- Branch access card rendered.
- Account actions card rendered.
- Edit and reset actions were reachable.
- No `passwordHash` field or input was rendered.
- Desktop and 390px mobile checks had no page-level horizontal overflow.

### User Edit

- Route: `/campus-core/users/[userId]/edit`
- Form fields were prefilled.
- Email was prefilled correctly.
- `tenantId`, `actorUserId`, and `passwordHash` were not editable.
- Safe profile field update succeeded.
- Profile field was restored after the QA mutation.
- Success message was clear.
- Desktop and 390px mobile checks had no page-level horizontal overflow.

### Role Assignment

- Role assignment UI rendered assigned and available roles.
- A teacher-like role was assigned to the local QA account.
- Duplicate role assignment was prevented by the UI after assignment.
- The assigned role was removed again.
- The local QA account retained its staff-style role for future permission checks.

### Branch Assignment

- Branch access UI rendered assigned branch access.
- Browser QA found that removing a user's only active branch access could make that user disappear from branch-scoped admin pages before the admin could restore it.
- Fix applied: removing a user's final active branch access is now blocked with a safe message.
- Verified browser message: "A user must keep at least one active branch access."
- Duplicate branch assignment was prevented by the UI while the branch remained assigned.

### Admin Reset Password

- Route: `/campus-core/users/[userId]/reset-password`
- Reset form loaded.
- Password confirmation mismatch was rejected with a safe validation message.
- Password reset succeeded for the local QA account.
- Login with the reset password succeeded.
- The local QA account password was restored through the admin reset flow after QA.
- No password value, password hash, reset token, or secret was shown.

### Change Own Password

- Route: `/account/change-password`
- Change-password page loaded.
- Wrong current password was rejected with a safe message.
- Confirmation mismatch was rejected with a safe validation message.
- Valid password change succeeded.
- Login with the changed password succeeded.
- The local QA account was restored afterward for future QA.
- No password value, password hash, reset token, or secret was shown.

### Permission Checks

- Staff-style QA account could not access `/campus-core/users`.
- Teacher account could not access `/campus-core/users`.
- Permission denial rendered a safe user-facing state, not a runtime/internal error.

## Visual / UX Observations

- Account-management pages rendered cleanly in local Chrome.
- Main actions were visible and tappable.
- Forms used readable labels and clear button text.
- Success and error messages were understandable.
- At 390px mobile width, checked pages had no page-level horizontal overflow:
  - `/campus-core/users`
  - `/campus-core/users/[userId]`
  - `/campus-core/users/[userId]/edit`
  - `/campus-core/users/[userId]/reset-password`
  - `/account/change-password`
- Chrome form warnings were found for password-related autocomplete hints, then fixed and rerun.
- Final browser run had no captured Chrome console warnings or runtime exceptions.

## Bugs Found and Fixed

1. Last branch access removal could orphan a user from branch-scoped admin pages.
   - Fix: `removeUserBranchService` now blocks removal when it would leave the target user with no active branch access.
   - Safe user-facing message: "A user must keep at least one active branch access."
   - Regression tests added.

2. Password forms triggered browser autocomplete/accessibility warnings.
   - Fix: login and account password forms now include explicit username/current-password/new-password autocomplete hints.
   - Hidden username fields are browser-friendly and not user-facing.
   - Regression test coverage updated.

## Sensitive Output Check

Visible browser output was checked for:

- `passwordHash`
- raw password
- reset token
- `tokenHash`
- raw QR token
- Prisma/SQL errors
- stack traces
- local file paths
- secrets

Result: none found in the checked browser output.

## Fake QA Account Status

- A fake local QA account remains in `jinacampus-demo`.
- It is useful for future account-management QA because it is safe to mutate and does not risk critical admin access.
- It was retained.
- Its branch access was restored to active during QA.
- Its password was restored through the admin reset flow without documenting the secret.

## Remaining Risks / TODOs

- This was local Chrome browser automation, not real-device Android Chrome or iOS Safari QA.
- The demo tenant currently has one main branch, so branch assignment add/remove UX is limited to the last-branch guard unless another safe demo branch is added later.
- No browser test framework was added.
- FeeDesk, GradeBook, SchoolCast, exports/charts, camera scanner, native app, and offline/PWA work remain deferred.

## Recommended Next Repair Task

Continue base stabilization with the next confirmed usability/runtime issue. If none is already known, run a similar browser click-through for CampusCore institution/branch profile edit flows and Academia/StaffBoard profile edit flows.
