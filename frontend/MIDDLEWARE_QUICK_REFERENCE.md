# Middleware Quick Reference Guide

**File**: `frontend/middleware.ts`
**Version**: 2.0.0

---

## TL;DR

The middleware protects all routes by default. Only routes in `PUBLIC_PATHS` are accessible without authentication. Auth checks use Supabase auth cookies.

---

## How to Use

### Making a Route Public

```typescript
// In middleware.ts, add to PUBLIC_PATHS:

const PUBLIC_PATHS = new Set([
  // ... existing paths
  "/your-new-public-route", // Add this line
]);
```

### Making a Route Protected

**Do nothing!** All routes are protected by default.

Just create your route:

```
app/[locale]/(app)/your-protected-route/page.tsx
```

### Adding Authentication Pages

```typescript
// In middleware.ts, add to PUBLIC_PATHS and AUTH_REDIRECT_PATHS:

const PUBLIC_PATHS = new Set([
  "/your-auth-page", // Add here
]);

const AUTH_REDIRECT_PATHS = new Set([
  "/your-auth-page", // Also add here (to redirect authenticated users)
]);
```

---

## Common Patterns

### Public Marketing Page

```typescript
// Route: /pricing
// File: app/[locale]/(marketing)/pricing/page.tsx

// Middleware: No changes needed (already public)
// If adding new marketing route, add to PUBLIC_PATHS:
const PUBLIC_PATHS = new Set([
  "/pricing",
  "/your-new-marketing-page", // Add here
]);
```

### Protected App Page

```typescript
// Route: /accounting/general-ledger
// File: app/[locale]/(app)/accounting/general-ledger/page.tsx

// Middleware: No changes needed (automatically protected)
```

### Public API Endpoint

```typescript
// Route: /api/public/webhook
// File: app/api/public/webhook/route.ts

// Middleware: Add to PUBLIC_PATHS:
const PUBLIC_PATHS = new Set([
  "/api/public", // This covers all nested routes
]);
```

---

## Debugging

### Enable Logging

```typescript
// Add to middleware function:

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Add logging
  console.log("[Middleware] Pathname:", pathname);
  console.log("[Middleware] Has session:", hasValidSession(request));

  const [locale, pathWithoutLocale] = extractLocale(pathname);
  console.log("[Middleware] Locale:", locale);
  console.log("[Middleware] Path without locale:", pathWithoutLocale);

  const isPublic = isPublicPath(pathWithoutLocale);
  console.log("[Middleware] Is public:", isPublic);

  // ... rest of middleware
}
```

### Check Cookies in Browser

1. Open DevTools (F12)
2. Go to Application > Cookies
3. Look for cookies matching: `sb-<project-ref>-auth-token`
4. Check if cookie has a value

### Common Issues

| Issue                    | Solution                                           |
| ------------------------ | -------------------------------------------------- |
| Infinite redirect        | Add route to `PUBLIC_PATHS` if it should be public |
| Locale not preserved     | Check `extractLocale()` is being called            |
| Auth not working         | Check Supabase auth cookie exists in DevTools      |
| Static files not loading | Check matcher pattern in `config`                  |

---

## Testing Checklist

### Unauthenticated User

- [ ] Cannot access `/dashboard` (redirects to `/en/signin`)
- [ ] Cannot access `/accounting/*` (redirects to `/en/signin`)
- [ ] Can access `/signin`
- [ ] Can access `/signup`
- [ ] Can access `/` (landing page)

### Authenticated User

- [ ] Can access `/dashboard`
- [ ] Can access `/accounting/*`
- [ ] Cannot access `/signin` (redirects to `/en/dashboard`)
- [ ] Cannot access `/signup` (redirects to `/en/dashboard`)

### Locale Handling

- [ ] `/en/dashboard` preserves locale on redirect
- [ ] `/ar/accounting` preserves locale on redirect
- [ ] `/` redirects to `/en/`

---

## Configuration Constants

```typescript
// PUBLIC_PATHS: Routes accessible without authentication
const PUBLIC_PATHS = new Set([
  "/",
  "/pricing",
  "/about",
  "/signin",
  "/signup",
  "/auth/signin",
  "/auth/signup",
  "/test-auth",
  "/api/auth",
  "/api/webhook",
  "/api/public",
]);

// AUTH_REDIRECT_PATHS: Routes to redirect authenticated users from
const AUTH_REDIRECT_PATHS = new Set(["/signin", "/signup", "/auth/signin", "/auth/signup"]);

// LOCALES: Supported languages
const LOCALES = ["en", "ar"];

// DEFAULT_LOCALE: Fallback language
const DEFAULT_LOCALE = "en";

// SUPABASE_AUTH_COOKIE_PATTERN: Pattern to detect auth cookies
const SUPABASE_AUTH_COOKIE_PATTERN = /^sb-.*-auth-token\.*/;
```

---

## Helper Functions

```typescript
// Extract locale from pathname
extractLocale(pathname: string): [locale: string, pathWithoutLocale: string]

// Check if path is public
isPublicPath(pathWithoutLocale: string): boolean

// Check if authenticated user should redirect
shouldRedirectAuthenticated(pathWithoutLocale: string): boolean

// Check for valid Supabase session
hasValidSession(request: NextRequest): boolean

// Validate redirect URL (prevent open redirects)
isValidRedirectUrl(url: string): boolean
```

