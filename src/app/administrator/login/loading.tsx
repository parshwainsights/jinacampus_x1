import { AuthLoadingState } from "@/components/auth/auth-loading-state";

export default function AdministratorLoginLoading() {
  return <AuthLoadingState variant="administrator" label="Opening Administrator Portal" />;
}
