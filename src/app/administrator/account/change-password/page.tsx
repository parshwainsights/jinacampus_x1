import { BrandLogo } from "@/components/brand/brand-logo";
import { requireAdministratorContextForPasswordChange } from "@/modules/campus-core/administrator-auth";
import { PlatformAdministratorPasswordForm } from "@/modules/campus-core/components/platform-administrator-password-form";

export default async function PlatformAdministratorChangePasswordPage() {
  const ctx = await requireAdministratorContextForPasswordChange();

  return (
    <main className="min-h-dvh bg-app-background px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <BrandLogo className="mb-6 w-56" priority />
        <PlatformAdministratorPasswordForm
          email={ctx.email}
          passwordChangeRequired={ctx.passwordChangeRequired}
        />
      </div>
    </main>
  );
}
