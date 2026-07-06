# Customer-Demo Browser QA

## QA Status

- QA date: 2026-05-30
- Status: Customer-demo browser QA passed after focused fixes.
- Tenant used: `jinacampus-demo`
- Browser method: local Chrome DevTools automation. The in-app Browser plugin was available, but its browser backend was unavailable in this session, so a temporary local Chrome CDP script was used without adding project dependencies.
- Screenshot evidence: captured outside the repository under the OS temp QA folder `jinacampus-customer-demo-qa-20260530/screens`. Screenshots are not committed because they are local QA artifacts and must not include secrets, QR payloads, or credentials.

## DB, Docker, And Seed Status

- Docker/PostgreSQL: running and reachable.
- Prisma migrations: applied and up to date.
- Seed command: completed successfully.
- Demo tenant: `jinacampus-demo` exists and is active.
- Seeded role users checked without documenting credentials:
  - Super Admin/Admin
  - Principal
  - Teacher/Class Teacher
  - Staff
  - Office Staff
- Seed data coverage used for dense UI checks:
  - Users: 25
  - Roles: 9
  - Classes: 3
  - Sections: 2
  - Class sections: 3
  - Students: 20
  - Guardians: 18
  - Enrollments: 18
  - Staff profiles: 13
  - Student attendance records: 291
  - Staff attendance records: 206

## Viewports Tested

- 360 x 800 phone
- 390 x 844 phone
- 768 x 1024 tablet
- 1280 x 800 desktop

## Result Matrix

| Area | Result | Notes |
| --- | --- | --- |
| Login/logout | Pass | `/login` rendered, password visibility toggle worked, valid login redirected, logout cleared session, protected route returned to login. |
| Forgot password | Pass | Unknown and seeded teacher email submissions returned the same public-safe, non-enumerating response shape. |
| Super Admin/Admin | Pass | Dashboard, CampusCore institutions/users/roles/audit logs, Academia students, and StaffBoard attendance routes rendered with no horizontal overflow at desktop width. |
| Principal | Pass | Institution-scoped dashboard, CampusCore institutions/branches/users, Academia attendance/students, and StaffBoard routes rendered with no horizontal overflow at desktop width. |
| Teacher | Pass | Dashboard, mark attendance, reports, QR scan, and change password rendered at mobile width; admin-only routes returned safe forbidden states. |
| Staff | Pass | Dashboard, QR scan, and change password rendered at mobile width; admin, academia, staff admin, QR generation, and reports routes returned safe forbidden states. |
| Office Staff | Pass | Dashboard and permitted StaffBoard operational routes rendered at tablet width; CampusCore users/roles and Academia students returned safe forbidden states. |
| CampusCore UI | Pass | Users, institutions, roles, branches, and audit surfaces rendered in permitted contexts with responsive wrappers and no visible sensitive internals. |
| Academia UI | Pass | Students, attendance marking, and attendance reports rendered across tested viewports with responsive behavior and seeded data. |
| StaffBoard UI | Pass | Staff profiles, QR generation, scan/manual fallback, attendance admin, and reports rendered across tested viewports. |
| Forbidden states | Pass | Teacher, staff, and office staff unauthorized routes showed safe forbidden/redirect behavior with no internal details. |
| Responsive layout | Pass | Tested pages reported no page-level horizontal overflow at 360, 390, 768, and 1280 widths. |
| Dense data | Pass | Seeded students, staff profiles, and attendance records were sufficient to exercise table/report density and scrolling behavior. |
| Sensitive output | Pass | Browser-visible checks did not expose password hashes, raw passwords, reset tokens, session secrets, bearer tokens, token hashes, raw QR tokens outside intended input surfaces, Prisma/SQL errors, stack traces, private URLs, or secrets. |

## Screenshot Evidence

Captured screenshot labels:

