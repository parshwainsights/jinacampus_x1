# WhatsApp Attendance Notifications And Reports

## Status

- Review date: 2026-08-05
- Scope: student attendance alerts and staff weekly/monthly attendance reports
- Implementation status: application foundation repaired and source-level verification passed
- Live-delivery status: not ready until consent, approved templates, encrypted provider credentials, migration, and recurring worker configuration are complete
- Full SchoolCast, salary management, marketing broadcasts, parent/student portals, and push notifications remain out of scope

Attendance remains the source of truth. Notification failures never roll back or block a valid attendance submission.

## Student Attendance Behavior

When attendance is submitted or corrected, the server:

1. Resolves tenant, branch, academic year, actor, and permissions from the authenticated server context.
2. Loads the branch notification policy and approved tenant/branch WhatsApp template.
3. Selects an explicitly consented recipient, prioritising the primary guardian and then father, mother, or authorised guardian.
4. Uses the preference WhatsApp number, or the registered guardian phone only after explicit WhatsApp consent has been captured.
5. Queues and immediately processes the notification outbox on a best-effort basis.

`EXCEPTION_ONLY` supports Absent, Late, Half Day, and On Leave alerts. Absent and Late remain separately configurable. `ALL_STATUSES` sends the daily marked status for every eligible student.

The student payload includes only:

- student name
- scholar/admission number
- class and section
- attendance status
- attendance date
- attendance marking time in the branch time zone
- institution display name

It does not contain remarks, medical information, tenant IDs, actor IDs, passwords, session data, QR data, or provider secrets.

### Ten-Minute And Duplicate Rules

- Attendance submission and authorised correction invoke outbox processing immediately, which is the primary under-ten-minute delivery path.
- A production worker must also call `/api/cron/attendance-notifications` at an approved interval of ten minutes or less to drain queued messages and run scheduled staff reports.
- The worker route requires `Authorization: Bearer <CRON_SECRET>` and uses timing-safe secret comparison.
- An Absent notification uses one idempotency key per tenant, student, and attendance date. Corrections or repeated submissions cannot create another Absent outbox row for the same day.
- Other daily statuses use a tenant/student/date/status key.
- Database uniqueness remains the final duplicate-concurrency guard.

The live ten-minute SLA cannot be claimed until the production provider and recurring worker are configured and monitored.

## Employee Attendance Reports

Staff reports are available for active staff profiles with explicit WhatsApp consent and the matching weekly or monthly preference enabled.

Weekly reports cover the previous seven completed institutional calendar days. Monthly reports cover the previous completed calendar month. Both include:

- working days represented by available attendance records
- marked days
- present days
- absent days
- leave days
- late arrivals
- half days
- not-marked days
- week-off days
- holiday days
- total working minutes
- institution display name and reporting period

Missing days are not invented as Absent. Calendar/roster-derived working-day inference requires a separately approved working-calendar design.

Salary values are intentionally excluded. They may be added to the monthly report only after Salary Management is implemented, authorised, and verified.

## Institutional Time Zone

Time-zone resolution follows this precedence:

1. active branch IANA time zone
2. tenant/institution IANA time zone
3. safe default `Asia/Kolkata`

CampusCore validates IANA time-zone values. The resolved zone is used for:

- dashboard live clock and date
- student attendance dates, cut-offs, alerts, and marking time
- staff attendance dates, QR validity display, check-in/check-out display, and correction inputs
- staff report periods and timestamps
- notification schedules and payload labels
- audit-log display

Database timestamps remain stored as UTC instants. The institutional zone is applied at business-date and presentation boundaries.

## Settings Review

CampusCore Settings now keeps the existing attendance policy and adds only required notification controls:

- institution time zone, locale, date format, and currency
- student WhatsApp enabled/disabled
- student notification mode
- Absent and Late alert controls
- staff weekly WhatsApp enabled, weekday, and time
- staff monthly WhatsApp enabled, day-of-month, and time
- provider and template readiness status without revealing secrets

Enabling a notification setting ensures tenant-scoped mappings exist for:

