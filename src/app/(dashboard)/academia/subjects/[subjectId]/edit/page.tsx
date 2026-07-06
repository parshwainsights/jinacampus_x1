import { notFound } from "next/navigation";
import { PermissionState } from "@/components/ui/empty-state";
import { requireAuth } from "@/lib/auth/require-auth";
import { getEffectivePermissions } from "@/lib/rbac/require-permission";
import { getSubjectById } from "@/modules/academia/queries";
import { SubjectEditForm } from "@/modules/academia/components/core-record-edit-forms";

export default async function EditSubjectPage({ params }: { params: Promise<{ subjectId: string }> }) {
  const ctx = await requireAuth();
  const { subjectId } = await params;
  const permissions = await getEffectivePermissions({ ctx, branchId: ctx.activeBranchId });
  if (!permissions.has("academia.subject.manage")) return <PermissionState />;

  const subject = await getSubjectById(ctx, subjectId);
  if (!subject) notFound();

  return (
    <SubjectEditForm
      record={{
        id: subject.id,
        code: subject.code,
        name: subject.name,
        type: subject.type,
        description: subject.description,
        status: subject.status
      }}
    />
  );
}
