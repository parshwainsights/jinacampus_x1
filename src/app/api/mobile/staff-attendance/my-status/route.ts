import { requireMobileAuth } from "@/lib/mobile-api/auth";
import { mobileApiError, mobileApiSuccess } from "@/lib/mobile-api/responses";
import { getMobileStaffAttendanceStatus } from "@/lib/mobile-api/staff-attendance";

export async function GET(request: Request) {
  try {
    const auth = await requireMobileAuth(request);
    const url = new URL(request.url);
    const result = await getMobileStaffAttendanceStatus(auth.ctx, {
      date: url.searchParams.get("date") ?? undefined
    });
    return mobileApiSuccess(result);
  } catch (error) {
    return mobileApiError(error, { fallbackMessage: "Unable to load attendance status. Please try again." });
  }
}
