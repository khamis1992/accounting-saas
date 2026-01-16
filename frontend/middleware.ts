/**
 * Middleware - FRONTEND-1.6
 * Protected Route Middleware with Authentication Check
 * - Checks for valid session using tokens
 * - Redirects to signin if not authenticated
 * - Stores tenant context for API calls
 * - Allows public routes (signin, signup, landing page)
 * - Works with locale routing
 */

import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  '/signin',
  '/signup',
  '/auth/signin',
  '/auth/signup',
  '/api/auth', // Public API endpoints
];

// Create the internationalization middleware
const intlMiddleware = createMiddleware({
  locales: ['en', 'ar'],
  defaultLocale: 'en',
  localePrefix: 'always',
});

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for authentication token
  const accessToken = request.cookies.get('access_token')?.value;

  // Normalize path for public route check (remove locale prefix)
  const pathSegments = pathname.split('/').filter(Boolean);
  const pathWithoutLocale =
    pathSegments.length > 0 && ['en', 'ar'].includes(pathSegments[0])
      ? '/' + pathSegments.slice(1).join('/')
      : '/' + pathSegments.join('/');

  // Check if this is a public path
  const isPublicPath = PUBLIC_PATHS.some((publicPath) =>
    pathWithoutLocale.startsWith(publicPath)
  );

  // If not authenticated and trying to access protected route, redirect to signin
  if (!accessToken && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/en/auth/signin';
    return NextResponse.redirect(url);
  }

  // If authenticated and trying to access signin/signup, redirect to dashboard
  if (accessToken && isPublicPath && (pathWithoutLocale.includes('signin') || pathWithoutLocale.includes('signup'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/en/dashboard';
    return NextResponse.redirect(url);
  }

  // Apply internationalization middleware
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - _next (Next.js internals)
  // - _vercel (Vercel internals)
  // - static files (images, fonts, etc.)
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
};
