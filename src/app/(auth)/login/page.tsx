import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh w-full max-w-full items-center justify-center overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.13),transparent_30rem),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.12),transparent_28rem),linear-gradient(135deg,#f8fafc_0%,#eef6ff_48%,#f8fafc_100%)] px-4 py-8">
      <LoginForm
        schoolId={null}
        schoolIdLocked={false}
        schoolName={null}
        logoUrl={null}
      />
    </main>
  );
}
