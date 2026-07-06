# Final Release-Candidate Packaging

## Release Decision

- Packaging date: 2026-06-12
- Handoff date: 2026-06-14
- Release name: JinaCampus Web v1.0 - Base MVP Pilot
- Status: Ready with documented limitations
- Decision: Ready for controlled pilot/demo
- Native status: JinaCampus Mobile v0.1 is release-candidate; real-device QA pending

This decision covers the Web Base MVP only. It does not certify physical Android/iOS QR camera scanning, live WhatsApp delivery, native mobile production release, FeeDesk, GradeBook, full SchoolCast, exports/charts, offline sync, push notifications, payroll, leave management, or biometric/GPS attendance.

No passwords, bearer tokens, session cookies, QR payloads, provider secrets, private URLs, Aadhaar numbers, bank account numbers, or sensitive screenshots are included in this package.

## Package Contents

| Artifact | Status | Notes |
| --- | --- | --- |
| `docs/releases/base-mvp-v1.0-runbook.md` | Updated | Release status, environment setup, migration/seed, route smoke, QR, WhatsApp, support, and launch decision. |
| `docs/known-limitations-v1.md` | Updated | Pilot limitations, including QR device QA, tenant/branch fixture limits, WhatsApp deferrals, demo data, city field, and sensitive-field deferrals. |
| `docs/customer-demo-script.md` | Updated | Customer-safe Web Base MVP demo script with explicit DRY_RUN and QR-camera caveats. |
| `docs/pilot-support-checklist.md` | Updated | Support triage and local recovery notes. |
| `docs/final-release-candidate-packaging.md` | Created | Final release-candidate packaging decision and status matrix. |
| `docs/controlled-pilot-demo-handoff.md` | Created | Controlled pilot/demo handoff execution note, GO/HOLD recommendation, route smoke matrix, and handoff order. |
| `docs/pilot-db-reset-checklist.md` | Created | Clean pilot DB reset checklist before production-like demo/pilot use. |
| `docs/qr-camera-qa-plan.md` | Created | Real-device Android Chrome and iOS Safari QR camera QA plan over approved HTTPS. |
| `docs/post-pilot-feedback-plan.md` | Created | Feedback intake and classification plan for controlled pilot/demo. |

Supporting evidence:

- `docs/full-demo-rehearsal.md`
- `docs/final-base-mvp-freeze-smoke.md`
- `docs/customer-demo-browser-qa.md`
- `docs/academia-customer-demo-smoke.md`
- `docs/student-registration-db-smoke.md`
- `docs/administrator-school-id-browser-qa.md`
- `docs/whatsapp-notification-db-smoke.md`
- `docs/native-release-candidate-hardening.md`

## Environment / Setup Status

Documented in the runbook:

