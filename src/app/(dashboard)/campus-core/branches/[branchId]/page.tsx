import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { getEffectivePermissions } from "@/lib/rbac/require-permission";
import { getBranchById } from "@/modules/campus-core/queries";
import { StatusBadge } from "@/components/ui/table-primitives";
import { PermissionState } from "@/components/ui/empty-state";

function value(value: string | Date | null | undefined) {
  if (!value) return "Not set";
  if (value instanceof Date) return value.toLocaleDateString("en-IN");
  return value;
}

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-900">{children}</dd>
    </div>
  );
}

export default async function BranchProfilePage({ params }: { params: Promise<{ branchId: string }> }) {
  const ctx = await requireAuth();
  const { branchId } = await params;
  let permissions: Awaited<ReturnType<typeof getEffectivePermissions>>;
  try {
    permissions = await getEffectivePermissions({ ctx, branchId });
  } catch {
    return <PermissionState />;
  }
  if (!permissions.has("campuscore.branch.manage")) return <PermissionState />;

  const branch = await getBranchById(ctx, branchId);
  if (!branch) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Branch Profile</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{branch.name}</h1>
          <p className="mt-1 text-sm text-slate-500">Branch details for {branch.institution.name}.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/campus-core/branches" className="premium-secondary-button">
            Back to Branches
          </Link>
          <Link href={`/campus-core/branches/${branch.id}/edit`} className="premium-primary-button">
            Edit
          </Link>
        </div>
      </div>

      <section className="premium-card p-5">
        <dl className="grid gap-5 md:grid-cols-3">
          <DetailItem label="Branch Name">{branch.name}</DetailItem>
          <DetailItem label="Code">{branch.code}</DetailItem>
          <DetailItem label="Status"><StatusBadge value={branch.status} /></DetailItem>
          <DetailItem label="Institution">{branch.institution.name}</DetailItem>
          <DetailItem label="Phone">{value(branch.phone)}</DetailItem>
          <DetailItem label="Email">{value(branch.email)}</DetailItem>
          <DetailItem label="Timezone">{branch.timezone}</DetailItem>
          <DetailItem label="Address Line 1">{value(branch.addressLine1)}</DetailItem>
          <DetailItem label="Address Line 2">{value(branch.addressLine2)}</DetailItem>
          <DetailItem label="City">{value(branch.city)}</DetailItem>
          <DetailItem label="State">{value(branch.state)}</DetailItem>
          <DetailItem label="Postal Code">{value(branch.postalCode)}</DetailItem>
          <DetailItem label="Country">{value(branch.country)}</DetailItem>
          <DetailItem label="Created">{value(branch.createdAt)}</DetailItem>
          <DetailItem label="Updated">{value(branch.updatedAt)}</DetailItem>
        </dl>
      </section>
    </div>
  );
}
