# Passkey HTTPS QA

Date: 2026-07-30

Status: local HTTPS Chrome pass passed; approved production-domain and physical-device coverage pending.

## Environment

- Database: isolated local Docker PostgreSQL
- Migration: `20260729173000_add_passkey_authentication`
- Tenant fixture: `jinacampus-demo`
- Browser: installed Chrome in headless mode
- Authenticator: isolated virtual platform authenticator with resident-key and user-verification support
- Transport: local HTTPS
- Certificate: app-local development certificate; no CA was installed in the Windows trust store

QA credentials were provided only through process environment variables. No
password, session cookie, challenge, credential response, or database URL is
recorded here.

## Results

| Check | Result | Evidence |
| --- | --- | --- |
| HTTPS secure context | Pass | `window.isSecureContext`, `PublicKeyCredential`, and `navigator.credentials` were available. |
| Password login | Pass | Seeded Teacher reached the role-derived attendance route. |
| Passkey registration | Pass | Current password was required and a platform credential was persisted. |
| Passkey login | Pass | School ID plus tenant-scoped identity authenticated with the registered credential. |
| Challenge replay | Pass | Reusing the consumed authentication request returned HTTP 401. |
| Password fallback | Pass | Password login remained available after passkey enrollment. |
| Mandatory password change | Pass | Temporary Principal credential was forced to `/account/change-password`; passkey enrollment was hidden and dashboard access redirected back. |
| Logout | Pass | Logout cleared the browser session and a protected route redirected to `/login`. |
| QA cleanup | Pass | Only the passkey created by this pass was removed through the authenticated API. |

## Security Output Check

The browser output contained only boolean pass/fail fields. It did not expose:

- passwords or password hashes
- session tokens or cookies
- WebAuthn challenges or credential payloads
- tenant IDs or actor IDs
- database URLs
- stack traces or Prisma errors

## Remaining QA

- Approved production-like HTTPS origin with the final RP ID
- Windows Hello or hardware-backed platform authenticator
- Android Chrome
- iOS Safari
- Installed PWA mode
- Authentication challenge expiry by elapsed-time fixture
- Cross-tenant credential negative test with a second tenant fixture

Local virtual-authenticator coverage proves the server/browser WebAuthn flow,
challenge consumption, password fallback, and mandatory-password boundary. It
does not replace real-device or final-domain verification.
