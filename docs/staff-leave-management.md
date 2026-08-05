# Staff Leave Application and Management

## Status

The web StaffBoard Lite leave foundation, additive database migrations, private storage configuration, and DB-backed authenticated browser QA are complete for the configured release environment.

### Release QA - 2026-08-05

- Private `staff-leave-documents` and `student-documents` Supabase Storage buckets verified with PDF/JPEG/PNG/WebP allowlists and a 4 MB limit.
- Server-only Supabase URL, service-role credential, bucket names, and size limits configured for Vercel Production and Preview without exposing values to client bundles.
- Private-object smoke passed: authorized upload, short-lived signed download, byte verification, and cleanup.
- Teacher and Staff self-service submission passed against an isolated disposable tenant.
- Staff self-service history displayed only the authenticated staff member's application.
- A non-designated Office Staff user received the safe review-denied state.
- A designated Office Staff approver reviewed and approved a branch application; the settings link remained hidden without settings permission.
- Principal governance displayed the settings action and safely blocked approval where a real attendance check-in already existed.
- A Principal assigned only to a second branch received HTTP 404 for the first branch's application.
- Direct database verification confirmed approved status, one-time balance usage, linked `ON_LEAVE` attendance, preserved real attendance on conflict, required audit events, and no WhatsApp outbox row without consent.
- The disposable QA tenant is removed after deployment smoke; no real school records were used or modified.

Confirmed QA fixes:

- Permission-filter the Leave settings link on the review page.
- Translate inaccessible application details to HTTP 404 instead of the generic error boundary.
- Give the serializable approval transaction a bounded 30-second remote-database timeout so attendance synchronization can complete on Supabase.

## Scope

Implemented:

- Teacher, Staff, and Office Staff self-service leave applications when the user has an active linked `StaffProfile`.
- Full-day, first-half, and second-half leave requests.
- Branch-specific leave policy, leave types, annual limits, designated approvers, and balances.
- Pending, clarification-required, approved, rejected, withdrawn, and cancelled states.
- Supporting documents stored in a private Supabase Storage bucket.
- Transactional approved-leave synchronization to staff attendance.
- In-system updates and consent-controlled WhatsApp outbox events.
- Full audit history for material leave operations.

Deferred:

- Payroll and salary settlement.
- Automatic public-holiday calendars beyond configured non-working weekdays.
- Multi-level or sequential approval chains.
- Email invitations and email leave notifications.
- Native mobile leave screens.
- Provider delivery guarantees; WhatsApp depends on the existing outbox processor and approved provider templates.

## Routes

- `/staffboard/leave` - the signed-in staff member's applications, balances, and unread leave updates.
- `/staffboard/leave/apply` - create a leave application.
- `/staffboard/leave/[applicationId]` - status, remarks, documents, and action history.
- `/staffboard/leave/[applicationId]/edit` - edit pending or clarification-required applications.
- `/staffboard/leave/review` - branch-scoped review queue.
- `/staffboard/leave/settings` - branch policy, leave types, approvers, and balances.

## Permissions

| Permission | Purpose |
|---|---|
| `staffboard.leave.self_apply` | Submit, edit, clarify, and withdraw own applications |
| `staffboard.leave.self_view` | View own applications, balances, documents, and leave updates |
| `staffboard.leave.view` | View branch-scoped leave applications |
| `staffboard.leave.approve` | Review leave, subject to approver policy |
| `staffboard.leave.settings.manage` | Configure branch policy, types, and designated approvers |
| `staffboard.leave.balance.manage` | Allocate or adjust staff leave balances |

Principal receives governance permissions. Teacher and Staff receive only self-service permissions. Office Staff receives self-service and review permissions, but review still requires an active branch approver designation unless the branch policy allows a Principal. Principal does not receive self-service permission solely from the Principal role; a Principal who is also an employee needs an additional school staff role and linked profile.

## Server Authority

The client never supplies tenant, actor, branch, staff identity, total days, leave balance usage, approver authority, or attendance status. Services derive those values from the authenticated tenant context and linked staff profile.

