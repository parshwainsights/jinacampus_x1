# Base MVP UI/UX Modernization

Date: 2026-05-30

Status: implemented for the existing Base MVP surfaces. No new product modules were added.

## Design Direction

JinaCampus now uses a more premium, institutional SaaS interface while keeping the operational school workflow intact:

- modern, clean, and high-trust
- glassy but restrained
- table-first and form-first for office work
- role-aware and mobile-safe
- not decorative, childish, or module-expansive

The modernization is applied through shared primitives first so CampusCore, Academia, StaffBoard Lite, attendance, QR, reports, auth, and dashboard surfaces stay visually consistent.

## Color System

- Background: `#F8FAFC` with a very soft blue-tinted page gradient.
- Primary navy: `#0F172A`.
- Primary brand: `#4F46E5`.
- Accent cyan: `#06B6D4`.
- Muted text: `#64748B`.
- Border: `#E2E8F0`.
- Success: emerald scale.
- Warning: amber scale.
- Danger: rose/red scale.

The palette uses navy, indigo, cyan, and semantic colors without introducing new module branding or overly bright decorative color blocks.

## Typography

- Keep the existing system font stack.
- Use tighter tracking only on headings where already appropriate.
- Use semibold labels for forms, status chips, table headers, dashboard cards, and action buttons.
- Keep body copy readable at small widths with `text-sm` plus clear line height.

## Radius And Shadow System

- Premium shell and app panels use `rounded-2xl`, soft borders, backdrop blur, and low-opacity shadows.
- Tables and repeated panels use the shared `premium-card` treatment.
- Inputs use rounded controls, white glass surfaces, and strong focus rings.
- Buttons use practical touch targets with subtle elevation, not glossy ornamental effects.

## Component Rules

Shared modernization utilities:

- `premium-glass-panel`
- `premium-card`
- `premium-focus`
- `premium-primary-button`
- `premium-secondary-button`

Updated component families:

- App shell, sidebar, topbar
- Login and forgot-password forms
- `PasswordInput`
- `FormField`, `FormMessage`, required indicators
- `EmptyState`, `LoadingState`, `ErrorState`, `PermissionState`
- `ResponsiveTable`, `StatusBadge`, pagination/action links
- Dashboard header, cards, attention panels, quick actions
- Academia and StaffBoard list shells
- Student attendance marking panels
- Staff QR display/scanner/manual fallback panels
- Staff attendance summary cards and report filters

## Responsive Checklist

Target widths:

- 360 px phone
- 390 px phone
- 768 px tablet
- 1280 px desktop

Expected behavior:

- no horizontal page overflow
- mobile navigation remains available
- tables keep horizontal scroll wrappers
- forms keep full-width mobile controls
- buttons stay at least 44 px tall
- QR panel and scanner preview stay within viewport width
- topbar context chips wrap instead of overflowing
- institution name/logo fallback remains bounded

## Accessibility Notes

- Password toggles remain `type="button"` and expose `aria-label`.
- State components keep `role="status"` or `role="alert"` where appropriate.
- Tables retain captions and responsive scroll shells.
- Focus rings use the shared `premium-focus` pattern.
- Color is supported by labels and text, not status color alone.

## Security And Scope Notes

The UI pass did not change authentication, RBAC, tenant isolation, service-layer permissions, QR token handling, or database schema.

The UI should not expose:

- `passwordHash`
- reset tokens
- `tokenHash`
- raw QR tokens outside intended QR/manual input
- Prisma/SQL errors
- tenant internals in normal UI

## Remaining UI Risks

- Real-device Android/iOS camera QR QA remains pending.
- A second demo tenant/branch fixture is still recommended for cross-tenant/multi-branch UX proof.
- Some public marketing/home components still use the older visual treatment because this pass focused on Base MVP authenticated/customer demo surfaces plus auth.
- Browser plugin was previously unavailable in this workspace; rendered QA should use Browser/IAB when available, otherwise local HTTP/Playwright-style smoke fallback.
