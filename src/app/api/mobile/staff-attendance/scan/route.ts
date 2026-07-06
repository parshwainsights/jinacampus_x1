import { requireMobileAuth } from "@/lib/mobile-api/auth";
import { mobileApiError, mobileApiSuccess } from "@/lib/mobile-api/responses";
import { scanMobileStaffAttendanceQr } from "@/lib/mobile-api/staff-attendance";

export async function POST(request: Request) {
  try {
    const auth = await requireMobileAuth(request);
    const body = await request.json().catch(() => ({}));
    const result = await scanMobileStaffAttendanceQr(auth.ctx, body);
    return mobileApiSuccess(result);
  } catch (error) {
    return mobileApiError(error, {
      fallbackMessage: "Unable to submit staff QR scan. Please try again.",
      validationMessage: "Enter a valid QR token before submitting."
    });
  }
}
