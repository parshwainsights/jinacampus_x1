# Pilot Support Checklist

## Status

- Date: 2026-06-14
- Applies to: JinaCampus Web v1.0 Base MVP controlled pilot

This checklist supports the controlled web pilot. It does not add FeeDesk, GradeBook, full SchoolCast, native mobile production release, live WhatsApp sending, exports/charts, offline sync, push notifications, or parent/student app support.

Do not record passwords, session cookies, reset tokens, raw QR payloads, provider tokens, private URLs, or secrets in support notes.

## Support Contacts And Triage

For each issue, capture:

- school name and School ID, if safe to record
- affected user role
- affected workflow
- browser/device type
- time of issue
- safe screenshot only if it contains no secrets, QR payloads, credentials, or private URLs
- severity classification from `docs/post-pilot-feedback-plan.md`

Route the issue by category:

- Login/account
- Permissions/access
- CampusCore setup
- Student attendance
- Staff QR attendance
- Reports
- Notification settings
- UI/responsive
- Performance

## Login Issue

1. Confirm the user is using School ID login, not Administrator Portal, unless they are a platform administrator.
2. Confirm the school is active.
3. Confirm the user is active and belongs to the expected school.
4. Confirm branch access and role assignment.
5. Use authenticated Admin/Principal password reset if the user forgot the password.
6. Do not reveal whether another school's account exists.

## School ID Issue

1. Confirm the user is on school login, not Administrator Portal.
2. Confirm the exact School ID from authorized administrator/school records.
3. Confirm the school is active.
4. If the School ID was recently changed, confirm users were told to use the new value.
5. Do not reveal whether another School ID exists to unauthorized users.
6. Escalate if the correct active School ID fails for all users.

## Password Reset

Supported pilot path:

1. Administrator or Principal opens user management.
2. Select the allowed user within scope.
3. Use reset-password flow.
4. Share the new password through the approved school process outside JinaCampus docs/logs.
5. Ask the user to change their password after login where operationally required.

Do not log raw passwords or password hashes.

## Change School ID

1. Only authorized Administrator users may change School ID.
2. Confirm the change is intentional because it changes the login code and school login URL.
3. Use the School ID update form with explicit confirmation.
4. Notify pilot users to use the new School ID.
5. Verify old School ID no longer works and new School ID works.

## Deactivate School Or User

1. Prefer deactivate/suspend over delete.
2. Confirm the entity is the intended pilot school or user.
3. Preserve audit logs and attendance history.
4. Re-enable only after an authorized request.

## Attendance Issue

For student attendance:

1. Confirm class-section, date, branch, and academic year.
2. Confirm the teacher is assigned to the class-section or has required attendance permission.
3. Check whether the attendance date is locked by cutoff.
4. Use admin/principal correction with reason for locked records.
5. Review student attendance reports after correction.

For student registration:

1. Confirm the student is being created in the intended school and branch context.
2. Check required admission-sheet fields.
3. Check duplicate scholar/admission number behavior.
4. Confirm Aadhaar and bank values are masked/last-four only.
5. Correct harmless data-entry issues through the student edit route where permitted.
6. Do not store or paste full Aadhaar or bank account numbers in support notes.

For staff attendance:

1. Confirm staff profile is active and linked to the user.
2. Confirm branch access.
3. Confirm QR purpose: CHECK_IN or CHECK_OUT.
4. Confirm QR has not expired.
5. Confirm duplicate check-in/check-out state.
6. Use manual correction with reason when authorized.
7. Review staff reports after correction.

## QR Expired Or QR Scan Issue

1. Generate a fresh QR from the authorized QR page.
2. Confirm QR purpose is correct.
3. Confirm the staff user is signed in.
4. Use manual fallback if camera scanning is not available.
5. Do not paste raw QR payloads into support docs.
6. Record whether the issue is expiry, duplicate scan, wrong branch, missing staff profile, or camera access.

Physical Android/iOS camera QA is still pending, so do not claim certified device-camera readiness during pilot support.

Use `docs/qr-camera-qa-plan.md` when the approved HTTPS URL and physical devices are available.

## Local Recovery Notes

Use these for local/pilot support only. Follow the approved deployment provider process if production deployment is introduced.

1. Confirm the current git checkpoint before changing files.
2. Re-run migrations with `npx prisma migrate status` and the project migration command when needed.
3. Re-run `npm run db:seed` only for demo/local reset scenarios.
4. Regenerate Prisma Client with `npx prisma generate`.
5. Restart the app server.
6. Deactivate/reactivate schools and users where possible instead of deleting records.
7. Preserve audit logs and attendance history.
8. Do not paste passwords, session cookies, QR payloads, provider tokens, private URLs, or secrets into support tickets.

## Reports Issue

1. Confirm the selected branch, academic year, date, and filters.
2. Confirm the user has report permission.
3. Check whether data exists for the selected date range.
4. Verify no sensitive internal error appears.
5. Escalate if the report fails for a permitted user with seeded or pilot data.

## WhatsApp Notification Question

Current pilot status:

- WhatsApp notification foundation is DRY_RUN only.
- Live delivery is not enabled.
- Provider templates, credentials, scheduler, and outbox review UI are deferred.

Support response:

1. Confirm settings are visible only to authorized admin/principal users.
2. Explain no live WhatsApp messages are sent in this pilot.
3. Record requested notification behavior for post-pilot planning.

## Feedback Collection

Collect feedback on:

- login ease
- dashboard clarity
- student attendance flow
- staff QR attendance flow
- reports usefulness
- mobile browser usability
- performance
- missing must-have features
- UI/UX impression
- support issues

Classify feedback as:

- launch blocker
- high priority
- improvement
- future module

Escalate immediately if feedback indicates RBAC failure, tenant leakage, broken login/logout, data loss, or sensitive output exposure.

Use `docs/post-pilot-feedback-plan.md` for feedback categories, intake fields, and follow-up routing.
