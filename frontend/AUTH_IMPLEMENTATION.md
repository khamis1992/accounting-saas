# Frontend Authentication Flow Implementation

## Overview

Complete frontend authentication system for the المحاسب accounting platform, implementing tasks FRONTEND-1.3 through FRONTEND-1.7.

## Architecture

### Components

1. **API Client** (`lib/api/client.ts`)
   - Base URL: `http://localhost:3000/api`
   - Automatic token management
   - Token refresh on 401 responses
   - Typed fetch wrapper
   - Session persistence in localStorage

2. **Auth Context** (`contexts/auth-context.tsx`)
   - React Context for auth state management
   - User and tenant context
   - Auto-refresh tokens before expiry (55 minutes)
   - Protected route redirection
   - Session persistence across page reloads

3. **Sign-Up Page** (`app/[locale]/auth/signup/page.tsx`)
   - Company Name (English + Arabic)
   - Email with validation
   - Password with strength indicator
   - Confirm password with real-time matching
   - Calls `createTenantWithAdmin` API
   - Redirects to dashboard on success

4. **Sign-In Page** (`app/[locale]/auth/signin/page.tsx`)
   - Email and password fields
   - "Remember me" checkbox
   - "Forgot password" link
   - Inline error display
   - Loading states
   - Calls `/auth/sign-in` API

5. **Middleware** (`middleware.ts`)
   - Authentication check via cookies
   - Public route allow-list
   - Locale-aware routing
   - Automatic redirects based on auth state

## Files Created/Modified

### Created Files

1. `C:\Users\khamis\Desktop\المحاسب\frontend\lib\api\client.ts`
   - API client base implementation
   - Token management
   - Request/response interceptors
   - Type definitions

2. `C:\Users\khamis\Desktop\المحاسب\frontend\contexts\auth-context.tsx`
   - AuthProvider component
   - useAuth hook
   - State management
   - Auto-refresh logic

### Modified Files

1. `C:\Users\khamis\Desktop\المحاسب\frontend\app\[locale]\auth\signup\page.tsx`
   - Updated to use new auth context
   - Added company name fields (EN/AR)
   - Password strength indicator
   - Real-time validation

2. `C:\Users\khamis\Desktop\المحاسب\frontend\app\[locale]\auth\signin\page.tsx`
   - Updated to use new auth context
   - Added "Remember me" checkbox
   - Added "Forgot password" link
   - Improved error handling

3. `C:\Users\khamis\Desktop\المحاسب\frontend\middleware.ts`
   - Added authentication checks
   - Protected route logic
   - Public route allow-list

4. `C:\Users\khamis\Desktop\المحاسب\frontend\app\[locale]\layout.tsx`
   - Changed import from `@/lib/supabase/auth-provider` to `@/contexts/auth-context`

5. `C:\Users\khamis\Desktop\المحاسب\frontend\.env.local`
   - Added `NEXT_PUBLIC_API_URL=http://localhost:3000/api`

## API Integration

### Endpoints Used

#### Sign In

```
POST /api/auth/sign-in
Body: { email, password }
Response: { user, session }
```

#### Sign Up (Existing Tenant)

```
POST /api/auth/sign-up
Body: { email, password, tenantId }
Response: { user }
```

#### Create Tenant with Admin (Public Signup)

```
POST /api/tenants/create-with-admin
Body: { name, nameAr, email, password }
Response: { user, tenant, session }
```

#### Refresh Token

```
POST /api/auth/refresh-token
Body: { refreshToken }
Response: { session }
```

#### Sign Out

```
POST /api/auth/sign-out
Headers: Authorization: Bearer {token}
Response: { message }
```

#### Reset Password

```
POST /api/auth/reset-password
Body: { email }
Response: { success }
```

## Features

### Sign-Up Page (FRONTEND-1.3)

- [x] Company Name (English) field
- [x] Company Name (Arabic) field with RTL support
- [x] Email field with format validation
- [x] Password field with strength indicator (5 levels)
- [x] Confirm password with real-time matching
- [x] Loading state during submission
- [x] Inline error display
- [x] Success toast and redirect to dashboard
- [x] Bilingual support (English/Arabic)
- [x] Responsive design
- [x] Integration with `createTenantWithAdmin` API

### Sign-In Page (FRONTEND-1.4)

- [x] Email field with validation
- [x] Password field
- [x] "Remember me" checkbox
- [x] "Forgot password" link
- [x] Loading states during submission
- [x] Inline error display
- [x] Bilingual support
- [x] Integration with `/auth/sign-in` API
- [x] Success redirect to dashboard

### Auth Context (FRONTEND-1.5)

- [x] AuthProvider component wrapping app
- [x] State: user, tenant, accessToken
- [x] Methods: signIn(), signUp(), createTenantWithAdmin(), signOut()
- [x] Auto-refresh token before expiry (55 minutes)
- [x] Redirect to signin if not authenticated
- [x] Persist session across page reloads (localStorage)
- [x] Clear session on sign out

### Protected Route Middleware (FRONTEND-1.6)

- [x] Check for valid session via cookies
- [x] Redirect to signin if not authenticated
- [x] Store tenant context for API calls
- [x] Allow public routes (signin, signup, landing)
- [x] Work with locale routing
- [x] Redirect authenticated users away from auth pages

### API Client Base (FRONTEND-1.7)

- [x] Base URL: `http://localhost:3000/api`
- [x] Automatically add Authorization header
- [x] Handle token refresh on 401
- [x] Handle 401 responses (redirect to signin)
- [x] Handle network errors
- [x] Typed fetch wrapper
- [x] Token persistence in localStorage

