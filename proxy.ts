
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Check if the user is accessing a protected route
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // Check for the authentication cookie
    const authCookie = request.cookies.get('auth');

    // If the cookie is not present or invalid, redirect to login
    if (!authCookie || authCookie.value !== 'true') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Allow the request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