- `login-360`
- `forgot-password-360`
- `super-admin-dashboard-1280`
- `principal-dashboard-1280`
- `teacher-dashboard-390`
- `teacher-forbidden-campuscore-users-390`
- `staff-dashboard-390`
- `staff-forbidden-campuscore-users-390`
- `office-staff-dashboard-768`
- `academia-students-390`
- `staff-attendance-768`
- `staff-reports-768`
- `staff-scan-invalid-manual-390`

## Bugs Found And Fixed

### Staff Attendance Hydration Mismatch

- Feature/module: StaffBoard Lite staff attendance admin.
- Issue: Browser QA captured a React hydration mismatch on staff attendance correction detail timestamps. The server rendered dates with hyphens while the client rendered dates with spaces.
- Why it mattered: Hydration mismatches undermine customer-demo confidence and can hide real UI instability.
- Fix: Staff attendance date and datetime formatting now uses deterministic `Intl.DateTimeFormat().formatToParts()` assembly for stable server/client output.
- Files changed:
  - `src/modules/staffboard-lite/components/attendance/staff-attendance-admin-state.ts`
  - `tests/unit/staffboard-lite-attendance-admin-ui.test.ts`
- Retest: Targeted unit test passed, then full customer-demo browser matrix passed.

### Missing Favicon Console Error

- Feature/module: App shell metadata/static assets.
- Issue: Browser QA captured a `/favicon.ico` 404 console error.
- Why it mattered: Customer-demo QA should avoid avoidable browser console noise.
- Fix: Added favicon metadata and a small public SVG favicon asset.
- Files changed:
  - `src/app/layout.tsx`
  - `public/favicon.svg`
  - `tests/unit/ui-ux-modernization.test.ts`
- Retest: Targeted unit tests passed, then full customer-demo browser matrix passed with no relevant runtime/console errors.

## Remaining Risks And TODOs

- Real-device Android Chrome and iOS Safari live QR camera QA remains pending. The 2026-05-30 follow-up and re-run request were blocked because no approved HTTPS URL was available to this Codex session, local configuration remained HTTP-only, ADB reported 0 attached Android devices, and no iOS Safari device bridge/tooling was available from the Windows workspace.
- Screenshots are local temp artifacts and are not committed.
- Wrong-branch QR and cross-tenant browser-negative QA need a second branch/tenant fixture before they can be fully exercised.
- Multi-branch/institution switcher UX remains limited to current branch-cookie behavior.
- Global cross-tenant operator console remains deferred.
- FeeDesk, GradeBook, SchoolCast, native mobile, offline sync, exports/charts, and push notifications remain out of scope for this Base MVP freeze pass.

## Recommendation

Customer-demo browser QA is passed for the DB-backed Base MVP web surfaces tested here. The next stabilization task should be real-device Staff QR camera QA with an approved HTTPS URL and physical Android/iOS devices.

## Phase 11 UI Note

- Date: 2026-06-02
- Status: superseded by the 2026-06-02 DB-backed browser QA re-run below.
- Scope changed: shared web glass tokens, topbar, responsive table/status primitives, state components, and inherited Base MVP operational surfaces.
- Security note: the UI pass did not change auth, RBAC, tenant isolation, attendance services, QR token handling, notification settings behavior, or database schema.
- Recommended QA focus: login/logout, forgot password, dashboard, CampusCore users/settings, Academia attendance, StaffBoard QR/attendance/report pages, attendance notification settings, responsive mobile/tablet/desktop widths, and sensitive-output checks.

## Modernized Glass UI DB-Backed Browser QA Re-Run

- QA date: 2026-06-02
- Status: Passed after one focused route-loading fix.
- Tenant used: `jinacampus-demo`
- Browser method: local Chrome DevTools automation against the running Next.js dev server. The in-app Browser backend was unavailable in this session, so a temporary local CDP helper was used without adding project dependencies.
- Screenshot evidence: not committed. This run recorded checklist and browser-visible assertions only; no screenshots containing credentials, QR payloads, tokens, or private URLs were added.

### DB, Docker, And Seed Status

