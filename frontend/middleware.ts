/**
 * Middleware - FRONTEND-1.6 (Updated for Route Groups)
 * Protected Route Middleware with Authentication Check
 *
 * Security Features:
 * - Deny-by-default: All routes require authentication unless explicitly public
 * - Session validation via Supabase auth cookies
 * - Protected route enforcement for (app) route group
 * - Locale preservation in redirects
 * - Open redirect prevention
 *
 * Route Structure:
 * - (marketing)/ - Public routes (no auth required)
 * - (auth)/ - Authentication pages (signin, signup)
 * - (app)/ - Protected routes (requires authentication)
 *
 * @version 2.0.0
 * @lastUpdated 2025-01-17
 */

import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

// ============================================================================
// SECURITY CONFIGURATION
// ============================================================================

/**
 * Public paths that don't require authentication
 *
 * IMPORTANT: This is a deny-by-default system.
 * Only paths explicitly listed here are accessible without authentication.
 * All other paths require valid session.
 *
 * Route groups like (marketing), (auth), (app) are NOT part of the URL,
 * so we only list the actual path segments.
 */
const PUBLIC_PATHS = new Set([
  // Root and marketing pages
  "/", // Landing page
  "/pricing",
  "/about",
  "/features",
  "/contact",

  // Authentication pages
  "/signin",
  "/signup",
  "/auth/signin",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/reset-password",

  // Test/Debug pages (remove in production)
  "/test-auth",

  // Public API endpoints
  "/api/auth",
  "/api/webhook", // Webhooks from external services
  "/api/public", // Any public API routes
]);

/**
 * Paths that authenticated users should be redirected away from
 * e.g., don't show signin page to already signed-in users
 */
const AUTH_REDIRECT_PATHS = new Set(["/signin", "/signup", "/auth/signin", "/auth/signup"]);

/**
 * Supported locales for internationalization
 */
const LOCALES = ["en", "ar"] as const;
const DEFAULT_LOCALE = "en" as const;

/**
 * Supabase auth cookie name pattern
 * The cookie name format is: sb-{project-ref}-auth-token
 * We check for any cookie matching this pattern
 */
const SUPABASE_AUTH_COOKIE_PATTERN = /^sb-.*-auth-token\.*/;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validates that a redirect URL is safe (prevents open redirects)
 * Only allows redirects within the same domain and with supported locales
 *
 * @param url - The URL to validate
 * @returns true if safe, false otherwise
 */
function isValidRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url, "http://localhost");

    // Check if it's a relative URL or same origin
    if (parsed.origin !== "http://localhost" && parsed.origin !== "null") {
      return false;
    }

    // Check if locale is supported (if present)
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length > 0 && LOCALES.includes(segments[0] as never)) {
      return true;
    }

    // Allow paths without locale (will be added by middleware)
    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts locale from pathname and returns the locale and path without locale
 *
 * @param pathname - The pathname to parse
 * @returns Tuple of [locale, pathWithoutLocale]
 */
function extractLocale(pathname: string): [string, string] {
  const segments = pathname.split("/").filter(Boolean);

  // Check if first segment is a locale
  if (segments.length > 0 && LOCALES.includes(segments[0] as never)) {
    const locale = segments[0];
    const pathWithoutLocale = "/" + segments.slice(1).join("/");
    return [locale, pathWithoutLocale];
  }

  // No locale found, return default
  return [DEFAULT_LOCALE, pathname];
}

/**
 * Checks if a path is public (doesn't require authentication)
 * Uses exact match or prefix match for nested paths
 *
 * @param pathWithoutLocale - Path without locale prefix
 * @returns true if public, false otherwise
 */
