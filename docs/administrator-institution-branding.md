# Administrator Institution Branding

## Access model

Institution logo file uploads are available only inside the separate JinaCampus Administrator Portal. The upload server action requires a valid `PlatformAdministratorSession`; a school Principal, Teacher, Office Staff member, or Staff member cannot invoke this upload workflow through school RBAC.

The submitted tenant and institution identifiers are treated only as lookup inputs. The service verifies the institution belongs to the selected tenant before any storage or database write.

## Supported files

- JPEG
- PNG
- WebP
- Default maximum size: 2 MB

The server inspects file signatures and does not trust the browser filename or reported MIME type. SVG, PDF, and arbitrary file content are rejected. The browser `accept` attribute is only a convenience filter; server validation remains authoritative.

## Storage

Institution logos use a dedicated public Supabase Storage bucket because the image must render on school login and authenticated application pages. Public access applies only to the final branding asset. Uploads use the server-only Supabase service-role key and remain Administrator Portal actions.

Required server-only environment variables:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Optional explicit overrides (the shown values are the application defaults):

```text
INSTITUTION_LOGOS_BUCKET=institution-logos
INSTITUTION_LOGO_MAX_BYTES=2000000
```

`NEXT_PUBLIC_SUPABASE_URL` does not replace `SUPABASE_URL` for this server-only upload client. The service-role or secret key must never use a `NEXT_PUBLIC_` prefix.

Next.js accepts up to 3 MB for the surrounding Server Action request so multipart metadata does not reject an otherwise valid logo. The branding service still enforces the stricter 2,000,000-byte file limit after the request reaches server-side validation.

The service creates the bucket with public-read, image-only, and size restrictions when it does not exist. It fails safely if an existing bucket with the configured name is private. Service-role credentials must never use a `NEXT_PUBLIC_` or `EXPO_PUBLIC_` prefix.

Storage object names are random and do not contain tenant IDs, institution IDs, user IDs, or school names. Prisma stores the public URL in `Institution.logoUrl` and the server-only replacement key in `Institution.logoObjectKey`. No new database migration is required because both fields already exist.

## Display behavior

The authenticated desktop top bar displays the institution logo and highlighted Display Name immediately to the right of the JinaCampus wordmark. The mobile top bar and navigation drawer use the same institution context in a compact layout. Login and institution-profile pages continue to consume the same `Institution.displayName` and `Institution.logoUrl` values.

If a logo is missing or fails to load, the UI renders institution initials. The Display Name falls back through the existing institution name and tenant name resolution.

## Audit and safety

Every successful upload writes `platform.institution.logo_updated` with the platform administrator actor, target institution, file MIME type, file size, and whether an existing logo was replaced. Audit data does not include image bytes, service-role credentials, storage object keys, passwords, tokens, or session secrets.

The storage upload occurs before the database transaction. If the database update or platform audit fails, the newly uploaded object is removed. After a successful replacement, an earlier object created by this workflow is removed on a best-effort basis.

## Deployment and QA

1. Configure the four server-only storage variables in the target environment.
2. Sign in through `/administrator/login` with an authorized platform administrator.
3. Open a school, select Edit School, and upload a valid logo for the intended institution.
4. Verify the Administrator school detail shows the logo and Display Name.
5. Sign in through that school's login route and verify the desktop and mobile authenticated top bars.
6. Verify an invalid file, SVG/PDF, empty file, and oversized image return safe messages.
7. Verify an institution ID from another tenant is rejected safely and creates no object or audit record.
8. Verify the public logo URL contains no tenant, institution, actor, password, token, or storage credential values.

The server-only branding Storage variables are configured in the approved deployment environment. The DB-backed Supabase upload, replacement, invalid-file, and authorization-boundary browser gate passed on 2026-08-06.

## DB-Backed Browser QA - 2026-08-06

Status: Passed

The release-equivalent production build was exercised with a disposable platform administrator, two disposable tenants, and a school Principal session. All QA schools, sessions, audit rows, and uploaded objects were removed after verification.

| Area | Result | Evidence |
|---|---|---|
| Initial logo upload | Pass | A valid PNG uploaded from the Administrator school edit page, rendered immediately, persisted to the intended institution, and returned a publicly readable asset. |
| Logo replacement | Pass | A second valid PNG replaced the first; the institution row stored the new URL/key and the previous managed object was removed. |
| School chrome | Pass | The school Principal dashboard rendered the institution Display Name and replacement logo without exposing storage or authentication internals. |
| Invalid files | Pass | An extension-spoofed PDF, SVG, empty file, and oversized PNG returned specific safe validation messages and created no successful update audit. |
| Tenant/institution mismatch | Pass | Submitting an institution from a second tenant with the selected tenant returned a safe not-found response and left the second institution unchanged. |
| School-user authorization | Pass | A school Principal attempting the Administrator school edit URL was redirected to the separate Administrator login. |
| Storage posture | Pass | The configured branding bucket remained public-read, the replacement object was readable, and the generated public URL contained no tenant, institution, actor, credential, or token identifier. |
| Audit and sensitive output | Pass | Exactly the two successful updates produced platform audit events; audit metadata excluded object keys, passwords, tokens, sessions, and service-role credentials. |

No application defect was confirmed during this gate. Institution-logo replacement is ready for the Web Base MVP release candidate. Live WhatsApp provider delivery and Supabase advisory remediation remain separate, non-blocking follow-ups.
