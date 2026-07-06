# CampusCore Institution and Branch Browser QA

## Status

- Date: 2026-05-18
- Status: Complete for local Chrome browser click-through QA
- Environment: Local Windows development environment, Docker PostgreSQL, Next.js dev server
- Browser path used: local Chrome through DevTools protocol
- Tenant used: `jinacampus-demo`
- Screenshots committed: none

No passwords, session tokens, raw QR values, or reset values are documented here.

## Roles Tested

- Admin
- Teacher
- Staff

## Preconditions Verified

- Local PostgreSQL compose service was running and healthy.
- Prisma schema validation passed.
- Prisma migrations were up to date.
- Prisma client generation passed.
- Existing seed command completed.
- Demo tenant `jinacampus-demo` existed.
- Demo institution and branch existed.
- Demo admin, principal, teacher, and staff users existed.

## Institution Flows Tested

### Login

- Admin login reached the dashboard successfully.
- The login form rendered and submitted correctly.
- No password hash, token hash, Prisma output, SQL output, stack trace, local file path, or secret appeared in visible output.

### Institution List

- Route: `/campus-core/institutions`
- Institutions page rendered with heading, create form, institution table, and row actions.
- Demo institution was visible.
- View and Edit actions were visible.
- Desktop and 390px mobile checks had no page-level horizontal overflow.
- No sensitive output appeared in visible or checked HTML output.

### Institution Detail

- Route: `/campus-core/institutions/[institutionId]`
- Institution profile page loaded.
- Institution name, code, status, tenant name, optional fields, and created/updated metadata rendered safely.
- Edit action and Back to Institutions action worked.
- Empty optional fields rendered as clean "Not set" values.
- Desktop and 390px mobile checks had no page-level horizontal overflow.

### Institution Edit

- Route: `/campus-core/institutions/[institutionId]/edit`
- Edit form loaded and prefilled existing institution name and code.
- `tenantId`, `actorUserId`, and `passwordHash` were not editable.
- A harmless temporary institution-name change saved successfully.
- Detail page reflected the temporary update.
- The original demo institution name was restored through the same browser edit flow.
- Success message was clear: "Institution profile updated."
- Audit logs for `campuscore.institution.updated` were present.
- Desktop and 390px mobile checks had no page-level horizontal overflow.

## Branch Flows Tested

### Branch List

- Route: `/campus-core/branches`
- Branches page rendered with heading, create form, branch table, and row actions.
- Demo branch was visible.
- View and Edit actions were visible.
- Desktop and 390px mobile checks had no page-level horizontal overflow.
- No sensitive output appeared in visible or checked HTML output.

### Branch Detail

- Route: `/campus-core/branches/[branchId]`
- Branch profile page loaded.
- Branch name, code, status, institution, contact/address fields, timezone, and created/updated metadata rendered safely.
- Edit action and Back to Branches action worked.
- Empty optional fields rendered as clean "Not set" values.
- Desktop and 390px mobile checks had no page-level horizontal overflow.

### Branch Edit

- Route: `/campus-core/branches/[branchId]/edit`
- Edit form loaded and prefilled existing branch name and code.
- `tenantId`, `actorUserId`, and `passwordHash` were not editable.
- A harmless temporary branch-name change saved successfully.
- Detail page reflected the temporary update.
- The original demo branch name was restored through the same browser edit flow.
- Success message was clear: "Branch profile updated."
- Audit logs for `campuscore.branch.updated` were present.
- Desktop and 390px mobile checks had no page-level horizontal overflow.

## Permission Checks

- Teacher account could not edit institution profile.
- Teacher account could not edit branch profile.
- Staff account could not edit institution profile.
- Staff account could not edit branch profile.
- Denied pages rendered the safe permission state text instead of a runtime/internal error.

## Visual / UX Observations

- Institution and branch pages rendered cleanly in local Chrome.
- Labels and required fields were clear.
- Save and cancel/back actions were visible and tappable.
- Success messages were understandable.
- Detail page metadata rendered safely.
- At 390px mobile width, checked pages had no page-level horizontal overflow:
  - `/campus-core/institutions`
  - `/campus-core/institutions/[institutionId]`
  - `/campus-core/institutions/[institutionId]/edit`
  - `/campus-core/branches`
  - `/campus-core/branches/[branchId]`
  - `/campus-core/branches/[branchId]/edit`
- Final browser run had no relevant captured Chrome console warnings or runtime exceptions.

## Bugs Found and Fixed

1. Unauthorized institution and branch profile/edit access fell through to the generic dashboard error boundary.
   - Fix: institution and branch list/detail/edit pages now check effective permissions before calling tenant-scoped profile queries and render `PermissionState` for unauthorized users.
   - Regression test coverage updated for institution and branch permission-state rendering.

## Sensitive Output Check

Visible browser output and checked HTML output did not expose:

- `tenantId`
- `actorUserId`
- `passwordHash`
- raw password
- reset token
- `tokenHash`
- raw QR token
- Prisma/SQL errors
- stack traces
- local file paths
- secrets

## Remaining Risks / TODOs

- This was local Chrome browser automation, not real-device Android Chrome or iOS Safari QA.
- No browser test framework was added.
- The demo tenant currently has one institution and one branch, so multi-branch institution-switching UX remains limited.
- FeeDesk, GradeBook, SchoolCast, exports/charts, camera scanner, native app, and offline/PWA work remain deferred.

## Recommended Next Repair Task

Continue base stabilization with a similar browser click-through for Academia and StaffBoard profile edit flows, unless a higher-priority runtime issue is confirmed first.
