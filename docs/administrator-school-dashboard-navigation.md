# Administrator School Dashboard Navigation

Date: 2026-06-02

Status: implemented for Base MVP administrator-to-school inspection navigation.

## Route Design

JinaCampus uses an explicit administrator inspection route:

```txt
/administrator/schools/[tenantId]/dashboard
```

The public UI continues to say **School ID**. The route segment keeps the existing internal `tenantId` convention to avoid unnecessary route and data migrations.

## Navigation Behavior

Administrator users can move through:

- `/administrator` for the Administrator Dashboard.
- `/administrator/schools` for School Management.
- `/administrator/schools/[tenantId]/dashboard` for the selected school inspection dashboard.

The school registry and school detail pages expose an **Open School Dashboard** action. The selected-school dashboard exposes:

- **Return to Administrator Dashboard**
- **Back to Schools**
- **Edit School**
- **View School Details**

The old generic administrator sidebar shortcut to `/dashboard` was removed because it did not represent a selected school dashboard and could confuse session context.

## No Impersonation

This is not impersonation and does not mutate the administrator session.

The selected-school dashboard shows a visible banner:

```txt
You are viewing this school as Administrator.
```

School operations still require normal school-user access. A platform administrator does not become a principal, teacher, staff user, or branch-scoped school user through this route.

## RBAC

The dashboard route requires administrator authentication and the platform school-view permission:

```txt
platform.school.view
```

Principal, teacher, staff, and office users must not see administrator navigation in the school app shell and cannot use this route unless they also have a valid platform administrator role and permission.

## Data Shown

The inspection page shows safe school-scoped summary data:

- school name
- School ID
- lifecycle status
- institution/logo configured status
- support contact status
- branch count
- user count
- student count
- staff count
- active academic-year count
- today student/staff attendance record counts
- attendance notification control status
- notification outbox item count

## Security

The page must not expose:

- `tenantId` in normal user-facing labels
- `passwordHash`
- `tokenHash`
- raw passwords
- reset tokens
- raw QR tokens
- WhatsApp provider secrets
- Prisma/SQL errors
- stack traces

## Audit

Opening the selected-school administrator dashboard writes:

```txt
administrator.school_dashboard_opened
```

The audit metadata contains safe School ID metadata only and does not include credentials, hashes, provider secrets, or session secrets.

## QA Checklist

- Administrator Dashboard nav item is visible in the administrator shell.
- Schools nav item is visible in the administrator shell.
- School app navigation does not include administrator routes.
- School registry rows render **Open School Dashboard**.
- The link points to `/administrator/schools/[tenantId]/dashboard`.
- The selected-school dashboard renders **Administrator View**.
- The selected-school dashboard renders **Return to Administrator Dashboard**.
- The selected-school dashboard renders **Back to Schools**.
- Principal, teacher, and staff users receive safe forbidden/redirect behavior.
- Sensitive output check passes.

## Remaining Risks / TODOs

- DB-backed browser QA should re-run the administrator portal flow after this navigation fix.
- A true global operator console remains deferred.
- Impersonation remains deferred and must not be added without explicit approval and separate audit/session design.
