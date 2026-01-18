# Middleware Test Plan

**File**: `frontend/middleware.ts`
**Version**: 2.0.0
**Last Updated**: 2025-01-17
**Status**: Ready for Testing

---

## Overview

This document provides comprehensive test cases for the updated Next.js middleware that handles authentication, route protection, and locale management for the new route group structure.

---

## Test Environment Setup

### Prerequisites

1. **Development server running**:

   ```bash
   cd frontend
   npm run dev
   ```

2. **Test browser**:
   - Clear all cookies before starting
   - Use browser DevTools (Application > Cookies) to inspect Supabase auth cookies

3. **Test accounts**:
   - Have a valid test user account ready
   - Know the signin credentials

---

## Test Cases

### Category 1: Unauthenticated User Access

#### TC-UNAUTH-001: Access Protected Route (Dashboard)

**Priority**: HIGH

**Steps**:

1. Clear all cookies
2. Navigate to: `http://localhost:3001/en/dashboard`

**Expected Result**:

- Redirect to: `http://localhost:3001/en/signin?redirect=%2Fen%2Fdashboard`
- No access to dashboard
- Locale preserved (en)

**Status**: ☐ PASS ☐ FAIL

---

#### TC-UNAUTH-002: Access Protected Route (Accounting)

**Priority**: HIGH

**Steps**:

1. Clear all cookies
2. Navigate to: `http://localhost:3001/ar/accounting/coa`

**Expected Result**:

- Redirect to: `http://localhost:3001/ar/signin?redirect=%2Far%2Faccounting%2Fcoa`
- No access to accounting pages
- Locale preserved (ar)

**Status**: ☐ PASS ☐ FAIL

---

#### TC-UNAUTH-003: Access Public Route (Signin)

**Priority**: HIGH

**Steps**:

1. Clear all cookies
2. Navigate to: `http://localhost:3001/en/signin`

**Expected Result**:

- No redirect
- Signin page displayed
- No console errors

**Status**: ☐ PASS ☐ FAIL

---

#### TC-UNAUTH-004: Access Public Route (Landing)

**Priority**: MEDIUM

**Steps**:

1. Clear all cookies
2. Navigate to: `http://localhost:3001/`

**Expected Result**:

- Redirect to: `http://localhost:3001/en/`
- Landing page displayed
- No authentication required

**Status**: ☐ PASS ☐ FAIL

---

#### TC-UNAUTH-005: Access Public API Route

**Priority**: MEDIUM

**Steps**:

1. Clear all cookies
2. Navigate to: `http://localhost:3001/api/auth/callback`

**Expected Result**:

- No redirect
- API route handles request
- No middleware blocking

**Status**: ☐ PASS ☐ FAIL

---

### Category 2: Authenticated User Access

#### TC-AUTH-001: Access Protected Route (Dashboard)

**Priority**: HIGH

**Steps**:

1. Sign in with valid credentials
2. Verify Supabase auth cookie exists
3. Navigate to: `http://localhost:3001/en/dashboard`

**Expected Result**:

- No redirect
- Dashboard displayed
- Access granted

**Status**: ☐ PASS ☐ FAIL

---

#### TC-AUTH-002: Access Protected Route (Accounting Journals)

**Priority**: HIGH

**Steps**:

1. Sign in with valid credentials
2. Navigate to: `http://localhost:3001/ar/accounting/journals`

**Expected Result**:

- No redirect
- Journals page displayed
- Access granted

**Status**: ☐ PASS ☐ FAIL

---

#### TC-AUTH-003: Access Signin Page While Authenticated

**Priority**: HIGH

**Steps**:

1. Sign in with valid credentials
2. Navigate to: `http://localhost:3001/en/signin`

**Expected Result**:

- Redirect to: `http://localhost:3001/en/dashboard`
- User redirected away from signin
- Locale preserved

**Status**: ☐ PASS ☐ FAIL

---

#### TC-AUTH-004: Access Signup Page While Authenticated

**Priority**: HIGH

**Steps**:

1. Sign in with valid credentials
2. Navigate to: `http://localhost:3001/ar/signup`

**Expected Result**:

- Redirect to: `http://localhost:3001/ar/dashboard`
- User redirected away from signup
- Locale preserved (ar)

**Status**: ☐ PASS ☐ FAIL

---

### Category 3: Locale Handling

#### TC-LOCALE-001: Default Locale Redirect

**Priority**: HIGH

**Steps**:

1. Clear all cookies
2. Navigate to: `http://localhost:3001/`

**Expected Result**:

- Redirect to: `http://localhost:3001/en/`
- Default locale applied

**Status**: ☐ PASS ☐ FAIL

---

#### TC-LOCALE-002: Arabic Locale Preserved in Redirect

**Priority**: HIGH

**Steps**:

1. Clear all cookies
2. Navigate to: `http://localhost:3001/ar/accounting/journals`

**Expected Result**:

- Redirect to: `http://localhost:3001/ar/signin?redirect=%2Far%2Faccounting%2Fjournals`
- Arabic locale preserved in redirect URL

