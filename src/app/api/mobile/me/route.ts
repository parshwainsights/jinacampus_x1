import { mobileContextPayload, requireMobileAuth } from "@/lib/mobile-api/auth";
import { mobileApiError, mobileApiSuccess } from "@/lib/mobile-api/responses";

export async function GET(request: Request) {
  try {
    const auth = await requireMobileAuth(request);
    return mobileApiSuccess(mobileContextPayload(auth.user));
  } catch (error) {
    return mobileApiError(error, { fallbackMessage: "Please sign in to continue." });
  }
}
