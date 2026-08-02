import { redirect } from "next/navigation";

type LoginSearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: { searchParams?: LoginSearchParams }) {
  const params = searchParams ? await searchParams : {};
  const schoolId = firstParam(params.schoolId) ?? firstParam(params.tenantSlug);
  redirect(schoolId ? `/?schoolId=${encodeURIComponent(schoolId)}` : "/");
}
