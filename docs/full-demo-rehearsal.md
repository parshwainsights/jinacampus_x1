# Full-Demo Rehearsal

## Rehearsal Date / Status

- Date: 2026-06-12
- Status: Passed for Web Base MVP release-candidate packaging
- Tenant used: `jinacampus-demo`
- Scope: short full-demo rehearsal across Administrator Portal, School ID login, Dashboard, CampusCore, Academia, Student Attendance, StaffBoard Lite, QR/manual fallback, Staff Attendance Correction, Staff Reports, WhatsApp notification DRY_RUN foundation, and responsive spot checks

No passwords, bearer tokens, session cookies, raw QR payloads, provider tokens, private URLs, raw Aadhaar numbers, raw bank account numbers, or secrets are documented here.

## DB / Seed Status

Verified before and during the rehearsal:

- Docker/PostgreSQL was running and reachable.
- `npx prisma migrate status` reported 8 migrations and the database schema was up to date.
- `npm run db:seed` completed successfully.
- `npm run demo:qa:reset` completed for the demo QR QA staff profiles.
- `npm run smoke:notifications:whatsapp` passed in `DRY_RUN` mode.
- Demo tenant `jinacampus-demo` exists and is active.
- Demo admin/principal, teacher, staff, and office users exist.
- Demo branch, active academic year, classes, sections, class sections, students, guardians, active enrollments, staff profiles, attendance records, notification templates, and WhatsApp settings exist.

Observed local demo counts after rehearsal:

| Area | Count |
| --- | ---: |
| Users | 25 |
| Roles | 11 |
| Branches | 1 |
| Academic years | 2 |
| Classes | 3 |
| Sections | 2 |
| Class sections | 3 |
| Students | 24 |
| Guardians | 18 |
| Active enrollments | 18 |
| Staff profiles | 13 |
| Student attendance records | 453 |
| Staff attendance records | 317 |
| Notification templates | 2 |
| Notification outbox rows | 5 |
| WhatsApp settings | 1 |

The student count includes QA-only local student rows created during browser smoke passes. Treat them as local demo/test records only.

## Browser Method

The in-app Browser runtime was attempted first, but local runtime assets were unavailable in this session. The rehearsal used the established local Chrome DevTools/CDP fallback against the running Next.js dev server. No browser automation dependency was added.

## Roles Tested

| Role | Result | Notes |
| --- | --- | --- |
| Administrator / Admin | Pass | Administrator Portal, school registry, selected-school dashboard inspection, CampusCore, Student Attendance reports, StaffBoard QR/admin/report flows. |
| Principal | Pass | Dashboard, CampusCore users/settings, notification controls, student registration/list/profile/edit/filter. |
| Teacher | Pass | Teacher landing, student attendance mark/reports, Staff QR scan, admin boundary denial. |
| Staff | Pass | Staff QR scan allowed; StaffBoard admin/QR generation denied safely. |
| Office Staff | Pass | Staff operations allowed; CampusCore settings boundary denied safely. |

## Administrator Result

Passed.

Verified:

- `/administrator/login` rendered the Administrator login surface.
- Administrator login succeeded.
- Administrator dashboard and school registry loaded.
- Selected-school dashboard inspection opened without impersonating a school user.
- Return navigation to Administrator Dashboard/Schools worked.
- School user login to Administrator Portal was rejected with a safe generic message.
- Public copy uses School ID rather than Tenant Slug.

## School Login Result

Passed.

Verified:

- `/login` rendered School ID, email, password, forgot-password, and show/hide password controls.
- Principal, Teacher, Staff, and Office-style school sessions were established through the normal School ID login path.
- Forgot-password response stayed public-safe and non-enumerating.
- Password visibility toggle worked and did not submit the form.
- Protected route access after cookie clearing redirected or showed login safely.

## Dashboard Result

Passed.

Verified:

- Principal dashboard loaded with institution context.
- Teacher and staff landing routes were role-appropriate and simple.
- Role-aware navigation and quick-action surfaces loaded without broken links in checked flows.
- No internal identifiers or secrets appeared in visible output.

## CampusCore Result

Passed.

Verified:

- CampusCore users and settings loaded for authorized Principal/Admin context.
- Institution-scoped attendance and WhatsApp notification settings were visible to authorized users.
- Office, Teacher, and Staff governance boundaries returned safe forbidden states where expected.
- Provider secrets were not shown.

## Academia / Student Registration Result

Passed.

Verified:

- `/academia/students` loaded.
- `/academia/students/create` loaded with admission-sheet sections.
- A fake QA-only student was created successfully.
- The created student appeared in the Student list as `Not enrolled`.
- Student profile opened and showed masked Aadhaar and masked bank references only.
- Student edit saved a non-sensitive city update.
- Class-section filtering returned seeded active enrolled data for Class 1-A.
- Mobile-width Student list check had no page-level horizontal overflow.

