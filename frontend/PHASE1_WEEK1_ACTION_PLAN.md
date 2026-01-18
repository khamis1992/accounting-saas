# Phase 1, Week 1 - Action Plan

## Current Status: 🔴 BLOCKED

The application **cannot be used** because users cannot sign in. This is a critical blocker that must be resolved immediately.

---

## What's Broken

### The Problem in Plain English

1. You try to visit any protected page (like `/dashboard`)
2. The middleware says "Hey, you're not signed in!"
3. It tries to redirect you to `/signin`
4. **But `/signin` doesn't exist** → 404 error
5. You're stuck. Cannot use the app.

### Why It's Broken

The route groups were created:

- ✅ `(marketing)` - for public pages
- ✅ `(auth)` - for signin/signup pages
- ✅ `(app)` - for protected pages

BUT the actual signin/signup pages were **never created** in the `(auth)` folder.

---

## The Fix (Step-by-Step)

### Part 1: Create the Signin Page

**Create this file**: `frontend/app/[locale]/(auth)/signin/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

export default function SignInPage() {
  const t = useTranslations('auth');
  const { signIn, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await signIn(email, password);
      // Redirect is handled by signIn function
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    }
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-lg shadow-md p-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {t('signIn')}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
          Welcome back to {t('common.appName')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            {t('email')}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="your@email.com"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            {t('password')}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
            required
            disabled={loading}
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
              {t('rememberMe')}
            </span>
          </label>

          <Link href={`/${locale}/forgot-password`} className="text-sm text-blue-600 hover:text-blue-500">
            {t('forgotPassword')}
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? t('loading') : t('signIn')}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">
          {t('dontHaveAccount')}
        </span>
        <Link href={`/${locale}/signup`} className="ml-1 text-blue-600 hover:text-blue-500 font-medium">
          {t('signUpNow')}
        </Link>
      </div>
    </div>
  );
}
```

### Part 2: Fix Route References

**File 1**: `frontend/components/layout/authenticated-layout.tsx`

Change line 19 from:

```typescript
router.push(`/${locale}/auth/signin`);
```

To:

```typescript
router.push(`/${locale}/signin`);
```

---

**File 2**: `frontend/contexts/auth-context.tsx`

Change line 185 from:

```typescript
router.push("/en/auth/signin");
```

To:

```typescript
const locale = window.location.pathname.split("/")[1] || "en";
router.push(`/${locale}/signin`);
```

---

**File 3**: `frontend/app/[locale]/(marketing)/page.tsx`

Find the line with:

```typescript
<Link href="/auth/signin">
```

Change it to:

```typescript
<Link href="/en/signin">
```

**NOTE**: This is a temporary fix. The proper solution is to use the `useLocale()` hook, but the marketing page might be a server component. For now, hardcoding `/en/signin` is acceptable since English is the default locale.

---

### Part 3: Verify Directory Structure

After creating the signin page, your directory structure should look like this:

```
frontend/app/[locale]/
├── (app)/
│   ├── accounting/
│   ├── dashboard/
│   ├── purchases/
│   ├── sales/
│   └── settings/
├── (auth)/
│   ├── layout.tsx           ✅ Already exists
│   ├── signin/              ✅ YOU WILL CREATE THIS
│   │   └── page.tsx
│   └── signup/              ⚠️ Optional but recommended
│       └── page.tsx
└── (marketing)/
    ├── layout.tsx
    └── page.tsx
```

---

## Test the Fix

After applying all fixes above:

1. **Start the dev server** (if not already running):

   ```bash
   cd frontend
   npm run dev
   ```

2. **Test 1: Visit protected route while signed out**
   - Go to: http://localhost:3000/en/dashboard
   - Expected: Redirect to http://localhost:3000/en/signin
   - Expected: Signin page loads (NOT 404)
   - ✅ PASS → Fix is working

3. **Test 2: Sign in with valid credentials**
   - Use the signin form
   - Email: `admin@demo-company.qa` (or your test email)
   - Password: `admin123` (or your test password)
   - Click "Sign In"
   - Expected: Redirect to dashboard
   - Expected: Dashboard loads successfully
   - ✅ PASS → Authentication works

4. **Test 3: Sign out**
   - Click user menu in bottom-left of sidebar
   - Click "Sign Out"
   - Expected: Redirect to `/en/signin`
   - Expected: Signin page loads
   - ✅ PASS → Sign out works

5. **Test 4: No redirect loops**
   - Visit `/en/signin` while signed out
   - Expected: Page loads, stays on signin page
   - Expected: No infinite redirects
   - ✅ PASS → No loop

---

## Quick Verification Commands

Run these commands to verify the fixes:

```bash
# Check that signin page exists
ls -la frontend/app/[locale]/\(auth\)/signin/

# Expected output:
# total 1
# drwxr-xr-x 1 user group 0 Jan 17 16:00 .
# drwxr-xr-x 1 user group 0 Jan 17 16:00 ..
# -rw-r-r- 1 user group 5000 Jan 17 16:00 page.tsx

# Check for any remaining /auth/signin references
cd frontend
grep -r "auth/signin" app/ components/ contexts/

# Expected: Should return NOTHING (all fixed)

# Verify middleware is correct
grep "signin" middleware.ts

# Expected output:
# '/signin',
# '/signin',
# const redirectUrl = new URL(`/${locale}/signin`, request.url);
```

---

## If You Get Errors

### Error: "useAuth must be used within an AuthProvider"

**Solution**: The signin page uses `useAuth()` which requires the AuthProvider. Make sure your root layout includes the AuthProvider.

Check: `frontend/app/[locale]/layout.tsx`

It should wrap children with:

```typescript
<AuthProvider>
  {children}
</AuthProvider>
```

---

### Error: "Module not found: Can't resolve '@/contexts/auth-context'"

**Solution**: Make sure the import path is correct. The file exists at:
`frontend/contexts/auth-context.tsx`

The import should be:

```typescript
import { useAuth } from "@/contexts/auth-context";
```

---

### Error: Page still shows 404

**Solution**: Check these things:

1. **File exists?**

   ```bash
   ls frontend/app/[locale]/\(auth\)/signin/page.tsx
   ```

2. **Restart dev server**
   - Stop the server (Ctrl+C)
   - Start it again: `npm run dev`
   - Next.js sometimes needs a restart to pick up new routes

3. **Check for typos**
   - Make sure directory is `(auth)` not `(auth)` with special characters
   - Make sure file is `page.tsx` not `Page.tsx` or `page.ts`

---

## After the Fix Works

Once signin is working:

1. ✅ Celebrate! You've fixed the critical blocker
2. ✅ Re-run the full test suite (35 tests)
3. ✅ Update the test report
4. ✅ **THEN** you can proceed to Phase 2

---

## Summary

**What was broken**:

- Signin page didn't exist
- Route references pointed to wrong paths
- Users couldn't authenticate

**What you need to do**:

1. Create `app/[locale]/(auth)/signin/page.tsx` (use the code above)
2. Fix 3 route references (authenticated-layout, auth-context, marketing page)
3. Test the signin flow

**Time required**: 30-60 minutes

**Result**: Working authentication, can proceed to Phase 2

---

**Need Help?**

If you're stuck after applying these fixes:

1. Check the browser console (F12) for error messages
2. Check the terminal for build errors
3. Verify all file paths are correct
4. Make sure the dev server is running
5. Try clearing your browser cache

---

**Version**: 1.0
**Last Updated**: 2025-01-17
**Status**: Awaiting implementation
