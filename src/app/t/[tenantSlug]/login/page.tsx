import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { getSchoolLoginBranding } from "@/modules/campus-core/tenant-login";
import { normalizeSchoolId } from "@/modules/campus-core/tenant-login-policy";

export default async function TenantLoginPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug: rawSchoolId } = await params;
  const schoolId = normalizeSchoolId(rawSchoolId);
  const branding = await getSchoolLoginBranding(schoolId);

  return (
    <AuthShell variant="school">
      <LoginForm
        schoolId={schoolId}
        schoolIdLocked={true}
        schoolName={branding.schoolName}
        logoUrl={branding.logoUrl}
      />
    </AuthShell>
  );
}
