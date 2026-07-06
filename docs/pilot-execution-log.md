# Pilot Execution Log

## Status

- Date: 2026-06-28
- Release: JinaCampus Web v1.0 - Base MVP Release Candidate
- Execution type: controlled pilot/demo execution attempt
- Target School ID: `jinacampus-demo`
- Overall execution status: blocked before clean DB reset by local Docker/PostgreSQL availability
- Latest rerun status: blocked at Step 1 before migration/seed/browser smoke
- Web RC status: GO for controlled pilot/demo after target-environment DB reset, seed, and smoke pass
- Widen-pilot recommendation: HOLD until clean DB reset, migration/seed verification, short browser smoke, and QR/device limitations are accepted

This log does not include passwords, bearer tokens, session cookies, raw QR payloads, provider secrets, private URLs, Aadhaar values, bank account values, or screenshots.

## Environment

| Item | Result |
| --- | --- |
| Repository | Local Windows checkout |
| Package manager | npm |
| Database URL shape | Local PostgreSQL on `localhost:55432`, database `jinacampus` |
| Docker/PostgreSQL | Blocked: Docker daemon is not running and nothing is listening on `localhost:55432` |
| Production DB safety | No destructive reset was run |
| Native mobile | Frozen for this Web Base MVP pilot execution |
| WhatsApp | DRY_RUN/foundation only; live delivery not enabled |

## DB Reset Status

Clean pilot DB reset was not performed.

Reason:

- Latest rerun confirmed `.env` still points to a local PostgreSQL target on `localhost:55432`, database `jinacampus`; secrets were not printed.
- `docker ps --filter name=jinacampus-postgres` failed because the Docker daemon is not running.
- `docker compose up -d postgres` failed because the Docker daemon is not running.
- `Test-NetConnection localhost:55432` returned `TcpTestSucceeded: False`.
- `npx prisma migrate status` was not rerun in the latest pass because the instructions require stopping when no database is reachable.

Safety decision:

- No destructive reset command was run.
- No production-like clean DB state is claimed.
- The existing local/demo DB must still be treated as possibly QA-contaminated until reset/rebuild succeeds.

## Migration / Seed Status

| Step | Status | Notes |
| --- | --- | --- |
| Confirm DB target | Passed | `.env` points to local PostgreSQL at `localhost:55432` for database `jinacampus`; secrets were not printed. |
| Docker/PostgreSQL reachable | Blocked | Docker daemon unavailable. |
| Migration status | Not run in latest rerun | Stopped at Step 1 because Docker/PostgreSQL was not reachable. |
| Seed | Not run | Seed requires reachable PostgreSQL. |
| Demo School ID verification | Not run | Requires seed/DB access. |
| Demo users/roles verification | Not run | Requires seed/DB access. |
| Notification settings/templates verification | Not run | Requires seed/DB access. |

## Quality Gate Results

Latest static quality gate evidence from the current local checkout session:

| Command | Result |
| --- | --- |
| `npx prisma format` | Passed |
| `npx prisma validate` | Passed |
| `npx prisma generate` | Passed |
| `npm run typecheck` | Passed |
| `npm test` | Passed, 76 files / 662 tests |
| `npm run build` | Passed |
| `git diff --check` | Passed |
| `npm pkg get scripts.lint` | Returned `{}`; no root lint script exists |

The current re-run should be treated as DB-environment blocked, not as a confirmed app regression.

DB-backed commands:

| Command | Result |
| --- | --- |
| `docker ps --filter name=jinacampus-postgres` | Failed because Docker daemon is not running. |
| `docker compose up -d postgres` | Failed because Docker daemon is not running. |
| `Test-NetConnection localhost:55432` | Failed; no TCP listener was available on the configured local PostgreSQL port. |
| `npx prisma migrate status` | Not rerun in latest pass because no database was reachable. |
| `npm run db:seed` | Not run because PostgreSQL was unavailable. |

## Demo Users Prepared

Not verified in this execution attempt because the DB was unavailable.

Expected seeded roles remain:

- Administrator / Super Admin
- Principal
- Teacher
- Staff
- Office Staff

Do not document demo passwords in this log.

## Short Browser Smoke Status

Short browser smoke was not run in this execution attempt.

Reason:

- Clean DB reset and seed were blocked before app smoke.
- Protected route smoke depends on seeded users and session setup.

Required smoke when DB is available:

| Area | Routes / flows |
| --- | --- |
| Auth | `/administrator/login`, `/login`, `/forgot-password`, `/dashboard`, `/account/change-password` |
| Administrator | `/administrator`, `/administrator/schools`, create/view/edit/dashboard inspection routes |
| CampusCore | institutions, branches, users, roles, settings |
| Academia | students, registration, profile/edit, enrollments, attendance, mark, reports |
| StaffBoard Lite | staff, categories, attendance, QR display, scan/manual fallback, reports |
| Notifications | CampusCore attendance notification settings in DRY_RUN state |

## Deployment Status

Deployment was not executed.

Reason:

- The pilot execution order requires clean DB reset, migrations/seed, and short browser smoke before deployment.
- Those pre-deployment gates are blocked by local Docker/PostgreSQL availability.

No new deployment architecture was introduced.

## Customer Demo Run Status

Customer demo was not run in this execution attempt.

Reason:

- DB reset/seed and short browser smoke did not complete.

Use `docs/customer-demo-script.md` when the target environment is ready.

## Feedback Summary

No pilot/demo feedback was collected in this execution attempt because the controlled demo did not run.

Feedback intake log:

- `docs/post-pilot-feedback-log.md`

## Blocker Summary

| Type | Description | Product blocker? | Next action |
| --- | --- | --- | --- |
| Environment | Docker daemon is not running, so local PostgreSQL cannot start. | No confirmed app defect | Start Docker Desktop or provide reachable pilot/staging PostgreSQL, then rerun DB reset and smoke. |
| Execution gate | Clean pilot DB reset/seed not completed. | Release execution blocker | Rerun migration status and seed after DB is reachable. |
| Execution gate | Short browser smoke not run. | Release execution blocker | Run browser smoke after DB reset/seed. |
| Execution gate | Deployment not executed. | Release execution blocker | Deploy only after DB reset/seed and smoke pass. |
| QA limitation | Real-device Android/iOS QR camera QA remains pending. | Known limitation | Run `docs/qr-camera-qa-plan.md` with approved HTTPS URL and devices. |

## Next Decision

Decision: hold execution at the clean DB reset gate.

Recommended next step:

1. Start Docker Desktop or provide the approved pilot/staging PostgreSQL environment.
2. Rerun `docker ps`.
3. Rerun `npx prisma migrate status`.
4. Run the approved seed/reset sequence.
5. Run the short browser smoke matrix.
6. Deploy the Web Base MVP RC only after the smoke passes.
7. Run the controlled demo and collect feedback.
8. Keep QR camera readiness claims pending until real-device QA passes.