## Student Attendance Result

Passed.

Verified:

- `/academia/attendance/mark` loaded for Teacher.
- Class 1-A active enrolled students loaded on a safe future QA date.
- Mark All Present worked.
- Individual status changes worked.
- Submit and repeat update completed successfully.
- `/academia/attendance/reports` loaded and showed the expected report sections and filters.
- A same-day locked-date attempt from the first helper run correctly showed the lock policy; the rehearsal was rerun on a safe future date without changing application behavior.

## StaffBoard / QR Result

Passed.

Verified:

- StaffBoard attendance admin loaded with filters, summary cards, and correction entry points.
- `/staffboard/attendance/qr` generated CHECK_IN and CHECK_OUT QR cards for authorized user context without exposing `tokenHash`.
- `/staffboard/attendance/scan` loaded for staff/teacher scan context.
- Manual fallback handled blank, invalid, expired, CHECK_IN, duplicate CHECK_IN, CHECK_OUT, and duplicate CHECK_OUT states with safe messages.
- Staff correction required a reason, rejected invalid times, saved a valid correction, and did not expose `NOT_MARKED` as a correction option.
- Staff reports loaded daily, teacher, non-teaching, late, half-day, monthly summary, and manual correction sections.

## Notification DRY_RUN Result

Passed.

Verified:

- `npm run smoke:notifications:whatsapp` returned `PASS`.
- Provider mode remained `DRY_RUN`.
- Student attendance and staff monthly summary outbox smoke checks passed.
- Dry-run outbox processing and webhook signature/status smoke passed.
- CampusCore settings displayed DRY_RUN/provider-not-configured copy without provider secrets.
- No live WhatsApp sending was enabled or attempted.

## Responsive Result

Passed.

Checked:

- 390px mobile width in Student list, attendance mark, student reports, Staff Attendance admin, Staff Reports, and auth UX flows.
- 1280px desktop width for Administrator, CampusCore, QR display, reports, and correction flows.
- Existing responsive evidence remains available for 768px tablet and broader release-candidate surfaces in `docs/customer-demo-browser-qa.md` and `docs/final-base-mvp-freeze-smoke.md`.

Result:

- No page-level horizontal overflow was found in the fresh checked surfaces.
- Tables and forms stayed usable in the checked mobile-width surfaces.
- Sidebar/topbar did not block the checked flows.

## Forbidden-State Result

Passed.

Verified:

- Non-admin school user was rejected from Administrator Portal.
- Teacher access to CampusCore users/settings returned safe forbidden states.
- Office staff settings boundary returned a safe forbidden state.
- Staff scan was allowed while StaffBoard attendance admin and QR generation were denied safely.
- Unauthenticated protected route access redirected or showed login safely.

## Sensitive-Output Result

Passed.

Browser-visible output and command outputs used for this doc did not expose:

- `passwordHash`
- raw passwords
- reset tokens
- session secrets
- bearer/mobile tokens
- `tokenHash`
- raw QR payloads outside the intended manual-entry test context
- WhatsApp provider tokens
- webhook secrets
- full Aadhaar values
- full bank account values
- `tenantId` in normal user-facing UI
- `actorUserId`
- Prisma/SQL errors
- stack traces
- private URLs or secrets

## Issues Found / Fixed

No confirmed application defect was found.

QA harness notes:

- The first full-demo helper run selected a locked same-day attendance date. The app correctly enforced the attendance lock policy. The rehearsal was rerun with a safe future QA date.
- The QR manual fallback helper needed a reset-aware sequence after a successful scan state. The page itself showed the success state correctly.
- The supplemental student profile assertion was corrected for uppercase UI label text (`AADHAAR`).

These were QA harness adjustments only; no application code fix was required.

## Remaining Risks / TODOs

- Real-device Android Chrome and iOS Safari live QR camera QA over approved HTTPS remains pending.
- Wrong-branch QR negative browser QA still needs a second branch/staff fixture.
- Broader cross-tenant negative browser QA still needs additional fixture coverage.
- Multi-branch switcher UX remains limited to current branch-cookie behavior.
- Global cross-tenant operator console remains deferred.
- Live Meta Cloud WhatsApp sending, approved encrypted provider-secret storage, production scheduler wiring, and outbox review UI remain deferred.
- QA-only local student rows may remain in the demo DB.

## Recommendation

Proceed to release-candidate packaging for the Web Base MVP with documented limitations.

This rehearsal does not certify real-device QR camera scanning or live WhatsApp sending.
