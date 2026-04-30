# PRD.md — JinaCampus First Development PRD

## 1. Product Overview
JinaCampus is a production-grade, multi-tenant School Management SaaS for Indian schools.

Brand:

> JinaCampus — The Complete School OS, powered by Parshav Insights

The first development phase creates the foundation for a reliable school operations platform with secure tenant isolation, role-based access, audit logs, student academic records, student attendance, staff profiles, and QR-based staff attendance.

## 2. First Development Goal
Build the initial production-ready foundation for:

1. CampusCore
2. Academia
3. StaffBoard Lite

The goal is to deliver a strong modular monolith foundation that can later support GradeBook, FeeDesk, SchoolCast, InsightBoard, CampusFleet, BookNest, AssetRoom, full StaffBoard HR, and mobile apps.

## 3. Non-Goals for First Development
Do not build the following in this phase:

- Fee collection
- Receipts
- Exams
- Marks entry
- Report cards
- Full SchoolCast communication module
- Advanced dashboards
- Payroll
- Leave balance automation
- Biometric attendance
- Transport
- Library
- Inventory
- Native mobile apps

## 4. Target Users

### 4.1 Tenant Owner
Owns the school tenant account and manages high-level settings, branches, users, roles, and permissions.

### 4.2 Principal
Views school operations, attendance status, users, students, and reports across assigned branches.

### 4.3 Admin
Manages branches, academic years, students, guardians, enrollments, staff records, and attendance operations.

### 4.4 Class Teacher
Marks daily full-day attendance for assigned class-sections.

### 4.5 Teacher / Staff Member
Uses QR scan check-in/check-out for staff attendance.

### 4.6 Parent / Student
Seed future-ready roles only. Full parent/student portals are out of scope for first development.

## 5. Core Product Principles

1. Tenant-safe by default
2. Permission-gated by default
3. Audit-ready for sensitive changes
4. Financial-module-ready, but no finance implementation yet
5. Academic-year-aware for academic records
6. Branch-aware for school operations
7. Clean UI for daily school staff usage
8. Extensible module structure
9. Strong server-side validation
10. Production-grade code organization

## 6. Module Requirements

## 6.1 CampusCore
CampusCore is the platform foundation.

### Required Features

- Tenant model
- Institution model
- Branch model
- Academic year model
- User model
- Role model
- Permission model
- Role-permission assignment
- User-role assignment
- User branch access where required
- Tenant settings
- Attendance settings
- Tenant context resolver
- RBAC guard
- Audit logging utility
- App shell with role-aware navigation

### CampusCore Acceptance Criteria

- Every tenant-owned query is scoped by `tenantId`.
- Branch-scoped operations verify `branchId` access.
- Permissions are checked server-side.
- Default roles and permissions can be seeded.
- Audit logs can be created for critical actions.
- Active academic year can be identified per tenant/branch.
- App shell can show tenant, branch, and academic year context.

## 6.2 Academia
Academia manages academic setup, student records, enrollment, and student attendance.

### Required Features

- Classes
- Sections
- Class Sections
- Subjects
- Students
- Guardians
- Student Guardian Links
- Enrollments
- Daily Full-Day Class-Section Attendance
- Basic attendance reports
- Parent absence alert outbox placeholder

### Student Attendance Method
The MVP uses Daily Full-Day Class-Section Attendance.

Required attendance capabilities:

1. Class-section selection
2. Active enrolled student list
3. Mark all present
4. Individual status changes
5. Absent, late, half-day, on-leave, excused statuses
6. Teacher submit
7. Admin correction
8. Auto-locking after configured cutoff
9. Parent absence alert event placeholder
10. Audit logs
11. Student-wise and class-wise reports

### Student Attendance Statuses

- `PRESENT`
- `ABSENT`
- `LATE`
- `HALF_DAY`
- `ON_LEAVE`
- `EXCUSED`
- `NOT_MARKED`

### Student Attendance Rules

