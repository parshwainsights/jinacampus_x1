# Controlled Pilot/Demo Handoff

## Status

- Date: 2026-06-14
- Release: JinaCampus Web v1.0 - Base MVP Release Candidate
- Tenant used in local QA evidence: `jinacampus-demo`
- Final recommendation: GO for controlled pilot/demo with documented limitations

Final release statement:

```txt
JinaCampus Web v1.0 — Base MVP Release Candidate is suitable for controlled pilot/demo use with documented limitations.
```

This handoff covers the web Base MVP only. It does not certify physical Android/iOS QR camera readiness, native mobile production readiness, live WhatsApp delivery, FeeDesk, GradeBook, full SchoolCast, exports/charts, offline sync, push notifications, payroll, leave management, or biometric/GPS attendance.

## Handoff Execution Verification

Current handoff verification result:

| Check | Result |
| --- | --- |
| `npx prisma format` | Passed |
| `npx prisma validate` | Passed |
| `npx prisma generate` | Passed |
| `npm run typecheck` | Passed |
| `npm test` | Passed, 76 files / 662 tests |
| `npm run build` | Passed |
| `git diff --check` | Passed |
| `npm pkg get scripts.lint` | Returned `{}`; no root lint script exists |
| `docker ps --filter name=jinacampus-postgres` | Blocked: Docker daemon was not running |
| `npx prisma migrate status` | Blocked by unavailable local PostgreSQL/Docker; static Prisma validation passed |

No application code was changed for this handoff execution package.

## Handoff Package

Use these documents together:

| Document | Purpose |
| --- | --- |
| `docs/releases/base-mvp-v1.0-runbook.md` | Operator runbook, environment names, startup commands, migration/seed checks, route smoke matrix, support, and launch decision. |
| `docs/final-release-candidate-packaging.md` | RC package manifest, evidence summary, verification status, and final readiness decision. |
| `docs/known-limitations-v1.md` | Explicit limitations that must be shared before pilot/demo. |
| `docs/pilot-db-reset-checklist.md` | Clean pilot DB reset/rebuild order before production-like customer demo use. |
| `docs/customer-demo-script.md` | Presenter-safe customer demo flow and non-claim boundaries. |
| `docs/pilot-support-checklist.md` | Support triage, account recovery, QR issue handling, and escalation rules. |
| `docs/qr-camera-qa-plan.md` | Real-device Android Chrome and iOS Safari QR camera QA plan over approved HTTPS. |
| `docs/post-pilot-feedback-plan.md` | Feedback intake, classification, cadence, and next-release backlog routing. |

## Pilot DB Reset Order

Before any production-like customer demo or controlled pilot, do not reuse a QA-contaminated local DB. Use a clean pilot/staging DB or rebuild local demo data intentionally.

Minimum reset/rebuild order:

1. Confirm the target DB is the intended local, staging, or pilot database.
2. Back up or snapshot the DB if data needs to be preserved.
3. Start PostgreSQL or confirm the approved DB is reachable.
4. Check migration status.
5. Apply migrations using the project convention for the target environment.
6. Generate Prisma Client.
7. Run seed for the controlled pilot/demo dataset.
8. Run the browser smoke route matrix.
9. Verify users, roles, branch access, institution branding, active academic year, class sections, students, staff profiles, attendance data, and notification settings.
10. Confirm no QA-only local rows or accidental real personal data are presented as production-like data.

Package script references:

```bash
npx prisma migrate status
npm run db:migrate
npm run db:deploy
npx prisma generate
npm run db:seed
npm run typecheck
npm test
npm run build
git diff --check
npm pkg get scripts.lint
```

Use `npm run db:migrate` for local development migration creation/application. Use `npm run db:deploy` only where the deployment environment convention is to apply already-created migrations.

## Browser Smoke Route Matrix

Run this short smoke after DB reset and seed:

