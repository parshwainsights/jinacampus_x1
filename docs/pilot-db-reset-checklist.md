# Pilot DB Reset Checklist

## Status

- Date: 2026-06-14
- Applies to: JinaCampus Web v1.0 Base MVP controlled pilot/demo
- Purpose: prepare a clean pilot/demo database before any production-like customer run

Do not include passwords, bearer tokens, session cookies, private URLs, full Aadhaar values, full bank account values, real phone numbers, or production credentials in this document, screenshots, or support notes.

## Why A Clean Pilot DB Is Required

The local demo database may contain QA-only student rows and other test mutations created during browser smoke, release rehearsal, QR/manual fallback checks, and attendance workflow validation.

Use the existing local demo DB only for internal QA/rehearsal. Before a customer-facing production-like pilot/demo, reset or rebuild a clean pilot DB so the data story is controlled and does not contain accidental QA records.

## What Not To Use

- Do not use a QA-contaminated local DB as a production-like pilot database.
- Do not import real Aadhaar numbers.
- Do not import full bank account numbers.
- Do not import real parent/student/staff phone numbers unless the pilot has explicit approval and privacy handling.
- Do not use production credentials in demo docs.
- Do not disable tenant isolation, RBAC, audit logging, QR hashing, or password hashing to speed up setup.

## Reset / Rebuild Steps

1. Confirm the target database is the intended local, staging, or pilot DB.
2. Back up only if the environment owner requires it.
3. Confirm no real customer data will be destroyed.
4. Apply migrations using the project convention.
5. Generate Prisma Client.
6. Run the seed command for the controlled pilot/demo dataset.
7. Confirm the demo school exists.
8. Confirm users, roles, branch access, and active academic year exist.
9. Confirm student/staff records and attendance fixtures are fake and appropriate for the pilot.
10. Run the quality gates before handoff.

Command checklist:

```bash
docker compose up -d postgres
npx prisma migrate status
npx prisma generate
npm run db:seed
npm run typecheck
npm test
npm run build
git diff --check
npm pkg get scripts.lint
```

If schema changes are introduced in a later phase, run the project migration command before seed. This handoff package does not add a new migration.

## Verification Checklist

| Check | Expected result | Status |
| --- | --- | --- |
| School ID | `jinacampus-demo` exists for demo use or the approved pilot School ID exists. | Pending per target environment |
| Institution | Institution profile and branding exist. | Pending per target environment |
| Branch | Active branch exists. | Pending per target environment |
| Academic year | Active academic year exists. | Pending per target environment |
| Roles | Administrator/Super Admin, Principal, Teacher, Staff, and Office Staff roles exist as needed. | Pending per target environment |
| Users | Demo/pilot users are active and scoped to the intended school. | Pending per target environment |
| Branch access | Principal, teacher, staff, and office users have intended branch access only. | Pending per target environment |
| Classes/sections | Classes, sections, and class sections exist. | Pending per target environment |
| Students | Student records are fake/demo-safe and do not contain real sensitive data. | Pending per target environment |
| Guardians | Guardian data is fake/demo-safe and phone values are approved for the environment. | Pending per target environment |
| Enrollments | Active enrollments exist for the teacher attendance demo. | Pending per target environment |
| Staff profiles | Staff profiles are active and linked where QR/self-attendance is tested. | Pending per target environment |
| Attendance settings | Student/staff attendance settings match the demo plan. | Pending per target environment |
| Notifications | WhatsApp settings remain DRY_RUN/non-live. | Pending per target environment |

## Sensitive Data Rules

- Aadhaar and bank fields must remain masked/last-four only until approved encrypted storage and controlled reveal are implemented.
- Support notes must not include full Aadhaar, full bank account, raw passwords, reset tokens, session cookies, QR payloads, provider secrets, private URLs, tenant IDs, or actor IDs.
- Use fake `.test` emails and clearly fake phone numbers unless an approved pilot data policy says otherwise.

## Handoff Decision

A clean pilot DB is required before any production-like customer pilot/demo. The current internal demo DB may be used for continued QA and rehearsal only.

