# Post-Pilot Feedback Log

## Status

- Date opened: 2026-06-28
- Applies to: JinaCampus Web v1.0 Base MVP controlled pilot/demo
- Current feedback status: no pilot feedback collected yet

This log must not include passwords, session cookies, bearer tokens, reset tokens, raw QR payloads, provider secrets, private URLs, Aadhaar numbers, bank account numbers, or screenshots containing sensitive data.

## Feedback Summary

The controlled pilot/demo did not run in the 2026-06-28 execution attempt because clean DB reset, migration/seed verification, and short browser smoke were blocked by local Docker/PostgreSQL availability.

## Launch Blockers

| Date | School / context | Role | Workflow | Issue | Status | Owner / next step |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-06-28 | Local execution environment | Operator | Clean DB reset | Docker daemon unavailable; local PostgreSQL could not start. | Open | Start Docker Desktop or provide reachable pilot/staging DB, then rerun reset/seed/smoke. |

## High Priority

| Date | School / context | Role | Workflow | Feedback | Status | Owner / next step |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-06-28 | Not applicable | Not applicable | Not applicable | No high-priority user feedback collected yet. | Pending pilot/demo | Collect during controlled demo. |

## Improvements

| Date | School / context | Role | Workflow | Feedback | Status | Owner / next step |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-06-28 | Not applicable | Not applicable | Not applicable | No improvement feedback collected yet. | Pending pilot/demo | Collect during controlled demo. |

## Future Modules

| Date | School / context | Requested area | Notes | Status |
| --- | --- | --- | --- | --- |
| 2026-06-28 | Not applicable | FeeDesk / GradeBook / full SchoolCast / native production / exports / offline / push | No customer request collected in this execution attempt. These areas remain deferred unless approved after pilot feedback. | Deferred |

## Intake Rules

For future entries, capture:

- safe school or demo context
- user role
- workflow
- browser/device
- expected behavior
- observed behavior
- severity category
- workaround
- owner or next decision

Escalate as a launch blocker if feedback suggests broken login/logout, RBAC failure, tenant data leakage, attendance data loss, sensitive data exposure, Prisma/SQL/stack trace exposure, or accidental live WhatsApp sending.
