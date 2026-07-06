# WhatsApp Notification DB Smoke

## Status

- Date: 2026-06-01
- Status: Passed
- Scope: SchoolCast Lite attendance notification foundation only
- Provider mode: DRY_RUN
- Tenant used: `jinacampus-demo`
- Branch used: Main Branch
- Real WhatsApp sending: not configured and not tested

## Docker And PostgreSQL

Docker Desktop was started from the Windows workspace. The project PostgreSQL container became healthy on the configured local port.

The smoke used the local PostgreSQL database configured by the project `.env`. No provider tokens, passwords, private URLs, webhook secrets, or real phone numbers were documented.

## Migration Status

Migrations were applied successfully with:

```bash
npm run db:deploy
```

Applied during this pass:

- `20260601100000_add_whatsapp_attendance_notifications`
- `20260601113000_add_notification_unique_indexes`

The smoke verified the expected notification tables:

- `communication_preferences`
- `notification_templates`
- `notification_outbox`
- `notification_delivery_logs`
- `whatsapp_integration_settings`

The smoke verified expected notification enums and uniqueness/index coverage, including:

- `NotificationOutbox.idempotencyKey`
- `CommunicationPreference tenantId + ownerType + ownerId`
- tenant/global and tenant/branch scoped notification template uniqueness
- tenant/global and tenant/branch scoped WhatsApp integration uniqueness

## Seed Status

Seed ran successfully with:

```bash
npm run db:seed
```

Verified seed data:

- Demo tenant exists.
- Main Branch exists.
- Active academic year exists.
- Demo class-section/enrollment data exists.
- Demo guardians and staff profiles exist.
- Two active WhatsApp notification templates exist.
- Guardian communication preferences exist.
- Staff communication preferences exist.
- DRY_RUN WhatsApp integration seed exists and contains no provider secret.

## Student Attendance Notification Smoke

Result: Passed.

The smoke used seeded class-section data and a safe local QA attendance date.

Verified:

- Attendance submission succeeded for 6 active enrolled students.
- Student notification settings were enabled only inside the smoke.
- `EXCEPTION_ONLY` queued notifications for:
  - `ABSENT`
  - `LATE`
  - `HALF_DAY`
  - `ON_LEAVE`
- `PRESENT` was skipped.
- Guardian without consent was skipped.
- Guardian without a WhatsApp number was skipped.
- Running the queue twice returned `alreadyQueued` for already queued rows.
- Four `NotificationOutbox` rows were created for eligible guardian notifications.
- Outbox rows were tenant, branch, and academic-year scoped.
- Payloads contained safe template variables only.
- Payloads did not include password data, QR data, remarks, medical details, tenant IDs, or actor IDs.

Smoke counts:

| Check | Result |
| --- | ---: |
| Submitted student attendance records | 6 |
| Student notifications queued | 4 |
| Student notifications already queued on rerun | 4 |
| Skipped by status | 1 |
| Skipped by missing consent | 1 |
| Skipped by missing phone | 1 |

## Staff Monthly Summary Smoke

Result: Passed.

Verified:

- Staff monthly summary setting was enabled only inside the smoke.
- Active staff profiles were checked.
- Eligible staff with consent and a fake local smoke recipient value received one outbox row.
- Staff without consent was skipped.
- Staff without a WhatsApp number was skipped.
- Duplicate monthly queueing returned `alreadyQueued`.
- Inactive staff were not part of the active staff query.
- Payload contained safe monthly summary variables only.

Smoke counts:

| Check | Result |
| --- | ---: |
| Active staff checked | 13 |
| Staff summary notifications queued | 1 |
| Already queued on rerun | 1 |
| Skipped by missing consent | 11 |
| Skipped by missing phone | 1 |

## Outbox Processor DRY_RUN Smoke

Result: Passed.

Verified:

- Queued smoke rows were fetched by tenant and branch.
- DRY_RUN provider was used.
- No real WhatsApp API call was made.
- Five queued rows were processed.
- Five rows were marked `SENT`.
- Five delivery logs were created.
- Dry-run provider message IDs were fake.
- Delivery logs did not contain provider tokens or unsafe error text.

## Webhook Smoke

Result: Passed.

Verified at handler level:

- Valid HMAC signature was accepted.
- Invalid HMAC signature was rejected.
- Known provider message status was recorded.
- Unknown provider message ID was ignored safely.
- A `DELIVERED` delivery log was created for the known dry-run provider message ID.

No live Meta webhook was called.

## Tenant And Branch Safety

Result: Passed.

Verified:

- Smoke outbox rows were scoped to the demo tenant and branch.
- Notification templates and communication preferences were tenant-scoped.
- Processor input was tenant-scoped and branch-scoped.
- Multi-tenant negative fixture coverage was available in the local DB during this pass.
- No cross-tenant outbox rows appeared in smoke IDs.

## RBAC Result

Result: Passed.

Verified from seeded role permissions:

- Admin and Principal have notification governance permissions.
- Teacher and Staff do not have notification settings management permission.
- Teacher and Staff do not have notification outbox processing permission.

## Bugs Found And Fixed

1. Missing DB uniqueness for notification templates and WhatsApp integration settings.
   - Fix: added `20260601113000_add_notification_unique_indexes` with partial unique indexes for global and branch-scoped rows.

2. Initial smoke script assumed one class-section had at least seven active enrolled students.
   - Fix: script now selects a class-section with enough enrolled students for the seeded demo shape and uses a separate no-phone verification step.

3. Initial fake recipient values exceeded the schema's WhatsApp recipient length.
   - Fix: script now uses short local-only fake recipient values.

## Security Output Check

Passed.

The smoke output and this document do not include:

- provider access tokens
- webhook secrets
- raw passwords
- password hashes
- session secrets
- bearer tokens
- token hashes
- raw QR payloads
- real phone numbers
- private URLs

## Commands

```bash
docker ps
npm run db:deploy
npx prisma generate
npm run db:seed
npm run smoke:notifications:whatsapp
```

Full quality gate commands were run after documentation updates.

## Remaining Risks And TODOs

- Live Meta Cloud sending remains deferred.
- Approved encrypted provider secret storage remains deferred.
- Scheduler/cron production wiring remains deferred.
- Outbox review UI remains deferred.
- Full SchoolCast remains deferred.
- Real provider webhook QA remains deferred until live provider setup is approved.

## Recommended Next Task

Run a short authenticated browser QA pass for CampusCore attendance settings to verify the new notification controls are visible only to authorized admin/principal users and remain hidden or forbidden for teacher/staff users.
