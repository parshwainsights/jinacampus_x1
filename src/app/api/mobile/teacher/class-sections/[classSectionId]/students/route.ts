import { requireMobileAuth } from "@/lib/mobile-api/auth";
import { mobileApiError, mobileApiSuccess } from "@/lib/mobile-api/responses";
import { listMobileTeacherClassSectionStudents } from "@/lib/mobile-api/teacher-attendance";

export async function GET(
  request: Request,
  context: { params: Promise<{ classSectionId: string }> }
) {
  try {
    const auth = await requireMobileAuth(request);
    const params = await context.params;
    const result = await listMobileTeacherClassSectionStudents(auth.ctx, params);
    return mobileApiSuccess(result);
  } catch (error) {
    return mobileApiError(error, { fallbackMessage: "Unable to load students. Please try again." });
  }
}
