import { PageIntro, Screen } from "../../src/components/ui";
import { StaffQrScanner } from "../../src/features/staff-attendance/staff-qr-scanner";
import { useAuth } from "../../src/auth/auth-context";

export default function ScanQrScreen() {
  const auth = useAuth();

  return (
    <Screen>
      <PageIntro
        title="Scan Staff QR"
        subtitle="Use the camera scanner for staff check-in/check-out. Manual entry remains available as fallback."
      />
      <StaffQrScanner sessionToken={auth.token} />
    </Screen>
  );
}
