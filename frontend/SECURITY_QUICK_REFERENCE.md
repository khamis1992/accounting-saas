# 🔐 Security Quick Reference for Developers

**Last Updated:** 2025-01-17
**Status:** All Critical Vulnerabilities Fixed ✅

---

## ⚡ QUICK SECURITY RULES

### DO's ✅

- ✅ Use Supabase httpOnly cookies for auth (NO localStorage)
- ✅ Check permissions before rendering protected UI
- ✅ Validate all redirect URLs against whitelist
- ✅ Use strong password validation
- ✅ Display passwords in secure modal only
- ✅ Include `credentials: 'include'` in fetch requests

### DON'Ts ❌

- ❌ NEVER store tokens in localStorage
- ❌ NEVER show passwords in toasts/logs
- ❌ NEVER redirect without validation
- ❌ NEVER assume user is authorized
- ❌ NEVER use weak password requirements
- ❌ NEVER trust user input (validate everything)

---

## 🚨 CRITICAL SECURITY RULES

### 1. TOKEN STORAGE (XSS Prevention)

```typescript
// ❌ WRONG - VULNERABLE TO XSS
localStorage.setItem("access_token", token);
const token = localStorage.getItem("access_token");

// ✅ CORRECT - SECURE
// Tokens stored in httpOnly cookies by Supabase
// Use Supabase client for auth
import { createClient } from "@/lib/supabase/browser-client";
const supabase = createClient();
const { data } = await supabase.auth.getSession();
```

**WHY:** localStorage is accessible to JavaScript, making it vulnerable to XSS attacks. httpOnly cookies cannot be accessed by JavaScript.

---

### 2. PERMISSION CHECKS (Access Control)

```typescript
// ❌ WRONG - NO PERMISSION CHECK
function UsersPage() {
  return <div>All users...</div>;
}

// ✅ CORRECT - WITH PERMISSION CHECK
import { usePermissions } from '@/hooks/use-permissions';

function UsersPage() {
  const { hasPermission, loading } = usePermissions();

  if (!loading && !hasPermission('users.view')) {
    return <AccessDenied />;
  }

  return <div>All users...</div>;
}
```

**WHY:** Prevents unauthorized access to sensitive pages and features.

---

### 3. PASSWORD DISPLAY (Credential Protection)

```typescript
// ❌ WRONG - PASSWORD IN TOAST
toast.success(`User created! Password: ${tempPassword}`);

// ✅ CORRECT - SECURE MODAL
import { SecurePasswordModal } from "@/components/secure-password-modal";

toast.success("User created successfully");
showSecureModal(tempPassword);
```

**WHY:** Passwords in toasts are visible on screen, logged, and can be seen by anyone nearby.

---

### 4. URL VALIDATION (Open Redirect Prevention)

```typescript
// ❌ WRONG - UNVALIDATED REDIRECT
window.location.href = redirectUrl;

// ✅ CORRECT - VALIDATED REDIRECT
import { sanitizeRedirect } from "@/lib/utils/security";

const safeUrl = sanitizeRedirect(redirectUrl, "/dashboard");
window.location.href = safeUrl;
```

**WHY:** Prevents attackers from redirecting users to phishing sites.

---

### 5. PASSWORD VALIDATION (Brute Force Prevention)

```typescript
// ❌ WRONG - WEAK VALIDATION
if (password.length < 8) {
  return "Password too short";
}

// ✅ CORRECT - STRONG VALIDATION
import { validatePassword } from "@/lib/utils/security";

const result = validatePassword(password);
if (!result.isValid) {
  return result.errors.join(", ");
}
```

**WHY:** Prevents users from setting weak, easily guessable passwords.

---

## 📋 AVAILABLE PERMISSIONS

### User Management

- `users.view` - View user list
- `users.create` - Create new users
- `users.edit` - Edit user details
- `users.delete` - Delete users
- `users.activate` - Activate/deactivate users

### Role Management

- `roles.view` - View roles
- `roles.create` - Create roles
- `roles.edit` - Edit roles
- `roles.delete` - Delete roles

