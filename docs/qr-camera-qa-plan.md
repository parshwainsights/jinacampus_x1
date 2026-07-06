# QR Camera QA Plan

## Status

- Date: 2026-06-14
- Applies to: StaffBoard Lite web/PWA QR scanner for JinaCampus Web v1.0 Base MVP
- Current readiness: release-candidate; real-device Android/iOS QA pending

Do not claim full QR camera production readiness until this plan passes on real devices over an approved HTTPS URL.

Do not document passwords, bearer tokens, session cookies, raw QR payloads, private URLs, tunnel secrets, provider secrets, or screenshots containing QR payloads.

## Preconditions

| Requirement | Status |
| --- | --- |
| Approved HTTPS URL | Required |
| Backend reachable from Android and iOS devices | Required |
| PostgreSQL/staging DB running | Required |
| Migrations applied | Required |
| Seed or pilot data loaded | Required |
| Demo/pilot school active | Required |
| Admin/principal/office user for QR generation | Required |
| Staff/teacher user with linked active StaffProfile | Required |
| Staff QR self-scan permission | Required |
| `/staffboard/attendance/qr` loads for authorized QR generator | Required |
| `/staffboard/attendance/scan` loads for scanning staff user | Required |

Camera access on physical phones requires secure context. Use an approved staging HTTPS URL, approved HTTPS tunnel, or approved internal HTTPS URL. Do not commit private tunnel URLs or secrets.

## Android Chrome QA Plan

| Test | Steps | Expected result | Actual result |
| --- | --- | --- | --- |
| App/login load | Open approved HTTPS URL, then `/login`. | Login page loads with School ID, email, and password. | Pending |
| Staff scan page | Log in as linked staff/teacher user and open `/staffboard/attendance/scan`. | Scan page loads, manual fallback visible, no sensitive output. | Pending |
| Camera permission allow | Tap Start Camera and allow permission. | Camera preview opens and page remains usable. | Pending |
| Camera unavailable/failure | Test a browser/device state where camera is unavailable or scanner startup fails if feasible. | Safe fallback message appears and manual token entry remains usable. | Pending |
| CHECK_IN scan | Admin generates CHECK_IN QR from `/staffboard/attendance/qr`; staff scans it. | Check-in succeeds, result shows purpose/date/status/check-in time. | Pending |
| CHECK_OUT scan | Admin generates CHECK_OUT QR; staff scans it. | Check-out succeeds, result shows purpose/date/status/check-out time and working minutes if returned. | Pending |
| Permission denied | Deny camera permission. | Safe message appears and manual fallback remains usable. | Pending |
| Scan failure | Submit empty and invalid manual token. | Safe validation/invalid QR messages appear. | Pending |
| Expired QR | Scan or submit an expired QR if safe. | Safe expired QR message appears. | Pending |
| Duplicate scan | Repeat CHECK_IN/CHECK_OUT where safe. | Safe duplicate message appears. | Pending |
| Cleanup/reload | Reload and leave scan page after use. | Camera stops or resets safely; navigation remains usable. | Pending |

## iOS Safari QA Plan

| Test | Steps | Expected result | Actual result |
| --- | --- | --- | --- |
| App/login load | Open approved HTTPS URL in iOS Safari, then `/login`. | Login page loads with School ID, email, and password. | Pending |
| Staff scan page | Log in as linked staff/teacher user and open `/staffboard/attendance/scan`. | Scan page loads, manual fallback visible, no sensitive output. | Pending |
| Camera permission allow | Tap Start Camera and allow permission. | Camera preview opens and page remains usable. | Pending |
| Camera unavailable/failure | Test simulator/no-camera or blocked-camera state if feasible. | Safe fallback message appears and manual token entry remains usable. | Pending |
| CHECK_IN scan | Admin generates CHECK_IN QR; staff scans it. | Check-in succeeds, result card is readable. | Pending |
| CHECK_OUT scan | Admin generates CHECK_OUT QR; staff scans it. | Check-out succeeds, result card is readable. | Pending |
| Permission denied | Deny camera permission where feasible. | Safe message appears and manual fallback remains usable. | Pending |
| Scan failure | Submit empty and invalid manual token. | Safe validation/invalid QR messages appear. | Pending |
| Expired QR | Scan or submit an expired QR if safe. | Safe expired QR message appears. | Pending |
| Duplicate scan | Repeat CHECK_IN/CHECK_OUT where safe. | Safe duplicate message appears. | Pending |
| iOS layout | Check keyboard and safe-area behavior. | Manual token field and buttons remain usable; UI does not freeze. | Pending |

