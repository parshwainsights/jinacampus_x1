# Navbar / Sidebar Polish

Date: 2026-06-02

Status: implemented for the Base MVP web app, with Phase 11.3 compact-rail behavior added on 2026-06-02. No new product modules or fake routes were added.

## Issue Fixed

The authenticated sidebar can contain more role-aware navigation links than fit in a normal viewport. Before this pass, the desktop sidebar did not have an independent scroll area, so bottom navigation items could become difficult to reach.

## Scroll Behavior

- Desktop sidebar now uses a fixed viewport-height flex column.
- Branding stays visible at the top.
- The navigation list uses `min-height: 0`, vertical scrolling, hidden horizontal overflow, and smooth scrolling.
- The page body does not need to scroll just because the sidebar has many items.
- Scrollbars use a thin muted style through the shared `premium-nav-scroll` utility.

## Desktop Behavior

- Sidebar remains sticky at the left edge.
- The sidebar surface keeps the premium glass treatment with a subtle border, shadow, and compact grouped links.
- The sidebar can be collapsed into a compact icon rail.
- In compact mode, hover and keyboard focus temporarily expand the rail so labels remain discoverable.
- A visible collapse button exposes `aria-expanded` and `aria-pressed` state.
- Collapsed links keep accessible labels and preserve icon-visible active state.
- Active links use `aria-current="page"` plus an indigo/cyan left accent, tinted background, and ring so the state is not color-only.
- Existing grouping is preserved: Dashboard, CampusCore, Academia, and StaffBoard Lite.

## Mobile Behavior

- The mobile shortcut bar is unchanged and remains role-aware.
- The expanded mobile menu now has a max-height scroll area so long menus can be reached without forcing page-level overflow.
- Mobile menu links keep full-width touch targets and visible active state.

## Active State Behavior

Existing route mapping remains in `src/components/app-shell/navigation.ts`.

Verified active mappings include:

- `/academia/attendance/mark` -> Student Attendance
- `/academia/attendance/reports` -> Student Attendance Reports
- `/staffboard/attendance` -> Staff Attendance
- `/staffboard/attendance/qr` -> QR Display
- `/staffboard/attendance/scan` -> Scan QR
- `/staffboard/attendance/reports` -> Staff Reports
- `/campus-core/users/[userId]/edit` -> Users
- `/academia/students/[studentId]/edit` -> Students
- `/staffboard/staff/[staffId]/edit` -> Staff Profiles

This pass also fixed a double-highlight edge case where parent attendance links could remain active on more specific StaffBoard routes such as `/staffboard/attendance/scan`.

## Role-Aware Behavior

Permission filtering was not changed.

- Admin/principal users see CampusCore, Academia, StaffBoard, and settings links according to their permissions.
- Teachers keep teacher attendance, reports, and scan-focused links where permitted.
- Staff keep scan-focused links where permitted.
- Office staff keep permission-scoped operational links.

Server-side RBAC remains authoritative; navigation hiding is still only a UX layer.

## Remaining Risks / TODOs

- Real-device Staff QR camera QA over an approved HTTPS URL remains pending.
- Current rendered browser re-check was partially blocked after the local PostgreSQL service became unavailable. Source tests and the first desktop rendered check verified the independent sidebar scroll behavior; repeat DB-backed browser QA should be run after Docker/PostgreSQL is available.
- Broader visual screenshot QA can be repeated after final customer-demo review.
- Multi-branch switcher redesign remains deferred.
