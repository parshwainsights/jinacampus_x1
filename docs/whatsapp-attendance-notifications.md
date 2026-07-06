# WhatsApp Attendance Notification Foundation

## Status

- Phase: Base MVP Phase 10.7
- Date: 2026-06-01
- Status: foundation implemented, DB-backed dry-run smoke passed, provider live-send disabled by default
- Scope: attendance notifications only
- Explicitly not in scope: full SchoolCast, marketing broadcasts, fee reminders, result announcements, chatbot, parent/student apps, native mobile, and push notifications

## Product Decision

This phase adds a lightweight SchoolCast Lite foundation for attendance notifications without starting the full SchoolCast module.

The supported MVP notification use cases are:

- Student daily attendance WhatsApp alerts for guardians.
- Staff monthly attendance WhatsApp summaries for staff.
- Tenant-safe notification outbox and delivery log infrastructure.
- Disabled-by-default demo seed configuration.
- Dry-run provider behavior unless approved production credentials are configured outside source control.

Attendance submission remains the source of truth. Notification queueing is best-effort and must not block attendance submission.

## Data Model

New Prisma models:

- `CommunicationPreference`
- `NotificationTemplate`
- `NotificationOutbox`
- `NotificationDeliveryLog`
- `WhatsAppIntegrationSetting`

DB uniqueness is enforced with partial unique indexes for global and branch-scoped notification templates and WhatsApp integration settings.

New attendance settings fields:

- `studentAttendanceWhatsAppEnabled`
- `studentAttendanceNotificationMode`
- `staffMonthlySummaryWhatsAppEnabled`
- `staffMonthlySummarySendDay`
- `staffMonthlySummarySendTime`

New notification enums cover preference owner type, channel, template category, recipient type, outbox status, delivery status, WhatsApp provider, and student attendance notification mode.

## Student Attendance Alerts

Student attendance submission queues WhatsApp notifications only when all of these are true:

- Attendance settings enable student WhatsApp alerts.
- A matching active WhatsApp template exists.
- The attendance status is allowed by the configured mode.
- A guardian is linked.
- The guardian has WhatsApp consent enabled.
- The guardian has attendance alerts enabled.
- A WhatsApp number is available.

Modes:

- `DISABLED`: queue nothing.
- `EXCEPTION_ONLY`: queue `ABSENT`, `LATE`, `HALF_DAY`, and `ON_LEAVE`.
- `ALL_STATUSES`: queue any marked status except `NOT_MARKED`.

Queueing uses an idempotency key per tenant, attendance record, and status to prevent duplicate outbox rows.

Notification payloads intentionally include only safe attendance fields:

- student name
- class-section display name
- attendance status
- attendance date
- institution name

They do not include remarks, medical details, tenant IDs, actor IDs, password hashes, token hashes, or QR tokens.

## Staff Monthly Summaries

Staff monthly summaries are queued by the staff monthly summary job helper when:

- Staff monthly WhatsApp summaries are enabled in attendance settings.
- A matching active WhatsApp template exists.
- The staff profile is active.
- The staff member has WhatsApp consent enabled.
- Monthly summaries are enabled for that staff member.
- A WhatsApp number is available.

Summary payloads include:

- staff name
- month label
- present day count
- late day count
- half-day count
- leave day count
- absent/not-marked count
- institution name

The helper is ready for a future scheduler, but no production scheduler or broadcast system is introduced in this phase.

## Outbox And Provider Behavior

Outbox rows are tenant-scoped and optionally branch/academic-year scoped. Processing sends queued rows through the provider abstraction and records delivery logs.

Provider behavior:

- `WHATSAPP_PROVIDER_MODE=DRY_RUN` returns a safe dry-run success and sends no real messages.
- Missing provider configuration fails safely.
- Live Meta Cloud API sending is deferred until approved credential storage and secret decryption are configured.
- Provider errors are sanitized before persistence or user-facing handling.

Local environment placeholders:

```bash
WHATSAPP_PROVIDER_MODE="DRY_RUN"
WHATSAPP_WEBHOOK_VERIFY_TOKEN_SHA256=""
WHATSAPP_APP_SECRET=""
```

Do not commit provider credentials, access tokens, app secrets, webhook verify tokens, private URLs, or phone-number fixture data from real users.

## Webhook Behavior

The WhatsApp webhook route supports:

- GET verification by comparing the submitted verify token hash with `WHATSAPP_WEBHOOK_VERIFY_TOKEN_SHA256`.
- POST signature verification using `x-hub-signature-256` and `WHATSAPP_APP_SECRET`.
- Delivery status extraction and recording for known provider message IDs.

Webhook processing ignores unknown delivery message IDs safely.

## Settings And Permissions

Attendance settings now expose notification controls for authorized users:

- Student WhatsApp attendance alerts.
- Student notification mode.
- Staff monthly WhatsApp summaries.
- Staff monthly summary send day/time.

Notification permissions:

- `notifications.settings.manage`
- `notifications.outbox.view`
- `notifications.outbox.process`
- `notifications.whatsapp.manage`

Default role policy:

- Admin and Principal receive notification governance permissions.
- Teacher and Staff do not receive notification governance permissions.

Server-side permission checks remain authoritative. UI visibility is not a security boundary.

## Consent And Privacy

Demo seed creates notification templates, disabled WhatsApp integration settings, and disabled communication preferences.

Rules:

- No real messages are sent by default.
- Consent is required before queueing.
- Phone numbers in audit metadata are masked.
- Notification queue failures are swallowed by attendance submission and can be reviewed through logs/outbox processing later.
- Raw passwords, password hashes, session secrets, bearer tokens, token hashes, raw QR tokens, tenant IDs in normal UI, actor IDs, and provider secrets must not appear in UI, logs, docs, or screenshots.

## Testing Checklist

Source/unit coverage includes:

- Student attendance status filtering.
- Consent and phone gating.
- Idempotency behavior.
- Non-blocking queue failure behavior.
- Staff monthly summary calculation and queueing.
- Outbox queued/sent/failed behavior.
- Provider dry-run and sanitized errors.
- Webhook status extraction and signature verification.
- Notification RBAC defaults.
- Client schema rejection of tenant/actor IDs.
- Payload privacy guards.

DB-backed checks still require a running PostgreSQL instance:

- Apply migration.
- Seed demo data.
- Verify templates/preferences/settings are seeded.
- Submit student attendance with alerts disabled.
- Enable alerts in a local QA branch and verify outbox rows are queued only for eligible statuses and consented recipients.
- Process the outbox in dry-run mode.
- Verify delivery logs contain no secrets.

## DB Smoke Result

The 2026-06-01 DB-backed dry-run smoke passed against local PostgreSQL for:

- migration application
- seed verification
- student attendance notification outbox queueing
- staff monthly summary outbox queueing
- outbox processing in DRY_RUN mode
- delivery log creation
- webhook status handling
- tenant/branch scoping
- seeded notification RBAC

See `docs/whatsapp-notification-db-smoke.md`.

## Remaining TODOs

- Add an approved secret storage/decryption path before live Meta Cloud API sending.
- Add a scheduler only after product approval.
- Add an admin outbox review UI only if needed.
- Add fuller fixture coverage for consent edge cases.
- Keep full SchoolCast deferred until explicitly started.