- One active student enrollment receives one attendance record per school day for `FULL_DAY`.
- Unique key: `tenantId + academicYearId + studentId + attendanceDate + sessionType`.
- Teachers can mark only assigned class-sections.
- Admins can mark any class-section within assigned branch scope.
- After cutoff/lock, correction requires admin/principal permission and reason.
- Absence alert placeholder is created for `ABSENT`, and optionally `LATE` / `HALF_DAY` based on settings.

### Academia Acceptance Criteria

- Student records are tenant-scoped.
- Admission number is unique within tenant.
- Enrollments are academic-year-scoped.
- Active enrolled student list excludes inactive/withdrawn students.
- Attendance submission is transactional.
- Duplicate attendance records are prevented.
- Attendance correction stores before/after values in audit log.

## 6.3 StaffBoard Lite
StaffBoard Lite manages staff profiles and QR-based staff attendance.

### Required Features

1. Staff profiles
2. Staff categories
3. Daily staff attendance using QR scan
4. Check-in/check-out
5. Late, half-day, absent status
6. Manual correction with reason
7. Staff attendance reports
8. Dashboard cards

### Staff Categories

- `TEACHER`
- `ADMIN`
- `ACCOUNTANT`
- `LIBRARIAN`
- `DRIVER`
- `HELPER`
- `SECURITY`
- `PEON`
- `CLEANING_STAFF`
- `MANAGEMENT`
- `OTHER`

### Staff Attendance Method
The MVP uses QR Scan-based Check-in / Check-out Attendance.

### Staff QR Attendance Flow

```txt
Staff arrives at school
→ Staff opens JinaCampus on mobile
→ Staff scans active QR code displayed at school/gate/office
→ System validates tenant, branch, user, QR token, purpose, and time window
→ Check-in is recorded
→ Late rule is applied automatically
→ Staff scans again at departure
→ Check-out is recorded
→ Working duration is calculated
→ Final status is generated
→ Audit log is created
```

### QR Rules

- QR code is tenant-scoped.
- QR code is branch-scoped.
- QR code is time-bound.
- Default QR validity is 180 seconds.
- Raw token must not be stored; store token hash.
- Staff must be authenticated before scanning.
- Duplicate check-in must be prevented.
- Expired QR must be rejected.
- Wrong-branch QR must be rejected unless explicitly allowed.
- Manual correction requires reason and permission.

### Staff Attendance Statuses

- `PRESENT`
- `ABSENT`
- `LATE`
- `HALF_DAY`
- `ON_LEAVE`
- `WEEK_OFF`
- `HOLIDAY`
- `NOT_MARKED`

### Staff Attendance Sources

- `QR_SCAN`
- `MANUAL_ADMIN`
- `IMPORT`
- `BIOMETRIC`

Only `QR_SCAN` and `MANUAL_ADMIN` are implemented in first development. `IMPORT` and `BIOMETRIC` are enum values for future readiness only.

### StaffBoard Lite Acceptance Criteria

- Staff profile is tenant-scoped and branch-scoped.
- Employee code is unique within tenant.
- QR token generation requires permission.
- QR scan requires authenticated staff user.
- QR token expiry is enforced.
- QR token hash is stored, not raw token.
- Check-in/check-out are transactional.
- Late and half-day status are calculated from branch attendance settings.
- Manual correction requires reason and audit log.

## 7. Data Model Requirements

Required Prisma models:

### CampusCore

- `Tenant`
- `Institution`
- `Branch`
- `AcademicYear`
- `User`
- `Role`
- `Permission`
- `RolePermission`
- `UserRoleAssignment`
- `UserBranchAccess`
- `TenantSettings`
- `AttendanceSetting`
- `AuditLog`

### Academia

- `Class`
- `Section`
- `ClassSection`
- `Subject`
- `Student`
- `Guardian`
- `StudentGuardianLink`
- `Enrollment`
- `StudentAttendanceRecord`

### StaffBoard Lite

- `StaffProfile`
- `StaffAttendanceRecord`
- `StaffAttendanceQrToken`

