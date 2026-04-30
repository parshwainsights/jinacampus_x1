# AGENTS.md — JinaCampus Codex Operating Rules

## 0. Mandatory Read Order
Before making any code change, Codex must read these files in this order:

1. `AGENTS.md`
2. `PRD.md`
3. `TASKS.md`
4. Existing project files, if present

If repository code conflicts with this document, treat this document as the operating rule and preserve existing working behavior unless explicitly asked to refactor it.

## 1. Product Identity
JinaCampus is a production-grade, multi-tenant School Management SaaS for Indian schools.

Brand line:

> JinaCampus — The Complete School OS, powered by Parshav Insights

This is not a demo CRUD app. Every implementation must respect SaaS-grade tenant isolation, RBAC, auditability, data integrity, and maintainable architecture.

## 2. First Development Scope
Codex must build only these modules in the first development phase:

1. CampusCore
2. Academia
3. StaffBoard Lite

Do not implement these modules yet unless a later task explicitly asks:

- GradeBook
- FeeDesk
- SchoolCast full module
- InsightBoard full analytics
- CampusFleet
- BookNest
- AssetRoom
- Full StaffBoard HR
- Payroll
- Leave balance automation
- Biometric attendance
- Native mobile apps

Small future-ready placeholders are allowed only when required by the approved architecture, such as `NotificationOutbox` for future SchoolCast absence alerts.

## 3. Default Tech Stack
Use the following defaults:

- Next.js App Router
- TypeScript, strict mode
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- Zod validation
- Server Actions and/or Route Handlers
- Secure session-based authentication
- Permission-based RBAC
- Modular monolith architecture
- Docker-ready project structure

Prefer `pnpm` if a `pnpm-lock.yaml` exists. Otherwise follow the package manager already used in the repo. Do not introduce a new package manager.

## 4. Architecture Rules
JinaCampus must always be multi-tenant.

Required model:

- Shared database
- Shared schema
- Strict `tenantId` scoping
- Institution hierarchy
- Branch-level operations
- Academic-year scoping where relevant
- Tenant-scoped roles and permissions
- Audit logs for critical actions

Every tenant-owned table must include `tenantId`.

Operational branch data must include `branchId` where relevant.

Academic data must include `academicYearId` where relevant.

Never trust client-provided `tenantId`, `branchId`, `userId`, role, or permission claims.

## 5. Server-Side Security Rules
Every protected mutation and query must verify:

1. Authenticated user
2. Tenant context
3. Branch access, if branch-scoped
4. Required permission
5. Zod-validated input
6. Tenant-safe database query
7. Audit log when the action is critical

Frontend permission checks are allowed only for UX. They must never be the only enforcement layer.

## 6. Module Boundaries
Keep business logic out of React components.

Use modular boundaries:

```txt
src/modules/<module>/schemas
src/modules/<module>/services
src/modules/<module>/queries
src/modules/<module>/components
src/modules/<module>/permissions.ts
src/modules/<module>/audit-events.ts
```

Shared utilities belong in:

```txt
src/lib/auth
src/lib/rbac
src/lib/tenant
src/lib/audit
src/lib/db
src/lib/errors
src/lib/pagination
src/lib/dates
src/lib/money
```

## 7. Database Rules
Use normalized Prisma models with:

- Relations
- Indexes
- Unique constraints
- Enums for lifecycle/status fields
- `createdAt`
- `updatedAt`
- `createdById` where useful
- `updatedById` where useful
- Tenant scoping
- Branch scoping where applicable
- Academic-year scoping where applicable

Use Prisma transactions for multi-step writes, especially:

- User and role assignment
- Student + guardian linking
- Enrollment changes
- Student attendance submission
- Student attendance correction
- Staff QR generation
- Staff check-in/check-out
- Staff attendance correction

## 8. RBAC Rules
Use permission-based RBAC, not only hardcoded roles.

Default seeded roles:

- `TENANT_OWNER`
- `PRINCIPAL`
- `ADMIN`
- `CLASS_TEACHER`
- `TEACHER`
- `STAFF`
- `PARENT`
- `STUDENT`

Use permission strings such as:

```txt
campuscore.user.create
academia.attendance.mark
staffboard.attendance.self_scan
```

Every service method that reads or writes protected data must require an explicit permission check.

## 9. Attendance Rules
Student attendance MVP:

- Daily Full-Day Class-Section Attendance
- Class-section selection
- Active enrolled student list
- Mark all present
- Individual status changes
- Teacher submit
- Admin correction
- Auto-locking
- Parent absence alert placeholder
- Audit logs
- Reports

Staff attendance MVP:

- StaffBoard Lite
- Staff profiles
- Staff categories
- QR scan attendance
- Check-in/check-out
- Late/half-day/absent statuses
- Manual correction with reason
- Reports
- Dashboard cards

QR security rules:

- QR tokens must be tenant-scoped and branch-scoped
- QR tokens must be time-bound
- Store token hash, not reusable raw token
- Reject expired tokens
- Reject wrong-branch scans unless explicitly allowed
- Prevent duplicate check-in/check-out misuse
- Staff must be authenticated before scanning

## 10. Audit Logging Rules
Audit critical actions in CampusCore, Academia, and StaffBoard Lite.

Audit log must capture where applicable:

- `tenantId`
- `branchId`
- `academicYearId`
- `actorUserId`
- `action`
- `entityType`
- `entityId`
- `beforeJson`
- `afterJson`
- `metadataJson`
- `ipAddress`
- `userAgent`
- `createdAt`

Never silently change attendance, roles, users, student records, enrollment, or staff records without an audit event.

## 11. UI/UX Rules
The UI must feel:

- Clean
- Calm
- Modern
- Trustworthy
- School-friendly
- Operationally efficient

Use:

- Sidebar navigation
- Top bar with tenant, branch, and academic year context
- Role-aware navigation
- Accessible forms
- Searchable/filterable/paginated tables
- Loading states
- Empty states
- Error states
- Success toasts
- Mobile-friendly attendance screens

Avoid flashy UI that slows school office work.

## 12. Coding Standards
Use strict TypeScript.

Required standards:

- No `any` unless justified with a comment
- Zod validation for all external inputs
- Typed service responses or explicit error handling
- No business logic inside UI components
- No raw SQL unless justified
- No missing `tenantId` in tenant-owned queries
- No broad `findMany` without tenant filters
- No destructive deletes for audited business records unless explicitly approved

Prefer soft lifecycle statuses over deletion for records such as users, staff, students, enrollments, and attendance.

## 13. Testing and Quality Gates
Before marking a task complete, run the available checks from the repo.

Typical commands, adjusted to the actual repo:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

If a command does not exist, state that clearly and do not invent success.

At minimum, add or propose tests for:

- Tenant isolation
- Permission denial
- Attendance submission
- Attendance correction
- QR expiry
- Wrong-branch QR scan
- Duplicate staff check-in

## 14. Response Discipline
When Codex replies, it must include:

1. What changed
2. Files changed
3. Commands run
4. Tests/checks result
5. Known risks or follow-up tasks

Do not claim completion if tests were not run.

## 15. Task Discipline
Follow `TASKS.md` strictly.

Do not jump to later phases unless all prior phase acceptance criteria are satisfied or the user explicitly changes priority.

If a task is ambiguous, choose the safest MVP implementation that preserves tenant isolation, RBAC correctness, and auditability.
