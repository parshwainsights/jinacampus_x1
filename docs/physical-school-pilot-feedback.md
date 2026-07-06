# Physical School Pilot Feedback

## Status

- Date opened: 2026-06-28
- Applies to: JinaCampus Web v1.0 Base MVP controlled physical attendance pilot
- Current feedback status: no physical pilot feedback collected yet
- Current blocker: Day 0 DB-backed setup is blocked by local Docker/PostgreSQL availability

Do not include passwords, session cookies, raw QR payloads, private URLs, real Aadhaar values, bank account values, payroll/discipline decisions, or sensitive student/staff data in this file.

## Feedback Classification

| Category | Definition |
| --- | --- |
| Launch blocker | Prevents safe attendance pilot operation, breaks login/logout, breaks attendance, weakens RBAC/tenant isolation, causes data loss, or exposes sensitive internals. |
| High priority | Important workflow issue with workaround, repeated support issue, or role-specific usability problem. |
| Improvement | Useful UX/copy/workflow/report refinement that does not block the pilot. |
| Future module | Request for deferred modules or scope such as FeeDesk, GradeBook, full SchoolCast, live WhatsApp, native production app, exports/charts, offline sync, push notifications, payroll, or leave. |

## Teacher Feedback

| Date | Class/section context | Feedback | Category | Status |
| --- | --- | --- | --- | --- |
| 2026-06-28 | Not started | No teacher feedback collected because Day 0 setup is blocked. | Pending pilot | Pending |

## Staff Feedback

| Date | Staff group context | Feedback | Category | Status |
| --- | --- | --- | --- | --- |
| 2026-06-28 | Not started | No staff feedback collected because Day 0 setup is blocked. | Pending pilot | Pending |

## Principal Feedback

| Date | Workflow | Feedback | Category | Status |
| --- | --- | --- | --- | --- |
| 2026-06-28 | Not started | No principal feedback collected because Day 0 setup is blocked. | Pending pilot | Pending |

## Admin / Office Feedback

| Date | Workflow | Feedback | Category | Status |
| --- | --- | --- | --- | --- |
| 2026-06-28 | Not started | No admin/office feedback collected because Day 0 setup is blocked. | Pending pilot | Pending |

## Login Issues

| Date | Role | Issue | Category | Status |
| --- | --- | --- | --- | --- |
| 2026-06-28 | Not tested | Login was not tested because DB-backed setup is blocked. | Pending pilot | Pending |

## Attendance Issues

| Date | Workflow | Issue | Category | Status |
| --- | --- | --- | --- | --- |
| 2026-06-28 | Not tested | Student/staff attendance was not tested because DB-backed setup is blocked. | Pending pilot | Pending |

## QR Issues

| Date | Device/browser | Issue | Category | Status |
| --- | --- | --- | --- | --- |
| 2026-06-28 | Not tested | QR camera and manual fallback were not tested because DB-backed setup is blocked. | Pending pilot | Pending |

## Report Issues

| Date | Report | Issue | Category | Status |
| --- | --- | --- | --- | --- |
| 2026-06-28 | Not tested | Attendance reports were not tested because DB-backed setup is blocked. | Pending pilot | Pending |

## UI / UX Issues

| Date | Surface | Issue | Category | Status |
| --- | --- | --- | --- | --- |
| 2026-06-28 | Not tested | No physical-pilot UI feedback collected yet. | Pending pilot | Pending |

## Must-Have Missing Features

| Date | Requested area | Notes | Category | Status |
| --- | --- | --- | --- | --- |
| 2026-06-28 | Not collected | No physical-pilot feature feedback collected yet. Deferred modules remain out of scope unless separately approved. | Pending pilot | Pending |

## Open Launch Blockers

| Date | Blocker | Status | Next step |
| --- | --- | --- | --- |
| 2026-06-28 | Docker/PostgreSQL unavailable, so DB-backed Day 0 setup and attendance pilot QA cannot run. | Open | Start Docker Desktop or provide a reachable pilot/staging DB, then rerun setup and smoke. |
| 2026-06-28 | Local LAN app server was not started because the database gate is blocked. | Open | After DB setup passes, start the app on the LAN and verify `/login` from a phone/tablet on the same network. |

## Intake Rules

For future pilot entries, capture:

- user role
- affected workflow
- class-section or staff group context where safe
- browser/device
- expected behavior
- observed behavior
- safe screenshot only if it contains no credentials, raw QR payloads, private URLs, or sensitive student/staff data
- category
- workaround
- owner/next decision

Escalate immediately if feedback suggests broken login/logout, RBAC failure, tenant leakage, attendance data loss, sensitive output exposure, or accidental live WhatsApp sending.
