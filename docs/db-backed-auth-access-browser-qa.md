# DB-Backed Auth/Access Browser QA

Date: 2026-05-30

Status: Passed after focused stabilization fixes.

## Scope

This QA pass covered Base MVP authentication and access governance with seeded local data for `jinacampus-demo`.

Native mobile work remained frozen. FeeDesk, GradeBook, SchoolCast, invite email flow, reset-token email flow, forced password change, full branch switcher redesign, and global cross-tenant operator console work were not started.

## Environment

- Docker/PostgreSQL: running after Docker Desktop/PostgreSQL recovery.
- Database: local PostgreSQL through the project Docker Compose setup.
- Migration status: Prisma reported the database schema is up to date.
- Seed status: seed command completed successfully.
- Browser QA method: local browser automation against the dev server.
- Tenant used: `jinacampus-demo`.
- Demo roles tested: Super Admin/Admin, Principal, Teacher, Staff, Office Staff.

No passwords, session secrets, reset tokens, QR payloads, bearer tokens, or private URLs are documented here.

## Seeded Data Checks

Verified local seeded records exist for:

- Active demo tenant.
- Active demo institution.
- Active demo branch.
- Active academic year.
- Demo users for Admin, Principal, Teacher, Staff, and Office Staff.
- Demo role assignments.
- Demo branch assignments.

## Role Matrix

| Role | Login | Logout | Dashboard | Navigation | User Management | Role Assignment | Branch Assignment | Password | Institution Branding | Forbidden States |
|---|---|---|---|---|---|---|---|---|---|---|
| Super Admin/Admin | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass |
| Principal | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass |
| Teacher | Pass | Pass | Pass | Pass | Forbidden | Forbidden | Forbidden | Own only pass | View pass | Pass |
| Staff | Pass | Pass | Pass | Pass | Forbidden | Forbidden | Forbidden | Own only pass | View pass | Pass |
| Office Staff | Pass | Pass | Pass | Scope-based pass | Forbidden | Forbidden | Forbidden | Own only pass | View pass | Pass |

## Login/Logout Results

Passed.

- `/login` rendered successfully.
- Show/hide password toggle worked and did not submit the form.
- Invalid credentials returned the safe message.
- Valid seeded users reached role-appropriate authenticated pages.
- Account/logout flow cleared the session and returned to `/login`.
- Protected routes redirected after logout.
- No password hashes, raw passwords, session secrets, Prisma errors, or stack traces appeared in the final checked UI/log output.

## Forgot-Password Results

Passed.

- `/forgot-password` rendered successfully.
- Invalid email validation worked.
- Unknown, teacher/staff, and admin/principal emails produced the same public-safe response shape.
- The response did not reveal whether the account exists, the user role, tenant, institution, reset token, or password hash.
- The UI did not falsely claim that email was sent when email provider integration is deferred.

## Super Admin/Admin Result

Passed for current MVP routes.

- Authenticated dashboard loaded.
- CampusCore institutions, branches, users, roles, and audit routes were accessible according to seeded permissions.
- Academia and StaffBoard routes were accessible according to seeded permissions.
- Current limitation: a global cross-tenant operator console is deferred, so this pass verifies the seeded platform/admin behavior available in the current app rather than a separate cross-tenant console.

## Principal Result

Passed.

- Dashboard and institution branding loaded for the assigned institution/branch.
- Institution profile route was visible.
- Institution branding validation rejected invalid logo URLs safely.
- Principal could access institution-scoped user management.
- Principal-created disposable QA users were scoped to the demo institution/branch.
- Role options were filtered and did not expose Super Admin assignment.
- Branch options were scoped to allowed branch access.
- Platform-only routes remained unavailable.

## Teacher Result

Passed after stabilization fix.

- Teacher dashboard and teacher-permitted attendance routes loaded.
- Teacher could access student attendance and staff QR self-scan routes where permitted.
- Teacher could access own password change.
- Teacher could view student records without create or edit controls.
- CampusCore users, roles, QR generation, staff attendance admin/correction, role assignment, branch assignment, and other admin-only routes returned safe forbidden/redirect states.

## Staff Result

Passed after stabilization fix.

- Staff dashboard/self-service flow loaded.
- Staff could access staff QR self-scan and own password change.
- Staff could not access user management, role management, student master management, QR generation, staff attendance admin/correction, or platform routes.
- Forbidden states were safe and did not leak internal errors.

