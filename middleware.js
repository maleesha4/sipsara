// middleware.js (at root)
import { NextResponse } from 'next/server';
import { verifyToken } from './src/lib/auth';  // Adjust path if not using src/

export function middleware(request) {
  const token = request.cookies.get('auth_token')?.value;
  const pathname = request.nextUrl.pathname;

  console.log(`[Middleware] Path: ${pathname}, Has token: ${!!token}`);  // Temp: Check if running

  // Public routes: Skip auth
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

  // Not protected: Allow
  if (!protectedPrefix) {
    return NextResponse.next();
  }

  // No token: Redirect to login
  if (!token) {
    console.log('[Middleware] No token - redirect to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify token
  let decoded = null;
  try {
    decoded = verifyToken(token);
    if (!decoded) {
      console.log('[Middleware] Invalid token - redirect to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    console.log(`[Middleware] Decoded role: ${decoded.role}`);  // Temp: Verify role
  } catch (error) {
    console.error('[Middleware] Token verification error:', error.message);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Role check
  const requiredRole = roleRouteMap[protectedPrefix];
  if (decoded.role !== requiredRole) {
    console.log(`[Middleware] Role mismatch: '${decoded.role}' != '${requiredRole}' - blocking access`);
    // Option 1: Redirect to login (your current)
    return NextResponse.redirect(new URL('/login', request.url));
    
    // Option 2: 403 Forbidden (more secure - prevents fishing)
    // return new NextResponse('Unauthorized: Access denied', { status: 403 });
  }

  // Success: Proceed, no cache
  const response = NextResponse.next({
    headers: { 'Cache-Control': 'no-store, no-cache' }
  });
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',  // Broader matcher: All non-static paths
    // Or keep original: '/admin/:path*', '/student/:path*', '/tutor/:path*'
  ],
};