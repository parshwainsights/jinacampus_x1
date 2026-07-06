# CampusCore Auth and Branding Browser QA

## Status

- Date: 2026-05-19
- Status: Complete for local Chrome browser click-through QA
- Environment: Local Windows development environment, Docker PostgreSQL, Next.js dev server
- Browser path used: local Chrome through DevTools protocol
- Tenant used: `jinacampus-demo`
- Screenshots committed: none

No passwords, session tokens, raw QR payloads, reset values, or secrets are documented here.

## Roles Tested

- Admin
- Principal
- Teacher
- Staff

## Preconditions Verified

- Prisma schema validation passed.
- Prisma migrations were up to date.
- Existing seed command completed.
- Demo tenant `jinacampus-demo` existed.
- Demo admin, principal, teacher, staff, and office users existed.
- Demo institution existed.
- Demo staff role context was restored to the seed-defined `STAFF` role only before staff-role QA because local role-assignment testing had left an extra demo-only role assignment.

## Login QA Result

- Route checked: `/login`
- Login page rendered cleanly in local Chrome.
- Tenant slug, email, and password fields were usable.
- Invalid credentials showed the safe user-facing message "Invalid credentials".
- Admin, principal, teacher, and staff users logged in successfully.
- Successful login redirected to `/dashboard`.
- Login output did not expose password hash, session internals, Prisma errors, stack traces, or secrets.

## Logout QA Result

- Account/topbar actions were visible after login.
- "Change Password" and "Sign out" actions were visible for authenticated users.
- Sign out redirected to `/login`.
- Visiting `/dashboard` after sign out redirected back to `/login`.
- Browser refresh after sign out did not restore the protected session.
- Logout did not produce a runtime overlay or unsafe output.

## Protected Route QA Result

Unauthenticated redirects to `/login` were verified for:

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

Authenticated behavior:

- Admin and principal could access expected CampusCore institution routes.
- Teacher could access student attendance marking and received safe forbidden states for CampusCore user/institution edit routes.
- Staff could access QR scan and received safe forbidden states for CampusCore user/institution edit routes and QR generation.

## Role Context Display QA Result

- Admin role label rendered as `ADMIN`.
- Principal role label rendered as `PRINCIPAL`.
- Teacher role label rendered as `CLASS TEACHER`.
- Staff role label rendered as `STAFF`.
- User email rendered safely in the shell.
- Admin navigation exposed CampusCore links.
- Teacher/staff navigation did not expose CampusCore user-management links.
- Visible output did not expose internal permission arrays, role assignment IDs, tenant IDs, or branch IDs.

## Institution Branding QA Result

- App shell showed the institution display name when configured.
- When display name was temporarily cleared, the app shell fell back to the institution name.
- When a valid logo URL was temporarily saved, the app shell rendered a logo image element for the institution.
- After restore, the demo institution returned to `JinaCampus Demo School` with no logo URL.
- Product identity remained visible through the "powered by JinaCampus" shell copy and sidebar product label.
- No tenant ID appeared in normal user-facing UI.

## Institution Profile / Edit QA Result

- Routes checked:
  - `/campus-core/institutions`
  - `/campus-core/institutions/[institutionId]`
  - `/campus-core/institutions/[institutionId]/edit`
- Institutions list loaded and showed the demo institution.
- Institution profile loaded and showed display name, institution name, code, status, logo state, branch count, address/contact fields, and metadata safely.
- Edit form preloaded institution name, display name, code, status, and logo URL.
- Invalid logo URL rendered a safe validation message.
- Display name updates saved successfully.
- Logo URL updates saved successfully.
- Updated display name and logo URL appeared in the app shell after navigation/revalidation.
- Original demo display name and logo URL were restored through the same browser edit flow.
- Institution update/branding audit log count increased during the pass.
- `tenantId`, `actorUserId`, `passwordHash`, token hashes, and raw QR values were not editable or visible.

## Mobile / Responsive Observations

Checked in local Chrome responsive emulation:

- 360px phone:
  - `/login`
  - `/dashboard`
  - institution profile
  - institution edit
- 768px tablet:
  - `/dashboard`
- 1280px desktop:
  - `/dashboard`

Result:

- No page-level horizontal overflow was detected.
- Institution logo/name did not crowd the header in checked widths.
- Account/logout actions remained available.
- Institution edit form remained readable and single-column on phone width.

## Visual / UX Observations

- Login and authenticated shell rendered without runtime overlay.
- Role labels were readable in the topbar.
- Institution branding fallback was clear when no logo URL was configured.
- Save/cancel actions on institution edit were visible.
- Validation and success messages were understandable.

## Bugs Found / Fixed

- No application code bug was found in this pass.
- Local demo data drift was found: the staff demo user had an extra `TENANT_OWNER` role assignment from earlier local QA. It was removed only for `staff@demo.jinacampus.test` inside `jinacampus-demo`, restoring the seed-defined staff role context. No non-demo tenant data was touched.

## Sensitive Output Check

Visible browser output was checked for:

- `passwordHash`
- raw password
- session secret
- reset token
- `tokenHash`
- raw QR token
- storage secret
- `tenantId`
- internal permission arrays
- Prisma/SQL errors
- stack traces
- internal file paths
- secrets

Result: none appeared in checked browser output.

## Remaining Risks / TODOs

- This was local Chrome browser automation, not real-device Android Chrome or iOS Safari QA.
- Logo support remains URL-based only; real file upload/storage abstraction is deferred.
- No browser/e2e framework was added.
- The demo tenant still has one primary institution/branch, so broader multi-institution or multi-branch branding switching was not covered.
- FeeDesk, GradeBook, SchoolCast, exports/charts, camera scanner, native app, and offline/PWA work remain deferred.

## Recommended Next Repair Task

Continue base stabilization only if another confirmed runtime or browser issue appears. If no higher-priority issue is confirmed, return to the Base MVP Foundation v0.1 freeze/runbook acceptance path before starting the next approved product module.
