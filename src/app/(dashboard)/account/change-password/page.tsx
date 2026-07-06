import { requireAuth } from "@/lib/auth/require-auth";
import { ChangeOwnPasswordForm } from "@/modules/campus-core/components/campus-core-profile-forms";

export default async function ChangePasswordPage() {
  const ctx = await requireAuth();
  return <ChangeOwnPasswordForm userEmail={ctx.userEmail} />;
}