## Usage Examples

### Using the Auth Context

```typescript
'use client';

import { useAuth } from '@/contexts/auth-context';

export default function MyComponent() {
  const { user, tenant, isAuthenticated, signIn, signOut } = useAuth();

  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }

  return (
    <div>
      <p>Welcome, {user?.email}</p>
      <p>Tenant: {tenant?.id}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Making API Calls

```typescript
import { apiClient } from "@/lib/api/client";

// Get request
const data = await apiClient.get("/users");

// Post request
const result = await apiClient.post("/invoices", {
  customerId: "xxx",
  amount: 1000,
});

// Authenticated request (token added automatically)
const profile = await apiClient.get("/auth/verify");
```

## Security Considerations

1. **Token Storage**: Tokens are stored in localStorage (for development). Consider httpOnly cookies for production.

2. **Token Refresh**: Automatic refresh happens 55 minutes before expiry to prevent session interruption.

3. **Protected Routes**: Middleware checks authentication on every navigation.

4. **Password Strength**: Visual indicator shows password strength in real-time.

5. **Error Handling**: All API errors are caught and displayed to the user.

## Localization

All text supports both English and Arabic:

- Uses `next-intl` for translations
- RTL support for Arabic
- Locale-aware routing (`/en/...`, `/ar/...`)

## Accessibility

- Semantic HTML elements
- ARIA labels where appropriate
- Keyboard navigation support
- Focus management
- Error announcements via toast notifications

## Testing Checklist

### Sign-Up Flow

- [ ] Fill in company name (EN)
- [ ] Fill in company name (AR)
- [ ] Enter valid email
- [ ] Enter weak password (see warning)
- [ ] Enter strong password (see indicator)
- [ ] Confirm password mismatch (see error)
- [ ] Confirm password match (see success)
- [ ] Submit form (see loading)
- [ ] Verify redirect to dashboard
- [ ] Verify localStorage has tokens

### Sign-In Flow

- [ ] Enter invalid email (see error)
- [ ] Enter wrong password (see error)
- [ ] Enter valid credentials
- [ ] Check "Remember me"
- [ ] Submit (see loading)
- [ ] Verify redirect to dashboard
- [ ] Verify session persistence on reload

### Protected Routes

- [ ] Access dashboard without auth (should redirect)
- [ ] Access dashboard with auth (should load)
- [ ] Sign out (clears session)
- [ ] Try to access protected route after sign out (should redirect)

## Next Steps

### Backend Requirements

The following backend endpoints need to be implemented:

1. **POST `/api/tenants/create-with-admin`**
   - Create tenant with admin user in one transaction
   - Return: `{ user, tenant, session }`

2. **Verify CORS Configuration**
   - Ensure backend allows requests from frontend origin
   - Check credentials: true configuration

3. **Token Expiry Configuration**
   - Ensure backend tokens expire after 1 hour
   - Verify refresh token endpoint works correctly

### Future Enhancements

1. **Social Login**: Google, Microsoft, Apple
2. **Two-Factor Authentication**: SMS/TOTP
3. **Email Verification**: Confirm email before activation
4. **Password Reset Flow**: Complete forgot password implementation
5. **Session Management**: View active sessions, revoke sessions
6. **Remember Me**: Extended sessions (30 days vs 1 hour)

## Troubleshooting

### "Failed to fetch" errors

- Check backend is running on port 3000
- Verify CORS configuration in backend
- Check browser console for CORS errors

### Token not refreshing

- Check localStorage for tokens
- Verify refresh token endpoint
- Check browser console for errors

### Middleware redirect loops

- Verify cookie names match (access_token)
- Check public paths list
- Verify locale prefixes are handled

### RTL issues in Arabic

- Verify `dir="rtl"` is set on html element
- Check Tailwind RTL classes (`space-x-reverse`)
- Test form layout in Arabic

## Files Summary

### Created

- `C:\Users\khamis\Desktop\المحاسب\frontend\lib\api\client.ts`
- `C:\Users\khamis\Desktop\المحاسب\frontend\contexts\auth-context.tsx`

### Modified

- `C:\Users\khamis\Desktop\المحاسب\frontend\app\[locale]\auth\signup\page.tsx`
- `C:\Users\khamis\Desktop\المحاسب\frontend\app\[locale]\auth\signin\page.tsx`
- `C:\Users\khamis\Desktop\المحاسب\frontend\middleware.ts`
- `C:\Users\khamis\Desktop\المحاسب\frontend\app\[locale]\layout.tsx`
- `C:\Users\khamis\Desktop\المحاسب\frontend\.env.local`

## Configuration

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Package Dependencies

Required packages (already installed):

- `next-intl` - Internationalization
- `sonner` - Toast notifications
- `@radix-ui/react-checkbox` - Checkbox component
- `react` - React library
- `next` - Next.js framework

## Implementation Status

| Task         | Status      | Notes                          |
| ------------ | ----------- | ------------------------------ |
| FRONTEND-1.3 | ✅ Complete | Sign-up page with all fields   |
| FRONTEND-1.4 | ✅ Complete | Sign-in page with remember me  |
| FRONTEND-1.5 | ✅ Complete | Auth context with auto-refresh |
| FRONTEND-1.6 | ✅ Complete | Protected route middleware     |
| FRONTEND-1.7 | ✅ Complete | API client base                |

All frontend authentication tasks have been implemented successfully.