| Area | Routes / flows | Expected result |
| --- | --- | --- |
| Administrator login | `/administrator/login`, `/administrator` | Platform administrator login succeeds; school users are rejected safely. |
| School login | `/login`, `/forgot-password`, `/dashboard` | School ID login works; forgot password is non-enumerating; protected routes require session. |
| Account | `/account/change-password`, logout | Password controls work; logout clears session and redirects to login. |
| CampusCore | Institution, branches, users, roles, settings, audit | Authorized users see scoped data; forbidden users fail safely. |
| Academia | Students, student create/profile/edit, class-section filters, attendance mark/report | Student and attendance flows work with seeded data and safe validation. |
| StaffBoard Lite | Staff profiles, QR display, scan/manual fallback, admin correction, reports | QR/manual fallback and staff attendance flows return safe results. |
| Notifications | CampusCore attendance notification settings | DRY_RUN/provider-not-configured state is visible only to authorized users. |

## Demo User Handoff Notes

Share roles and School ID through the approved handoff channel only. Do not include passwords in docs, screenshots, tickets, chat transcripts, or release notes.

School ID for local demo evidence:

```txt
jinacampus-demo
```

Seeded roles to verify during pilot/demo:

- Administrator / Super Admin
- Principal
- Teacher
- Staff
- Office Staff

If a user cannot log in, use the authenticated Administrator/Principal reset flow described in `docs/pilot-support-checklist.md`. Do not add public self-service reset-token flow during this pilot.

## Demo Execution Order

Use `docs/customer-demo-script.md` as the presenter script. Recommended order:

1. Administrator Portal and school registry.
2. School ID login and role-aware dashboard.
3. CampusCore institution branding, users, roles, and notification settings.
4. Academia student list, registration/profile/edit, class-section view, and student attendance.
5. StaffBoard Lite staff profiles, QR generation, manual scan fallback, correction, and reports.
6. DRY_RUN WhatsApp notification foundation explanation.
7. Teacher/staff forbidden states.
8. Logout and protected-route redirect.

Do not claim physical QR camera readiness, live WhatsApp delivery, native production readiness, FeeDesk, GradeBook, full SchoolCast, exports/charts, or clean production-like DB state unless those items are separately verified and approved.

## Support Execution

Use `docs/pilot-support-checklist.md` during the controlled pilot/demo.

Support priorities:

1. Login/logout and School ID issues.
2. RBAC/forbidden-state issues.
3. Student attendance and staff attendance mutation issues.
4. QR expiry/duplicate/manual fallback questions.
5. Notification DRY_RUN questions.
6. UI/responsive friction.
7. Feedback classification and escalation.

Escalate immediately if a report suggests cross-tenant access, role boundary failure, attendance data loss, sensitive data exposure, Prisma/SQL/stack trace exposure, or accidental live WhatsApp sending.

## QR Camera QA Plan

Physical QR camera readiness remains pending.

Before claiming full QR camera readiness, complete `docs/qr-camera-qa-plan.md` with:

- approved HTTPS URL
- reachable backend
- seeded DB
- physical Android Chrome
- physical iOS Safari
- live CHECK_IN scan
- live CHECK_OUT scan
- permission denied state
- camera unavailable/failure state
- manual fallback
- duplicate/expired QR states where safe
- wrong-branch QR negative fixture when available

Until then, describe QR scanner status as release-candidate with browser/manual fallback verified and real-device camera QA pending.

## Post-Pilot Feedback Plan

Use `docs/post-pilot-feedback-plan.md` to classify feedback as:

- Launch blocker
- High priority
- Improvement
- Future module

Do not turn future-module requests into Base MVP scope without explicit approval. FeeDesk, GradeBook, full SchoolCast, native production release, exports/charts, offline sync, push notifications, payroll, leave management, and parent/student app requests stay in roadmap feedback.

## Final GO / HOLD Recommendation

GO:

- Controlled web pilot/demo can proceed with documented limitations.
- The handoff package is documentation-ready.
- Core web Base MVP scope has supporting browser smoke and rehearsal evidence.

HOLD conditions:

- Do not start a production-like customer pilot until DB reset/rebuild and smoke checks are performed on the target environment.
- Do not claim physical QR camera readiness until Android/iOS HTTPS device QA passes.
- Do not claim live WhatsApp delivery until provider setup, secret storage, scheduler, and outbox review are approved and tested.
- Do not claim native mobile production readiness until physical-device QA passes.

Current handoff status: ready for controlled pilot/demo execution with documented limitations.