### Optional Foundation

- `NotificationOutbox` or `DomainEventOutbox` for future SchoolCast integration.

## 8. Permission Requirements

### CampusCore Permissions

- `campuscore.tenant.view`
- `campuscore.institution.manage`
- `campuscore.branch.manage`
- `campuscore.academic_year.manage`
- `campuscore.user.view`
- `campuscore.user.create`
- `campuscore.user.update`
- `campuscore.role.view`
- `campuscore.role.manage`
- `campuscore.audit.view`
- `campuscore.settings.manage`

### Academia Permissions

- `academia.class.manage`
- `academia.section.manage`
- `academia.subject.manage`
- `academia.student.view`
- `academia.student.create`
- `academia.student.update`
- `academia.guardian.manage`
- `academia.enrollment.manage`
- `academia.attendance.view`
- `academia.attendance.mark`
- `academia.attendance.update`
- `academia.attendance.correct`
- `academia.attendance.lock`
- `academia.attendance.report`

### StaffBoard Lite Permissions

- `staffboard.staff.view`
- `staffboard.staff.create`
- `staffboard.staff.update`
- `staffboard.attendance.qr.generate`
- `staffboard.attendance.self_scan`
- `staffboard.attendance.view`
- `staffboard.attendance.correct`
- `staffboard.attendance.report`

## 9. UI Route Requirements

### CampusCore Routes

- `/dashboard`
- `/campus-core/institutions`
- `/campus-core/branches`
- `/campus-core/academic-years`
- `/campus-core/users`
- `/campus-core/roles`
- `/campus-core/settings`
- `/campus-core/audit-logs`

### Academia Routes

- `/academia/classes`
- `/academia/sections`
- `/academia/class-sections`
- `/academia/subjects`
- `/academia/students`
- `/academia/guardians`
- `/academia/enrollments`
- `/academia/attendance`
- `/academia/attendance/reports`

### StaffBoard Lite Routes

- `/staffboard/staff`
- `/staffboard/categories`
- `/staffboard/attendance`
- `/staffboard/attendance/qr`
- `/staffboard/attendance/scan`
- `/staffboard/attendance/reports`

## 10. Reporting Requirements

### Student Attendance Reports

- Daily class attendance
- Class-wise attendance report
- Student-wise attendance history
- Monthly attendance percentage
- Absent students list
- Late students list
- Classes not marked report

### Staff Attendance Reports

- Daily staff attendance
- Teacher attendance report
- Non-teaching staff attendance report
- Late arrival report
- Half-day report
- Monthly staff attendance summary
- Manual correction report

Reports can be table-first in first development. Export may be deferred unless simple CSV export is low-risk.

## 11. Dashboard Card Requirements

### CampusCore Cards

- Total branches
- Active academic year
- Total users
- Active roles

### Academia Cards

- Total students
- Active enrollments
- Students present today
- Students absent today
- Classes not marked today

### StaffBoard Lite Cards

- Total staff
- Staff checked in today
- Staff late today
- Staff absent today
- Staff half-day today

## 12. Non-Functional Requirements

### Security

- Server-side authorization for all protected actions
- Tenant-safe queries
- Branch access checks
- Zod input validation
- Secure QR token handling
- Audit logs for sensitive mutations

### Performance

- Index common tenant/branch/date/status filters
- Avoid unbounded lists
- Use pagination for tables
- Avoid N+1 queries for attendance lists

### Reliability

- Transactional attendance submission
- Transactional QR scan handling
- Idempotent handling where practical
- Clear error messages

### Maintainability

- Modular folder structure
- Clear service layer
- No business logic inside UI components
- Typed errors or structured service results

## 13. Definition of Done
A feature is done only when:

1. Data model is tenant-safe.
2. Input is validated with Zod.
3. Permissions are checked server-side.
4. Critical mutations are audited.
5. UI handles loading, empty, error, and success states.
6. Tests are added or clearly proposed.
7. Lint/typecheck/build are run if available.
8. Known limitations are documented.
