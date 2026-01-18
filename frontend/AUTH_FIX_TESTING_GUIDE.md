# Quick Testing Guide - Authentication Fix

## Test the Fix in 5 Minutes

### Step 1: Start the Dev Server

```bash
cd frontend
npm run dev
```

Wait for the server to start (usually 5-10 seconds).

---

### Step 2: Open Browser

Navigate to: `http://localhost:3000/en/dashboard`

**Expected Result**: You should be redirected to `http://localhost:3000/en/signin`

**If you see 404**: Something is wrong. Check the troubleshooting section below.

---

### Step 3: Test Signin Page

You should see:

- A centered signin form
- Email field
- Password field
- "Sign In" button
- "Don't have an account? Sign up now" link
- "Forgot Password?" link

**If you see the form**: ✓ The fix is working!

---

### Step 4: Test Sign In (Optional)

If you have test credentials:

1. Enter your email
2. Enter your password
3. Click "Sign In"

**Expected Result**: Redirect to `/en/dashboard`

---

### Step 5: Test Landing Page Links

1. Navigate to: `http://localhost:3000/en`
2. Click "Sign In" button
3. **Expected**: Navigate to `/en/signin`
4. Go back to landing page
5. Click "Sign Up" button
6. **Expected**: Navigate to `/en/signup`

---

### Step 6: Test Sign Out (Optional)

If you're signed in:

1. Click user menu in sidebar (bottom-left)
2. Click "Sign Out"
3. **Expected**: Redirect to `/en/signin`

---

## Quick Checks

### ✓ Signin Page Exists

```bash
# Run this command:
ls frontend/app/[locale]/\(auth\)/signin/page.tsx

# Expected output: file exists
```

### ✓ Build Passes

```bash
# Run this command:
cd frontend && npm run build

# Expected: Build succeeds with no errors
# Look for: /ƒ /[locale]/signin in the route list
```

### ✓ No 404s

- Visit `/en/signin` → Should see signin form (not 404)
- Visit `/ar/signin` → Should see signin form in Arabic (not 404)

---

## Troubleshooting

### Problem: Still seeing 404

**Solution 1**: Restart the dev server

```bash
# Press Ctrl+C to stop
# Then restart:
npm run dev
```

**Solution 2**: Clear browser cache

- Press Ctrl+Shift+Delete
- Clear cache for localhost
- Refresh the page

**Solution 3**: Check the files exist

```bash
ls -la frontend/app/[locale]/\(auth\)/signin/
ls -la frontend/app/[locale]/\(auth\)/signup/
```

---

### Problem: "useAuth must be used within an AuthProvider"

**Solution**: Check that AuthProvider is in your root layout.

File: `app/[locale]/layout.tsx`

Should contain:

```tsx
import { AuthProvider } from "@/contexts/auth-context";

export default function LocaleLayout({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
```

---

### Problem: Redirect loops

**Symptoms**: Browser keeps reloading, never shows signin page

**Solution 1**: Clear cookies

- Open DevTools (F12)
- Go to Application → Cookies
- Delete all cookies for localhost

**Solution 2**: Check you're on the right URL

- Make sure you're visiting `/en/signin` (not `/en/auth/signin`)

---

## Success Indicators

You'll know the fix is working when:

✅ Visiting `/en/dashboard` redirects to `/en/signin` (not 404)
✅ Signin page displays the form
✅ No console errors (F12 → Console tab)
✅ Can click between signin and signup pages
✅ Landing page "Sign In" button goes to `/en/signin`
✅ Build output shows `/ƒ /[locale]/signin` route

---

## Test Credentials (if available)

Ask your team for test credentials, or create a new user:

1. Visit `/en/signup`
2. Fill in the form
3. Submit
4. Check your email for confirmation link

---

## What to Report

If something doesn't work, report:

1. **What you did**: "I visited /en/dashboard"
2. **What happened**: "I got a 404 error"
3. **What you expected**: "Should redirect to /en/signin"
4. **Console errors**: Open DevTools (F12) → Console tab → Copy any red errors
5. **Screenshot**: If possible

---

**Need Help?**

Check the full summary: `AUTH_FIX_SUMMARY.md`

---

**Quick Reference**

| Page      | URL             | Purpose                  |
| --------- | --------------- | ------------------------ |
| Signin    | `/en/signin`    | User authentication      |
| Signup    | `/en/signup`    | User registration        |
| Dashboard | `/en/dashboard` | Main app (requires auth) |
| Landing   | `/en`           | Home page                |

---

**Last Updated**: 2025-01-17
**Status**: Ready for Testing
