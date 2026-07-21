# Optional Development Fixtures

Development fixtures are isolated from the commercial seed path. They are intended only for local engineering and automated QA, never for customer onboarding, staging with real users, or production.

## Default Seed Behavior

```bash
npm run db:seed
```

With both bootstrap flags disabled, this command seeds only the global permission registry. It does not create a tenant, institution, branch, academic year, user, password, student, staff profile, or attendance record.

## Explicit Development Fixture Mode

To load local fixtures, an engineer must explicitly set:

```txt
DEV_DEMO_SEED_ENABLED="true"
NODE_ENV="development"
```

The administrator email and all temporary passwords must be supplied through local environment variables. No working credentials are committed to this repository. The fixture password variables are:

- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PHONE` (optional)
- `SEED_ADMIN_TEMP_PASSWORD`
- `DEV_DEMO_USER_PASSWORD`
- `DEV_DEMO_STAFF_PASSWORD` (optional override)

The seed rejects development fixture mode when `NODE_ENV="production"`. Fixture creation remains idempotent and stores only password hashes.

## Commercial Onboarding

Commercial environments must use `COMMERCIAL_BOOTSTRAP_ENABLED` and the environment-driven process documented in `README.md`. Do not use development fixtures for a real school.

## Safety Rules

- Never commit local or production environment files.
- Never share one temporary password across real users.
- Never copy development students, staff, attendance, or QR state into a commercial database.
- No raw QR token is seeded.
- Disable all bootstrap flags after their intended one-time use.