- Docker/PostgreSQL: running and reachable.
- Prisma migration status: seven migrations found and database schema up to date.
- Seed command: completed successfully before QA.
- Demo tenant `jinacampus-demo`: active.
- Demo admin, principal, teacher, staff, and office users: active.
- Demo teacher/staff-linked profiles: present for tested users.
- Scoped demo QR QA reset: used once after a repeat run had already checked in the QA staff user for the day.

Seeded demo counts observed during this pass:

| Area | Count |
| --- | ---: |
| Users | 25 |
| Roles | 9 |
| Branches | 1 |
| Academic years | 2 |
| Classes | 3 |
| Sections | 2 |
| Class sections | 3 |
| Students | 20 |
| Guardians | 18 |
| Enrollments | 18 |
| Staff profiles | 13 |
| Student attendance records | 333 |
| Staff attendance records | 233 |
| Notification templates | 2 |
| WhatsApp integration settings | 1 |

### Browser QA Result

| Area | Result | Notes |
| --- | --- | --- |
| Login page | Pass | Mobile-width `/login` rendered cleanly. Forgot-password link was visible. Show/hide password toggle worked and did not submit the form. |
| Forgot password | Pass | Unknown account request returned the safe non-enumerating recovery message and did not reveal account existence or role. |
| Admin | Pass | Dashboard, student attendance reports, StaffBoard QR display, attendance admin, correction, and staff reports rendered through browser automation. |
| Principal | Pass | Dashboard, CampusCore users, and CampusCore settings rendered. Attendance notification controls and DRY_RUN/provider-not-configured status were visible without provider secrets. |
| Teacher | Pass | Role-aware landing route loaded `/academia/attendance/mark`. Admin-only users/settings routes returned safe permission states. |
| Staff | Pass | Staff QR scan was allowed; StaffBoard attendance admin and QR generation routes returned safe permission states. |
| Office staff | Pass | Staff attendance operations rendered. CampusCore settings returned a safe permission state. |
| Dashboard route first paint | Pass | Protected dashboard-group pages rendered final content after removing the route-group loading fallback that could leave browser QA stuck on the loading state. |
| CampusCore settings / notification controls | Pass | WhatsApp notification status, DRY_RUN/provider-not-configured state, student WhatsApp mode, and staff monthly WhatsApp controls were visible to authorized users only. |
| Student attendance | Pass | Class 1-A active students loaded on a safe QA date. Mark All Present, individual status changes, submit, and repeat update were verified. |
| Student attendance reports | Pass | Daily summary, absent/late/class-not-marked, student history, and monthly percentage sections rendered with filters. |
| Staff QR display | Pass | Authorized QR display generated CHECK_IN and CHECK_OUT QR cards without exposing `tokenHash`. |
| Staff QR scan/manual fallback | Pass | Blank, invalid, expired, CHECK_IN, duplicate CHECK_IN, CHECK_OUT, and duplicate CHECK_OUT states returned safe messages through the browser manual-token path. |
| Staff attendance admin | Pass | Filters, summary cards, table, and correction entry points rendered. |
| Staff correction | Pass | Reason validation, invalid time validation, valid correction, and `NOT_MARKED` exclusion were verified. |
| Staff reports | Pass | Daily, teacher, non-teaching, late, half-day, monthly, and correction report sections rendered. |
| Role-aware navigation | Pass | Navigation and landing routes reflected seeded role permissions for admin, principal, teacher, staff, and office users. |
| Navbar/sidebar scroll | Pass | Desktop sidebar and mobile menu use independent scroll areas so bottom CampusCore/StaffBoard navigation items remain reachable without adding fake routes. |
| Forbidden states | Pass | Teacher/staff/office unauthorized routes returned safe forbidden or redirect states with no internal details. |
| Responsive layout | Pass | Priority routes were checked at mobile and desktop widths, including 360 and 390 mobile widths, with no page-level horizontal overflow in the tested surfaces. |
| Sensitive output | Pass | Browser-visible checks did not expose password hashes, raw passwords, reset tokens, session secrets, bearer/mobile tokens, token hashes, raw QR tokens outside intended QR/manual-entry surfaces, provider secrets, Prisma/SQL errors, stack traces, private URLs, or secrets. |

