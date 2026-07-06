import { LoginForm } from "@/components/auth/login-form";
import { getSchoolLoginBranding } from "@/modules/campus-core/tenant-login";
import { normalizeSchoolId } from "@/modules/campus-core/tenant-login-policy";

type LoginSearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: { searchParams?: LoginSearchParams }) {
  const params = searchParams ? await searchParams : {};
  const rawSchoolId = firstParam(params.schoolId) ?? firstParam(params.tenant) ?? firstParam(params.tenantSlug);
  const schoolId = normalizeSchoolId(rawSchoolId);
  const schoolIdLocked = typeof rawSchoolId === "string" && rawSchoolId.trim().length > 0;
  const branding = await getSchoolLoginBranding(schoolId);

  return (
    <main className="flex min-h-dvh w-full max-w-full items-center justify-center overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.13),transparent_30rem),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.12),transparent_28rem),linear-gradient(135deg,#f8fafc_0%,#eef6ff_48%,#f8fafc_100%)] px-4 py-8">
      <LoginForm
        schoolId={schoolId}
        schoolIdLocked={schoolIdLocked}
        schoolName={branding.schoolName}
        logoUrl={branding.logoUrl}
      />
    </main>
  );
}
