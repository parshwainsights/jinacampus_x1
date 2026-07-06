import { AdministratorLoginForm } from "@/components/auth/administrator-login-form";

export default function AdministratorLoginPage() {
  return (
    <main className="flex min-h-screen w-full max-w-full items-center justify-start overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.16),transparent_30rem),linear-gradient(135deg,#f8fafc_0%,#eef6ff_48%,#f8fafc_100%)] px-4 py-8 sm:justify-center">
      <AdministratorLoginForm />
    </main>
  );
}
