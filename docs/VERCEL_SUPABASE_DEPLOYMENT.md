# Vercel and Supabase Deployment

Date: 2026-07-14

Status: Database schema and application data transferred to the managed Supabase project; Vercel connection-string cutover and deployed application verification remain operator-controlled.

## Database Transfer Record

- The source was the local Docker PostgreSQL database managed by the existing Prisma migration history.
- The destination was the active managed Supabase project for JinaCampus.
- All 10 checked-in Prisma migrations were applied in order.
- Prisma's `_prisma_migrations` ledger was copied with matching migration names and SHA-256 checksums so future `prisma migrate deploy` runs remain consistent.
- All 33 application tables were transferred. The destination contains 34 public tables including `_prisma_migrations`.
- Application row counts matched after import, except for intentionally excluded environment-bound records.
- `sessions`, `login_otps`, and `staff_attendance_qr_tokens` were not transferred. Users must sign in again after cutover; one-time codes and short-lived QR tokens must be regenerated in the destination environment.
- Users, password credentials, tenant/institution/branch context, roles, permissions, settings, and audit records were transferred without printing hashes or secrets.
- Row-level security is enabled on every public table with no public API policies. JinaCampus continues to access PostgreSQL only through its trusted server-side Prisma connection.
- Supabase security advisors reported no warnings after public API execution was revoked from the generated `rls_auto_enable()` helper.
- Performance advisor notices are expected on a newly migrated, low-traffic database and should be reviewed after representative pilot traffic rather than by deleting indexes during cutover.

The local source database remains unchanged as a rollback reference. The temporary transfer dump was deleted after verification.

## Architecture Decision

- Supabase provides hosted PostgreSQL only.
- Vercel hosts the Next.js application and server routes.
- JinaCampus custom authentication, database-backed sessions, tenant isolation, RBAC, OTP handling, and audit logs remain unchanged.
- No Supabase Auth client, public API key, service-role key, or browser database access is required.

## Required Production Variables

Configure secrets in **Vercel Project Settings -> Environment Variables**. Never place real values in tracked files.

| Variable | Production purpose |
| --- | --- |
| `DATABASE_URL` | Supavisor transaction-pooled PostgreSQL URL used by Vercel runtime functions. |
| `DIRECT_URL` | Direct Supabase PostgreSQL URL used by Prisma migration commands. |
| `APP_URL` | Canonical HTTPS application origin. |
| `SESSION_SECRET` | Random server-only session-token HMAC secret, at least 32 characters. |
| `PASSWORD_PEPPER` | Separate server-only password and OTP pepper. |
| `SESSION_COOKIE_NAME` | Session cookie name; defaults to `jc_session`. |
| `SESSION_TTL_DAYS` | Session lifetime from 1 to 30 days. |
| `COMMERCIAL_BOOTSTRAP_ENABLED` | One-time tenant bootstrap gate; normally `false`. |
| `RESET_SEED_ADMIN_PASSWORD` | Explicit credential reset gate; normally `false`. |
| `DEV_DEMO_SEED_ENABLED` | Must remain `false` in production. |
| `SEED_TENANT_NAME` | Initial school tenant name when bootstrap is enabled. |
| `SEED_TENANT_SLUG` | Initial unique School ID when bootstrap is enabled. |
| `SEED_ADMIN_EMAIL` | Initial tenant-owner email. |
| `SEED_ADMIN_PHONE` | Initial tenant-owner phone; required for OTP QA or non-development SMS delivery. |
| `SEED_ADMIN_TEMP_PASSWORD` | Strong temporary password, hashed before storage. |
| `SMS_PROVIDER` | OTP provider mode; `dev` does not represent production SMS delivery. |

Institution, branch, academic-year, SMS provider, and WhatsApp provider variables remain optional according to `.env.example` and the selected rollout scope.

## Connection Selection

### Runtime

Use the Supabase **Supavisor transaction-mode** connection for `DATABASE_URL`. It is intended for temporary/serverless clients. Use the exact Prisma-compatible string supplied by Supabase and retain its required SSL/pooling parameters.

### Migrations

Use the Supabase **direct database** connection for `DIRECT_URL`. Direct connections may require IPv6 support or the Supabase IPv4 option. Run migrations only from an approved secure terminal or CI runner that can reach this endpoint.

Do not print either URL. Do not place either URL in a `NEXT_PUBLIC_` variable.

## Supabase Data API Safety

