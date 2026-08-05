import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { validateEnvironment } from "@/lib/env-validation";
import {
  detectStudentDocumentMimeType,
  safeStudentDocumentObjectName
} from "@/lib/files/student-document-file";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("student admission document storage", () => {
  it("detects approved file signatures and rejects arbitrary bytes", () => {
    expect(detectStudentDocumentMimeType(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]))).toBe("application/pdf");
    expect(detectStudentDocumentMimeType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(detectStudentDocumentMimeType(new Uint8Array([1, 2, 3, 4]))).toBeNull();
  });

  it("normalizes object names without trusting uploaded extensions", () => {
    expect(safeStudentDocumentObjectName("../../Transfer Certificate.exe", "application/pdf"))
      .toBe("..-..-Transfer-Certificate.pdf");
  });

  it("requires Supabase URL and service role configuration together", () => {
    const base = {
      NODE_ENV: "development",
      DATABASE_URL: "postgresql://user:password@localhost:5432/app",
      PASSWORD_PEPPER: "password-pepper-at-least-16-characters"
    };
    expect(() => validateEnvironment({ ...base, SUPABASE_URL: "https://project.supabase.co" }))
      .toThrow("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    expect(validateEnvironment({
      ...base,
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "server-only-key"
    }).STUDENT_DOCUMENTS_BUCKET).toBe("student-documents");
  });

  it("stores tenant-scoped metadata and keeps the bucket private", () => {
    const schema = source("prisma/schema.prisma");
    const storage = source("src/lib/storage/supabase-storage.ts");
    const service = source("src/modules/academia/services/student-document.service.ts");

    expect(schema).toMatch(/model StudentDocument \{[\s\S]*tenantId\s+String[\s\S]*branchId\s+String[\s\S]*studentId\s+String/);
    expect(storage).toContain("public: false");
    expect(storage).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(service).toContain('requireBranchPermission(ctx, "academia.student.update", student.branchId)');
    expect(service).toContain("createSignedUrl(document.storagePath, 60");
    expect(service).toContain("checksumSha256");
    expect(service).not.toContain("getPublicUrl");
  });

  it("integrates file inputs into admission and document management into the profile", () => {
    const registration = source("src/modules/academia/components/student-registration-form.tsx");
    const actions = source("src/modules/academia/actions/profile.actions.ts");
    const profile = source("src/app/(dashboard)/academia/students/[studentId]/page.tsx");

    expect(registration).toContain('name="passportPhoto"');
    expect(registration).toContain('name="transferCertificate"');
    expect(registration).toContain('name="birthCertificate"');
    expect(registration).toContain('name="additionalAdmissionDocuments"');
    expect(registration).toContain("formData.delete(documentField.field)");
    expect(registration).toContain("uploadAdmissionDocument(result.studentId, document)");
    expect(actions).not.toContain('formData.get("passportPhoto")');
    expect(profile).toContain("StudentDocumentsPanel");
  });
});