### Bugs Found And Fixed

#### Dashboard Route-Group Loading Fallback

- Feature/module: authenticated app shell and dashboard route group.
- Issue: Chrome browser QA could authenticate and receive the final server payload, but protected dashboard-group pages stayed visually on the `Loading page...` fallback.
- Why it mattered: Customer-demo users could see a stuck loading state even though the backend returned the route successfully.
- Fix: Removed the dashboard route-group `loading.tsx` fallback so customer-demo protected pages server-render their final content directly on first paint.
- Files changed:
  - `src/app/(dashboard)/loading.tsx`
  - `tests/unit/ui-ux-modernization.test.ts`
- Retest: The expanded DB-backed browser pass passed after the fix.

### Remaining Risks And TODOs

- Real-device Android Chrome and iOS Safari live QR camera QA over an approved HTTPS URL remains pending.
- Wrong-branch QR negative browser QA still needs a second branch/staff fixture.
- Broader cross-tenant negative browser QA needs additional fixture coverage.
- Multi-branch/institution switcher UX remains limited to current branch-cookie behavior.
- Global cross-tenant operator console remains deferred.
- Live Meta Cloud WhatsApp sending, scheduler wiring, provider-secret management, and outbox review UI remain deferred.

## Final Release-Candidate Re-Run

- QA date: 2026-06-01
- Status: Passed for DB-backed customer-demo browser QA after attendance notification settings verification.
- Tenant used: `jinacampus-demo`
- Browser method: local headless Chrome DevTools automation against the running Next.js app. The in-app Browser backend was unavailable in this session, so no project dependency or committed browser harness was added.
- Screenshot evidence: captured only in the OS temp directory for local review and not committed.

### DB, Docker, And Seed Status

- Docker Desktop was started from this session.
- Project PostgreSQL container was running on the configured local port.
- Prisma migration status reported seven migrations and the database schema was up to date.
- `npm run db:seed` completed successfully.
- Demo tenant `jinacampus-demo` exists and is active.
- Demo admin, principal, teacher, staff, and office users exist and are active.
- Demo teacher/staff-linked profiles exist for the tested users.

Seeded demo counts at the start of this pass:

| Area | Count |
| --- | ---: |
| Users | 25 |
| Roles | 9 |
| Branches | 1 |
| Academic years | 2 |
| Classes | 3 |
| Sections | 2 |
| Class sections | 3 |
| Students | 20 |
| Guardians | 18 |
| Enrollments | 18 |
| Staff profiles | 13 |
| Student attendance records | 321 |
| Staff attendance records | 223 |
| Active notification templates | 2 |
| WhatsApp integration settings | 1 |

### Browser QA Result

| Area | Result | Notes |
| --- | --- | --- |
| Login page | Pass | `/login` rendered at mobile width, forgot-password link was visible, password show/hide toggle was keyboard/button-safe, and invalid login showed the safe error message. |
| Forgot password | Pass | Invalid email validation worked. Unknown, teacher, staff, and principal emails returned the same public-safe response shape without revealing account existence or role. |
| Admin | Pass | Dashboard, CampusCore institutions/branches/users/roles/settings/audit logs, Academia students/attendance/reports, and StaffBoard staff/attendance/QR/report routes rendered without page-level horizontal overflow or sensitive output. |
| Principal | Pass | Same customer-demo surfaces rendered within institution scope, including CampusCore settings and attendance notification controls. |
| Teacher | Pass | Dashboard, student attendance mark/reports, Staff QR scan, and change-password rendered at mobile width. Admin-only routes returned safe permission states. |
| Staff | Pass | Dashboard, Staff QR scan, and change-password rendered at mobile width. Admin/student/staff-admin routes returned safe permission or safe error states without internal details. |
| Office staff | Pass | Dashboard and permitted StaffBoard operational routes rendered at tablet width. CampusCore user/role/settings and Academia student routes returned safe permission states. |
| Staff QR manual fallback | Pass | Staff mobile-width scan page accepted an invalid manual token and returned a safe scan error with no token hash or internal output. |
| Attendance notification settings | Pass | Admin and principal could see WhatsApp notification status, DRY_RUN/provider-not-configured state, student WhatsApp alerts, staff monthly WhatsApp controls, and template mapping copy. Provider secrets were not exposed. |
| Logout/protected redirect | Pass | Sign-out control was visible; after logout, visiting `/dashboard` redirected to `/login`. |
| Responsive layout | Pass | Checked priority customer-demo routes at mobile, tablet, and desktop widths with no page-level horizontal overflow. |
| Sensitive output | Pass | Checked browser-visible output did not expose password hashes, raw passwords, reset tokens, session secrets, bearer tokens, token hashes, raw QR tokens outside intended manual input/QR contexts, provider secrets, Prisma/SQL errors, stack traces, private URLs, or secrets. |

