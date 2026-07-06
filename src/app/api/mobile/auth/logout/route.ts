import { revokeMobileSession } from "@/lib/mobile-api/auth";
import { mobileApiError, mobileApiSuccess } from "@/lib/mobile-api/responses";

export async function POST(request: Request) {
  try {
    await revokeMobileSession(request);
    return mobileApiSuccess({});
  } catch (error) {
    return mobileApiError(error, { fallbackMessage: "Unable to sign out. Please try again." });
  }
}
