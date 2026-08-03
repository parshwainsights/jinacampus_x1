import { redirect } from "next/navigation";

import { requireAdministratorContext } from "@/modules/campus-core/administrator-auth";

type PageParams = Promise<{ tenantId: string }>;

export default async function DeprecatedAdministratorSchoolDashboardPage({
  params
}: {
  params: PageParams;
}) {
  await requireAdministratorContext();
  const { tenantId } = await params;
  redirect(`/administrator/schools/${tenantId}`);
}
