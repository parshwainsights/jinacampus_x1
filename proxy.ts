import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = ["/dashboard", "/campus-core", "/academia", "/staffboard", "/account"];
const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? "jc_session";
const platformSessionCookieName = process.env.PLATFORM_SESSION_COOKIE_NAME ?? "jc_platform_session";

export function proxy(request: NextRequest) {
  const isProtected = protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix));
  const isAdministratorRoute =
    request.nextUrl.pathname.startsWith("/administrator") &&
    request.nextUrl.pathname !== "/administrator/login";
  const hasSchoolSession = Boolean(request.cookies.get(sessionCookieName)?.value);
  const hasPlatformSession = Boolean(request.cookies.get(platformSessionCookieName)?.value);

  if (isProtected && !hasSchoolSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isAdministratorRoute && !hasPlatformSession) {
    return NextResponse.redirect(new URL("/administrator/login", request.url));
  }

  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/campus-core/:path*", "/academia/:path*", "/staffboard/:path*", "/account/:path*", "/administrator/:path*"] };
