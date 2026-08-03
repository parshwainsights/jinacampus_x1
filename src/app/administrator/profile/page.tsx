import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdministratorContext } from "@/modules/campus-core/administrator-auth";
import { getAdministratorProfile } from "@/modules/campus-core/administrator-services";
import { AdministratorShell } from "@/modules/campus-core/components/administrator-shell";

function formatDate(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(value)
    : "Not available";
}

export default async function PlatformAdministratorProfilePage() {
  const ctx = await requireAdministratorContext();
  const profile = await getAdministratorProfile(ctx);
  if (!profile) notFound();

  return (
    <AdministratorShell ctx={ctx} activeHref="/administrator/profile">
      <section className="premium-section-shell">
        <p className="premium-muted-chip">Independent Platform Identity</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Administrator Profile</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          This account is owned by the JinaCampus platform and is not attached to any school, institution, branch, school role, or academic year.
        </p>
      </section>
      <section className="premium-card p-5 sm:p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white/75 p-4">
            <dt className="text-xs font-semibold uppercase text-slate-500">Display Name</dt>
            <dd className="mt-2 font-semibold text-slate-950">{profile.displayName ?? "JinaCampus Administrator"}</dd>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/75 p-4">
            <dt className="text-xs font-semibold uppercase text-slate-500">Email</dt>
            <dd className="mt-2 break-all font-semibold text-slate-950">{profile.email}</dd>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/75 p-4">
            <dt className="text-xs font-semibold uppercase text-slate-500">Status</dt>
            <dd className="mt-2 font-semibold text-slate-950">{profile.status}</dd>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/75 p-4">
            <dt className="text-xs font-semibold uppercase text-slate-500">Last Login</dt>
            <dd className="mt-2 font-semibold text-slate-950">{formatDate(profile.lastLoginAt)}</dd>
          </div>
        </dl>
        <div className="mt-5 flex justify-end">
          <Link href="/administrator/account/change-password" className="premium-primary-button w-full premium-focus sm:w-auto">
            Change Password
          </Link>
        </div>
      </section>
    </AdministratorShell>
  );
}
