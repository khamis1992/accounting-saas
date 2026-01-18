# Middleware Architecture Documentation

**File**: `frontend/middleware.ts`
**Version**: 2.0.0
**Last Updated**: 2025-01-17

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Security Model](#security-model)
4. [Route Protection](#route-protection)
5. [Locale Handling](#locale-handling)
6. [Authentication Flow](#authentication-flow)
7. [Security Considerations](#security-considerations)
8. [Troubleshooting](#troubleshooting)
9. [Migration Guide](#migration-guide)

---

## Overview

The Next.js middleware provides authentication, route protection, and locale management for the Accounting SaaS application. It implements a **deny-by-default** security model where all routes require authentication unless explicitly marked as public.

### Key Features

- **Deny-by-default security**: All routes protected unless explicitly public
- **Flexible Supabase auth**: Works with any Supabase project (pattern-based cookie detection)
- **Locale preservation**: Maintains user's language preference during redirects
- **Open redirect prevention**: Validates all redirect URLs
- **Route group support**: Ready for (marketing), (auth), (app) route groups
- **Type-safe**: Fully typed with TypeScript

---

## Architecture

### Middleware Chain

```
Request
  ↓
[Static File Check] → If static, pass through
  ↓
[Locale Extraction] → Extract locale and normalize path
  ↓
[Session Validation] → Check Supabase auth cookie
  ↓
[Path Classification] → Public vs Protected vs Auth Redirect
  ↓
[Redirect Logic] → Apply redirects if needed
  ↓
[i18n Middleware] → Apply next-intl middleware
  ↓
Response
```

### Key Components

#### 1. Configuration Constants

```typescript
PUBLIC_PATHS: Set<string>; // Paths accessible without auth
AUTH_REDIRECT_PATHS: Set; // Paths to redirect authenticated users from
LOCALES: const array; // Supported languages
DEFAULT_LOCALE: string; // Fallback language
SUPABASE_AUTH_COOKIE_PATTERN: RegExp; // Cookie detection pattern
```

#### 2. Helper Functions

```typescript
extractLocale(pathname); // Extract locale from path
isPublicPath(pathWithoutLocale); // Check if path is public
shouldRedirectAuthenticated(path); // Check if authenticated user should redirect
hasValidSession(request); // Check for Supabase auth cookie
isValidRedirectUrl(url); // Validate redirect URL (prevent open redirects)
```

#### 3. Main Middleware Function

```typescript
middleware(request: NextRequest): NextResponse
```

---

## Security Model

### Deny-by-Default Approach

The middleware uses a **deny-by-default** security model:

```
Default: Protected (requires authentication)
Exception: Public paths (explicitly listed)
```

This is more secure than an allow-by-default model because:

1. **Explicit over implicit**: You must deliberately make a path public
2. **No accidental exposure**: New routes are protected by default
3. **Clear security boundary**: Easy to audit public paths
4. **Fail-closed**: If logic fails, users are locked out, not let in

### Public Path Definition

```typescript
const PUBLIC_PATHS = new Set([
  // Marketing pages (future route group)
  "/",
  "/pricing",
  "/about",

  // Authentication pages (future route group)
  "/signin",
  "/signup",
  "/auth/signin",
  "/auth/signup",

  // Public API
  "/api/auth",
  "/api/webhook",
]);
```

**Important Notes**:

- Route groups like `(marketing)` and `(auth)` are NOT part of the URL
- Only list the actual path segments
- Use exact match or prefix match for nested paths
- API routes that handle their own auth should be listed here

### Session Validation

The middleware checks for Supabase authentication using a pattern-based approach:

```typescript
const SUPABASE_AUTH_COOKIE_PATTERN = /^sb-.*-auth-token\.*/;

function hasValidSession(request: NextRequest): boolean {
  const cookies = request.cookies.getAll();

  for (const cookie of cookies) {
    if (SUPABASE_AUTH_COOKIE_PATTERN.test(cookie.name)) {
      if (cookie.value && cookie.value.length > 0) {
        return true;
      }
    }
  }

  return false;
}
```

**Advantages**:

- **Project-agnostic**: Works with any Supabase project (not hard-coded to specific project ref)
- **Flexible**: Automatically detects auth cookies regardless of project
- **Simple**: No need to update middleware when changing Supabase projects

**Limitations**:

- **Cookie-only**: Does not validate session with backend
- **Assumes valid**: If cookie exists, assumes session is valid
- **Client validation**: Supabase client handles actual session validation

---

## Route Protection

### Protected Routes

All routes NOT in `PUBLIC_PATHS` require authentication. This includes:

```
/dashboard              → Protected
/accounting/*           → Protected (all accounting pages)
/sales/*                → Protected (all sales pages)
/settings/*             → Protected (all settings pages)
```

### Public Routes

Only routes explicitly listed in `PUBLIC_PATHS` are accessible without authentication:

```
/                       → Public (landing page)
/signin                 → Public (signin page)
/signup                 → Public (signup page)
/api/auth/callback      → Public (Supabase auth callback)
```

### Authentication Redirect Paths

Authenticated users are redirected away from these paths:

```
/signin     → Redirect to /dashboard
/signup     → Redirect to /dashboard
/auth/*     → Redirect to /dashboard
```

---

## Locale Handling

### Supported Locales

```typescript
const LOCALES = ["en", "ar"];
const DEFAULT_LOCALE = "en";
```

### Locale Extraction

The middleware extracts the locale from the URL path:

```typescript
function extractLocale(pathname: string): [string, string] {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length > 0 && LOCALES.includes(segments[0] as never)) {
    const locale = segments[0];
    const pathWithoutLocale = "/" + segments.slice(1).join("/");
    return [locale, pathWithoutLocale];
  }

  return [DEFAULT_LOCALE, pathname];
}
```

**Examples**:

```
Input: /en/accounting/journals
Output: ['en', '/accounting/journals']

Input: /ar/sales/invoices
Output: ['ar', '/sales/invoices']

Input: /dashboard (no locale)
Output: ['en', '/dashboard']
```

### Locale Preservation in Redirects

When redirecting, the middleware preserves the user's locale:

```typescript
// Unauthenticated user accessing protected route
Redirect: /en/dashboard → /en/signin?redirect=%2Fen%2Fdashboard

// Arabic locale preserved
Redirect: /ar/accounting/journals → /ar/signin?redirect=%2Far%2Faccounting%2Fjournals
```

---

## Authentication Flow

### Unauthenticated User Flow

```
1. User navigates to: /en/dashboard
2. Middleware checks: hasValidSession() → false
3. Middleware checks: isPublicPath() → false
4. Middleware redirects to: /en/signin?redirect=%2Fen%2Fdashboard
5. User signs in
6. App redirects to: /en/dashboard (from redirect param)
```

### Authenticated User Flow

```
1. User navigates to: /en/accounting/journals
2. Middleware checks: hasValidSession() → true
3. Middleware checks: isPublicPath() → false
4. Middleware allows access → Journal page displayed
```

### Authenticated User Accessing Signin

```
1. User navigates to: /en/signin (while authenticated)
2. Middleware checks: hasValidSession() → true
3. Middleware checks: shouldRedirectAuthenticated() → true
4. Middleware redirects to: /en/dashboard
```

---

## Security Considerations

### 1. Open Redirect Prevention

**Problem**: Attackers could craft malicious redirect URLs to steal credentials or redirect users to phishing sites.

**Solution**:

```typescript
function isValidRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url, "http://localhost");

    // Check if it's a relative URL or same origin
    if (parsed.origin !== "http://localhost" && parsed.origin !== "null") {
      return false;
    }

    // Additional checks...
    return true;
  } catch {
    return false;
  }
}
```

**Protection**:

- All redirect URLs validated
- Only same-origin redirects allowed
- External redirects blocked
- `encodeURIComponent` used for redirect parameter

### 2. Authentication Bypass Prevention

**Problem**: Attackers could bypass authentication using path traversal or wildcard patterns.

**Solution**:

```typescript
function isPublicPath(pathWithoutLocale: string): boolean {
  const normalizedPath = pathWithoutLocale.replace(/\/$/, "") || "/";

  // Exact match only
  if (PUBLIC_PATHS.has(normalizedPath)) {
    return true;
  }

  // Prefix match for nested paths
  for (const publicPath of PUBLIC_PATHS) {
    if (normalizedPath.startsWith(publicPath + "/")) {
      return true;
    }
  }

  return false; // Deny by default
}
```

**Protection**:

- Deny-by-default model
- No wildcard patterns
- Path normalization
- Explicit public path list

### 3. Session Validation

**Problem**: Invalid or expired sessions could allow unauthorized access.

**Current Implementation**:

- Middleware checks for Supabase auth cookie
- Does not validate session with backend (performance optimization)
- Relies on Supabase client-side validation

**Future Enhancement**:

```typescript
// Optional: Add backend session validation
async function hasValidSession(request: NextRequest): Promise<boolean> {
  const cookie = request.cookies.get("sb-gbbmicjucestjpxtkjyp-auth-token");

  if (!cookie) return false;

  // Call backend to validate session
  const response = await fetch(`${API_URL}/auth/validate`, {
    headers: {
      Authorization: `Bearer ${cookie.value}`,
    },
  });

  return response.ok;
}
```

### 4. Cookie Security

**Current Implementation**:

- Cookie pattern matching (project-agnostic)
- Checks for cookie existence and value

**Recommendations**:

- Ensure Supabase cookies are set with:
  - `Secure` flag (HTTPS only)
  - `HttpOnly` flag (not accessible via JavaScript)
  - `SameSite=Strict` or `SameSite=Lax`
  - Appropriate `Max-Age` or `Expires`

---

## Troubleshooting

### Common Issues

#### Issue 1: Infinite Redirect Loop

**Symptoms**:

- Browser shows "Too many redirects"
- Page never loads

**Possible Causes**:

1. Public path not listed in `PUBLIC_PATHS`
2. Middleware logic error
3. Intl middleware conflict

**Solutions**:

1. Add path to `PUBLIC_PATHS` if it should be public
2. Check middleware logic flow
3. Ensure intl middleware is called last

**Debug**:

```typescript
// Add logging to middleware
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log("[Middleware] Pathname:", pathname);
  console.log("[Middleware] Has session:", hasValidSession(request));
  console.log("[Middleware] Is public:", isPublicPath(pathWithoutLocale));

  // ... rest of middleware
}
```

#### Issue 2: Locale Not Preserved

**Symptoms**:

- User loses language preference after redirect
- Always redirected to `/en/` even when using `/ar/`

**Possible Causes**:

1. Locale extraction not working
2. Redirect URL hard-coded to specific locale

**Solutions**:

1. Ensure `extractLocale()` function is called
2. Use extracted locale in redirect URLs

#### Issue 3: Authentication Not Working

**Symptoms**:

- Continuously redirected to signin
- Cannot access protected routes after signing in

**Possible Causes**:

1. Supabase auth cookie not being set
2. Cookie pattern not matching
3. Cookie name changed

**Solutions**:

1. Check browser DevTools > Application > Cookies
2. Verify Supabase auth cookie exists
3. Check cookie name matches pattern: `sb-{project-ref}-auth-token`

**Debug**:

```typescript
function hasValidSession(request: NextRequest): boolean {
  const cookies = request.cookies.getAll();

  console.log("[Middleware] All cookies:", cookies);

  for (const cookie of cookies) {
    console.log("[Middleware] Checking cookie:", cookie.name);

    if (SUPABASE_AUTH_COOKIE_PATTERN.test(cookie.name)) {
      console.log("[Middleware] Auth cookie found:", cookie.name);
      console.log("[Middleware] Cookie value length:", cookie.value?.length);

      if (cookie.value && cookie.value.length > 0) {
        return true;
      }
    }
  }

  return false;
}
```

#### Issue 4: Static Files Not Loading

**Symptoms**:

- Images, fonts, or CSS not loading
- 404 errors for static assets

**Possible Causes**:

1. Middleware blocking static files
2. Matcher pattern too broad

**Solutions**:

1. Ensure static file paths are excluded in matcher
2. Check if file extensions are properly excluded

**Current Matcher**:

```typescript
matcher: [
  "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)",
];
```

---

## Migration Guide

### From v1.0.0 to v2.0.0

#### Breaking Changes

1. **Hard-coded cookie removed**:

   ```typescript
   // OLD (v1.0.0)
   const supabaseAuth = request.cookies.get("sb-gbbmicjucestjpxtkjyp-auth-token")?.value;

   // NEW (v2.0.0)
   const hasSession = hasValidSession(request); // Pattern-based
   ```

2. **Public path structure changed**:

   ```typescript
   // OLD (v1.0.0)
   const PUBLIC_PATHS = ["/signin", "/signup", "/auth/signin", "/auth/signup"];

   // NEW (v2.0.0)
   const PUBLIC_PATHS = new Set([
     "/",
     "/pricing",
     "/about",
     "/signin",
     "/signup",
     "/auth/signin",
     "/auth/signup",
     "/api/auth",
   ]);
   ```

#### Migration Steps

1. **Update middleware.ts**:
   - Replace the entire file with v2.0.0
   - No code changes needed in other files

2. **Update public paths** (if needed):
   - Add any additional public routes to `PUBLIC_PATHS`
   - Remove routes that should now be protected

3. **Test thoroughly**:
   - Follow test plan in `MIDDLEWARE_TEST_PLAN.md`
   - Verify all authentication flows work
   - Check locale preservation

### Adding New Public Routes

To make a new route public:

```typescript
const PUBLIC_PATHS = new Set([
  // ... existing paths
  "/your-new-public-path", // Add here
  "/api/your-public-api", // Add API routes here
]);
```

### Adding New Protected Routes

Protected routes require NO changes to middleware. All routes are protected by default.

Simply create the route in the appropriate directory:

```
app/[locale]/(app)/your-new-route/page.tsx
```

---

## Performance Considerations

### Middleware Execution Time

**Target**: < 50ms for all middleware operations

**Optimizations**:

1. **Early returns**: Skip middleware for static files
2. **Set instead of Array**: O(1) lookup for public paths
3. **Pattern matching**: Efficient regex for cookie detection
4. **Minimal function calls**: Only run what's necessary

### Profiling

To profile middleware performance:

```typescript
export function middleware(request: NextRequest) {
  const start = performance.now();

  // ... middleware logic

  const end = performance.now();
  console.log(`[Middleware] Execution time: ${end - start}ms`);

  return response;
}
```

---

## Future Enhancements

### 1. Role-Based Access Control (RBAC)

Add role checking to middleware:

```typescript
async function hasRequiredRole(request: NextRequest, requiredRole: string): Promise<boolean> {
  const hasSession = hasValidSession(request);
  if (!hasSession) return false;

  // Decode JWT to get user role
  const token = request.cookies.get("sb-gbbmicjucestjpxtkjyp-auth-token")?.value;
  const payload = JSON.parse(atob(token.split(".")[1]));
  const userRole = payload.user_role;

  return userRole === requiredRole;
}
```

### 2. Backend Session Validation

Add API call to validate session:

```typescript
async function validateSessionWithBackend(token: string): Promise<boolean> {
  const response = await fetch(`${API_URL}/auth/validate`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.ok;
}
```

### 3. Rate Limiting

Add rate limiting for sensitive routes:

```typescript
const rateLimiter = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string, limit: number, window: number): boolean {
  const now = Date.now();
  const record = rateLimiter.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimiter.set(identifier, { count: 1, resetTime: now + window });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}
```

---

## References

- [Next.js Middleware Documentation](https://nextjs.org/docs/advanced-features/middleware)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [OWASP Top 10 - Open Redirects](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/11-Client-side_Testing/04-Testing_for_Client-side_URL_Redirect)
- [Route Groups Documentation](https://nextjs.org/docs/routing/defining-routes#route-groups)

---

**Document Version**: 1.0.0
**Last Updated**: 2025-01-17
**Maintained By**: Development Team