- `POSTGRES_HOST_PORT`
- `DATABASE_URL`
- `APP_URL`
- `SESSION_COOKIE_NAME`
- `SESSION_TTL_DAYS`
- `PASSWORD_PEPPER`
- `NODE_ENV`
- `WHATSAPP_PROVIDER_MODE`
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN_SHA256`
- `WHATSAPP_APP_SECRET`
- native-only `EXPO_PUBLIC_API_BASE_URL`

Local startup commands are documented for dependency install, Docker PostgreSQL, Prisma generation, migration status, seed, dev server, build, and production start.

## Handoff Verification - 2026-06-14

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
| `docker ps --filter name=jinacampus-postgres` | Blocked: Docker daemon was not running in this session |
| `npx prisma migrate status` | Blocked by unavailable local PostgreSQL/Docker; static Prisma validation still passed |

No application code was changed for this handoff package. The current work is documentation and release-candidate handoff preparation only.

## Migration / Seed Status

Latest evidence from `docs/full-demo-rehearsal.md`:

- Docker/PostgreSQL was reachable.
- Prisma migration status reported 8 migrations and schema up to date.
- `npm run db:seed` completed.
- Demo tenant `jinacampus-demo` exists and is active.
- Demo roles include Administrator/Super Admin, Principal, Teacher, Staff, and Office Staff.
- Seed covers institution, branch, active academic year, classes, sections, class sections, students, guardians, enrollments, staff profiles, attendance records, notification templates, and WhatsApp settings.

Demo data warning:

- QA-only local student rows may exist.
- Demo DB must not be represented as clean production-like data.
- Real Aadhaar, bank, phone, and credential data must not be used.

## Core Browser Smoke Status

| Area | Status | Evidence |
| --- | --- | --- |
| Authentication | Pass | Login, School ID login, Administrator login, forgot password, password toggle, logout, and protected redirect are covered by freeze/full-demo docs. |
| Administrator Portal | Pass | School registry, create/edit/view/dashboard inspection, and safe school-user rejection are covered. |
| CampusCore | Pass | Institution, branch, users, roles, settings, branding, audit, and notification controls are covered for authorized users. |
| Academia | Pass | Student list/create/profile/edit, class-section filtering, enrollment visibility, attendance navigation, attendance mark, and reports are covered. |
| StaffBoard Lite | Pass | Staff profiles, QR display, scan/manual fallback, attendance admin, correction, and reports are covered. |
| Notifications | Pass with DRY_RUN limitation | Settings and DB smoke passed with no live sending. |
| Responsive UI | Pass in documented browser checks | Mobile/tablet/desktop spot checks passed in customer-demo/freeze/full-demo evidence. |

No release-candidate packaging blocker was found in the documented browser smoke evidence.

## Auth / Access Status

Verified:

- Administrator login/logout remains separate from School ID login.
- School users log in with School ID, email, and password.
- Institutions and roles do not log in.
- Principal/Admin can access permitted school context.
- Teacher, Staff, and Office Staff forbidden states are safe.
- Forgot password is public-safe and non-enumerating.
- Show/hide password controls work.
- Password reset/change flows remain authenticated and governed.

Remaining limitation:

- Broader cross-tenant browser-negative QA needs additional safe fixtures.

## Academia Demo Status

Verified:

- Student list loads.
- Student registration works.
- Duplicate admission number returns safe field-level error.
- Student profile and edit routes work.
- Seeded enrollment and class-section filtering work.
- Attendance navigation, marking, and reports are covered by full-demo/freeze smoke.
- Sensitive Aadhaar/bank values are masked and full values are not exposed.

Known limitations:

- City is free-text.
- Full sensitive-field encryption and controlled reveal are deferred.
- QA-only student rows may remain in local demo DB.

## Tenant / Branch Safety Status

Verified in current fixture coverage:

- Server-side context resolves tenant, branch, role, and permissions.
- Principal/Admin school context is scoped.
- Teacher/staff forbidden direct URLs fail safely.
- Class-section and attendance filters remain scoped in tested flows.

Limitations:

- Wrong-branch QR negative QA needs a second branch/staff fixture.
- Broader cross-tenant negative browser QA remains limited.
- Multi-branch switcher UX is deferred.

## QR Flow Status

Readiness label: QR Scanner release-candidate; real-device Android/iOS QA pending.

Verified in browser/manual flow:

- QR display page loads.
- CHECK_IN and CHECK_OUT QR generation work for authorized users.
- QR countdown/expiry UI is clear.
- Staff scan page loads.
- Manual fallback handles blank, invalid, expired, duplicate, check-in, and check-out states safely.
- `tokenHash` is not shown.
- Raw QR payload is not leaked outside intended QR/manual input contexts in checked flows.

Not certified yet:

- Physical Android Chrome camera scan.
- Physical iOS Safari camera scan.
- Approved HTTPS real-device QR CHECK_IN/CHECK_OUT.

## WhatsApp / Communication Status

Readiness label: SchoolCast Lite WhatsApp Attendance Notification Foundation is DRY_RUN/mock-ready only.

Verified:

- Notification models, templates, settings, outbox, delivery logs, provider abstraction, and webhook foundation exist.
- DB smoke passed in DRY_RUN mode.
- Authorized settings UI shows provider-not-configured/DRY_RUN state.
- No provider secrets are shown.
- No live WhatsApp sending is enabled.

Deferred:

- live Meta Cloud sending
- approved provider templates
- provider-secret storage
- scheduler wiring
- outbox review UI
- full SchoolCast

## UI / UX Status

Verified in documented smoke:

- Modern glass UI applied across release surfaces.
- Sidebar/topbar visual polish and scroll behavior documented.
- PWA icons/favicon updated and referenced.
- Login page is launch-ready.
- Dashboard, tables, forms, empty/loading/error states, and responsive wrappers are demo-ready in checked routes.

Remaining limitation:

- Real-device mobile camera UX remains pending for QR.

## Support / Recovery Status

Support notes are documented in `docs/pilot-support-checklist.md`:

- login issue triage
- password reset
- School ID verification/change
- school/user deactivate-reactivate
- student/staff attendance correction
- QR expired/manual fallback explanation
- WhatsApp DRY_RUN explanation
- feedback collection
- local recovery commands and audit preservation

## Final Readiness

Decision: Ready for controlled pilot/demo.

Final release statement:

```txt
JinaCampus Web v1.0 — Base MVP Release Candidate is suitable for controlled pilot/demo use with documented limitations.
```

This is not a full production rollout decision. The pilot can proceed with the documented Web Base MVP scope and limitations, provided support, demo, and pilot teams do not claim:

- physical QR camera production readiness
- live WhatsApp delivery
- native mobile production readiness
- FeeDesk, GradeBook, or full SchoolCast availability
- clean production-like demo database state

Handoff note:

- Use `docs/releases/base-mvp-v1.0-runbook.md` as the operator runbook.
- Use `docs/controlled-pilot-demo-handoff.md` as the handoff execution note.
- Use `docs/customer-demo-script.md` as the presenter script.
- Use `docs/pilot-support-checklist.md` for support triage.
- Use `docs/pilot-db-reset-checklist.md` before any production-like pilot database setup.
- Use `docs/qr-camera-qa-plan.md` before claiming Android/iOS QR camera readiness.
- Use `docs/post-pilot-feedback-plan.md` during and after the controlled pilot/demo.

## Remaining Risks / TODOs

- Run real-device Android Chrome and iOS Safari QR camera QA over approved HTTPS.
- Add second-branch/staff fixture for wrong-branch QR negative QA.
- Add broader cross-tenant browser-negative QA fixture coverage.
- Rebuild or reset a clean pilot DB before any customer-specific production-like data load.
- Keep WhatsApp live provider setup, secret storage, scheduler, and outbox review UI in a separate approved phase.
- Keep native mobile production release separate until physical-device QA passes.

## Recommended Next Step

Use this package for controlled pilot/demo handoff, then run real-device Staff QR camera QA over approved HTTPS before claiming full QR camera readiness.
