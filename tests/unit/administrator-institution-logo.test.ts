import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { validateEnvironment } from "@/lib/env-validation";
import { detectInstitutionLogoMimeType } from "@/lib/files/institution-logo-file";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("administrator institution logo governance", () => {
  it("accepts supported image signatures and rejects active or arbitrary content", () => {
    expect(detectInstitutionLogoMimeType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(detectInstitutionLogoMimeType(new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
    ]))).toBe("image/png");
    expect(detectInstitutionLogoMimeType(new TextEncoder().encode("<svg onload='alert(1)'></svg>"))).toBeNull();
    expect(detectInstitutionLogoMimeType(new Uint8Array([0x25, 0x50, 0x44, 0x46]))).toBeNull();
  });

  it("provides bounded default branding storage configuration", () => {
    const env = validateEnvironment({
      NODE_ENV: "development",
      DATABASE_URL: "postgresql://user:password@localhost:5432/app",
      PASSWORD_PEPPER: "password-pepper-at-least-16-characters"
    });

    expect(env.INSTITUTION_LOGOS_BUCKET).toBe("institution-logos");
    expect(env.INSTITUTION_LOGO_MAX_BYTES).toBe(2_000_000);
  });

  it("allows Server Action transport overhead without weakening the 2 MB file limit", () => {
    const config = source("next.config.ts");
    const service = source("src/modules/campus-core/administrator-branding.service.ts");

    expect(config).toContain('bodySizeLimit: "3mb"');
    expect(service).toContain("input.file.size > maxBytes");
  });

  it("keeps upload authority in the separate Administrator Portal and scopes the institution server-side", () => {
    const actions = source("src/modules/campus-core/administrator-actions.ts");
    const services = source("src/modules/campus-core/administrator-branding.service.ts");
    const storage = source("src/lib/storage/supabase-storage.ts");

    expect(actions).toContain("updateInstitutionLogoAction");
    expect(actions).toContain("await getPlatformAdministratorContext()");
    expect(services).toContain("updateInstitutionLogoForAdministrator");
    expect(services).toContain("where: { id: input.institutionId, tenantId: input.tenantId }");
    expect(services).toContain("INSTITUTION_LOGO_UPDATED");
    expect(services).toContain("getPublicUrl(objectKey)");
    expect(services).toContain("logoObjectKey: objectKey");
    expect(storage).toContain("public: true");
    expect(storage).toContain("INSTITUTION_LOGO_BUCKET_MUST_BE_PUBLIC");
    expect(storage).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(storage).not.toContain("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY");
  });

  it("exposes a supported file picker without rendering internal storage fields", () => {
    const form = source("src/modules/campus-core/components/administrator-school-forms.tsx");
    const editPage = source("src/app/administrator/schools/[tenantId]/edit/page.tsx");

    expect(form).toContain('name="institutionLogo"');
    expect(form).toContain('accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"');
    expect(form).toContain("InstitutionLogoUploadForm");
    expect(editPage).toContain("Only signed-in JinaCampus administrators");
    expect(form).not.toMatch(/logoObjectKey|SUPABASE_SERVICE_ROLE_KEY|passwordHash|tokenHash/);
  });

  it("places the institution logo and display name beside JinaCampus in authenticated chrome", () => {
    const navbar = source("src/components/app-shell/app-navbar.tsx");
    const institutionBrand = source("src/components/app-shell/institution-brand.tsx");
    const institutionLogo = source("src/components/brand/institution-logo.tsx");
    const brandPosition = navbar.indexOf("<BrandLogo");
    const institutionPosition = navbar.indexOf("<InstitutionBrand");

    expect(brandPosition).toBeGreaterThan(-1);
    expect(institutionPosition).toBeGreaterThan(brandPosition);
    expect(institutionBrand).toContain("branding.institutionName");
    expect(institutionLogo).toContain("onError={() => setFailedUrl(logoUrl)}");
    expect(navbar).toContain("branding.institutionName");
    expect(navbar).not.toMatch(/tenantId|actorUserId|logoObjectKey/);
  });
});
