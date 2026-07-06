# UI Motion and Delete Governance

Date: 2026-06-02

Status: Phase 11.2 implemented as Base MVP stabilization.

## Scope

This pass adds subtle interface motion and confirm-first lifecycle actions for existing Base MVP records. It does not add new product modules.

## Motion Rules

- Motion is limited to small fades, slide-up entrances, hover elevation, and existing loading spinner behavior.
- Motion uses CSS utilities only: `motion-fade-in`, `motion-slide-up`, and `motion-soft-hover`.
- No animation dependency was added.
- `prefers-reduced-motion: reduce` disables entrance animations and transform hover movement.
- Motion is applied to shared operational surfaces: dashboard header/cards, quick actions, responsive tables, badges, empty/error/loading states, and lifecycle warning cards.

## Delete Governance

JinaCampus Base MVP does not use broad hard deletes for operational records.

Preferred verbs:

- User: Deactivate
- Staff profile: Deactivate
- Class/section/subject: Deactivate
- Student: Deactivate
- Enrollment: Cancel
- Role assignment: Remove assignment
- Branch assignment: Remove access

Hard delete remains deferred unless all of these are true:

- There are no dependent business records.
- The actor has explicit permission.
- Tenant and branch scope are resolved server-side.
- The action is audited.
- The UI requires explicit confirmation.

## User Lifecycle Actions

User deactivation now uses a dedicated permission:

- `campuscore.user.deactivate`

Server behavior:

- Requires authenticated tenant context.
- Requires `campuscore.user.deactivate`.
- Uses server-derived tenant/branch governance scope.
- Blocks self-deactivation.
- Blocks principal/non-platform deactivation of platform administrator accounts.
- Updates user status to `DEACTIVATED`.
- Revokes active sessions.
- Writes `campuscore.user.deactivated`.
- Does not hard delete users.

The normal user edit form no longer exposes account status as a routine profile field. Deactivation is a separate warning card with explicit checkbox confirmation.

## Staff Lifecycle Actions

Staff profile deactivation uses the existing `deactivateStaffProfile` service.

Server behavior:

- Requires `staffboard.staff.deactivate`.
- Scopes by tenant and accessible branch.
- Updates `employmentStatus` to `INACTIVE`.
- Writes staff deactivation audit.
- Does not hard delete staff profiles or attendance history.

## Academia Lifecycle Actions

Existing audited service-layer status changes are now exposed through confirm-first edit-page controls:

- Class: deactivate
- Section: deactivate
- Subject: deactivate
- Student: deactivate
- Enrollment: cancel

These actions preserve historical records and keep attendance/report integrity intact.

## Role Boundaries

- Super Admin / platform admin can use lifecycle actions within their allowed platform/tenant scope.
- Principal/Admin can use institution-scoped lifecycle actions only where permissions and branch access allow.
- Teachers and staff do not receive lifecycle governance permissions by default.
- UI hiding is only a convenience; server-side RBAC remains authoritative.

## Security Rules

Lifecycle UI and action responses must not expose:

- `passwordHash`
- `tokenHash`
- raw password
- raw QR token
- session secret
- tenant IDs in normal UI
- actor user IDs
- Prisma/SQL errors
- stack traces

## QA Checklist

- Verify lifecycle controls are visible only to authorized roles.
- Verify confirmation checkbox is required.
- Verify user deactivation revokes sessions.
- Verify self-deactivation is blocked.
- Verify teacher/staff cannot access governance actions.
- Verify deactivated records are retained for history.
- Verify dashboard/table motion respects reduced-motion settings.
- Verify no horizontal overflow on mobile lifecycle cards.

## Remaining Risks / TODOs

- DB-backed browser QA for the new lifecycle controls is still recommended.
- Full cross-tenant negative QA still needs broader fixtures.
- Hard-delete workflows remain intentionally deferred.
- Multi-branch switcher redesign remains deferred.
