import { requireMobileAuth } from "@/lib/mobile-api/auth";
import { mobileApiError, mobileApiSuccess } from "@/lib/mobile-api/responses";
import { submitMobileStudentAttendance } from "@/lib/mobile-api/teacher-attendance";

export async function POST(request: Request) {
  try {
    const auth = await requireMobileAuth(request);
    const body = await request.json().catch(() => ({}));
    const result = await submitMobileStudentAttendance(auth.ctx, body);
    return mobileApiSuccess(result);
  } catch (error) {
    return mobileApiError(error, {
      fallbackMessage: "Unable to submit attendance. Please try again.",
      validationMessage: "Please check the attendance fields and try again."
    });
  }
}
