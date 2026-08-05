# Student Records Import, Export, and Admission Documents

## Scope

JinaCampus supports branch-scoped student roster import/export and private admission-document storage inside Academia. The implementation reuses the existing school session, branch access, RBAC, Zod validation, student masking rules, enrollment rules, and audit logging.

## Import and Export

Route: `/academia/students/bulk`

Supported formats:

- Excel `.xlsx`
- UTF-8 `.csv`, compatible with Google Sheets

Workflow:

1. Select an accessible branch.
2. Download the Excel or CSV template.
3. Complete up to 5,000 student rows.
4. Upload and preview the file.
5. Correct every row/field issue.
6. Confirm the validated import.

The Excel template includes Instructions and Reference Data worksheets. Class assignments use the active class-section display name, not database IDs. Tenant, branch, user, and academic-year context are resolved server-side.

Import behavior:

- A file is limited to 4 MB and 5,000 populated student rows.
- Required headers and values are validated before writes.
- Admission-number, roll-number, class capacity, guardian-contact, active branch, and active class-section conflicts are checked.
- Imports are all-or-nothing and use batched inserts inside one database transaction.
- Student, guardian link, optional enrollment, and import summary audit events are recorded.
- Full Aadhaar and bank-account numbers are converted to masked values and last four digits before persistence.
- Spreadsheet error responses contain row, field, and safe message only; they do not echo sensitive cell values.

Export behavior:

- Exports are limited to the authenticated user's accessible branch.
- Excel output has frozen headers and filters.
- CSV output uses a UTF-8 BOM for Google Sheets and guards formula-like cells against spreadsheet injection.
- Aadhaar and bank-account fields are exported only as masked values.
- Tenant IDs, actor IDs, password data, token data, storage paths, and document checksums are excluded.
- Every export is audited with branch and record count.

## Admission Documents

The student registration form accepts optional:

- Passport-size photograph
- School Transfer Certificate
- Birth Certificate
- Additional board- or school-required admission documents

Student registration is completed first, then each selected document is uploaded separately through the permission-checked document API. This keeps each request within hosted-function upload limits and prevents one failed optional file from rolling back a valid admission. Failed files can be retried from the created student's profile.

The student profile supports later upload, view, and deletion for:

- Passport-size photograph
- Transfer Certificate
- Birth Certificate
- Identity proof
- Previous school report card
- Caste Certificate
- Migration Certificate
- Medical Certificate
- Other admission documents

Allowed file signatures:

- PDF
- JPEG
- PNG
- WebP

File extension and browser MIME declarations are not trusted. JinaCampus detects the file signature server-side and applies the configured size limit. Passport photographs must be images.

## Storage and Security

Files are stored in a private Supabase Storage bucket. The database stores tenant-scoped metadata and object paths only; it does not store file bytes or public URLs.

Required server-only environment variables:

```env
SUPABASE_URL="https://<project-ref>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<server-only-service-role-key>"
STUDENT_DOCUMENTS_BUCKET="student-documents"
STUDENT_DOCUMENT_MAX_BYTES="4000000"
```

Rules:

- Never use a `NEXT_PUBLIC_` or `EXPO_PUBLIC_` prefix for the service-role key.
- Never commit the service-role key.
- Configure the values in Vercel Project Settings for the required environments.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` must be configured together.
- The bucket is created as private on the first authorized upload if it does not exist.
- If an existing bucket with the configured name is public, uploads fail closed.
- Object keys are generated server-side as tenant/student/document paths with sanitized filenames.
- Downloads require `academia.student.update` for the student's branch and use a 60-second signed URL.
- Non-image records are served as downloads rather than permanent public links.
- Deletion removes the object, soft-marks metadata, and records an audit event.
- Teachers with student-view permission do not automatically receive document access.

## Deployment

Apply the included additive migration using the approved direct PostgreSQL connection:

```powershell
npx prisma migrate deploy
```

Then configure the storage variables and redeploy. The migration adds only `StudentDocumentType` and `student_documents`; it does not alter existing student rows.

The private bucket and server-only Storage variables were configured for Vercel Production and Preview on 2026-08-05. DB-backed student upload/replacement and cross-tenant browser QA remain a separate unchecked gate.

## QA Checklist

- Download Excel and CSV templates for an allowed branch.
- Preview a valid file and verify row counts.
- Verify malformed dates, Aadhaar, category, missing headers, duplicate admission numbers, duplicate roll numbers, and unavailable class sections are rejected.
- Import a multi-row file and verify Student, Guardian, link, Enrollment, and audit rows.
- Verify a second tenant or unauthorized branch cannot preview, import, export, upload, open, or delete files.
- Verify exported Aadhaar and bank fields remain masked.
- Upload valid PDF/JPEG/PNG/WebP files and reject extension-spoofed files.
- Verify an oversized file is rejected.
- Verify the bucket is private and signed links expire.
- Verify deleted files disappear from the profile and are removed from storage.

## Known Limits

- Imports are intentionally insert-only. Existing students are reported as conflicts rather than overwritten.
- Files above the configured standard-upload limit require a future direct/resumable-upload flow.
- Automated malware scanning and document OCR are not included. Files are limited to authenticated administrators, approved signatures, private storage, and short-lived access; add an approved scanning service before accepting documents from untrusted public users.
- Background import jobs are not required at the current 5,000-row limit because inserts are batched in one bounded server request. Reassess if pilot files or Vercel execution limits exceed this envelope.