## Office Staff Result

Passed.

- Office Staff authenticated successfully.
- StaffBoard operational routes matched seeded permissions.
- CampusCore governance routes, platform routes, role assignment, and branch assignment were not accessible unless explicitly permitted.
- Forbidden states were safe.

## User Creation Result

Passed.

- Principal user creation flow created disposable local QA users under the demo institution/branch.
- Tenant/institution/branch were derived server-side by the application flow.
- Role and branch options were filtered.
- Password fields used show/hide controls.
- Created users appeared in the user list and could authenticate where tested.

## Role Assignment Result

Passed.

- Assigning an allowed role to a disposable QA user succeeded.
- Removing a test role through the UI flow was exercised successfully.
- Duplicate assignment was prevented safely by the UI/state.
- Principal could not assign Super Admin.
- Teacher/staff could not access role assignment UI.
- Disposable local QA users remain scoped to the demo tenant/branch. Some repeated QA accounts may retain extra allowed test role assignments and can be cleaned up through the app/service flow if a pristine local demo database is needed.

## Branch Assignment Result

Passed with current one-branch demo data.

- Assigned branch loaded for disposable QA users.
- The principal saw only scoped branch options.
- Duplicate branch assignment was prevented safely by the UI/state.
- Teacher/staff could not access branch assignment UI.
- Current limitation: true multi-branch negative browser QA needs a second branch/tenant fixture.

## Password Result

Passed.

- Admin/principal reset route loaded for an allowed disposable QA user.
- Blank, short password, and confirmation mismatch validation worked.
- Valid reset succeeded.
- The disposable target user could log in with the reset password.
- Own password change rejected wrong current password, accepted a valid change, and allowed login afterward.
- No raw password or password hash appeared in checked UI/log output.

## Institution Branding Result

Passed.

- Institution display name/logo fallback appeared in the app shell and profile routes.
- Invalid logo URL validation was safe.
- Teacher/staff could view branding but could not edit branding.
- No runtime error appeared for the checked branding flows.

## Tenant/Institution Isolation Result

Passed within the available seeded data.

- User lists, branch options, dashboard data, Academia data, and StaffBoard data were scoped to the logged-in user's assigned tenant/branch context.
- Teacher/staff direct URL access to unauthorized pages produced safe forbidden/redirect states.
- Cross-tenant negative browser QA remains limited because this local seed currently uses one demo tenant.

## Bugs Found/Fixed

1. CampusCore roles and audit log routes threw forbidden permission errors through the route error boundary for unauthorized users. Fixed by rendering `PermissionState` after checking effective permissions.
2. Student list access returned a generic load error for staff and exposed create/edit controls to view-only users. Fixed by adding an explicit `academia.student.view` guard, gating create controls on `academia.student.create`, and gating row edit actions on `academia.student.update`.
3. Docker/PostgreSQL became unavailable during the earlier QA run. Recovered by restarting Docker/PostgreSQL and rerunning the final browser QA. This was an environment interruption, not an app bug.

## Disposable QA User Status

Disposable local `.test` QA users remain in the local demo database for future QA. They are scoped to the demo tenant/branch and do not contain real personal data. Repeated QA attempts may leave extra allowed test role assignments on some disposable users; clean them up through the app/service flow if a pristine local demo database is needed. Their passwords are not documented.

## Security Output Check

Passed in the final checked browser and server-log pass.

No checked output exposed:

- `passwordHash`
- raw password
- reset token
- session secret
- bearer/mobile token
- `tokenHash`
- raw QR token
- `actorUserId`
- Prisma/SQL errors
- stack traces
- internal file paths
- private URLs or secrets

## Remaining Risks/TODOs

- Add a second demo tenant/branch fixture for stronger cross-tenant and multi-branch negative browser QA.
- Global cross-tenant operator console remains deferred.
- Full institution/branch switcher redesign remains deferred.
- Invite email flow remains deferred.
- Reset-token email flow remains deferred.
- Forced password change UX remains deferred.
- Native/mobile work remains frozen until Base MVP release readiness is accepted.

## Recommended Next Task

Run a final Base MVP freeze smoke/release acceptance pass, or add a second safe demo tenant/branch fixture and run targeted cross-tenant/multi-branch negative QA before starting any new product module.
