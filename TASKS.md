# TASKS.md — JinaCampus First Development Task Plan

## Operating Rule
Codex must follow these tasks in order unless the user explicitly changes priority.

Do not jump to later modules before completing the foundation tasks they depend on.

Each completed task must include:

- Files changed
- Key decisions made
- Commands run
- Test/check result
- Known follow-ups

## Phase 0 — Repository Discovery and Setup

### 0.1 Inspect Existing Repository
- [ ] Identify package manager.
- [ ] Identify Next.js version and App Router structure.
- [ ] Identify TypeScript config.
- [ ] Identify Prisma setup.
- [ ] Identify auth setup, if any.
- [ ] Identify existing UI/component system.
- [ ] Identify test/lint/typecheck/build commands.

Acceptance criteria:

- Codex reports actual repo structure before changing files.
- Codex does not overwrite existing architecture blindly.

### 0.2 Create/Confirm Base Folder Structure
Create or align to this structure:

```txt
src/app
src/components
src/components/ui
src/modules/campus-core
src/modules/academia
src/modules/staffboard-lite
src/lib/auth
src/lib/rbac
src/lib/tenant
src/lib/audit
src/lib/db
src/lib/errors
src/lib/pagination
src/lib/dates
prisma
```

Acceptance criteria:

- Module boundaries are clear.
- Shared utilities are not duplicated inside modules.

## Phase 1 — CampusCore Foundation

### 1.1 Prisma CampusCore Schema
Create/extend Prisma schema for:

- [ ] `Tenant`
- [ ] `Institution`
- [ ] `Branch`
- [ ] `AcademicYear`
- [ ] `User`
- [ ] `Role`
- [ ] `Permission`
- [ ] `RolePermission`
- [ ] `UserRoleAssignment`
- [ ] `UserBranchAccess`
- [ ] `TenantSettings`
- [ ] `AttendanceSetting`
- [ ] `AuditLog`

Acceptance criteria:

- Every tenant-owned table includes `tenantId`.
- Branch-level records include `branchId` where required.
- Academic-year records are properly scoped.
- Indexes and unique constraints exist.
- No single-school assumptions.

### 1.2 CampusCore Enums
Add enums for lifecycle/status fields, including where applicable:

- [ ] Tenant status
- [ ] User status
- [ ] Academic year status
- [ ] Branch status

Acceptance criteria:

- Status fields do not rely on loose strings.

### 1.3 Permission Seed Plan
Create seed constants for permissions:

- [ ] CampusCore permissions
- [ ] Academia permissions
- [ ] StaffBoard Lite permissions

Acceptance criteria:

- Permission strings are centralized.
- Permission names match `PRD.md`.

### 1.4 Default Role Seed Plan
Create seed mapping for:

- [ ] `TENANT_OWNER`
- [ ] `PRINCIPAL`
- [ ] `ADMIN`
- [ ] `CLASS_TEACHER`
- [ ] `TEACHER`
- [ ] `STAFF`
- [ ] `PARENT`
- [ ] `STUDENT`

Acceptance criteria:

- Roles are tenant-scoped where appropriate.
- Role-permission mappings are explicit.

### 1.5 Tenant Context Resolver
Implement tenant context utilities:

- [ ] Resolve current user
- [ ] Resolve tenant context
- [ ] Resolve active branch, if selected
- [ ] Resolve active academic year
- [ ] Prevent trusting client-supplied tenant claims

Acceptance criteria:

- Protected services receive verified tenant context.
- Branch access is validated where required.

### 1.6 RBAC Guard
Implement permission guard:

```ts
requirePermission({
  userId,
  tenantId,
  branchId,
  permission,
})
```

Acceptance criteria:

- Denies unauthenticated users.
- Denies missing permissions.
- Denies wrong tenant.
- Denies wrong branch where applicable.

### 1.7 Audit Logger
Implement audit utility:

```ts
writeAuditLog({
  tenantId,
  branchId,
  academicYearId,
  actorUserId,
  action,
  entityType,
  entityId,
  beforeJson,
  afterJson,
  metadataJson,
})
```

Acceptance criteria:

- Can be called inside Prisma transactions.
- Supports before/after snapshots.
- Does not break app flow on optional metadata absence.

### 1.8 CampusCore Zod Schemas
Create schemas for:

