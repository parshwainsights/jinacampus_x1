# Known Limitations v1

## Status

- Date: 2026-06-14
- Applies to: JinaCampus Web Base MVP v1.0 controlled pilot

## Release Limitations

| Area | Limitation | Pilot Impact | Next Step |
| --- | --- | --- | --- |
| Staff QR camera | Real-device Android Chrome and iOS Safari camera scan over approved HTTPS remains pending. A mobile/Safari Start Camera button issue was source-level repaired on 2026-06-29, with diagnostics and QR image fallback added on 2026-06-30, but not device-certified. | Manual QR/token browser flow is verified; HTTP LAN/IP access should show an HTTPS-required blocked state; physical camera readiness should not be claimed yet. | Run real-device Staff QR camera QA with approved HTTPS URL and physical devices in normal browser and PWA/home-screen modes. |
| Native mobile physical QA | Native Mobile v0.1 is release-candidate only; physical Android/iOS QA remains pending. | Web pilot is not blocked, but native production readiness must not be claimed. | Provide approved HTTPS backend URL and physical Android/iOS devices for QA. |
| Wrong-branch QR | Wrong-branch QR negative QA needs a second branch/staff fixture. | Single-branch demo is acceptable; multi-branch QR rollout needs more coverage. | Add safe second-branch fixture and run negative QR QA. |
| Cross-tenant negative QA | Broader cross-tenant browser-negative QA needs more fixtures. | Core tenant-scoped services and tests exist, but broader browser fixture coverage is limited. | Add dedicated multi-tenant QA fixture and smoke matrix. |
| Multi-branch UX | Branch/institution switcher UX remains limited to current branch-cookie behavior. | Single-branch pilot users are covered. Multi-branch users need clearer switching UX later. | Design and implement a focused switcher phase. |
| Operator console | Global cross-tenant operator console is deferred. | Administrator Portal supports school registry and selected-school inspection, not a full operator console. | Plan a separate operator-console phase. |
| WhatsApp live sending | Live Meta Cloud WhatsApp sending is deferred. | DRY_RUN outbox/provider foundation is verified; no live messages are sent. | Add provider-secret management, live provider setup, scheduler, and outbox review UI in a separate phase. |
| WhatsApp templates/credentials | Approved provider templates and production credentials are pending. | Pilot can show settings/foundation only. | Complete provider approval and secret-storage design before live send. |
| Scheduler wiring | Notification scheduler/cron wiring is deferred. | Outbox processing remains manual/helper-based in this scope. | Add scheduler in a separate approved notification phase. |
| Outbox review UI | Notification outbox review UI is deferred. | Operators cannot review queued notification rows from the UI yet. | Add an outbox review screen if pilot support requires it. |
| SchoolCast | Full SchoolCast is deferred. | Attendance notification foundation only is present. | Build full SchoolCast after Base MVP freeze. |
| Pilot database cleanup | Demo DB may contain QA-only local student rows and other test mutations. | Demo data is useful for controlled pilot/demo rehearsals but should not be represented as sanitized production-like data. | Follow `docs/pilot-db-reset-checklist.md` and reset or rebuild a clean pilot DB before production-like customer pilot/demo use. |
| Physical attendance pilot | Day 0 physical school attendance pilot setup is blocked until Docker/PostgreSQL or an approved pilot/staging DB is reachable. The local-network app server is not started yet. | Physical teacher/staff attendance cannot be started safely yet. | Run `docs/physical-attendance-pilot-plan.md` after DB reset/seed/browser smoke passes, then expose the app on the LAN using `http://<local-ip>:3000`. |
| Student city field | City remains a validated free-text field. | Demo registration works, but city normalization/search is not available. | Add city master/search in a later student-profile data-quality phase. |
| Sensitive-field storage | Aadhaar and bank values are masked/last-four only; encrypted storage and controlled reveal are deferred. | Current pilot avoids full sensitive-number storage and reveal. | Design encrypted storage, reveal permissions, and audit workflow before collecting full sensitive values. |
| Future modules | FeeDesk, GradeBook, exports/charts, payroll, leave management, offline sync, push notifications, parent/student app, and native mobile production release are out of scope. | Pilot focuses on CampusCore, Academia, Student Attendance, StaffBoard Lite, QR, and dashboard. | Prioritize after pilot feedback. |
| Lint script | Root `scripts.lint` is not configured. | Typecheck, tests, build, Prisma, and diff checks are still enforced. | Add lint script in a dependency/tooling maintenance phase if desired. |

## Non-Negotiable Security Constraints

The following must remain true during pilot:

- Users log in; institutions and roles do not log in.
- Tenant, branch, role, and permission context is resolved server-side.
- Client-provided tenant, branch, user, role, or permission claims are not trusted.
- Passwords are hashed and never stored as plaintext.
- `passwordHash`, `tokenHash`, raw QR internals, provider secrets, reset tokens, session secrets, bearer tokens, Prisma/SQL errors, stack traces, and private URLs must not appear in UI, docs, logs, or screenshots.

## Readiness Position

JinaCampus Web Base MVP v1.0 is ready for controlled pilot launch with the limitations above. It is not yet ready to be marketed as fully device-certified for QR camera scanning or live WhatsApp delivery.

Final handoff statement:

```txt
JinaCampus Web v1.0 — Base MVP Release Candidate is suitable for controlled pilot/demo use with documented limitations.
```

Use `docs/controlled-pilot-demo-handoff.md` for the pilot/demo handoff execution checklist and GO/HOLD recommendation.

## Current Execution Note - 2026-06-28

The controlled pilot/demo execution attempt is blocked before clean DB reset because the local Docker daemon is not running and PostgreSQL is unavailable.

Latest re-run detail: the configured DB target is local PostgreSQL on `localhost:55432` for database `jinacampus`, but Docker daemon access fails on the missing `docker_engine` pipe and no TCP listener is available on the configured Postgres port. The latest gate rerun stopped before migration, seed, reset, and browser smoke. Static gates from the normal checkout context remain previously passed: Prisma format/validate/generate, typecheck, tests, build, and diff check.

This does not change the Web Base MVP RC readiness position, but it means no clean production-like pilot DB state, seed verification, short browser smoke, deployment smoke, controlled demo, feedback collection, or widen-pilot decision can be claimed from this execution attempt.

Next required action: start Docker Desktop or provide a reachable pilot/staging PostgreSQL environment, then rerun the DB reset, migration/seed, short browser smoke sequence, and DB-backed pilot data checks.