JinaCampus does not use PostgREST or browser-side Supabase access. Disable the Supabase Data API for this project when practical. If the Data API remains enabled, separately review exposed schemas, grants, and RLS before adding commercial data. Do not assume application RBAC automatically protects Data API access.

## Migration Procedure

Load production environment variables in a secure terminal, then run:

```bash
npm run db:migrate:status
npm run db:migrate:deploy
npm run db:generate
```

Production rule: never run `prisma migrate dev` or `prisma migrate reset` against Supabase production.

## One-Time Commercial Bootstrap

1. Confirm migrations are current.
2. Set `COMMERCIAL_BOOTSTRAP_ENABLED=true` in the secure command environment.
3. Provide the required tenant and administrator variables.
4. Keep `DEV_DEMO_SEED_ENABLED=false`.
5. Run:

```bash
npm run db:seed
```

6. Verify the tenant, tenant owner, role assignment, and password credential through server-side SQL or authenticated JinaCampus flows.
7. Set `COMMERCIAL_BOOTSTRAP_ENABLED=false` immediately.
8. Keep `RESET_SEED_ADMIN_PASSWORD=false` unless an approved controlled reset is required.
9. Redeploy production so the disabled bootstrap setting is active.

The bootstrap is idempotent. It does not reset an existing administrator password unless the explicit reset flag is enabled.

## Database Verification

From the Supabase SQL Editor or an approved direct SQL client, verify migration and bootstrap state without selecting secrets:

```sql
select to_regclass('public.login_otps') as login_otp_table;
select count(*) as tenant_count from public.tenants;
select count(*) as active_user_count from public.users where status = 'ACTIVE';
select count(*) as tenant_owner_assignments
from public.user_role_assignments ura
join public.roles r on r.id = ura."roleId" and r."tenantId" = ura."tenantId"
where ura."isActive" = true and r.code = 'TENANT_OWNER';
```

Do not select `passwordHash`, `tokenHash`, `otpHash`, session cookies, or raw credentials during verification.

## Deploy and Verify

After adding or changing Vercel variables, create a new deployment:

```bash
vercel --prod
```

Then verify:

1. `https://<approved-domain>/api/health` returns `{ "ok": true, "database": "connected" }`.
2. The generic login page loads without requiring tenant context.
3. Unknown or unauthenticated `/api/auth/me` and `/api/campus-core/context` requests return safe `401` JSON.
4. School login resolves tenant context only after credentials are submitted.
5. The dashboard handles missing branch or active academic year with setup states rather than a runtime failure.

## Runtime Logs

Open **Vercel Project -> Logs** and filter the production deployment by route or request ID. Check for:

- Environment validation failures naming missing keys only.
- Prisma reachability, authentication, pool exhaustion, or migration-table errors.
- `/api/health` database failure codes.
- Route-level safe errors without database URLs, SQL, stack traces, passwords, tokens, or OTPs.

Never paste full database URLs or secrets into support logs or issue trackers.

## Avoiding Common 500 Errors

| Symptom | Check |
| --- | --- |
| Build fails during environment validation | Confirm all production variables exist in Vercel and redeploy. |
| Health reports database unavailable | Confirm pooled `DATABASE_URL`, password encoding, SSL parameters, and Supabase project status. |
| Prisma reports a missing table | Run `npm run db:migrate:deploy` with the direct URL. |
| OTP route reports a missing relation | Verify `public.login_otps` exists and the latest migration is applied. |
| Login fails after session-secret change | Existing session hashes are invalid; sign in again. |
| Direct migration host cannot be reached | Use an IPv6-capable runner or the approved Supabase IPv4 option. |
| Environment changes appear ignored | Vercel variables affect only new deployments; redeploy. |

## Post-Deployment Gate

- [ ] Production and Preview use separate databases or isolated credentials.
- [ ] `DATABASE_URL` uses the approved pooled runtime endpoint.
- [ ] `DIRECT_URL` uses the approved migration endpoint.
- [ ] `SESSION_SECRET` and `PASSWORD_PEPPER` are separate strong secrets.
- [ ] All migrations are deployed.
- [ ] `LoginOtp` table exists.
- [ ] Commercial bootstrap completed once.
- [ ] Bootstrap and development fixture flags are disabled.
- [ ] Temporary administrator password was changed.
- [ ] `/api/health` passes.
- [ ] Vercel logs expose no secrets or raw Prisma errors to clients.