- [ ] Tenant create/update
- [ ] Institution create/update
- [ ] Branch create/update
- [ ] Academic year create/update
- [ ] User create/update
- [ ] Role create/update
- [ ] Role assignment
- [ ] Attendance settings update

Acceptance criteria:

- No unvalidated inputs reach services.

### 1.9 CampusCore Services
Create services for:

- [ ] Institutions
- [ ] Branches
- [ ] Academic years
- [ ] Users
- [ ] Roles/permissions
- [ ] Settings
- [ ] Audit log queries

Acceptance criteria:

- All services are tenant-scoped.
- All protected services check permissions.
- Critical mutations write audit logs.

### 1.10 CampusCore UI Routes
Build initial pages:

- [ ] `/dashboard`
- [ ] `/campus-core/institutions`
- [ ] `/campus-core/branches`
- [ ] `/campus-core/academic-years`
- [ ] `/campus-core/users`
- [ ] `/campus-core/roles`
- [ ] `/campus-core/settings`
- [ ] `/campus-core/audit-logs`

Acceptance criteria:

- Pages have loading/empty/error states.
- Tables have pagination or clear TODO where not yet implemented.
- Navigation is role-aware where practical.

## Phase 2 — Academia Foundation

### 2.1 Academia Prisma Schema
Create/extend models for:

- [ ] `Class`
- [ ] `Section`
- [ ] `ClassSection`
- [ ] `Subject`
- [ ] `Student`
- [ ] `Guardian`
- [ ] `StudentGuardianLink`
- [ ] `Enrollment`
- [ ] `StudentAttendanceRecord`
- [ ] Optional `NotificationOutbox`

Acceptance criteria:

- Academic records include `tenantId`.
- Branch-scoped records include `branchId`.
- Enrollments include `academicYearId`.
- Attendance uniqueness prevents duplicates.

### 2.2 Academia Enums
Add enums for:

- [ ] Student status
- [ ] Enrollment status
- [ ] Guardian relation
- [ ] Student attendance status
- [ ] Attendance session type

Acceptance criteria:

- MVP uses `FULL_DAY` but future values are safe.

### 2.3 Academia Zod Schemas
Create schemas for:

- [ ] Class create/update
- [ ] Section create/update
- [ ] Class-section create/update
- [ ] Subject create/update
- [ ] Student create/update
- [ ] Guardian create/update
- [ ] Guardian link
- [ ] Enrollment create/update

Acceptance criteria:

- Admission number validation exists.
- Guardian link validation prevents invalid relation data.

### 2.4 Academia Services
Create services for:

- [ ] Classes
- [ ] Sections
- [ ] Class sections
- [ ] Subjects
- [ ] Students
- [ ] Guardians
- [ ] Enrollments

Acceptance criteria:

- All services are tenant-scoped.
- Enrollment operations are academic-year-aware.
- Critical changes are audited.

### 2.5 Academia UI Routes
Build initial pages:

- [ ] `/academia/classes`
- [ ] `/academia/sections`
- [ ] `/academia/class-sections`
- [ ] `/academia/subjects`
- [ ] `/academia/students`
- [ ] `/academia/guardians`
- [ ] `/academia/enrollments`

Acceptance criteria:

- Operational CRUD pages exist.
- Tables support search/filter where useful.
- Forms validate client and server-side.

## Phase 3 — Student Attendance

### 3.1 Attendance Submission Schema
Create Zod schemas:

- [ ] `submitStudentAttendanceSchema`
- [ ] `correctStudentAttendanceSchema`
- [ ] `lockStudentAttendanceSchema`
- [ ] `studentAttendanceReportFilterSchema`

Acceptance criteria:

- Invalid statuses are rejected.
- Empty attendance submissions are rejected.
- Correction requires reason.

### 3.2 Active Enrolled Student Query
Implement query for active students in a class-section on a selected date.

Acceptance criteria:

- Excludes inactive/withdrawn students.
- Handles mid-year admissions.
- Tenant, branch, and academic year scoped.

### 3.3 Submit Daily Full-Day Attendance
Implement transactional service:

- [ ] Validate teacher/admin permission
- [ ] Verify class-section access
- [ ] Load active enrollments
- [ ] Upsert attendance records safely
- [ ] Prevent duplicate records
- [ ] Queue absence alert placeholder
- [ ] Write audit logs

Acceptance criteria:

- Teacher can mark only assigned class-section.
- Admin can mark branch-scoped class-section.
- Submission is atomic.
- Parent alert placeholder created for absent/late/half-day according to settings.

