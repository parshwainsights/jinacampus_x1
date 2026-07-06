# Demo Seed Data

Phase 9.8 adds safe, fake demo data for local QA and product demos. The seed is for development and QA only; do not use it for production data.

## Run Seed

```bash
npm run db:seed
```

The command assumes the local PostgreSQL database from `docker-compose.yml` is reachable and migrations are applied.

## Demo Tenant

- Tenant: JinaCampus Demo School
- School ID: `jinacampus-demo`
- Institution: JinaCampus Demo Institution
- Branch: Main Branch (`MAIN`)
- Academic year: 2026-27

The Prisma schema does not currently include an academic-year code field, so the demo academic year uses the name `2026-27`.

## Demo Users

The seed creates local demo users with fake `.test` emails:

- Admin: `admin@demo.jinacampus.test`
- Principal: `principal@demo.jinacampus.test`
- Teacher: `teacher@demo.jinacampus.test`
- Staff: `staff@demo.jinacampus.test`
- Office staff: `office@demo.jinacampus.test`

All demo users are active and assigned to Main Branch. The local demo password is defined in the seed constants and repeated below only for local development and QA use. Staff login uses the same School ID login page as other school users.

School user login method:

- School ID: `jinacampus-demo`
- Identifier: email address
- Password: the local demo password below, unless overridden through seed environment variables

The current staff demo login is:

- Email: `staff@demo.jinacampus.test`
- Password: `JinaCampus@123` by default

## Local Demo Login Password

The current local-only shared password for the seeded demo users is:

```txt
JinaCampus@123
```

This password is only for local development, QA, and demo seed data. Do not use it for production, staging, or real school accounts. The seed hashes this value with the existing password hashing utility before storing it; plaintext passwords must never be stored in the database.

Optional seed overrides:

- `DEMO_USER_PASSWORD`: overrides the local demo password for all seeded school users.
- `DEMO_STAFF_PASSWORD`: overrides only `staff@demo.jinacampus.test`; if unset, the staff demo user uses `DEMO_USER_PASSWORD`.

Do not use one shared password for real staff. For pilot/staging accounts, set a temporary password through the authenticated admin/principal reset flow and rotate it before production-like use.

## Supported Demo Flows

The seed supports:

- Admin/principal dashboard QA.
- Teacher student attendance page with active class-section enrollments.
- Student attendance reports with present, absent, late, and half-day records.
- StaffBoard staff list, staff filters, and staff reports.
- Staff QR generation by admin/principal because staff QR attendance is enabled for the demo branch.
- Staff QR self-scan with a linked staff user.
- Staff attendance admin and correction report, including one corrected demo record.
- Dashboard cards for students, enrollments, class sections, guardians, active staff, student attendance today, staff attendance today, classes not marked, and staff not marked.

## Safety Rules

- All people and emails are fake demo data.
- No real student, guardian, or staff data is used.
- No raw QR token is seeded.
- QR test payloads should be generated through the existing QR generation workflow during QA.
- The seed is idempotent/upsert-based and can be rerun for local QA.

## Remaining QA Notes

- Browser/device QA should be repeated after seeding to verify teacher, staff, QR generation, QR scan, correction, reports, and dashboard flows end to end.
- Real-device Android Chrome and iOS Safari QA remain recommended before production rollout.