### Company Settings

- `company.view` - View company settings
- `company.edit` - Edit company settings

### Financial Data

- `accounting.view` - View accounting data
- `accounting.create` - Create accounting entries
- `accounting.edit` - Edit accounting entries
- `accounting.delete` - Delete accounting entries
- `accounting.approve` - Approve accounting entries

### Reports

- `reports.view` - View reports
- `reports.export` - Export reports

### Banking

- `banking.view` - View banking data
- `banking.create` - Create bank transactions
- `banking.edit` - Edit bank transactions
- `banking.delete` - Delete bank transactions

### Sales

- `sales.view` - View sales data
- `sales.create` - Create sales
- `sales.edit` - Edit sales
- `sales.delete` - Delete sales

### Purchases

- `purchases.view` - View purchases
- `purchases.create` - Create purchases
- `purchases.edit` - Edit purchases
- `purchases.delete` - Delete purchases

### Assets

- `assets.view` - View assets
- `assets.create` - Create assets
- `assets.edit` - Edit assets
- `assets.delete` - Delete assets

### Tax

- `tax.view` - View tax data
- `tax.create` - Create tax entries
- `tax.edit` - Edit tax entries
- `tax.delete` - Delete tax entries

### Settings

- `settings.view` - View settings
- `settings.edit` - Edit settings

---

## 🎭 USER ROLES

### Admin

**All Permissions** - Full system access

### Manager

**Most Permissions** - Cannot manage users/roles

### Accountant

**Accounting + Reports** - Can manage financial data and reports

### Viewer

**Read-Only** - Can view but not edit

### Employee

**Limited** - Basic access to sales/purchases

---

## 🔧 SECURITY UTILITIES

### URL Validation

```typescript
import { isValidRedirect, sanitizeRedirect } from "@/lib/utils/security";

// Check if URL is safe
if (isValidRedirect(url)) {
  // Use the URL
}

// Get safe URL (with fallback)
const safeUrl = sanitizeRedirect(url, "/dashboard");
```

### Password Validation

```typescript
import { validatePassword } from '@/lib/utils/security';

const result = validatePassword('MyP@ssw0rd');

// Result:
{
  isValid: true,
  strength: 'strong', // 'weak' | 'medium' | 'strong'
  errors: []
}
```

### Permission Checking

```typescript
import { usePermissions } from "@/hooks/use-permissions";

function MyComponent() {
  const { hasPermission, hasAllPermissions, hasAnyPermission } = usePermissions();

  // Single permission
  if (hasPermission("users.create")) {
    // Show create button
  }

  // Multiple permissions (all required)
  if (hasAllPermissions(["users.edit", "users.delete"])) {
    // Show advanced actions
  }

  // Multiple permissions (any required)
  if (hasAnyPermission(["sales.create", "purchases.create"])) {
    // Show create button
  }
}
```

### Permission-Based Components

```typescript
import { RequirePermission, RequireAll, RequireAny } from '@/hooks/use-permissions';

// Single permission
<RequirePermission permission="users.delete">
  <DeleteButton />
</RequirePermission>

// All permissions required
<RequireAll permissions={['users.edit', 'users.delete']}>
  <UserManagement />
</RequireAll>

// Any permission required
<RequireAny permissions={['sales.create', 'purchases.create']}>
  <CreateButton />
</RequireAny>
```

### Secure Password Modal

```typescript
import { SecurePasswordModal, useSecurePasswordModal } from '@/components/secure-password-modal';

function UserManagement() {
  const passwordModal = useSecurePasswordModal();

  const handleCreateUser = async () => {
    const result = await usersApi.inviteUser(data);

    // Show secure modal with password
    passwordModal.show(result.tempPassword, data.email);
  };

  return (
    <>
      <Button onClick={handleCreateUser}>Create User</Button>
      <SecurePasswordModal
        {...passwordModal.props}
        email={data.email}
        autoCloseAfterCopy={true}
      />
    </>
  );
}
```

