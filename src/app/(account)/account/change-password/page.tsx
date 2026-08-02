import { requireAuthForPasswordChange } from "@/lib/auth/require-auth";
import { BrandLogo } from "@/components/brand/brand-logo";
import { hasPlatformAdminRole } from "@/lib/rbac/roles";
import { ChangeOwnPasswordForm } from "@/modules/campus-core/components/campus-core-profile-forms";
import { PasskeyManager } from "@/modules/campus-core/components/passkey-manager";

export default async function ChangePasswordPage() {
  const ctx = await requireAuthForPasswordChange();

  return (
    <main className="min-h-dvh bg-app-background px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <BrandLogo className="mb-6 w-56" priority />
        {ctx.passwordChangeRequired ? (
          <p role="status" className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            Change the temporary password before continuing to JinaCampus.
          </p>
        ) : null}
        <ChangeOwnPasswordForm
          userEmail={ctx.userEmail}
          backHref={hasPlatformAdminRole(ctx.roleCodes ?? []) ? "/administrator" : "/dashboard"}
        />
        {!ctx.passwordChangeRequired ? <PasskeyManager schoolId={ctx.tenantSlug} /> : null}
      </div>
    </main>
  );
}
