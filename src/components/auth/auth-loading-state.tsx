import { AppMark } from "@/components/brand/app-mark";
import { BrandLogo } from "@/components/brand/brand-logo";
import { AuthShell, type AuthShellVariant } from "@/components/auth/auth-shell";

export function AuthLoadingState({
  variant = "school",
  label = "Preparing secure sign in"
}: {
  variant?: AuthShellVariant;
  label?: string;
}) {
  return (
    <AuthShell variant={variant}>
      <section className="auth-form-panel flex min-h-[25rem] w-full max-w-xl flex-col items-center justify-center p-7 text-center sm:p-10" aria-live="polite" aria-busy="true">
        <BrandLogo className="hidden w-[15rem] lg:block" priority />
        <div className="auth-loading-mark relative flex h-24 w-24 items-center justify-center rounded-full border border-brand-100 bg-white shadow-lg lg:mt-10">
          <span className="auth-loading-ring absolute inset-2 rounded-full border-2 border-brand-100 border-t-brand-500" aria-hidden="true" />
          <AppMark className="relative h-12 w-12" priority />
        </div>
        <p className="mt-7 text-lg font-semibold text-ink">{label}</p>
        <p className="mt-2 text-sm text-slate-500">Please wait a moment.</p>
      </section>
    </AuthShell>
  );
}
