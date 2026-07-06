import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = ["/dashboard", "/campus-core", "/academia", "/staffboard", "/account"];
const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? "jc_session";

export function middleware(request: NextRequest) {
  const isProtected = protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix));
  const isAdministratorRoute =
    request.nextUrl.pathname.startsWith("/administrator") &&
    request.nextUrl.pathname !== "/administrator/login";
  const hasSession = Boolean(request.cookies.get(sessionCookieName)?.value);

  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAdministratorRoute && !hasSession) {
    return NextResponse.redirect(new URL("/administrator/login", request.url));
  }

  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/campus-core/:path*", "/academia/:path*", "/staffboard/:path*", "/account/:path*", "/administrator/:path*"] };
