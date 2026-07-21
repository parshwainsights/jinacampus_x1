# JinaCampus

JinaCampus is a multi-tenant school management SaaS foundation covering CampusCore, Academia, StaffBoard Lite, attendance, dashboard, and production onboarding controls.

## Release Checkpoint

- [JinaCampus Base MVP Foundation v0.1 Runbook](docs/releases/base-mvp-v0.1-runbook.md)

## Commercial Bootstrap

The default seed is safe to run repeatedly: it updates only global permission definitions. It does not create a school, administrator, branch, academic year, or sample operational data unless an explicit bootstrap mode is enabled.

1. Copy `.env.example` to `.env`.
2. Set `COMMERCIAL_BOOTSTRAP_ENABLED="true"`.
3. Set `SEED_TENANT_NAME` and a unique lowercase `SEED_TENANT_SLUG`.
4. Set `SEED_ADMIN_EMAIL`, optional `SEED_ADMIN_PHONE`, and a strong `SEED_ADMIN_TEMP_PASSWORD`.
5. Optionally configure institution, branch, and academic-year values as complete groups.
6. Run `npx prisma migrate deploy`.
7. Run `npm run db:seed`.
8. Sign in with the configured School ID, administrator email, and temporary password.
9. Change the temporary password after first login.
10. Set `COMMERCIAL_BOOTSTRAP_ENABLED="false"` after onboarding.

Never commit real production `.env` files. Never keep a temporary password after onboarding. Re-running bootstrap does not reset an existing administrator password unless `RESET_SEED_ADMIN_PASSWORD="true"` is explicitly set.

Changing the seed configuration does not delete records from an existing database. Use a clean managed PostgreSQL database for commercial onboarding. Any cleanup of a previously populated development database must be separately reviewed and must never be run against customer data.

## Optional Development Fixtures

Local development fixtures are disabled by default. They run only when `DEV_DEMO_SEED_ENABLED="true"` outside production and require environment-supplied passwords. Production seed execution rejects that flag. Development fixtures must never be used as commercial school data.

## Supabase PostgreSQL + Vercel Deployment

JinaCampus uses Supabase only as hosted PostgreSQL. The existing JinaCampus session authentication, tenant context, RBAC, password hashing, OTP validation, and audit logging remain authoritative. Do not enable Supabase Auth for this deployment.

### A. Supabase Setup

1. Create a Supabase project and store its database password in an approved secret manager.
2. Open the project dashboard, select **Connect**, and copy the Supavisor transaction-mode connection string for `DATABASE_URL`. Vercel serverless runtime traffic should use the pooled endpoint.
3. Copy the direct database connection string for `DIRECT_URL`. Prisma migration commands use this endpoint through `directUrl` in `prisma/schema.prisma`.
4. Preserve the SSL and Prisma compatibility parameters supplied by Supabase. Do not commit either connection string.
5. If the direct endpoint is unreachable from an IPv4-only migration runner, use a runner with IPv6 support or the approved Supabase IPv4 option.
6. JinaCampus does not use the Supabase Data API. Disable it for this project, or separately harden exposed schemas before commercial data is added.

### B. Vercel Environment Variables

Set these under **Vercel Project Settings -> Environment Variables** for Production, and use separate database credentials for Preview:

```txt
DATABASE_URL=
DIRECT_URL=
APP_URL=
SESSION_SECRET=
PASSWORD_PEPPER=
COMMERCIAL_BOOTSTRAP_ENABLED=false
DEV_DEMO_SEED_ENABLED=false
RESET_SEED_ADMIN_PASSWORD=false
SEED_TENANT_NAME=
SEED_TENANT_SLUG=
SEED_ADMIN_EMAIL=
SEED_ADMIN_PHONE=
SEED_ADMIN_TEMP_PASSWORD=
SMS_PROVIDER=dev
```

Use a random `SESSION_SECRET` of at least 32 characters and a separate strong `PASSWORD_PEPPER`. Environment changes apply only to new deployments, so redeploy after editing variables.

### C. First Commercial Bootstrap

From a secure terminal loaded with the production Supabase environment:

```bash
npm run db:migrate:deploy
npm run db:generate
npm run db:seed
```

Temporarily set `COMMERCIAL_BOOTSTRAP_ENABLED=true` and provide the required tenant and administrator variables only for the one-time bootstrap. After it succeeds:

1. Set `COMMERCIAL_BOOTSTRAP_ENABLED=false`.
2. Keep `RESET_SEED_ADMIN_PASSWORD=false`.
3. Redeploy the production project with `vercel --prod` or the Vercel dashboard.
4. Sign in and change the temporary administrator password.

### D. Production Rules

- Never run `prisma migrate dev` against hosted production PostgreSQL; use `prisma migrate deploy`.
- Never enable `DEV_DEMO_SEED_ENABLED` in production.
- Never expose database URLs, Supabase secret/service-role keys, session secrets, password peppers, passwords, or OTPs to browser code.
- Do not log raw OTPs in production.
- A deployment that changes session-token hashing requires existing users to sign in again.
- Verify deployment health at `/api/health` after migrations and redeployment.

See `docs/VERCEL_SUPABASE_DEPLOYMENT.md` for the production runbook and troubleshooting checklist.
