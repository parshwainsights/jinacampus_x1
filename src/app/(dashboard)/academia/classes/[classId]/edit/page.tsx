import { notFound } from "next/navigation";
import { PermissionState } from "@/components/ui/empty-state";
import { requireAuth } from "@/lib/auth/require-auth";
import { getEffectivePermissions } from "@/lib/rbac/require-permission";
import { getClassById } from "@/modules/academia/queries";
import { ClassEditForm } from "@/modules/academia/components/core-record-edit-forms";

export default async function EditClassPage({ params }: { params: Promise<{ classId: string }> }) {
  const ctx = await requireAuth();
  const { classId } = await params;
  const permissions = await getEffectivePermissions({ ctx, branchId: ctx.activeBranchId });
  if (!permissions.has("academia.class.manage")) return <PermissionState />;

  const academicClass = await getClassById(ctx, classId);
  if (!academicClass) notFound();

  return (
    <ClassEditForm
      record={{
        id: academicClass.id,
        code: academicClass.code,
        name: academicClass.name,
        description: academicClass.description,
        sortOrder: academicClass.sortOrder,
        status: academicClass.status
      }}
    />
  );
}