---

## Flow Charts

### Unauthenticated User

```
Request → Extract Locale → Check Session → No Session
  → Check Public Path → Not Public → Redirect to Signin
```

### Authenticated User

```
Request → Extract Locale → Check Session → Has Session
  → Check Auth Redirect Path → Should Redirect → Redirect to Dashboard
```

### Public Path

```
Request → Extract Locale → Check Session → Any Session
  → Check Public Path → Is Public → Allow Access
```

---

## Examples

### Example 1: Unauthenticated User Accessing Dashboard

```
Request: GET /en/dashboard
Cookies: None

Middleware Flow:
1. Extract locale: ['en', '/dashboard']
2. Check session: false (no auth cookie)
3. Check public: false (not in PUBLIC_PATHS)
4. Redirect to: /en/signin?redirect=%2Fen%2Fdashboard
```

### Example 2: Authenticated User Accessing Dashboard

```
Request: GET /en/dashboard
Cookies: sb-gbbmicjucestjpxtkjyp-auth-token=abc123

Middleware Flow:
1. Extract locale: ['en', '/dashboard']
2. Check session: true (auth cookie exists)
3. Check public: false (not in PUBLIC_PATHS)
4. Allow access to /en/dashboard
```

### Example 3: Authenticated User Accessing Signin

```
Request: GET /en/signin
Cookies: sb-gbbmicjucestjpxtkjyp-auth-token=abc123

Middleware Flow:
1. Extract locale: ['en', '/signin']
2. Check session: true (auth cookie exists)
3. Check auth redirect: true (in AUTH_REDIRECT_PATHS)
4. Redirect to: /en/dashboard
```

---

## Security Best Practices

### ✅ DO

- Keep public path list minimal
- Use deny-by-default approach
- Validate all redirect URLs
- Check session on every request
- Log middleware execution for debugging

### ❌ DON'T

- Use wildcard patterns in public paths
- Skip session validation for performance
- Allow external redirects
- Hard-code project-specific values
- Assume input is sanitized

---

## Performance Tips

1. **Use Set for lookups**: O(1) vs O(n) for Array
2. **Early returns**: Skip middleware for static files
3. **Minimal function calls**: Only run what's necessary
4. **Regex patterns**: Efficient for pattern matching

---

## Troubleshooting

### Issue: Infinite redirect loop

**Cause**: Route not in `PUBLIC_PATHS` but should be public

**Fix**: Add route to `PUBLIC_PATHS`

```typescript
const PUBLIC_PATHS = new Set([
  "/your-route", // Add this
]);
```

### Issue: Locale not preserved

**Cause**: Hard-coded locale in redirect

**Fix**: Use extracted locale

```typescript
// ❌ Wrong
url.pathname = "/en/signin";

// ✅ Correct
url.pathname = `/${locale}/signin`;
```

### Issue: Auth not working

**Cause**: Supabase auth cookie not being detected

**Fix**: Check cookie name matches pattern

```typescript
// Cookie should be: sb-{project-ref}-auth-token
// Pattern: /^sb-.*-auth-token\.*/
```

---

## Next.js Middleware Reference

### Matcher Pattern

```typescript
matcher: [
  "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)",
];
```

**What it matches**:

- All routes except:
  - `_next/static` (static files)
  - `_next/image` (image optimization)
  - `favicon.ico` (favicon)
  - Files with extensions (images, fonts, etc.)

### Request Object

```typescript
interface NextRequest {
  nextUrl: {
    pathname: string; // The path without query params
  };
  cookies: {
    get(name: string): Cookie | undefined;
    getAll(): Cookie[];
  };
}
```

### Response Object

```typescript
// Redirect
return NextResponse.redirect(url);

// Next (continue to next middleware/route)
return NextResponse.next();

// Rewrite (serve different route without redirect)
return NextResponse.rewrite(new URL("/other-route", request.url));
```

---

## FAQ

**Q: Why use deny-by-default instead of allow-by-default?**

A: Deny-by-default is more secure because new routes are automatically protected. You must deliberately make a route public, reducing the risk of accidental exposure.

**Q: How do I add a new public route?**

A: Add it to `PUBLIC_PATHS` in middleware.ts.

**Q: Do I need to update middleware for every new route?**

A: No! Only for public routes. Protected routes work automatically.

**Q: How does locale handling work?**

A: The middleware extracts the locale from the URL path and preserves it in redirects.

**Q: What about API routes?**

A: Public API routes should be in `PUBLIC_PATHS`. Protected API routes handle their own auth.

**Q: Can I use this with other auth providers?**

A: Yes, but you'll need to update the `hasValidSession()` function to check for your auth cookies.

---

## Version History

- **2.0.0** (2025-01-17): Major update with enhanced security, flexible auth, and route group support
- **1.0.0** (Previous): Initial implementation

---

## Related Files

- `MIDDLEWARE_UPDATE_SUMMARY.md` - Detailed update summary
- `MIDDLEWARE_ARCHITECTURE.md` - Architecture documentation
- `MIDDLEWARE_TEST_PLAN.md` - Comprehensive test plan

---

**Last Updated**: 2025-01-17
**Version**: 2.0.0
