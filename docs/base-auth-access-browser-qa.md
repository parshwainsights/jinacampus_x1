# Base Auth Access Browser QA

Date: 2026-05-28

Status: re-run passed on 2026-05-28. Native mobile work remained frozen.

## Environment

- QA method: DB-backed local browser automation through local Chrome DevTools, plus unauthenticated route redirect checks.
- App URL type: local development server.
- Database: Docker PostgreSQL was started and became healthy.
- Migration status: database schema was up to date.
- Seed status: `npm run db:seed` completed successfully during the re-run.
- Tenant used: `jinacampus-demo`.

No passwords, bearer tokens, session cookies, raw QR payloads, private URLs, or secrets are documented here.

## Roles Tested

| Role | Result |
| --- | --- |
| Admin / platform-admin style demo user | Pass |
| Principal | Pass |
| Teacher | Pass |
| Staff | Pass |
| Office staff | Pass |

## Login / Logout Results

| Role | Login | Logout | Protected redirect after logout |
| --- | --- | --- | --- |
| Admin | Pass | Pass | Pass |
| Principal | Pass | Pass | Pass |
| Teacher | Pass | Pass | Pass |
| Staff | Pass | Pass | Pass |
| Office staff | Pass | Pass | Pass |

Invalid login showed the safe generic message:

```txt
Invalid email or password.
```

No password hash, raw password, session secret, token hash, QR token, Prisma error, SQL error, stack trace, or internal path appeared in checked browser UI.

The 2026-05-28 re-run also checked unauthenticated access to 10 protected routes. Each returned `307` to `/login`:

- `/dashboard`
- `/campus-core/institutions`
- `/campus-core/branches`
- `/campus-core/users`
- `/academia`
- `/academia/attendance/mark`
- `/staffboard`
- `/staffboard/attendance`
- `/staffboard/attendance/qr`
- `/staffboard/attendance/scan`

## Session / Context Results

- Institution display name appeared in the app shell.
- Institution logo/fallback behavior rendered safely.
- Branch context appeared as Main Branch.
- Active academic year appeared as `2026-27`.
- Role labels were readable in the topbar.
- Navigation reflected the logged-in role permissions.
- No tenant ID or internal role-assignment IDs appeared as normal user-facing labels.

Current multi-branch UX remains limited to the existing branch-cookie behavior. The demo tenant has one active branch, so multi-branch switching was not exercised.

## Role-Aware Navigation Results

- Admin saw CampusCore governance, Academia, and StaffBoard operational navigation.
- Principal saw institution-level governance and operational navigation.
- Teacher saw student attendance and self-scan focused navigation without user/role governance.
- Staff saw minimal dashboard and Scan QR navigation without admin or Academia management.
- Office staff saw StaffBoard operational tools and did not see user/role governance after stale seed role cleanup.

Navigation hiding was treated as UX only; forbidden route checks were also performed.

## User Creation Results

Principal-created fake local QA users were created inside the demo tenant and current branch using browser forms.

Verified:

- tenant and branch were derived server-side.
- role options did not include platform/admin/principal roles for principal.
- the created user appeared in the users list.
- password fields were not displayed after save.
- governance audit rows were written.

Teacher and staff user-management access returned safe forbidden/error states.

The re-run created another fake local QA user with a `.test` address for form and password validation. No real personal data was used.

## Role Assignment Results

Verified as principal with a fake local QA user:

- assigned roles loaded.
- assignable role options loaded.
- allowed role assignment succeeded.
- role removal succeeded.
- platform/admin/principal roles were not offered.
- teacher and staff role-assignment routes returned safe forbidden/error states.
- audit rows were written for role changes.

Duplicate assignment was prevented by the UI because already-assigned roles were removed from the assignment dropdown.

## Branch Assignment Results

Verified as principal with a fake local QA user:

- assigned branch loaded.
- only the accessible demo branch was offered.
- duplicate branch assignment was disabled.
- removing the only active branch failed safely with a user-facing guard.
- teacher and staff branch-assignment routes returned safe forbidden/error states.

Full remove-and-reassign success could not be exercised because the demo tenant has only one active branch and the app correctly prevents leaving a user with no branch access.

## Password Results

Admin/principal reset password:

- mismatch validation passed.
- valid reset succeeded for a fake local QA user.
- target user could log in with the reset password.
- no password hash or raw password appeared in UI output.

Change own password:

- wrong current password failed safely.
- valid change succeeded.
- logout and login with the changed password succeeded.
- no raw password values were documented.

## Forbidden State Results

Teacher and staff were checked against admin/governance routes:

- `/campus-core/users`
- `/campus-core/roles`
- institution edit route
- `/staffboard/attendance/qr`
- `/staffboard/attendance`

Result: pass. Each route showed a safe forbidden/error state or redirect without runtime errors or sensitive internals.

## Institution Branding Results

As principal:

- institution profile loaded.
- display name and logo/fallback appeared.
- invalid logo URL was blocked by safe field validation.
- display name/logo URL update succeeded.
- dashboard/app shell reflected the updated branding.
- original demo branding was restored through the browser form.

As teacher:

- app shell branding was visible.
- institution edit route returned a safe forbidden/error state.

## Bugs Found / Fixed

No new application bug was found during the latest DB-backed browser QA re-run.

Earlier QA in this repair cycle found and fixed:

1. Web invalid-login message did not match the current safe QA contract. It now returns and displays `Invalid email or password.` for bad credentials and malformed login payloads.
2. Re-running seed over older local data left the office demo user with a stale active `ADMIN` assignment. The demo seed now deactivates stale tenant role assignments for deterministic demo users before applying their intended role set.

One dev-server/HMR issue was observed while hot-reloaded code was active: `/campus-core/users` temporarily stayed on the loading fallback in the automated browser. Restarting the dev server resolved it; the restarted browser pass completed.

The re-run did not reproduce the HMR loading issue.

## Security Output Check

Checked browser UI did not expose:

- `passwordHash`
- raw password
- reset token
- session secret
- bearer/mobile token
- `tokenHash`
- raw QR token
- `tenantId`
- `actorUserId`
- Prisma/SQL errors
- stack traces
- internal file paths
- private URLs
- secrets

## Remaining Risks / TODOs

- Full multi-branch switcher UX remains future work; this pass only verified the current single-branch demo context.
- Cross-tenant global operator console remains deferred.
- Fake local QA users created during browser QA remain in the local demo database.
- Real-device QA remains separate from this Base MVP auth/access browser pass.

## Recommended Next Task

Run a final Base MVP freeze smoke pass after this governance QA is accepted, then choose the next product module intentionally without resuming native mobile work until base auth/access is accepted.

## Re-run Commands

Latest re-run commands completed after QA:

| Command | Result |
| --- | --- |
| `docker ps` | Passed; local PostgreSQL container was healthy. |
| `npx prisma migrate status` | Passed; database schema was up to date. |
| `npm run db:seed` | Passed. |
| `npx prisma format` | Passed. |
| `npx prisma validate` | Passed. |
| `npx prisma generate` | Passed. |
| `npm run typecheck` | Passed. |
| `npm test` | Passed; 65 files / 557 tests. |
| `npm run build` | Passed. |
| `git diff --check` | Passed. |
| `npm pkg get scripts.lint` | Returned `{}`; no lint script exists. |
