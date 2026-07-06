# Administrator Portal and School ID Browser QA

Date: 2026-06-02

Status: Passed with local DB-backed browser QA.

## Scope

This pass verified the Administrator Portal and School ID login model against the seeded local PostgreSQL database.

Native mobile, FeeDesk, GradeBook, full SchoolCast, global operator console redesign, branch switcher redesign, live WhatsApp sending, invite email, reset-token email, offline sync, exports/charts, payroll, leave management, and biometric/GPS attendance were not started.

## Environment

- Docker/PostgreSQL: running; local `jinacampus-postgres` container was healthy.
- Database: local PostgreSQL through the project Docker Compose mapping.
- Migration status: Prisma reported the database schema is up to date.
- Seed status: `npm run db:seed` completed successfully.
- Browser method: local headless Chrome DevTools automation against `http://localhost:3000`.
- In-app Browser plugin status: runtime initialized, but no session-owned in-app browser backend was available in this Codex session, so local Chrome DevTools automation was used instead.

No passwords, session cookies, reset tokens, QR payloads, provider tokens, private URLs, or credentials are documented here.

## Seeded Data

Verified local seed records exist for:

- Demo School ID `jinacampus-demo`.
- Active demo institution and branch.
- Active academic year `2026-27`.
- Demo administrator/admin user.
- Demo principal user.
- Demo teacher user.
- Demo staff user.
- Demo office user.
- Demo role assignments and branch assignments.

The public School ID maps to the existing internal `Tenant.slug` column.

## Administrator User Tested

The seeded demo admin account was used for administrator portal QA. Secrets are not documented.

## School Users Tested

Seeded school users tested without recording secrets:

- Principal
- Teacher
- Staff
- Office user

A disposable QA principal account was also created inside the disposable QA school for School ID login checks.

## Administrator Login Result

Passed.

- `/administrator/login` rendered with Administrator-focused copy.
- Email and password fields were usable.
- Show/hide password worked with real browser mouse interaction; the toggle button is `type="button"`.
- Invalid administrator login showed the safe generic message.
- Valid administrator login succeeded and redirected to the administrator area.
- Administrator route protection redirected unauthenticated access to `/administrator/login`.
- Administrator logout was exercised through the route/API during session clearing.
- No password hash, token hash, session secret, stack trace, Prisma error, or SQL error appeared in checked browser output.

## Non-Admin Administrator Login Rejection

Passed.

The following seeded school users were rejected from `/administrator/login` with the same safe message and no role/existence disclosure:

- Principal
- Teacher
- Staff
- Office user

## School List Result

Passed.

- `/administrator/schools` opened for the administrator.
- Existing schools appeared.
- School name, School ID, status, setup counts, updated metadata, and View/Edit actions appeared.
- Search route with the disposable QA School ID returned the created school.
- User-facing copy said `School ID`, not `Tenant Slug`.
- No internal tenant ID was visible in normal page text.

## Create School Result

Passed.

- `/administrator/schools/create` loaded.
- Reserved School ID validation showed a safe field message.
- Invalid School ID format showed a safe field message.
- Duplicate School ID was rejected safely.
- A disposable QA school was created with default institution, branch, roles, permissions, attendance settings, and an optional principal user.
- The new school appeared in the administrator school list.
- `school.created` audit action was present.
- No raw password or password hash appeared in browser output.

## Edit School Result

Passed.

- The edit route loaded for the disposable QA school.
- Existing school profile values were prefilled.
- School name and institution display name were updated.
- The update persisted in the database.
- `school.updated` audit action was present.
- Error and success states were safe.

## School ID Update Result

Passed.

- The edit page showed the warning that changing School ID changes the login code/URL.
- Explicit confirmation was required.
- Reserved School ID update was rejected.
- Duplicate School ID update was rejected.
- The disposable QA school was updated from its original School ID to a new School ID.
- The old School ID no longer resolved.
- The new School ID appeared on the school detail page.
- `school.school_id_updated` audit action was present.

## Deactivate School Result

Passed.

- The disposable QA school was deactivated through lifecycle controls.
- Database status changed to `SUSPENDED`.
- The detail page showed suspended status.
- Users from that deactivated school could no longer log in.
- `school.deactivated` audit action was present.

## Delete School Result

Passed for conservative hard-delete behavior.

- Hard delete was available only in the administrator detail danger area.
- The delete attempt required the explicit `DELETE SCHOOL` confirmation phrase.
- Hard delete was blocked because dependent data existed.
- Browser copy recommended deactivation instead.
- The disposable QA school remained in the database.
- `school.delete_blocked` audit action was present.

## School-User Login With School ID Result

Passed.

- `/login` displayed School ID, email, and password fields when no School ID query was provided.
- A disposable QA principal could log in with the updated School ID.
- The same disposable QA principal could not log in with the old School ID.
- The same disposable QA principal could not log in with the demo School ID.
- A seeded teacher login through `/login?schoolId=jinacampus-demo` succeeded and routed to the role-appropriate attendance page.
- Deactivated school login failed safely.
- All checked failures returned the generic school-login error.

## School ID Label And Copy Result

Passed.

- Checked browser UI used `School ID`.
- Source search found no user-facing `Tenant Slug` or `tenant slug` copy in `src` or docs.
- Internal `slug` and `tenantSlug` names remain in code for database compatibility and the existing `/t/[tenantSlug]/login` route.

## RBAC And Security Result

Passed.

- Principal, teacher, and staff route attempts against administrator pages produced safe redirect/permission behavior.
- School users could not create, edit, update School ID, deactivate, or hard-delete schools.
- Administrator-only services remained permission-gated.
- School ID was treated only as a login identifier, not authorization.
- Browser output did not expose password hashes, token hashes, raw passwords, session secrets, reset tokens, Prisma/SQL errors, stack traces, private URLs, or provider secrets.

## Multi-Tenant Safety Result

Passed for available local fixtures.

- A disposable QA school was created as a separate tenant.
- A QA user from that school could not log in using `jinacampus-demo`.
- The old School ID failed after School ID update.
- School ID uniqueness was enforced across schools.

Remaining broader cross-tenant negative QA can be expanded with a dedicated multi-tenant fixture matrix if needed before a wider operator rollout.

## Disposable QA School Status

The disposable QA school was retained in deactivated/suspended state for future local QA evidence. It contains fake `.test` contact data only.

## Bugs Found / Fixed

No application bugs were confirmed.

Harness notes:

- The in-app Browser plugin had no available backend in this session, so local headless Chrome DevTools automation was used.
- Synthetic DOM clicks did not reliably exercise the password toggle and some submit buttons. Focused reruns with real browser mouse events confirmed the app behavior passed.

## Remaining Risks / TODOs

- True global operator identity independent of tenant sessions remains a future design decision.
- Broader multi-tenant negative QA can be expanded with an intentional two-school fixture matrix.
- In-app Browser backend was unavailable in this session; QA used local Chrome DevTools automation.
- Native mobile remains frozen.
- FeeDesk, GradeBook, and full SchoolCast remain deferred.

## Recommended Next Task

Run final release acceptance review for the Base MVP freeze, or add a dedicated cross-tenant negative fixture pass if the administrator portal is expected to manage many schools before the next product module begins.
