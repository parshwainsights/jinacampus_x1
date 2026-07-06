# Post-Pilot Feedback Plan

## Status

- Date: 2026-06-14
- Applies to: JinaCampus Web v1.0 Base MVP controlled pilot/demo
- Purpose: collect, classify, and route controlled pilot feedback without expanding scope prematurely

Do not include passwords, session cookies, bearer tokens, reset tokens, raw QR payloads, provider secrets, private URLs, Aadhaar numbers, bank account numbers, or screenshots containing sensitive data.

## Feedback Categories

| Category | Definition | Response expectation |
| --- | --- | --- |
| Launch blocker | Prevents safe pilot operation, breaks login/logout, breaks core attendance, weakens RBAC/tenant isolation, causes data loss, or exposes sensitive internals. | Stop or pause affected pilot flow and fix before continuing. |
| High priority | Important school workflow issue with workaround, major usability pain, repeated support issue, or role-specific problem. | Triage for near-term stabilization. |
| Improvement | Helpful UX, copy, workflow, report, or configuration refinement that does not block the pilot. | Batch into polish backlog. |
| Future module | Request for FeeDesk, GradeBook, full SchoolCast, exports/charts, parent/student app, native production release, offline sync, push notifications, payroll, or other deferred scope. | Record for roadmap; do not fold into Base MVP pilot unless explicitly approved. |

## Feedback Intake Fields

Capture:

- school or demo context
- user role
- branch or class-section context if relevant
- workflow
- browser/device
- date/time
- expected behavior
- observed behavior
- safe screenshot or short screen recording if approved and sensitive-data-free
- severity category
- workaround, if any
- owner/follow-up decision

Do not capture raw passwords, QR payloads, session cookies, provider secrets, private URLs, full Aadhaar, full bank account, or private student/staff data in feedback artifacts.

## Topics To Collect

| Topic | Example prompts |
| --- | --- |
| Login ease | Was School ID login clear? Did users confuse Administrator Portal and school login? |
| School ID clarity | Was School ID wording clear? Were users able to identify the correct school? |
| Dashboard clarity | Did dashboard cards and quick actions make sense for each role? |
| Student registration | Were required admission-sheet fields clear? Were validation messages useful? |
| Attendance marking | Could teacher/principal users mark attendance quickly? Was locked-date behavior clear? |
| Staff QR flow | Was QR generation, scan/manual fallback, duplicate, and expiry behavior understandable? |
| Reports usefulness | Did student and staff reports answer immediate operational questions? |
| UI/UX impression | Did the web app feel modern, trustworthy, and school-friendly? |
| Performance | Did pages load acceptably on school office hardware/network? |
| Missing must-have features | Which items are essential for the next pilot phase? |

## Immediate Escalation Rules

Escalate as a launch blocker if any report suggests:

- Principal sees another school's data.
- Teacher/staff can access administrator-only flows.
- User can mutate another branch or school without permission.
- Login/logout is broken for seeded or pilot users.
- Student/staff attendance cannot be marked or corrected by authorized users.
- `passwordHash`, `tokenHash`, raw QR token, provider secret, Prisma/SQL error, stack trace, full Aadhaar, or full bank account appears in UI/docs/logs.
- Live WhatsApp sending is accidentally enabled.
- Physical QR camera failure blocks a pilot that depends on camera scanning and manual fallback is not acceptable.

## Deferred Scope Handling

Do not treat these as Base MVP pilot blockers unless the pilot sponsor explicitly changes scope:

- FeeDesk
- GradeBook
- full SchoolCast
- live WhatsApp sending
- native mobile production release
- exports/charts
- offline sync
- push notifications
- parent/student app
- payroll/leave/appraisal
- global operator console
- multi-branch switcher redesign

Record them as future-module or roadmap feedback.

## Review Cadence

During controlled pilot/demo:

1. Review launch blockers daily.
2. Review high-priority items at least twice weekly.
3. Batch improvements weekly.
4. Summarize future-module requests separately from stabilization work.
5. Keep a clear decision log for any scope change.

## Output

At the end of pilot/demo, prepare:

- launch blocker list and resolutions
- high-priority stabilization backlog
- UX improvement backlog
- future-module roadmap input
- support FAQ updates
- go/no-go recommendation for the next release stage

## Current Gate Note - 2026-06-28

No pilot/demo feedback can be collected from the latest execution attempt because the clean pilot DB reset, seed verification, and short browser smoke were blocked by local Docker/PostgreSQL availability. The latest rerun stopped at the database environment gate. Feedback collection should start only after the target environment is reset, seeded, smoked, and handed to the controlled demo team.
