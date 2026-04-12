import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. Get token from cookies (Set in LoginPage via document.cookie)
  const token = request.cookies.get('accessToken')?.value;

  const isAuthPage = pathname === '/login';
  const isProtectedPage = pathname === '/' || pathname.startsWith('/dashboard') || pathname.startsWith('/(dashboard)');

  // 2. Redirect logic
  if (isProtectedPage && !token) {
    const url = new URL('/login', request.url);
    // Remember where they were trying to go
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
};
