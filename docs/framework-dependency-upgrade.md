# Framework Dependency Upgrade

Date: 2026-07-30

Status: production dependency advisories resolved; one low-severity development-only advisory remains upstream-constrained.

## Scope

This was a dedicated dependency-maintenance task. It did not add a product
module or change tenant, RBAC, attendance, or audit behavior.

## Upgrades

| Package | Result |
| --- | --- |
| Next.js | Upgraded to `16.2.12` |
| React / React DOM | Upgraded to `19.2.8` |
| React type packages | Upgraded to current React 19-compatible releases |
| Vitest | Upgraded to `4.1.10` |
| Vite | Upgraded transitively to `8.1.5` |
| PostCSS | Pinned to `8.5.25` |
| Sharp | Overridden to `0.35.3` |

The package now pins Node.js to `24.x`, matching the verified workstation and
Vercel project runtime while preventing an automatic future major upgrade. The
verified workstation runtime was Node.js `24.18.0`.

Next.js 16 uses the `proxy.ts` convention, so the prior `middleware.ts` entry
point and source assertions were migrated. The TypeScript configuration uses
the React automatic JSX runtime and includes generated Next.js development
types. Vitest uses Vite 8's Oxc JSX transform.

## Advisory Result

- `npm audit --omit=dev`: zero vulnerabilities.
- Full `npm audit`: one low-severity development-only esbuild advisory.

The remaining advisory affects local development tooling on Windows. The
current `tsx` release pins esbuild to the `0.27.x` line while the patched
esbuild release is outside that accepted range. An unsafe transitive override
was not applied. Recheck after `tsx` publishes a compatible dependency range.

## Verification

- TypeScript: passed
- Vitest: 84 files, 729 tests passed
- Next.js production build: passed
- Production dependency audit: passed with zero findings

Build verification used non-routable, production-shaped database URLs. It did
not contact or mutate the hosted database.