### 3.4 Attendance Auto-Locking
Implement lock behavior based on `AttendanceSetting`.

Acceptance criteria:

- Teacher edits are blocked after cutoff.
- Admin/principal correction remains possible with reason.

### 3.5 Attendance Correction
Implement admin/principal correction flow.

Acceptance criteria:

- Correction requires permission.
- Correction requires reason.
- Before/after status is audited.

### 3.6 Student Attendance UI
Build:

- [ ] `/academia/attendance`
- [ ] Class-section selector
- [ ] Date selector
- [ ] Active student list
- [ ] Mark all present
- [ ] Individual status changes
- [ ] Remarks field
- [ ] Submit action
- [ ] Locked/correction state

Acceptance criteria:

- Teacher workflow is fast.
- Default action supports mark-all-present.
- Locked records are clear to user.

### 3.7 Student Attendance Reports
Build:

- [ ] Daily class attendance
- [ ] Class-wise report
- [ ] Student-wise history
- [ ] Monthly percentage
- [ ] Absent list
- [ ] Late list
- [ ] Classes not marked

Acceptance criteria:

- Reports are tenant/branch/academic-year scoped.
- Reports are table-first and paginated where needed.

## Phase 4 — StaffBoard Lite Foundation

### 4.1 StaffBoard Lite Prisma Schema
Create/extend models for:

- [ ] `StaffProfile`
- [ ] `StaffAttendanceRecord`
- [ ] `StaffAttendanceQrToken`

Acceptance criteria:

- Staff profile includes `tenantId` and `branchId`.
- Employee code is unique within tenant.
- Attendance record is unique per staff/date/branch.
- QR token stores hash, not raw token.

### 4.2 StaffBoard Lite Enums
Add enums for:

- [ ] Staff type
- [ ] Employment status
- [ ] Staff attendance status
- [ ] Staff attendance source
- [ ] Staff QR purpose

Acceptance criteria:

- Categories match PRD exactly.

### 4.3 Staff Zod Schemas
Create schemas for:

- [ ] Staff profile create/update
- [ ] Staff profile filters
- [ ] Staff attendance report filters

Acceptance criteria:

- Employee code required.
- Staff category required.
- Branch required.

### 4.4 Staff Services
Create services for:

- [ ] Staff create/update
- [ ] Staff list/detail
- [ ] Staff category filter

Acceptance criteria:

- Services are tenant and branch scoped.
- Critical changes are audited.

### 4.5 Staff UI Routes
Build:

- [ ] `/staffboard/staff`
- [ ] Staff list
- [ ] Staff create/edit form
- [ ] Category filter
- [ ] Status filter

Acceptance criteria:

- Staff admin workflow is usable.
- Page includes loading/empty/error states.

## Phase 5 — QR Staff Attendance

### 5.1 QR Generation Service
Implement QR token generation.

Acceptance criteria:

- Requires `staffboard.attendance.qr.generate`.
- Token is random and secure.
- Token hash is stored.
- Raw token is returned only once for QR rendering.
- Token has `validFrom` and `validUntil`.
- Token is tenant and branch scoped.

### 5.2 QR Display UI
Build:

- [ ] `/staffboard/attendance/qr`
- [ ] Branch selector if user has multiple branch access
- [ ] Purpose selector: check-in/check-out
- [ ] Auto-refresh QR
- [ ] Countdown timer
- [ ] Today summary cards

Acceptance criteria:

- Expired QR is not shown as active.
- UI makes scan purpose clear.

### 5.3 QR Scan Service
Implement scan validation.

Acceptance criteria:

- Requires authenticated staff.
- Requires `staffboard.attendance.self_scan`.
- Rejects invalid token.
- Rejects expired token.
- Rejects wrong tenant.
- Rejects wrong branch.
- Prevents duplicate check-in misuse.
- Supports check-out.
- Writes audit logs.

### 5.4 Check-in/Check-out Calculation
Implement status calculation from attendance settings.

Acceptance criteria:

- Check-in before late time = present candidate.
- Check-in after late time = late.
- Check-out calculates working minutes.
- Early checkout can become half-day based on minimum minutes.
- Missing scan can remain `NOT_MARKED` until absent-marking job/report logic.

### 5.5 Manual Staff Attendance Correction
Implement correction flow.

Acceptance criteria:

