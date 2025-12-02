// ============================================
// FILE: middleware.js (at root)
// ============================================
import { NextResponse } from 'next/server';
import { verifyToken } from './src/lib/auth';  // Path to auth lib

export function middleware(request) {
  const token = request.cookies.get('auth_token')?.value;
  const pathname = request.nextUrl.pathname;

  // Public routes: allow without auth
  const publicRoutes = ['/', '/login', '/register'];
  if (publicRoutes.includes(pathname)) {
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

  // Not a protected route: allow
  if (!protectedPrefix) return NextResponse.next();

  // No token: redirect to login
  if (!token) {
    console.log('No token found, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  let decoded;
  try {
    decoded = verifyToken(token);  // Synchronous
    if (!decoded) {
      console.log('Invalid token, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } catch (error) {
    console.log('Token verification failed:', error.message);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const requiredRole = roleRouteMap[protectedPrefix];
  if (decoded.role !== requiredRole) {
    console.log(
      `Role mismatch: user role is "${decoded.role}", tried to access "${protectedPrefix}"`
    );
    // Always redirect to login on role mismatch for strict enforcement
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/student/:path*',
    '/tutor/:path*'
  ],
};