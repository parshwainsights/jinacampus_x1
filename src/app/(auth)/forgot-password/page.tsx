import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { normalizeSchoolId } from "@/modules/campus-core/tenant-login-policy";

type ForgotPasswordSearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ForgotPasswordPage({ searchParams }: { searchParams?: ForgotPasswordSearchParams }) {
  const params = searchParams ? await searchParams : {};
  const rawSchoolId = firstParam(params.schoolId) ?? firstParam(params.tenantSlug);
  const schoolId = normalizeSchoolId(rawSchoolId);

  return <AuthShell variant="recovery"><ForgotPasswordForm initialSchoolId={schoolId ?? ""} /></AuthShell>;
}
