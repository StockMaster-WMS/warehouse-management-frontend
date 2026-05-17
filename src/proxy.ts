import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isProtectedAppPath } from "@/lib/site";

const AUTH_SESSION_COOKIE_NAMES = ["refreshToken", "accessToken"] as const;

function hasAuthSession(request: NextRequest) {
  return AUTH_SESSION_COOKIE_NAMES.some((name) => request.cookies.has(name));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = hasAuthSession(request);

  const isProtectedPage = isProtectedAppPath(pathname);

  if (isProtectedPage && !hasSession) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images).*)",
  ],
};