All inputs use strict Zod schemas. Cross-tenant and inaccessible branch records return safe not-found or forbidden errors. Review actions require both the RBAC permission and the branch approval policy.

## Application Rules

- Start and end dates must be within one calendar year.
- Half-day requests must cover one day and must be allowed by both branch policy and leave type.
- Non-working weekdays are excluded from calculated leave days.
- Backdated requests, minimum notice, and maximum consecutive days are branch-configured.
- Active pending, clarification, and approved applications cannot overlap.
- Required documents are checked before approval.
- Tracked leave requires an available annual balance; unpaid or untracked leave may bypass balance accounting according to its leave type.

## Attendance Synchronization

Approval and attendance synchronization occur in one serializable transaction.

- Full-day approved leave creates or updates `ON_LEAVE` attendance records.
- Half-day approved leave creates or updates `HALF_DAY` attendance records.
- Existing QR check-in/check-out activity or non-placeholder attendance blocks approval.
- Leave-linked attendance cannot be overwritten by QR scanning or manual correction.
- Cancelling approved leave is restricted to future dates without attendance activity. It releases linked attendance and restores tracked balance.

The conservative half-day rule blocks QR attendance on a leave-linked half day. Combining half-day leave with partial-day QR work is a future policy decision.

## Notifications

In-system leave notifications are written transactionally for applicants and relevant approvers. Staff WhatsApp leave updates are queued only when all of the following are true:

- Branch leave WhatsApp setting is enabled.
- The staff communication preference enables WhatsApp and leave updates.
- Consent timestamp and a valid registered number exist.
- An active `staff_leave_status_update` WhatsApp template is configured.

The event-specific idempotency key prevents duplicate outbox rows. Provider processing remains disabled or dry-run according to the existing notification environment configuration.

## Private Documents

Environment variables:

```env
STAFF_LEAVE_DOCUMENTS_BUCKET="staff-leave-documents"
STAFF_LEAVE_DOCUMENT_MAX_BYTES="4000000"
```

The bucket must be private. Supported files are PDF, JPEG, PNG, and WebP. The server validates file signature, MIME type, and size, stores an SHA-256 checksum, uses opaque object paths, and returns short-lived signed download URLs only after applicant or reviewer authorization.

## Migration and Deployment

Migrations:

```text
prisma/migrations/20260805214500_add_staff_leave_management
prisma/migrations/20260805223000_index_staff_leave_foreign_keys
```

Deployment order:

1. Back up the target database.
2. Configure the private storage bucket variables and existing Supabase server credentials.
3. Run `npx prisma migrate deploy` using the approved direct migration URL. This has been completed for the currently configured Supabase database.
4. Run `npx prisma generate` and deploy the application.
5. Verify leave tables have RLS enabled and no public browser policies.
6. Run the QA checklist below.

## DB-Backed QA Checklist

- Teacher and Staff can submit and view only their own leave. **Passed**
- An unlinked user receives the safe missing-profile state.
- Principal can review branch applications. **Passed**
- Office Staff without an active approver designation is denied. **Passed**
- A designated Office Staff approver can review and approve. **Passed**; clarification/rejection remain covered by focused tests.
- Cross-tenant and inaccessible-branch application IDs are denied safely. **Inaccessible branch passed**; broader cross-tenant browser coverage remains part of the student/import QA gate.
- Overlapping applications and insufficient balances are rejected.
- Required-document approval fails until an authorized upload succeeds.
- Approved leave creates the expected attendance rows and balance usage. **Passed**
- Real attendance activity blocks conflicting leave approval. **Passed**
- Withdrawal and future approved-leave cancellation restore correct state.
- In-system notifications appear without sensitive identifiers.
- WhatsApp remains unqueued without consent/configuration and queues once when all gates are enabled. **Disabled/no-consent case passed**; live-provider delivery remains deferred.
- Audit logs contain no raw document content, phone number, credentials, provider secret, or message token. **Passed for the exercised submit/approve flows**
