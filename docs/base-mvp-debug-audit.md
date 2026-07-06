# Complete Base MVP Debugging and Missing Feature Audit

Date: 2026-05-30

Status: Passed with two focused role-aware UI fixes. No Critical freeze blocker remains for the local DB-backed Base MVP.

## Scope

This audit covers the Base MVP only:

- Authentication
- Authorization and role-aware access
- Super Admin/Admin access
- Principal institution/branch access
- CampusCore
- Academia
- Student Attendance
- StaffBoard Lite
- QR generation and scan surfaces
- Dashboard
- Forms, tables, reports, responsive routes
- Sensitive-output and customer demo readiness

Native mobile remains frozen. FeeDesk, GradeBook, SchoolCast, global cross-tenant operator console, full branch switcher redesign, exports/charts, offline sync, payroll, leave management, biometric/GPS attendance, invite email flow, reset-token email flow, and forced-password-change UX were not started.

## Environment and Evidence

- Local PostgreSQL/Docker was available.
- Seed command completed for `jinacampus-demo`.
- Dev server was verified at `http://localhost:3000`.
- Browser plugin runtime had no active in-app browser target available, so rendered evidence used HTTP route smoke, DB checks, source inspection, and unit tests.
- Public routes `/login` and `/forgot-password` returned 200.
- Unauthenticated `/dashboard` returned 307 to `/login`.
- Authenticated route smoke across Admin, Principal, Teacher, Staff, and Office Staff completed with no framework-overlay or sensitive-output hits.

No passwords, session cookies, reset values, QR payloads, bearer tokens, or private URLs are documented here.

## Feature Audit Matrix

| Area | Result | Evidence |
| --- | --- | --- |
| Login/logout | Pass | Login API and browser-route smoke passed for seeded roles; protected routes redirect unauthenticated users. |
| Forgot password | Pass | Public recovery route exists and returns safe non-enumerating behavior per policy/tests. |
| Show/hide password toggles | Pass | Login, reset, create-user, and change-password controls are covered by source/tests. |
| Role-aware navigation | Pass | Navigation filters by permission; route-level RBAC remains authoritative. |
| Super Admin/Admin access | Pass | Seeded Admin can access Base MVP governance, Academia, StaffBoard, reports, QR, and dashboard routes. |
| Principal access | Pass | Principal can access institution/branch scoped governance and cannot assign platform roles. |
| Teacher/staff forbidden states | Pass | Route smoke confirmed safe permission states for governance/admin-only pages. |
| Institution branding | Pass | Branding appears in shell/profile; invalid logo URL validation remains safe. |
| User create/edit/reset | Pass | Server actions/services are tenant-scoped and password-safe; QA route smoke passed. |
| Role/branch assignment | Pass | Role/branch actions are permission-gated and audited; principal role options are bounded. |
| Class-wise student details | Pass | Student list/filter route and active-enrollment queries are present and tenant/branch scoped. |
| Attendance mark/submit | Pass | Attendance mark route loads; transactional service/tests cover assigned class access and duplicate safety. |
| Attendance reports | Pass | Student attendance reports route loads and report query tests cover tenant/branch/year scope. |
| Staff profile edit | Pass after fix | Staff profile page now hides create/edit controls from view-only roles. |
| QR generation | Pass | QR generation route/service require permission, store token hash, return raw token only in intended QR payload. |
| QR scan/manual fallback/camera surface | Pass for browser surface | Scan route/manual fallback render; camera surface exists. Real-device camera success remains pending. |
| Staff attendance correction | Pass | Correction action/service require permission and reason; tests cover safe errors. |
| Staff reports | Pass | Staff reports route loads and query/tests cover table-first report sections. |
| Dashboard cards/quick actions | Pass | Dashboard route loads across roles; query/tests cover scoped metrics and quick actions. |
| Responsive pages | Pass for route smoke/source hardening | Mobile responsive smoke docs exist; real-device QA remains recommended. |
| Sensitive output | Pass | Final route smoke had no hits for password/token/hash/Prisma/SQL/stack patterns. |

## Issues and Missing Pieces

