import { requireMobileAuth } from "@/lib/mobile-api/auth";
import { mobileApiError, mobileApiSuccess } from "@/lib/mobile-api/responses";
import { listMobileTeacherClassSections } from "@/lib/mobile-api/teacher-attendance";

export async function GET(request: Request) {
  try {
    const auth = await requireMobileAuth(request);
    const result = await listMobileTeacherClassSections(auth.ctx);
    return mobileApiSuccess(result);
  } catch (error) {
    return mobileApiError(error, { fallbackMessage: "Unable to load class sections. Please try again." });
  }
}
