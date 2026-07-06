# CampusCore Account-Management QA

Date: 2026-05-18

Status: Phase 10.3 authenticated CampusCore account-management QA completed for the local demo environment.

No FeeDesk, GradeBook, SchoolCast, native mobile app, camera scanner, exports/charts, payroll, leave management, appraisal, biometric attendance, or new product module work was included.

## Environment

- Workspace: `c:\Users\Parshav Insights\Downloads\jinacampus-phase1-campuscore\jinacampus-phase1`
- Local database: PostgreSQL through Docker Compose
- `DATABASE_URL`: local `localhost:55432` JinaCampus database
- Demo tenant: `jinacampus-demo`
- Dev server: `npm run dev` at `http://localhost:3000`

Docker Desktop was started, the Compose PostgreSQL service was running, Prisma validation/generation passed, migrations were current, and the existing seed command completed.

## Demo Users Verified

The seeded demo users were verified as active without recording passwords or session cookies:

- Admin
- Principal
- Teacher
- Staff
- Office staff

An additional local-only fake QA account under the `.test` demo domain was used for safe account mutation checks so core demo role access was not weakened.

## Routes Checked

Authenticated admin route checks passed:

- `/dashboard`
- `/campus-core/users`
- `/campus-core/users/[userId]`
- `/campus-core/users/[userId]/edit`
- `/campus-core/users/[userId]/reset-password`
- `/account/change-password`

Unauthenticated access to `/campus-core/users` returned a redirect to `/login`.

Teacher and staff access to `/campus-core/users` rendered the safe permission state, did not render the users table, and did not expose sensitive output.

## Flows Tested

User list/detail:

- Users list loaded for admin.
- User detail loaded for the QA account.
- Role assignment card rendered.
- Branch access card rendered.
- Reset password action rendered for an authorized admin.
- No `passwordHash`, `tokenHash`, Prisma, SQL, or environment-secret strings appeared in checked route output.

User edit:

- Update service succeeded for a safe fake QA account.
- Update audit event was written.
- Tenant and password fields remained service/schema protected.

Role assignment:

- Admin role assignment succeeded.
- Duplicate role assignment returned a safe domain error.
- Role removal succeeded.
- Role restoration succeeded.
- Staff role assignment attempt was rejected by RBAC.
- Audit events were written for assign/remove.

Branch assignment:

- Admin branch assignment succeeded.
- Duplicate branch access returned a safe domain error.
- Branch access removal succeeded.
- Branch access restoration succeeded.
- Staff branch assignment attempt was rejected by RBAC.
- Audit events were written for assign/remove.

Admin reset password:

- Reset service succeeded for the fake QA account.
- Reset password hash verification passed.
- Raw password was not stored.
- Password reset audit metadata did not contain raw passwords or hashes.

Change own password:

- Wrong current password was rejected safely.
- Confirmation mismatch was rejected by schema validation.
- Valid password change succeeded.
- Old password was rejected after change.
- New password verified after change.
- Raw password was not stored.
- Password change audit metadata did not contain raw passwords or hashes.

## Issue Found And Fixed

Role reassignment reactivation had a stale date-limit bug: when an inactive role assignment was reactivated, the previous `endsAt` value could remain in place. That could make a restored role look active but still ineffective in permission checks.

Fix applied:

- Reactivated role assignments now explicitly clear stale `startsAt` and `endsAt` values when no new dates are provided.
- A regression test covers reactivation of inactive role assignments.

## Sensitive Output

Checked route output and audit metadata for:

- `passwordHash`
- raw password values used during QA
- reset tokens
- `tokenHash`
- Prisma and SQL error strings
- environment-secret strings

No sensitive output was found in checked route output or audit metadata.

## Commands Run

- `docker compose up -d`
- `npx prisma validate`
- `npx prisma generate`
- `npx prisma migrate status`
- `npm run db:seed`
- DB-backed CampusCore account-management smoke script through `npx tsx`
- `npm run dev`
- Authenticated route smoke through the login API

Final quality gates are recorded in the task response.

## Remaining Risks / TODOs

- This was local browserless route/service QA, not a real-device or visual browser click-through.
- The local fake QA account may remain in the `jinacampus-demo` tenant for future account-management QA.
- Real-device Android Chrome and iOS Safari QA remains recommended before production.
- FeeDesk, GradeBook, SchoolCast, native mobile app, camera scanner, offline/PWA, exports/charts, payroll, leave management, appraisal, and biometric integration remain deferred.

## Recommended Next Repair Task

Run a focused authenticated CampusCore browser click-through with a human browser session, or proceed to the next base-stabilization repair only after confirming the current local QA state is acceptable.
