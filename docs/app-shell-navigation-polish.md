# App Shell Navigation And PWA Asset Polish

Date: 2026-06-02

Status: implemented for the Base MVP release-candidate web app. This pass did not add product modules, auth logic, RBAC rules, service behavior, database schema, or native mobile work.

## Public Assets Checked

The public asset pass checked:

- `public/favicon.ico`
- `public/favicon-16x16.png`
- `public/favicon-32x32.png`
- `public/favicon-48x48.png`
- `public/favicon-96x96.png`
- `public/apple-touch-icon.png`
- `public/android-chrome-192x192.png`
- `public/android-chrome-512x512.png`
- `public/site.webmanifest`
- `public/head-snippet.html`
- `public/browserconfig.xml`
- `public/brand/jinacampus-horizontal-on-light.png`
- `public/brand/jinacampus-horizontal-transparent.png`
- `public/brand/jinacampus-mark-transparent.png`
- `public/icons/pwa-icon-*`
- `public/icons/pwa-icon-maskable-*`

`src/app/layout.tsx` now references the actual public favicon, apple-touch icon, and `/site.webmanifest` paths. The previous stale `/favicon.svg` metadata reference was removed because the current public asset set is PNG/ICO based.

## PWA And Favicon Behavior

- Browser favicon paths use the top-level PNG/ICO assets.
- Apple touch icon uses `/apple-touch-icon.png`.
- The web manifest remains `/site.webmanifest`.
- Manifest icons point to `public/icons` standard and maskable PWA PNGs.
- Theme color is aligned to the JinaCampus navy tone `#12324A`.
- `browserconfig.xml` remains aligned to the PWA icon set for legacy Microsoft tile metadata.

## Desktop Sidebar Behavior

- The desktop sidebar remains a fixed viewport-height flex column.
- The navigation list keeps `min-h-0 flex-1 overflow-y-auto overflow-x-hidden` through the existing `premium-nav-scroll` area.
- A compact rail control lets the user collapse the sidebar from the full `w-72` state to an icon rail.
- When the rail is compact, hover and keyboard focus expand it temporarily so labels remain discoverable.
- Active route state remains visible in both full and compact states.
- Icons are decorative (`aria-hidden`) while links keep explicit accessible labels.
- Route filtering and active route mapping continue to use the existing permission-aware navigation configuration.

## Mobile Navigation Behavior

- Mobile shortcut navigation remains permission-filtered.
- The mobile menu keeps a bounded scroll region so long menus do not force page-level overflow.
- Mobile shortcut and full-menu items now include matching icons while preserving text labels and touch-sized targets.

## Topbar Behavior

- The topbar now uses a glass shell that visually matches the sidebar.
- Institution logo or initials, display name, branch context, academic year context, and role chips remain visible after login.
- Account actions are grouped in a compact account menu.
- Change password continues to link to `/account/change-password`.
- Logout continues to submit to `/api/auth/logout`.
- The topbar is flex-wrapping so branch/year/role/account content does not force horizontal overflow on narrow screens.

## Accessibility And Security

- Sidebar collapse control is a `button` with `aria-expanded`, `aria-pressed`, and a clear label.
- Collapsed sidebar links keep accessible labels.
- Account menu controls are keyboard reachable.
- No route, RBAC, tenant isolation, branch scoping, QR token handling, or session behavior changed.
- The source/docs do not expose password hashes, token hashes, raw QR tokens, bearer tokens, private URLs, or provider secrets.

## Remaining Risks / TODOs

- Real-device Android Chrome and iOS Safari QR camera QA over an approved HTTPS URL remains pending.
- Offline/PWA service worker work remains deferred.
- Full installability QA should be repeated on the eventual staging/production HTTPS host.
- Broader screenshot QA can be repeated after final customer-demo approval.