| Priority | Feature/module | Current issue or missing piece | Why it matters | Required fix | Backend changes needed | Frontend changes needed | Database changes needed | Testing checklist |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| High | CampusCore Users | User list role labels could include inactive or non-current role assignments. | Governance screens could imply a user has access that is no longer effective. | Filter displayed role assignments to effective active assignments only. | Updated `listUsers` query to include `isActive` and start/end date windows. | None beyond existing table rendering. | None. | Unit source assertion; route smoke for user list; verify office user active role only. |
| High | StaffBoard Lite Staff Profiles | View-only roles such as Office Staff could see Add Staff and Edit staff profile controls. | UI suggested actions the role is not allowed to perform, weakening demo clarity and role-aware UX. | Gate create/edit controls by `staffboard.staff.create` and `staffboard.staff.update`. | No service change; server-side RBAC already protected writes. | Added effective-permission guard and conditional form/action columns. | None. | Unit source assertion; office staff route smoke confirms no create/edit controls; principal/admin still see edit. |
| Medium | Tenant/institution isolation QA | Local seed has one demo tenant and one branch. | True cross-tenant and multi-branch negative browser QA cannot be fully proven with one fixture. | Add a second safe demo tenant/branch fixture or dedicated negative QA seed. | Optional future seed/service QA helpers. | Optional QA-only route smoke expansion. | Optional future seed data. | Principal direct URL to another tenant/branch; user/branch option scoping; dashboard/report isolation. |
| Medium | QR real-device camera QA | Browser camera CHECK_IN/CHECK_OUT has not been fully verified on physical Android Chrome and iOS Safari in this workspace. | Staff QR attendance is release-candidate until camera/device behavior is proven over a secure URL. | Provide approved HTTPS/staging URL and physical devices, then rerun live QR scanner QA. | None unless device bug is confirmed. | None unless device layout/camera bug is confirmed. | None. | Android Chrome CHECK_IN/CHECK_OUT; iOS Safari CHECK_IN/CHECK_OUT; permission denied; duplicate/expired safe states. |
| Medium | Branch switcher UX | Multi-branch support remains limited to current branch-cookie behavior. | Multi-branch principals need clearer active branch switching before larger deployments. | Defer full branch switcher redesign to a dedicated Base UX phase. | Existing server checks must remain authoritative. | Add explicit branch switcher UX later. | None expected. | Multi-branch user route smoke; branch-specific reports; unauthorized branch switch rejection. |
| Low | Global operator console | True cross-tenant SaaS operator console is deferred. | Platform operations across tenants will be needed beyond the current tenant-bound Admin model. | Defer until Base MVP freeze is accepted. | New platform-scoped services later. | New operator UI later. | Possible future global/operator models. | Cross-tenant tenant list, impersonation rules if approved, audit boundaries. |
| Low | Email invite/reset-token/forced password flows | Public recovery is admin-assisted only; email provider, reset-token email, invite onboarding, and forced password change UX are deferred. | Production onboarding will eventually need safer self-service and invitation lifecycle. | Keep current safe policy; implement later only with approved email/outbox/token design. | Future reset-token/invite models and email outbox. | Future invite/reset UI. | Future migration likely. | Non-enumerating recovery; token expiry; audit; no raw secrets in logs. |

## Fixes Applied

### CampusCore user role labels

`listUsers` now filters displayed role assignments to effective assignments:

- same tenant
- `isActive: true`
- `startsAt` is empty or already reached
- `endsAt` is empty or in the future

This keeps the Users table aligned with the session/RBAC resolver and avoids displaying stale role labels.

### StaffBoard Staff Profiles role-aware actions

`/staffboard/staff` now:

- returns `PermissionState` if `staffboard.staff.view` is missing
- renders create form only with `staffboard.staff.create`
- renders edit action column only with `staffboard.staff.update`
- keeps view-only office staff able to review staff records without unsupported write controls

## Sensitive Output Check

Final route smoke checked for:

- `passwordHash`
- raw password
- reset token
- session secret
- bearer token
- `tokenHash`
- raw QR token outside intended QR/manual flow
- Prisma/SQL error strings
- stack traces
- query engine strings
- private URL/secret markers

Result: Passed. No checked route output exposed these strings.

## Base MVP Freeze Recommendation

The local DB-backed Base MVP is acceptable for freeze from a code/test/build perspective after the two fixes above.

Recommended freeze status:

- Base MVP: freeze-ready for local/demo acceptance.
- Staff QR browser camera: release-candidate until physical Android Chrome and iOS Safari live CHECK_IN/CHECK_OUT QA pass over a secure URL.
- Multi-tenant negative QA: limited until a second demo tenant/branch fixture exists.

## Recommended Next Task

Run a final Base MVP freeze acceptance pass, or add a second safe demo tenant/branch fixture and run targeted cross-tenant/multi-branch negative QA before starting the next product module.
