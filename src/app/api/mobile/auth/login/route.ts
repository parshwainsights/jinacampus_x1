import { createMobileLoginSession } from "@/lib/mobile-api/auth";
import { mobileApiError, mobileApiSuccess } from "@/lib/mobile-api/responses";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = await createMobileLoginSession(body, request);
    return mobileApiSuccess(result);
  } catch (error) {
    return mobileApiError(error, {
      fallbackMessage: "Unable to sign in. Please try again.",
      validationMessage: "Invalid School ID, email, or password."
    });
  }
}