### Bugs Found And Fixed

No confirmed application defect was found in this final re-run, so no code fix was made.

The QA harness initially produced false negatives for:

- Audit log timestamps containing `404` in milliseconds.
- Form/logout navigation interrupting the intermediate JavaScript result while still clearing the session.
- Attendance settings label assertions using older copy.

Those were corrected in the QA interpretation and follow-up checks, not application code.

### Remaining Risks And TODOs

- Real-device Android Chrome and iOS Safari live QR camera QA remains pending until an approved HTTPS URL and physical devices are available.
- Wrong-branch QR negative browser QA still needs a second branch/staff fixture.
- Broader cross-tenant negative browser QA needs additional fixture coverage.
- Multi-branch/institution switcher UX remains limited to current branch-cookie behavior.
- Global cross-tenant operator console remains deferred.
- Live Meta Cloud WhatsApp sending, approved encrypted provider-secret storage, scheduler wiring, and outbox review UI remain deferred.

## Phase 11.3 PWA And App Shell Note

- Date: 2026-06-02
- Status: source-level polish implemented; browser/device installability QA should be repeated after the next customer-demo smoke pass.
- Public assets checked: top-level favicon and apple-touch assets, `public/brand`, `public/icons`, `public/site.webmanifest`, `public/head-snippet.html`, and `public/browserconfig.xml`.
- Metadata update: `src/app/layout.tsx` now references the actual PNG/ICO favicon set, `/apple-touch-icon.png`, and `/site.webmanifest` instead of the stale SVG favicon path.
- Navigation update: desktop sidebar now supports a compact icon rail with hover/focus expansion while keeping its independent scroll region. Mobile navigation remains role-aware and touch-sized.
- Topbar update: institution context, branch/year chips, role chips, change-password, and logout are grouped into a matching glass shell/account menu.
- Security note: no auth, RBAC, tenant isolation, QR token handling, provider secret handling, or database behavior changed.

### Final Recommendation

DB-backed customer-demo browser QA is passed for the Base MVP release candidate, including CampusCore attendance notification settings controls. The remaining release blocker is real-device Staff QR camera QA over an approved HTTPS URL.

## Staff QR Camera Button RC Note - 2026-06-29

Status: source-level repair completed; QR camera readiness remains pending.

A mobile/Safari issue was reported where the Staff QR Start Camera button did not react. The browser/PWA scanner was hardened to request camera access directly from the button click, show an HTTPS-required state on non-secure phone URLs, use rear-camera constraints with fallback, explicitly play a `playsInline` preview, stop media tracks on exit paths, and send a camera permissions policy header.

Customer-demo implication: local browser/manual-token QA remains passed, but do not claim physical QR camera readiness until Android Chrome and iOS Safari pass approved-HTTPS QA in normal browser mode and installed PWA/home-screen mode.

### Follow-up - 2026-06-30

The scan page now includes visible camera diagnostics for secure context, media API availability, current origin, and browser user agent. It also includes a controlled QR image/photo fallback for camera failure cases. LAN/IP HTTP access should now show the HTTPS-required message clearly; this is a blocked setup state, not QR readiness.