---

## 🚨 COMMON SECURITY MISTAKES

### Mistake 1: Storing Sensitive Data in localStorage

```typescript
// ❌ WRONG
localStorage.setItem("user", JSON.stringify(user));
localStorage.setItem("token", token);

// ✅ CORRECT
// Use Supabase session
const { data } = await supabase.auth.getSession();
```

### Mistake 2: No Permission Checks

```typescript
// ❌ WRONG
function SettingsPage() {
  return <div>Settings...</div>;
}

// ✅ CORRECT
function SettingsPage() {
  const { hasPermission } = usePermissions();
  if (!hasPermission('settings.view')) {
    return <AccessDenied />;
  }
  return <div>Settings...</div>;
}
```

### Mistake 3: Exposing Sensitive Data

```typescript
// ❌ WRONG
console.log("User data:", user);
toast.success(`Password: ${password}`);

// ✅ CORRECT
// Never log sensitive data
toast.success("Operation successful");
```

### Mistake 4: Unvalidated Redirects

```typescript
// ❌ WRONG
router.push(returnUrl);

// ✅ CORRECT
import { sanitizeRedirect } from "@/lib/utils/security";
router.push(sanitizeRedirect(returnUrl, "/dashboard"));
```

### Mistake 5: Weak Password Requirements

```typescript
// ❌ WRONG
if (password.length >= 6) {
  // Accept password
}

// ✅ CORRECT
import { validatePassword } from "@/lib/utils/security";
const result = validatePassword(password);
if (result.isValid) {
  // Accept password
}
```

---

## 🧪 SECURITY TESTING CHECKLIST

### Before Committing Code

- [ ] No localStorage for tokens
- [ ] Permission checks implemented
- [ ] URLs validated before redirect
- [ ] Passwords not exposed in toasts/logs
- [ ] Password validation implemented
- [ ] User input sanitized
- [ ] No sensitive data in console.logs

### Testing Steps

1. **Token Security**
   - Open DevTools → Console
   - Run: `localStorage.getItem('access_token')`
   - Should return: `null`

2. **Access Control**
   - Login as different roles
   - Try to access restricted pages
   - Verify proper redirects/blocks

3. **URL Validation**
   - Try redirecting to external URLs
   - Try `javascript:` URLs
   - Verify all blocked

4. **Password Security**
   - Create new user
   - Verify password NOT in toast
   - Verify secure modal appears

---

## 📚 LEARN MORE

### OWASP Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

### Internal Documentation

- `SECURITY_FIXES_IMPLEMENTATION.md` - Complete implementation guide
- `SECURITY_AUDIT_COMPLETE_SUMMARY.md` - Executive summary
- Inline code comments - Security explanations

---

## 🆘 GETTING HELP

### Security Questions

- Check: `SECURITY_FIXES_IMPLEMENTATION.md`
- Review: Inline code comments
- Contact: security@example.com

### Common Issues

**Issue:** "Permission check not working"

- **Solution:** Ensure role is set in user_metadata or app_metadata
- **Check:** `user.user_metadata.role` or `user.app_metadata.role`

**Issue:** "Tokens not working"

- **Solution:** Ensure using Supabase client, not localStorage
- **Check:** No `localStorage.getItem('access_token')` in code

**Issue:** "Redirect blocked"

- **Solution:** Add URL to whitelist in `security.ts`
- **Check:** `ALLOWED_REDIRECT_PATHS` set

---

## ✅ SECURITY CHECKLIST FOR NEW FEATURES

When building new features, ensure:

- [ ] No localStorage for auth tokens
- [ ] Permission checks implemented
- [ ] URLs validated before redirect
- [ ] Passwords handled securely
- [ ] User input validated
- [ ] No sensitive data in logs
- [ ] Error messages don't leak info
- [ ] Proper error handling
- [ ] Security tests written
- [ ] Documentation updated

---

**Remember:** Security is everyone's responsibility. When in doubt, ask the security team!

**Last Updated:** 2025-01-17
**Version:** 1.0.0
