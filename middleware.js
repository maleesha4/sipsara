// middleware.js
import { NextResponse } from 'next/server';
import { verifyToken } from './src/lib/auth';

export function middleware(request) {
  const token = request.cookies.get('auth_token')?.value;
  const pathname = request.nextUrl.pathname;

  // Public routes: Skip auth
  const publicRoutes = ['/', '/login', '/register'];
  if (publicRoutes.includes(pathname)) {
    // If user is already authenticated and tries to access login/register, redirect to dashboard
    if (token && (pathname === '/login' || pathname === '/register')) {
      try {
        const decoded = verifyToken(token);
        if (decoded) {
          const dashboardPath = `/${decoded.role}/dashboard`;
          return NextResponse.redirect(new URL(dashboardPath, request.url));
        }
      } catch (err) {
        // Invalid token, allow access to login/register
      }
    }
    return NextResponse.next();
  }

  // Role-based protected routes
  const roleRouteMap = {
    '/student': 'student',
    '/admin': 'admin',
    '/tutor': 'tutor',
  };

  const protectedPrefix = Object.keys(roleRouteMap).find(
    prefix => pathname === prefix || pathname.startsWith(prefix + '/')
  );

  if (!protectedPrefix) {
    return NextResponse.next();
  }

  // No token: Redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify token
  let decoded = null;
  try {
    decoded = verifyToken(token);
    if (!decoded) {
      // Clear invalid cookie
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth_token');
      return response;
    }
  } catch (error) {
    console.error('[Middleware] Token verification error:', error.message);
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }

  // Role check
  const requiredRole = roleRouteMap[protectedPrefix];
  if (decoded.role !== requiredRole) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Success: Proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
};