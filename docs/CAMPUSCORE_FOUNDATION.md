# CampusCore Foundation Map

CampusCore is the Phase 1 platform foundation for tenant, institution, branch, academic year, user, role, permission, settings, attendance settings, and audit-log ownership.

## Service Layer

- `src/modules/campus-core/schemas.ts` validates external CampusCore inputs with Zod.
- `src/modules/campus-core/actions.ts` converts form data into validated service inputs.
- `src/modules/campus-core/services/index.ts` owns protected mutations and dashboard service logic.
- `src/modules/campus-core/queries.ts` owns tenant-scoped read models for UI routes.
- `src/lib/tenant/context.ts` resolves authenticated tenant, user, branch, academic-year, IP, and user-agent context from trusted server state.
- `src/lib/rbac/require-permission.ts` enforces permission checks with tenant, branch, and academic-year scoped role assignments.
- `src/lib/audit/audit-log.ts` writes critical audit events and supports Prisma transactions.

## Seed Plan

- Permission registry: `src/lib/rbac/permissions.ts`
- CampusCore permissions: `src/modules/campus-core/permissions.ts`
- First-development seed constants: `src/modules/academia/permissions.ts`, `src/modules/staffboard-lite/permissions.ts`
- Default role mapping: `src/lib/rbac/roles.ts`
- Seed entrypoint: `prisma/seed.ts`
- Seed steps: create global permission rows, bootstrap tenant defaults, create tenant-scoped roles, attach tenant-scoped role permissions, create demo owner with branch access.

## Admin UI Route Map

| Route | Purpose | Primary permission |
| --- | --- | --- |
| `/dashboard` | CampusCore overview cards | `campuscore.tenant.view` |
| `/campus-core/institutions` | Manage tenant institutions | `campuscore.institution.manage` |
| `/campus-core/branches` | Manage branches and branch access boundary | `campuscore.branch.manage` |
| `/campus-core/academic-years` | Create and activate academic years | `campuscore.academic_year.manage` |
| `/campus-core/users` | Manage invited users, roles, and branch access | `campuscore.user.view` |
| `/campus-core/roles` | Manage tenant roles and permissions | `campuscore.role.view` |
| `/campus-core/settings` | Manage tenant and attendance defaults | `campuscore.settings.manage` |
| `/campus-core/audit-logs` | Review critical CampusCore events | `campuscore.audit.view` |

## Scope Guardrails

- CampusCore services must derive `tenantId`, `branchId`, and `userId` from server context, not client claims.
- Tenant-owned records include direct `tenantId` unless they are global reference rows.
- Branch-scoped actions must validate branch access before reads or writes.
- Critical mutations must call `writeAuditLog` inside the same transaction where practical.
- Academia and StaffBoard Lite are represented only by permission seed constants in Phase 1.