**Status**: ☐ PASS ☐ FAIL

---

#### TC-LOCALE-003: English Locale Preserved in Redirect

**Priority**: HIGH

**Steps**:

1. Clear all cookies
2. Navigate to: `http://localhost:3001/en/sales/invoices`

**Expected Result**:

- Redirect to: `http://localhost:3001/en/signin?redirect=%2Fen%2Fsales%2Finvoices`
- English locale preserved

**Status**: ☐ PASS ☐ FAIL

---

#### TC-LOCALE-004: Authenticated User Locale Redirect

**Priority**: MEDIUM

**Steps**:

1. Sign in with valid credentials
2. Navigate to: `http://localhost:3001/ar`

**Expected Result**:

- Redirect to: `http://localhost:3001/ar/dashboard`
- Locale (ar) preserved

**Status**: ☐ PASS ☐ FAIL

---

### Category 4: Security Tests

#### TC-SEC-001: Prevent Authentication Bypass

**Priority**: CRITICAL

**Steps**:

1. Clear all cookies
2. Navigate to: `http://localhost:3001/en/settings/users`
3. Try to access the page

**Expected Result**:

- Redirect to signin
- No access to protected settings
- Cannot bypass authentication

**Status**: ☐ PASS ☐ FAIL

---

#### TC-SEC-002: Prevent Open Redirect

**Priority**: CRITICAL

**Steps**:

1. Clear all cookies
2. Navigate to: `http://localhost:3001/en/dashboard?redirect=https://evil.com`
3. Observe behavior

**Expected Result**:

- Redirect URL validated
- No redirect to external domain
- User stays on same origin

**Status**: ☐ PASS ☐ FAIL

---

#### TC-SEC-003: Wildcard Path Bypass Attempt

**Priority**: HIGH

**Steps**:

1. Clear all cookies
2. Try various path patterns:
   - `/en/dashboard/../signin`
   - `/en/%2e%2e/dashboard`
   - `/en//dashboard`

**Expected Result**:

- All paths properly normalized
- No bypass of authentication
- Proper redirect to signin

**Status**: ☐ PASS ☐ FAIL

---

#### TC-SEC-004: Static Files Access

**Priority**: MEDIUM

**Steps**:

1. Clear all cookies
2. Navigate to: `http://localhost:3001/favicon.ico`
3. Navigate to: `http://localhost:3001/_next/static/...`

**Expected Result**:

- Static files accessible
- No authentication required
- No redirects

**Status**: ☐ PASS ☐ FAIL

---

### Category 5: Edge Cases

#### TC-EDGE-001: Trailing Slash Handling

**Priority**: MEDIUM

**Steps**:

1. Clear all cookies
2. Navigate to: `http://localhost:3001/en/dashboard/`
3. Navigate to: `http://localhost:3001/en/signin/`

**Expected Result**:

- Trailing slash properly handled
- Correct behavior (redirect or access)

**Status**: ☐ PASS ☐ FAIL

---

#### TC-EDGE-002: Multiple Slashes

**Priority**: MEDIUM

**Steps**:

1. Clear all cookies
2. Navigate to: `http://localhost:3001/en//dashboard`

**Expected Result**:

- Path normalized
- Correct authentication check applied

**Status**: ☐ PASS ☐ FAIL

---

#### TC-EDGE-003: Case Sensitivity

**Priority**: LOW

**Steps**:

1. Clear all cookies
2. Navigate to: `http://localhost:3001/EN/Dashboard`

**Expected Result**:

- Path handled correctly
- Consistent behavior

**Status**: ☐ PASS ☐ FAIL

---

#### TC-EDGE-004: URL Encoding

**Priority**: MEDIUM

**Steps**:

1. Clear all cookies
2. Navigate to: `http://localhost:3001/en/accounting/journals?page=1&filter=test`

**Expected Result**:

- Query parameters preserved in redirect
- No encoding issues

**Status**: ☐ PASS ☐ FAIL

---

#### TC-EDGE-005: Missing Supabase Cookie

**Priority**: HIGH

**Steps**:

1. Sign in with valid credentials
2. Delete Supabase auth cookie via DevTools
3. Try to navigate to: `http://localhost:3001/en/dashboard`

**Expected Result**:

- Redirect to signin
- Session properly invalidated
- No access to protected routes

**Status**: ☐ PASS ☐ FAIL

---

### Category 6: Route Group Structure (Future)

#### TC-GROUP-001: Marketing Route Access

**Priority**: HIGH (after route group implementation)

**Steps**:

1. Clear all cookies
2. Navigate to: `http://localhost:3001/en/pricing`

**Expected Result**:

- No redirect
- Public access to marketing pages
- No authentication required

**Status**: ☐ PASS ☐ FAIL ☐ NOT IMPLEMENTED YET

---

#### TC-GROUP-002: App Route Protection

**Priority**: HIGH (after route group implementation)

**Steps**:

1. Clear all cookies
2. Navigate to: `http://localhost:3001/en/accounting/general-ledger`

