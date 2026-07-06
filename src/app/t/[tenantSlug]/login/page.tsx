import { LoginForm } from "@/components/auth/login-form";
import { getSchoolLoginBranding } from "@/modules/campus-core/tenant-login";
import { normalizeSchoolId } from "@/modules/campus-core/tenant-login-policy";

export default async function TenantLoginPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug: rawSchoolId } = await params;
  const schoolId = normalizeSchoolId(rawSchoolId);
  const branding = await getSchoolLoginBranding(schoolId);

  return (
    <main className="flex min-h-screen w-full max-w-full items-center justify-start overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.13),transparent_30rem),linear-gradient(135deg,#f8fafc_0%,#eef6ff_48%,#f8fafc_100%)] px-4 py-8 sm:justify-center">
      <LoginForm
        schoolId={schoolId}
        schoolIdLocked={true}
        schoolName={branding.schoolName}
        logoUrl={branding.logoUrl}
      />
    </main>
  );
}
