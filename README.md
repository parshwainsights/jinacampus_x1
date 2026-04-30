# JinaCampus – CampusCore Phase 1 Foundation

This repository now contains **Phase 1 only** (CampusCore foundation), intentionally excluding Academia and StaffBoard Lite implementation while preserving plug-in architecture for future phases.

## 1) Final Folder Structure

```txt
.
├─ prisma/
│  └─ schema.prisma
├─ src/
│  ├─ app/
│  │  └─ api/campus-core/
│  │     ├─ tenants/route.ts
│  │     ├─ institutions/
│  │     ├─ branches/
│  │     ├─ academic-years/
│  │     ├─ users/
│  │     ├─ roles/
│  │     ├─ settings/
│  │     └─ audit-logs/
│  ├─ core/
│  │  ├─ auth/tenant-context.ts
│  │  ├─ db/prisma.ts
│  │  ├─ rbac/guard.ts
│  │  ├─ audit/logger.ts
│  │  └─ errors/http.ts
│  └─ modules/campus-core/
│     ├─ constants/{permissions.ts,audit-events.ts}
│     ├─ schemas/index.ts
│     ├─ queries/tenant.queries.ts
│     └─ services/{tenant.service.ts,index.ts}
└─ tests/campus-core/
```

## 2) Prisma Schema for CampusCore

Implemented in `prisma/schema.prisma` with these models:
- Tenant, Institution, Branch, AcademicYear
- User, Role, Permission, RolePermission
- UserRoleAssignment, UserBranchAccess
- TenantSettings, AttendanceSetting, AuditLog

All tenant-owned entities are tenant-scoped and indexed for operational queries.

## 3) Required Enums

- `RoleCode`: TENANT_OWNER, PRINCIPAL, ADMIN, CLASS_TEACHER, TEACHER, STAFF, PARENT, STUDENT

## 4) Default Roles and Permissions

Defined in `src/modules/campus-core/constants/permissions.ts`:
- Default roles: TENANT_OWNER, PRINCIPAL, ADMIN, CLASS_TEACHER, TEACHER, STAFF, PARENT, STUDENT
- Permission keys:
  - campuscore.tenant.view
  - campuscore.institution.manage
  - campuscore.branch.manage
  - campuscore.academic_year.manage
  - campuscore.user.view
  - campuscore.user.create
  - campuscore.user.update
  - campuscore.role.view
  - campuscore.role.manage
  - campuscore.audit.view
  - campuscore.settings.manage

## 5) Tenant Context Strategy

`src/core/auth/tenant-context.ts` resolves server-side context from session:
- `userId`
- `tenantId`
- `branchIds`
- `activeBranchId`
- `activeAcademicYearId`

Rejects requests with missing user/tenant context.

## 6) RBAC Permission Utility

`src/core/rbac/guard.ts` provides `requirePermission`:
- Optional branch-level access check (`userBranchAccess`)
- Role assignment lookup (`userRoleAssignment`)
- Permission resolution via `rolePermission` + `permission`
- Throws `403` for missing access/permission

## 7) Audit Logging Utility

`src/core/audit/logger.ts` provides `logAuditEvent` with:
- tenantId, actorUserId, action, entityType, entityId
- optional branchId / academicYearId
- beforeJson / afterJson / metadataJson
- ipAddress / userAgent

Audit event constants are in `src/modules/campus-core/constants/audit-events.ts`.

## 8) Zod Schemas

`src/modules/campus-core/schemas/index.ts` includes:
- createTenantSchema
- createInstitutionSchema
- createBranchSchema
- createAcademicYearSchema
- createUserSchema
- createRoleSchema
- assignRoleSchema
- updateTenantSettingsSchema
- updateAttendanceSettingsSchema

## 9) Service-Layer Structure

- `queries/`: database read/write primitives
- `services/`: business logic with:
  - tenant context assumptions
  - permission checks
  - Zod parsing
  - audit logging

`tenant.service.ts` demonstrates this orchestration with `createTenantService`.

## 10) Server Actions / Route Handlers

Route handler scaffold added:
- `POST /api/campus-core/tenants` in `src/app/api/campus-core/tenants/route.ts`

Flow:
1. resolve session context
2. parse payload in service
3. permission guard
4. DB write
5. audit write
6. API response

## 11) Admin UI Route Map (Phase 1 target)

- `/dashboard`
- `/campus-core/institutions`
- `/campus-core/branches`
- `/campus-core/academic-years`
- `/campus-core/users`
- `/campus-core/roles`
- `/campus-core/settings`
- `/campus-core/audit-logs`

(Implementation of pages is deferred to next commits; API/service foundation is now in place.)

## 12) Test Plan (CampusCore)

1. **Unit**
   - `resolveTenantContext` rejects invalid sessions.
   - Zod schema validation failures for invalid inputs.
   - `requirePermission` denies unauthorized users.

2. **Integration**
   - `createTenantService` creates tenant and audit event.
   - branch-scoped role checks enforce boundary.

3. **Security**
   - cross-tenant requests denied.
   - no permission => 403.

4. **API**
   - `POST /api/campus-core/tenants` returns 201 on valid input.
   - returns 4xx/5xx with normalized error body.

---

## Notes for Phase 2+ Plug-in Readiness

- CampusCore primitives (`tenant context`, `RBAC`, `audit`, `settings`) are intentionally reusable by future `academia` and `staffboard` modules.
- Academia and StaffBoard data models/services are intentionally not implemented in this phase.