- Requires `staffboard.attendance.correct`.
- Requires reason.
- Stores old/new values in audit log.
- Does not allow staff to directly edit system-generated QR records.

### 5.6 Staff Scan UI
Build:

- [ ] `/staffboard/attendance/scan`
- [ ] Camera QR scanner or input fallback
- [ ] Scan success state
- [ ] Scan error state
- [ ] Current attendance status
- [ ] Check-in/check-out times

Acceptance criteria:

- Mobile-friendly.
- Clear error messages for expired/wrong QR.

### 5.7 Staff Attendance Admin UI
Build:

- [ ] `/staffboard/attendance`
- [ ] Date filter
- [ ] Branch filter
- [ ] Staff category filter
- [ ] Status filter
- [ ] Attendance table
- [ ] Manual correction dialog

Acceptance criteria:

- Admin can review daily staff attendance.
- Manual correction is audited.

### 5.8 Staff Attendance Reports
Build:

- [ ] Daily staff attendance
- [ ] Teacher attendance report
- [ ] Non-teaching staff report
- [ ] Late arrival report
- [ ] Half-day report
- [ ] Monthly summary
- [ ] Manual correction report

Acceptance criteria:

- Reports are tenant/branch/date scoped.
- Tables are paginated where needed.

## Phase 6 — Dashboards and Polish

### 6.1 Dashboard Query Services
Create query services for dashboard cards.

CampusCore:

- [ ] Total branches
- [ ] Active academic year
- [ ] Total users
- [ ] Active roles

Academia:

- [ ] Total students
- [ ] Active enrollments
- [ ] Students present today
- [ ] Students absent today
- [ ] Classes not marked today

StaffBoard Lite:

- [ ] Total staff
- [ ] Staff checked in today
- [ ] Staff late today
- [ ] Staff absent today
- [ ] Staff half-day today

Acceptance criteria:

- Queries are tenant-scoped.
- Branch filters are applied for branch users.

### 6.2 Dashboard UI
Build dashboard cards.

Acceptance criteria:

- Cards are role-aware.
- Empty state appears for new tenant.
- No expensive unbounded queries.

### 6.3 Navigation Polish
Finalize sidebar and topbar.

Acceptance criteria:

- Navigation respects module scope.
- Shows only accessible areas where practical.
- Tenant/branch/academic year context visible.

### 6.4 Error Handling Polish
Add consistent handling for:

- [ ] Auth errors
- [ ] Permission errors
- [ ] Validation errors
- [ ] Not found errors
- [ ] Tenant mismatch errors
- [ ] QR expired errors

Acceptance criteria:

- Users see readable errors.
- Sensitive internals are not exposed.

## Phase 7 — Testing and Hardening

### 7.1 Tenant Isolation Tests
Test that users cannot access records from another tenant.

- [ ] CampusCore
- [ ] Academia
- [ ] StaffBoard Lite

### 7.2 RBAC Tests
Test permission denial and permission success for critical actions.

- [ ] User management
- [ ] Student attendance mark
- [ ] Student attendance correction
- [ ] QR generation
- [ ] QR scan
- [ ] Staff attendance correction

### 7.3 Attendance Tests
Test:

- [ ] Duplicate student attendance prevention
- [ ] Teacher assigned class access
- [ ] Attendance lock cutoff
- [ ] Correction reason required
- [ ] Absence alert outbox placeholder

### 7.4 QR Security Tests
Test:

- [ ] Expired QR rejected
- [ ] Wrong branch rejected
- [ ] Invalid token rejected
- [ ] Duplicate check-in prevented
- [ ] Check-out without check-in handled safely
- [ ] Token hash is stored, not raw token

### 7.5 Final Quality Gate
Run available commands:

- [ ] lint
- [ ] typecheck
- [ ] test
- [ ] build

Acceptance criteria:

- Codex reports exact commands and outputs.
- If a command is unavailable, Codex states that clearly.
- Known risks are documented.

## Final Delivery Checklist

- [ ] CampusCore schema complete
- [ ] Academia schema complete
- [ ] StaffBoard Lite schema complete
- [ ] RBAC utility implemented
- [ ] Tenant context implemented
- [ ] Audit logger implemented
- [ ] Zod schemas created
- [ ] Core services created
- [ ] Student attendance workflow implemented
- [ ] QR staff attendance workflow implemented
- [ ] Basic reports implemented
- [ ] Dashboard cards implemented
- [ ] Tests/checks completed or documented