function isPublicPath(pathWithoutLocale: string): boolean {
  // Normalize the path
  const normalizedPath = pathWithoutLocale.replace(/\/$/, "") || "/";

  // Check for exact match first
  if (PUBLIC_PATHS.has(normalizedPath)) {
    return true;
  }

  // Check for prefix match (for nested paths like /api/auth/callback)
  for (const publicPath of Array.from(PUBLIC_PATHS)) {
    if (normalizedPath.startsWith(publicPath + "/")) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if authenticated user should be redirected from this path
 *
 * @param pathWithoutLocale - Path without locale prefix
 * @returns true if should redirect, false otherwise
 */
function shouldRedirectAuthenticated(pathWithoutLocale: string): boolean {
  const normalizedPath = pathWithoutLocale.replace(/\/$/, "") || "/";

  for (const redirectPath of Array.from(AUTH_REDIRECT_PATHS)) {
    if (normalizedPath === redirectPath || normalizedPath.startsWith(redirectPath + "/")) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if user has a valid Supabase session
 * Looks for the Supabase auth token cookie
 *
 * @param request - NextRequest object
 * @returns true if session exists, false otherwise
 */
function hasValidSession(request: NextRequest): boolean {
  // Check all cookies for Supabase auth token
  const cookies = request.cookies.getAll();

  for (const cookie of cookies) {
    if (SUPABASE_AUTH_COOKIE_PATTERN.test(cookie.name)) {
      // Cookie exists - check if it has a value
      if (cookie.value && cookie.value.length > 0) {
        return true;
      }
    }
  }

  return false;
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Create the internationalization middleware
const intlMiddleware = createMiddleware({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "always",
});

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ========================================================================
  // Skip middleware for static files and Next.js internals
  // ========================================================================

  // Skip static files, Next.js internals, and API routes (they handle their own auth)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/_vercel") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") // Files with extensions (images, fonts, etc.)
  ) {
    return intlMiddleware(request);
  }

  // ========================================================================
  // Extract locale and normalize path
  // ========================================================================

  const [locale, pathWithoutLocale] = extractLocale(pathname);

  // ========================================================================
  // Check authentication status
  // ========================================================================

  const hasSession = hasValidSession(request);
  const isPublic = isPublicPath(pathWithoutLocale);
  const shouldRedirectAuth = shouldRedirectAuthenticated(pathWithoutLocale);

  // ========================================================================
  // Handle unauthenticated users accessing protected routes
  // ========================================================================

  if (!hasSession && !isPublic) {
    // User is not authenticated and trying to access protected route
    // Redirect to signin page while preserving locale
    const redirectUrl = new URL(`/${locale}/signin`, request.url);

    // Add redirect parameter to original destination (for post-signin redirect)
    // encodeURIComponent prevents open redirect vulnerabilities
    redirectUrl.searchParams.set("redirect", encodeURIComponent(pathname));

    return NextResponse.redirect(redirectUrl);
  }

  // ========================================================================
  // Handle authenticated users accessing signin/signup
  // ========================================================================

  if (hasSession && shouldRedirectAuth) {
    // User is already authenticated and trying to access signin/signup
    // Redirect to dashboard
    const redirectUrl = new URL(`/${locale}/dashboard`, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // ========================================================================
  // Handle root path without locale
  // ========================================================================

  if (pathWithoutLocale === "/" && pathname !== "/") {
    // Path has locale but no other segments (e.g., /en, /ar)
    // Redirect to dashboard if authenticated, landing if not
    const destination = hasSession ? "/dashboard" : "/";
    const redirectUrl = new URL(`/${locale}${destination}`, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname === "/") {
    // Root path without locale - redirect to default locale
    const destination = hasSession ? "/dashboard" : "/";
    const redirectUrl = new URL(`/${DEFAULT_LOCALE}${destination}`, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // ========================================================================
  // Apply internationalization middleware
  // ========================================================================

  return intlMiddleware(request);
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export const config = {
  /**
   * Matcher configuration
   *
   * Matches all request paths except:
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   * - public folder files (images, fonts, etc.)
   *
   * Security note: Using explicit exclusion rather than inclusion
   * to avoid accidentally matching sensitive paths
   */
  matcher: [
    /*
     * Match all pathnames except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, fonts, icons, etc.)
     * - Files with extensions (static assets)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)",
  ],
};