- `student_daily_attendance_alert`
- `staff_weekly_attendance_summary`
- `staff_monthly_attendance_summary`

Guardian edit and staff edit pages provide an authorised preference panel for consent and report choices. The server derives the owner branch, rejects cross-tenant/cross-branch records, and requires `notifications.settings.manage`. Admin and Principal receive governance permissions by default; Teacher and Staff do not.

The settings form also preserves previously stored locale/date/currency/multiple-academic-year values rather than silently resetting hidden fields.

## Consent And Audit

- No recipient is eligible without `whatsappEnabled`, the relevant alert/report preference, and `consentCapturedAt`.
- Registered phone data is not treated as WhatsApp consent.
- Preference changes and outbox state changes are audit logged.
- Audit metadata stores booleans and masked recipient information, never raw passwords, provider tokens, or message secrets.
- The outbox claim uses an atomic status update, preventing two workers from sending the same queued row concurrently.

## Requested Record Readiness

A read-only DB check was performed for the requested test records.

### Scholar No. 1

- Student, active class-section enrollment, primary guardian, branch, and institutional time zone: found.
- A registered guardian phone field exists.
- Explicit WhatsApp number/preference, attendance-alert opt-in, and consent capture: not configured.

### Employee Code D-01

- Active staff profile, branch, and institutional time zone: found.
- A registered staff phone field exists.
- Explicit WhatsApp number/preference, weekly/monthly opt-in, and consent capture: not configured.

### Tenant Notification Readiness

- Student alerts: disabled.
- Staff weekly/monthly reports: disabled.
- Approved template mappings for the requested tenant: not configured.
- Enabled WhatsApp provider integration: not configured.

No consent was fabricated, no recipient number was printed, and no message was sent during this review.

## Provider And Worker Configuration

Safe defaults:

```bash
WHATSAPP_PROVIDER_MODE="DRY_RUN"
WHATSAPP_WEBHOOK_VERIFY_TOKEN_SHA256=""
WHATSAPP_APP_SECRET=""
CRON_SECRET=""
```

`DRY_RUN` exercises outbox and delivery-log behavior without contacting WhatsApp. Live Meta Cloud/BSP delivery remains deliberately blocked until approved encrypted secret storage/decryption and provider implementation are completed. Do not place provider access tokens in source control, public settings, logs, or documentation.

The application includes the protected worker endpoint but does not assume a hosting plan or silently add an unsupported schedule. Configure the recurring invocation in the approved deployment scheduler after confirming its minimum interval and secret-injection behavior.

## Migration

Migration `20260805180000_add_weekly_attendance_notifications` adds disabled-by-default weekly settings and staff preference fields. It does not enable messages or create consent.

Apply with the project deployment convention only after the target environment is confirmed:

```bash
npx prisma migrate deploy
```

## Verification Coverage

Automated coverage includes:

- student status filtering and required payload fields
- guardian ordering, consent, and phone gating
- Absent duplicate-safe idempotency
- non-blocking attendance submission behavior
- weekly and monthly staff summary calculation and queueing
- registered-phone fallback only after explicit consent
- outbox atomic claim and sent/failed behavior
- provider dry-run and sanitized errors
- webhook signature/status handling
- notification RBAC and strict client schemas
- institutional date/time boundaries and correction-input round trips
- scheduler tenant/branch scoping and cron-secret guard
- dashboard clock and settings UI presence

## Remaining Release Gates

1. Apply the weekly notification migration to the intended environment.
2. Have an authorised school administrator record valid WhatsApp consent for the requested guardian and employee.
3. Enable the required student/weekly/monthly branch settings.
4. Register and approve provider template names for all three template keys.
5. Complete approved encrypted provider-secret storage/decryption and live-send adapter work.
6. Configure a recurring worker interval of ten minutes or less and alerting for failed delivery.
7. Run DRY_RUN DB smoke, then provider sandbox QA, then controlled real-recipient QA with explicit consent.
8. Verify webhook delivered/failed statuses and duplicate prevention under concurrent worker calls.

Until those gates pass, the correct status is: **application foundation ready; live WhatsApp attendance delivery not yet release-ready**.
