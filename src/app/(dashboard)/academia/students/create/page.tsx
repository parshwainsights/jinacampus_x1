import { PermissionState } from "@/components/ui/empty-state";
import { requireAuth } from "@/lib/auth/require-auth";
import { getEffectivePermissions } from "@/lib/rbac/require-permission";
import { listAccessibleBranches } from "@/modules/campus-core/queries";
import { StudentCreateForm } from "@/modules/academia/components/student-create-form";
import { listStudentRegistrationClassSectionOptions } from "@/modules/academia/queries";

export default async function CreateStudentPage() {
  const ctx = await requireAuth();
  const permissions = await getEffectivePermissions({ ctx, branchId: ctx.activeBranchId });
  const canRegisterStudent = [
    "academia.student.create",
    "academia.guardian.manage",
    "academia.enrollment.manage"
  ] as const;
  if (!canRegisterStudent.every((permission) => permissions.has(permission))) return <PermissionState />;

  const [branches, classSections] = await Promise.all([
    listAccessibleBranches(ctx),
    listStudentRegistrationClassSectionOptions(ctx)
  ]);
  const branchOptions = branches.map((branch) => ({ id: branch.id, name: branch.name }));

  return (
    <div className="space-y-6">
      <div className="premium-glass-panel p-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Register Student</h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
          Capture admission-sheet details for an accessible branch. Aadhaar and bank account inputs are converted to masked references only.
        </p>
      </div>
      <StudentCreateForm
        branchOptions={branchOptions}
        classSectionOptions={classSections}
        defaultBranchId={ctx.activeBranchId ?? branchOptions[0]?.id}
      />
    </div>
  );
}