**Expected Result**:

- Redirect to signin
- Protected route enforced
- No access without authentication

**Status**: ☐ PASS ☐ FAIL ☐ NOT IMPLEMENTED YET

---

## Test Execution Checklist

### Pre-Test Setup

- [ ] Development server running
- [ ] Database accessible
- [ ] Test account created
- [ ] Browser DevTools open
- [ ] Console cleared
- [ ] Network tab monitoring

### Test Execution

- [ ] All Category 1 tests completed (Unauthenticated)
- [ ] All Category 2 tests completed (Authenticated)
- [ ] All Category 3 tests completed (Locale)
- [ ] All Category 4 tests completed (Security)
- [ ] All Category 5 tests completed (Edge Cases)
- [ ] Category 6 tests marked for future implementation

### Post-Test

- [ ] All critical tests passed
- [ ] All high-priority tests passed
- [ ] No console errors during testing
- [ ] No unexpected redirects
- [ ] Performance acceptable (< 100ms for middleware)

---

## Known Limitations

1. **Route Groups Not Yet Implemented**:
   - TC-GROUP-001 and TC-GROUP-002 cannot be tested yet
   - Current structure uses flat routing under `[locale]`
   - Will be tested after route group migration

2. **Cookie-Based Auth Only**:
   - Middleware checks for Supabase auth cookie
   - Does not validate session with backend
   - Relies on Supabase client-side validation

3. **No Role-Based Access Control**:
   - Middleware only checks authentication
   - Does not check user roles/permissions
   - RBAC handled at API/Component level

---

## Security Checklist

- [x] Deny-by-default approach (all routes require auth unless public)
- [x] No wildcard patterns that could bypass auth
- [x] Open redirect prevention (redirect URL validated)
- [x] External redirects blocked
- [x] Locale handling doesn't break security
- [x] Edge cases handled (trailing slashes, encoding, etc.)
- [x] Session validation on each request
- [x] Static files excluded from auth checks

---

## Performance Metrics

Record middleware execution time for each test:

| Test Case     | Execution Time | Notes                    |
| ------------- | -------------- | ------------------------ |
| TC-UNAUTH-001 | \_\_\_ ms      | Redirect to signin       |
| TC-UNAUTH-002 | \_\_\_ ms      | Protected route redirect |
| TC-AUTH-001   | \_\_\_ ms      | Authenticated access     |
| TC-SEC-001    | \_\_\_ ms      | Security check           |
| TC-LOCALE-001 | \_\_\_ ms      | Locale redirect          |

**Target**: < 50ms for all middleware operations

---

## Bug Report Template

If a test fails, document using this template:

```markdown
### Bug Report: [Test Case ID]

**Test Case**: TC-XXX-YYY
**Priority**: CRITICAL/HIGH/MEDIUM/LOW
**Status**: FAIL

**Steps to Reproduce**:

1.
2.
3.

## **Expected Result**:

-
- **Actual Result**:

-
-
- **Screenshots/Logs**:
```

(Paste console errors or network logs)

```

**Environment**:
- Browser: Chrome/Firefox/Safari
- OS: Windows/Mac/Linux
- Node Version:
- Next.js Version:

**Severity**: Blocker / Major / Minor / Trivial
```

---

## Success Criteria

All tests must meet these criteria to be considered successful:

✅ **Must Have**:

- All CRITICAL priority tests pass
- All HIGH priority tests pass
- Zero security vulnerabilities
- No authentication bypass possible
- No open redirect vulnerabilities

✅ **Should Have**:

- All MEDIUM priority tests pass
- Middleware executes in < 50ms
- No console errors
- Proper locale preservation

✅ **Nice to Have**:

- All LOW priority tests pass
- Middleware executes in < 25ms
- Detailed logging for debugging

---

## Sign-Off

**Tester**: ******\_\_\_******
**Date**: ******\_\_\_******
**Test Environment**: Dev / Staging / Production
**Overall Result**: PASS / FAIL
**Notes**: **********\_\_\_**********

---

## Appendix: Testing Commands

### Manual Testing Commands

```bash
# Start development server
cd frontend
npm run dev

# Build for production testing
npm run build
npm start

# Type check (ensure no TypeScript errors)
npm run type-check

# Lint check
npm run lint
```

### Browser DevTools

1. **Open DevTools**: F12 or Ctrl+Shift+I
2. **Application Tab**: Check cookies
3. **Network Tab**: Monitor redirects
4. **Console Tab**: Check for errors
5. **Sources Tab**: Debug middleware (add debugger statements)

### Curl Testing (Advanced)

```bash
# Test unauthenticated access
curl -I http://localhost:3001/en/dashboard

# Test with authentication cookie
curl -I --cookie "sb-gbbmicjucestjpxtkjyp-auth-token=YOUR_TOKEN" http://localhost:3001/en/dashboard

# Test redirect following
curl -L -v http://localhost:3001/en/accounting/journals
```

---

**Document Version**: 1.0.0
**Last Updated**: 2025-01-17
**Maintained By**: Development Team
