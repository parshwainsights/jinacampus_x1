# Customer Demo Script

## Demo Positioning

JinaCampus is presented as:

```txt
JinaCampus - The Complete School OS
powered by Parshav Insights
```

This script is for the Web Base MVP controlled pilot/demo. It should not demonstrate FeeDesk, GradeBook, full SchoolCast, native mobile release, exports/charts, offline sync, push notifications, or live WhatsApp sending.

Handoff status:

- Web Base MVP: ready for controlled pilot/demo with documented limitations.
- Native mobile: release-candidate only; real-device QA pending.
- WhatsApp: DRY_RUN/foundation only; live delivery deferred.
- Staff QR camera: browser/manual flow verified; real Android/iOS camera QA pending.

## Safety Rules

- Use local/demo or approved pilot accounts only.
- Do not show passwords, session cookies, reset tokens, bearer tokens, raw QR payloads, provider secrets, private URLs, or internal IDs.
- Do not claim live WhatsApp sending is enabled. The notification foundation is DRY_RUN only.
- Do not claim physical QR camera readiness until real Android/iOS HTTPS QA is passed.

## Suggested Flow

### 0. Open JinaCampus

1. Open the approved local, staging, or pilot URL.
2. Confirm the JinaCampus brand appears.
3. Explain that this is the Web Base MVP pilot scope, not the full future suite.

### 1. Platform Administrator

1. Open Administrator Portal.
2. Explain that platform administrators manage school tenants and School IDs.
3. Show the Administrator Overview cards.
4. Open School Registry.
5. Open the selected-school dashboard.
6. Point out the Administrator View banner and explain it is read-only inspection, not impersonation.
7. Return to the Administrator Dashboard.

### 2. School Login

1. Open School Login.
2. Show the School ID, email, and password fields.
3. Show forgot-password link and password visibility toggle.
4. Explain that schools and roles do not log in. Users log in, and context is resolved after login.

### 3. Principal / School Admin

1. Log in as a principal or school admin.
2. Show institution branding and branch/academic-year context.
3. Open Dashboard.
4. Open CampusCore users and explain role/branch-scoped user governance.
5. Open CampusCore settings and show attendance notification controls.
6. Point out DRY_RUN/provider-not-configured status and no provider secret exposure.

### 4. Academia

1. Open Students or Academia overview.
2. Show class-wise student details from the student/class-section surfaces.
3. Create a fake local QA student only if the demo script calls for a write action.
4. Open an existing student profile and edit only a harmless non-sensitive field if needed.
5. Verify seeded enrollment/class-section details.
6. Open Student Attendance.
7. Select class-section and safe QA date.
8. Load active enrolled students.
9. Show Mark All Present and individual status changes.
10. Submit only on a safe QA date.
11. Open Student Attendance Reports and show summary/report sections.

Presenter note: use only fake/local QA student data. Do not enter real Aadhaar, bank, phone, or credential information during the demo.

### 5. StaffBoard Lite

1. Open StaffBoard.
2. Show staff attendance admin filters and summary cards.
3. Open Staff QR Attendance display.
4. Generate CHECK_IN and CHECK_OUT QR cards if appropriate.
5. Open Staff QR Scan manual fallback and explain browser/mobile camera QA status.
6. Show the staff attendance admin page after scan/manual fallback.
7. Show staff attendance correction with a required reason.
8. Open staff attendance reports.

### 6. WhatsApp Notification Foundation

1. Open CampusCore settings as an authorized admin/principal.
2. Show attendance notification settings.
3. Explain that WhatsApp is foundation-ready in DRY_RUN mode.
4. State clearly that live WhatsApp delivery is not enabled in this pilot.

### 7. Teacher / Staff Boundaries

1. Log in as teacher and show teacher landing route.
2. Show teacher can access attendance workflows.
3. Attempt an admin-only route and show safe permission state.
4. Log in as staff and show Staff QR scan access.
5. Attempt QR generation or staff attendance admin and show safe permission state.

### 8. Logout

1. Use the account menu logout.
2. Verify the app returns to login.
3. Open a protected route and confirm it redirects to login.

## Do Not Claim

- Live WhatsApp delivery is not enabled.
- Physical Android/iOS QR camera readiness is not certified yet.
- Native mobile production readiness is not certified yet.
- FeeDesk, GradeBook, and full SchoolCast are later modules.
- Exports/charts, offline sync, push notifications, parent/student app, and global operator console are deferred.

## Demo Close

Summarize:

- Web Base MVP is ready for controlled pilot.
- Core tenant, role, branch, and attendance flows are working.
- WhatsApp notifications are foundation-ready in DRY_RUN mode.
- Remaining readiness items are documented: physical QR camera QA, live WhatsApp setup, multi-branch switcher polish, and future modules.
- Feedback will be collected using `docs/post-pilot-feedback-plan.md`.