## Wrong-Branch QR Plan

Wrong-branch QR negative QA requires additional fixtures:

- second active branch
- staff user without access to the QR branch
- QR generated for the other branch
- scan attempt by the wrong-branch user

Expected result: scan fails safely with no cross-branch attendance mutation and no sensitive internal output.

This is not required for a single-branch controlled demo, but it is required before broad multi-branch rollout.

## Sensitive Output Checks

During every device pass, verify the browser UI, logs, docs, and screenshots do not expose:

- `passwordHash`
- raw password
- reset token
- session secret
- bearer/mobile token
- `tokenHash`
- raw QR token outside intended QR image/manual input context
- WhatsApp provider token
- webhook secret
- full Aadhaar
- full bank account
- `tenantId` in normal user-facing UI
- `actorUserId`
- Prisma/SQL errors
- stack traces
- private URLs
- credentials

## Readiness Decision Options

Use one final status after device QA:

1. Ready for QR camera pilot use
2. Android passed, iOS pending
3. iOS passed, Android pending
4. Release-candidate; real-device QA partially complete
5. Blocked by device/backend setup
6. Blocked by confirmed app bug

Current status: release-candidate; real-device Android/iOS QA pending.

## Current Execution Gate - 2026-06-28

The QR camera QA plan remains ready to execute, but it was not run in the latest pilot gate attempt because the clean pilot DB reset and seed verification were blocked by local Docker/PostgreSQL availability. The latest rerun stopped at the database environment gate before any QR browser or device smoke. Do not claim Android/iOS camera readiness until:

- Docker/PostgreSQL or an approved staging DB is reachable.
- The clean pilot DB reset/seed gate passes.
- An approved HTTPS URL is available.
- Physical Android Chrome and iOS Safari devices complete CHECK_IN/CHECK_OUT scan verification.

## Camera Button Repair Gate - 2026-06-29

A Safari/mobile report said the Staff QR camera button did not react. The scanner has been hardened at source level:

- direct `getUserMedia` call from the Start Camera button
- secure-context check with HTTPS-required message
- rear-camera constraints with generic fallback
- explicit `playsInline` video playback
- camera track cleanup on success, stop, error, and unmount
- safe messages for permission denied, unavailable camera, unsupported browser, and insecure context
- `Permissions-Policy: camera=(self), microphone=()` header

This does not change the readiness decision. The current status remains release-candidate; real-device Android/iOS QA pending. Re-run this plan over an approved HTTPS URL before marking QR camera scanning ready.

## Diagnostics And Fallback Gate - 2026-06-30

Additional source-level diagnostics were added after a mobile Safari/PWA screenshot showed the scanner opened from a LAN IP URL:

- visible status transition to `Checking support`
- visible secure-context, media API, origin, and user-agent diagnostics
- safe camera startup console diagnostics
- exact HTTPS-required copy for HTTP/LAN/IP contexts
- exact missing-camera-context copy for browsers that hide `navigator.mediaDevices`
- controlled QR image/photo upload fallback that still uses the existing server-side QR validation path

When executing this plan, record whether the tested URL is:

- approved HTTPS staging/pilot URL
- approved HTTPS tunnel
- local HTTP/LAN URL

Only the approved HTTPS cases can count toward QR camera readiness. Local HTTP/LAN results can only confirm the blocked HTTPS-required state.

## Production Scanner Implementation Gate - 2026-07-01

The Staff QR scanner source has been hardened for the next device QA attempt:

- direct button-click `getUserMedia`
- secure-context and likely in-app browser detection
- 12-second getUserMedia timeout
- rear-camera constraint with generic video fallback
- mobile Safari `autoPlay`, `muted`, `playsInline`, and `webkit-playsinline`
- `jsQR` decoding from canvas frames
- cleanup on Stop, pagehide, visibilitychange, and component unmount
- manual token entry and QR image/photo fallback remain available
- raw decoded QR payload is submitted to the server action, with all tenant, branch, permission, QR hash, purpose, expiry, duplicate, attendance write, and audit checks server-side

Do not change the readiness status from release-candidate to ready until this plan passes over an approved HTTPS URL on real Android Chrome and iOS Safari, with installed PWA mode tested separately.
