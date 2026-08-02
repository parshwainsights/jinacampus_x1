import { AdministratorLoginForm } from "@/components/auth/administrator-login-form";
import { AuthShell } from "@/components/auth/auth-shell";

export default function AdministratorLoginPage() {
  return <AuthShell variant="administrator"><AdministratorLoginForm /></AuthShell>;
}
