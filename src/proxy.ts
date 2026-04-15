import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_SESSION_COOKIE_NAMES = ["refreshToken", "accessToken"] as const;

function hasAuthSession(request: NextRequest) {
  return AUTH_SESSION_COOKIE_NAMES.some((name) => request.cookies.has(name));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = hasAuthSession(request);

  const isAuthPage = pathname === "/login";
  const isProtectedPage = pathname === "/" || pathname.startsWith("/dashboard");

  if (isProtectedPage && !hasSession) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images).*)",
  ],
};
