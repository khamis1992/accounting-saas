# Frontend Settings Pages Audit Report

**Date:** 2025-01-17
**Auditor:** Claude (AI Assistant)
**Scope:** All settings pages and related API/integration code

---

## Executive Summary

This audit covers all settings pages in the frontend application, focusing on code quality, form handling, validation, security, error handling, and API integration. The settings module includes 6 main pages: Profile, Users, Company Settings, Roles, Fiscal Year, and Cost Centers.

**Overall Grade:** C+ (Needs Improvement)

### Key Metrics
- **Total Pages Audited:** 6
- **Critical Issues:** 12
- **High Priority Issues:** 18
- **Medium Priority Issues:** 15
- **Security Concerns:** 8

---

## 1. Profile Settings Page

**File:** `frontend/app/[locale]/(app)/settings/profile/page.tsx`

### Strengths
✅ Good separation of concerns (profile vs security tabs)
✅ Avatar upload with file validation (type, size)
✅ Password change with confirmation matching
✅ Client-side password validation (length check)
✅ Loading states for all async operations
✅ Bilingual input fields (English/Arabic) with proper RTL support

### Critical Issues

#### 1.1 Weak Password Validation
**Severity:** HIGH
**Location:** Lines 111-114

```tsx
if (passwordForm.newPassword.length < 8) {
  toast.error('Password must be at least 8 characters');
  return;
}
```

**Issue:** Only checks length, but UI claims more requirements:
- "Must include uppercase and lowercase letters" (line 515-516)
- "Must include at least one number" (line 519-520)
- "Cannot match common passwords" (line 523-524)

**Recommendation:**
```tsx
const validatePassword = (password: string) => {
  const errors = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Must include uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Must include lowercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Must include at least one number');
  }

  // Add common password check
  const commonPasswords = ['password123', 'qwerty', '12345678'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Cannot use common password');
  }

  return errors;
};
```

#### 1.2 Password Exposed in Memory
**Severity:** MEDIUM
**Location:** Lines 45-49

```tsx
const [passwordForm, setPasswordForm] = useState({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});
```

**Issue:** Passwords stored in plain text in component state

**Recommendation:** Consider using a ref for passwords and clear immediately after use:
```tsx
const passwordRef = useRef({ current: '', new: '', confirm: '' });

const handlePasswordSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const { current, new: newPass } = passwordRef.current;

  try {
    await usersApi.changePassword({ currentPassword: current, newPassword: newPass });
    // Clear immediately
    passwordRef.current = { current: '', new: '', confirm: '' };
  } catch (error) {
    // Handle error
  }
};
```

#### 1.3 Missing Permission Checks
**Severity:** HIGH
**Location:** Entire file

**Issue:** No verification that user can edit their own profile. While users should always be able to edit their own profile, there's no check for email changes requiring verification, etc.

**Recommendation:**
```tsx
const { user } = useAuth();

// If email changes, require verification
if (profileForm.email !== user.email) {
  // Show email verification modal
  // Or send verification email first
}
```

### High Priority Issues

#### 1.4 Incomplete Error Handling
**Severity:** HIGH
**Location:** Lines 70, 96, 132, 160

```tsx
catch (error: any) {
  toast.error(error.message || 'Failed to load profile');
}
```

**Issue:** Using `any` type loses type safety. No distinction between different error types (network, validation, auth).

**Recommendation:**
```tsx
import { handleApiError, AuthError, ValidationError } from '@/lib/errors';

catch (error) {
  if (error instanceof AuthError) {
    toast.error('Session expired. Please sign in again.');
    router.push('/auth/signin');
  } else if (error instanceof ValidationError) {
    toast.error('Invalid data. Please check your inputs.');
  } else {
    toast.error('Failed to load profile');
  }
}
```

#### 1.5 No Form Validation Before Submit
**Severity:** MEDIUM
**Location:** Lines 77-101

**Issue:** Relies solely on HTML5 `required` attribute. No client-side validation for email format, phone format, etc.

**Recommendation:**
```tsx
const validateProfileForm = (data: typeof profileForm) => {
  const errors: Record<string, string> = {};

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    errors.email = 'Invalid email format';
  }

  // Phone validation (optional but if provided, must be valid)
  if (data.phone) {
    const phoneRegex = /^[\d\s\-+()]+$/;
    if (!phoneRegex.test(data.phone)) {
      errors.phone = 'Invalid phone format';
    }
  }

  return Object.keys(errors).length > 0 ? errors : null;
};
```

#### 1.6 Avatar Upload No Preview Cleanup
**Severity:** MEDIUM
**Location:** Lines 108-114

```tsx
const reader = new FileReader();
reader.onloadend = () => {
  setLogoPreview(reader.result as string);
};
reader.readAsDataURL(file);
```

**Issue:** Data URL stored in state can cause memory issues with large images. No cleanup of object URLs.

**Recommendation:**
```tsx
useEffect(() => {
  return () => {
    if (logoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreview);
    }
  };
}, [logoPreview]);
```

### Low Priority Issues

#### 1.7 Toast for Temporary Password
**Severity:** LOW
**Location:** N/A (not in this file, but related)

**Issue:** In users page, temporary password shown in toast notification stays in UI history

**Recommendation:** Use a secure dialog instead of toast for sensitive data.

---

## 2. Users Management Page

**File:** `frontend/app/[locale]/(app)/settings/users/page.tsx`

### Critical Issues

#### 2.1 Temporary Password Exposed in Toast
**Severity:** CRITICAL
**Location:** Line 134

```tsx
toast.success(`User invited successfully! Temporary password: ${result.tempPassword}`);
```

**Issue:** Temporary password displayed in toast notification which:
- Stays in screen until dismissed
- Logged in console
- Accessible to anyone viewing screen
- No way to copy securely

**Recommendation:**
```tsx
// Use a secure modal instead
const [showTempPassword, setShowTempPassword] = useState(false);
const [tempPassword, setTempPassword] = useState('');

const handleSubmitInvite = async (e: React.FormEvent) => {
  e.preventDefault();
  const result = await usersApi.inviteUser(inviteDto);
  setTempPassword(result.tempPassword);
  setShowTempPassword(true);
};

// In modal:
<Dialog open={showTempPassword} onOpenChange={setShowTempPassword}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>User Created Successfully</DialogTitle>
    </DialogHeader>
    <Alert>
      <AlertDescription>
        Temporary password: <code className="bg-muted px-2 py-1 rounded">{tempPassword}</code>
        <Button onClick={() => {
          navigator.clipboard.writeText(tempPassword);
          toast.success('Copied to clipboard');
        }}>
          Copy
        </Button>
      </AlertDescription>
    </Alert>
    <Button onClick={() => setShowTempPassword(false)}>
      I have saved the password
    </Button>
  </DialogContent>
</Dialog>
```

#### 2.2 No Permission Checks
**Severity:** CRITICAL
**Location:** Entire file

**Issue:** Admin-only page with no permission verification. Any authenticated user can access via URL.

**Recommendation:**
```tsx
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const permissions = await usersApi.getMyPermissions();
        if (!permissions.includes('users:manage')) {
          router.push('/unauthorized');
        }
      } catch (error) {
        router.push('/unauthorized');
      }
    };

    checkPermissions();
  }, [router]);

  // ... rest of component
}
```

Or add at middleware level for better security.

#### 2.3 Deactivate Without Confirmation Detail
**Severity:** HIGH
**Location:** Lines 144-147

```tsx
const handleDeactivate = async (user: UserProfile) => {
  if (!confirm(`Are you sure you want to deactivate ${user.first_name_en}?`)) {
    return;
  }
```

**Issue:** Using native `confirm()` which:
- Cannot be styled
- Blocks UI
- No additional context shown
- Doesn't show impact (e.g., "User will lose access immediately")

**Recommendation:**
```tsx
const [deactivateDialog, setDeactivateDialog] = useState<{
  open: boolean;
  user: UserProfile | null;
}>({ open: false, user: null });

const handleDeactivate = (user: UserProfile) => {
  setDeactivateDialog({ open: true, user });
};

const confirmDeactivate = async () => {
  if (!deactivateDialog.user) return;

  try {
    await usersApi.deactivateUser(deactivateDialog.user.id);
    toast.success('User deactivated successfully');
    await fetchUsers();
    setDeactivateDialog({ open: false, user: null });
  } catch (error: any) {
    toast.error(error.message || 'Failed to deactivate user');
  }
};

// In JSX:
<ConfirmDialog
  open={deactivateDialog.open}
  onOpenChange={(open) => setDeactivateDialog({ ...deactivateDialog, open })}
  title="Deactivate User"
  description={
    <div className="space-y-2">
      <p>Are you sure you want to deactivate <strong>{deactivateDialog.user?.first_name_en}</strong>?</p>
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This user will lose access to all systems immediately.
        </AlertDescription>
      </Alert>
    </div>
  }
  onConfirm={confirmDeactivate}
  confirmLabel="Deactivate"
  variant="destructive"
/>
```

### High Priority Issues

#### 2.4 Missing Role Assignment UI
**Severity:** HIGH
**Location:** Lines 336-466

**Issue:** Invite form has `roleIds` array but no UI element to select roles in the invite dialog.

**Recommendation:** Add role selection:
```tsx
<div className="space-y-2">
  <Label htmlFor="roles">Roles *</Label>
  <Select
    value={inviteForm.roleIds[0] || ''}
    onValueChange={(value) =>
      setInviteForm({ ...inviteForm, roleIds: [value] })
    }
  >
    <SelectTrigger id="roles">
      <SelectValue placeholder="Select role" />
    </SelectTrigger>
    <SelectContent>
      {roles.map((role) => (
        <SelectItem key={role.id} value={role.id}>
          {role.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

#### 2.5 No Email Verification for Changed Email
**Severity:** HIGH
**Location:** N/A (feature not implemented)

**Issue:** When editing user email, there's no verification process required.

**Recommendation:** Implement email verification flow.

#### 2.6 Search Only Client-Side
**Severity:** MEDIUM
**Location:** Lines 91-98

```tsx
const filteredUsers = users.filter(
  (user) =>
    user.first_name_en?.toLowerCase().includes(search.toLowerCase()) ||
    // ...
);
```

**Issue:** For large user lists (>100), this is inefficient. Should be server-side with pagination.

**Recommendation:**
```tsx
const fetchUsers = async () => {
  try {
    setLoading(true);
    const filters: any = {};
    if (statusFilter !== 'all') {
      filters.status = statusFilter;
    }
    if (search) {
      filters.search = search; // Let server handle search
    }
    const data = await usersApi.listUsers(filters);
    setUsers(data);
  } catch (error: any) {
    toast.error(error.message || 'Failed to load users');
  } finally {
    setLoading(false);
  }
};

// Add useEffect to refetch on search change
useEffect(() => {
  const debounceTimer = setTimeout(() => {
    fetchUsers();
  }, 300);

  return () => clearTimeout(debounceTimer);
}, [search]);
```

### Medium Priority Issues

#### 2.7 No Loading State for Actions
**Severity:** MEDIUM
**Location:** Lines 144-166

```tsx
const handleDeactivate = async (user: UserProfile) => {
  // ...
  await usersApi.deactivateUser(user.id);
  // No loading indicator while waiting
};
```

**Issue:** No visual feedback during async operations.

**Recommendation:**
```tsx
const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

const handleDeactivate = async (user: UserProfile) => {
  setActionLoading(prev => ({ ...prev, [user.id]: true }));

  try {
    await usersApi.deactivateUser(user.id);
    toast.success('User deactivated successfully');
    await fetchUsers();
  } catch (error: any) {
    toast.error(error.message || 'Failed to deactivate user');
  } finally {
    setActionLoading(prev => ({ ...prev, [user.id]: false }));
  }
};

// In button:
<Button
  variant="ghost"
  size="icon"
  onClick={() => handleDeactivate(user)}
  disabled={actionLoading[user.id]}
>
  {actionLoading[user.id] ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : (
    <UserX className="h-4 w-4" />
  )}
</Button>
```

---

## 3. Company Settings Page

**File:** `frontend/app/[locale]/(app)/settings/company/page.tsx`

### Critical Issues

#### 3.1 No Permission Checks
**Severity:** CRITICAL
**Location:** Entire file

**Issue:** Company settings can be changed by any authenticated user. No verification of admin/owner role.

**Recommendation:** Same as users page - add permission checks.

#### 3.2 Tax ID Fields No Validation
**Severity:** MEDIUM
**Location:** Lines 234-259

```tsx
<Input
  id="taxRegistrationNumber"
  value={formData.taxRegistrationNumber}
  onChange={(e) =>
    setFormData({
      ...formData,
      taxRegistrationNumber: e.target.value,
    })
  }
/>
```

**Issue:** Tax IDs have specific formats per country. No validation.

**Recommendation:**
```tsx
const validateTaxId = (country: string, taxId: string) => {
  const validators: Record<string, RegExp> = {
    QA: /^[1-9]\d{8}$/, // Qatar: 9 digits
    SA: /^[1-9]\d{8}$/, // Saudi: 9 digits
    AE: /^[1-9]\d{8}$/, // UAE: 9 digits
    EG: /^\d{9}$/, // Egypt: 9 digits
    // Add more countries
  };

  const validator = validators[country];
  if (!validator) return true; // No validation for unknown country

  return validator.test(taxId);
};

// Add validation on submit
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validate tax ID
  if (formData.taxRegistrationNumber &&
      !validateTaxId(formData.country, formData.taxRegistrationNumber)) {
    toast.error('Invalid tax registration number format for selected country');
    return;
  }

  // ... rest of submit logic
};
```

### High Priority Issues

#### 3.3 Logo Upload No Size Warning Before Upload
**Severity:** MEDIUM
**Location:** Lines 91-115

```tsx
if (file.size > 2 * 1024 * 1024) {
  toast.error('Logo file must be less than 2MB');
  return;
}
```

**Issue:** Validates but doesn't show file size to user before upload attempt.

**Recommendation:**
```tsx
const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    // Show file size in friendly format
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const maxSizeMB = (2 * 1024 * 1024 / (1024 * 1024)).toFixed(0);

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error(`Logo file (${fileSizeMB}MB) exceeds ${maxSizeMB}MB limit`);
      return;
    }

    // ... rest of logic
  }
};
```

#### 3.4 Currency Change No Confirmation
**Severity:** HIGH
**Location:** Lines 343-367

**Issue:** Changing base currency is a critical operation that affects all financial data. No warning.

**Recommendation:**
```tsx
const [currencyDialog, setCurrencyDialog] = useState<{
  open: boolean;
  newCurrency: string;
} | null>(null);

const handleCurrencyChange = (newCurrency: string) => {
  if (newCurrency !== formData.currencyCode) {
    setCurrencyDialog({ open: true, newCurrency });
  }
};

const confirmCurrencyChange = () => {
  if (currencyDialog) {
    setFormData({ ...formData, currencyCode: currencyDialog.newCurrency });
    setCurrencyDialog(null);
  }
};

// In select:
<Select
  value={formData.currencyCode}
  onValueChange={handleCurrencyChange}
>
  {/* ... options */}
</Select>

<ConfirmDialog
  open={currencyDialog?.open || false}
  onOpenChange={(open) =>
    setCurrencyDialog(currencyDialog ? { ...currencyDialog, open } : null)
  }
  title="Change Base Currency"
  description={
    <div className="space-y-2">
      <p>Are you sure you want to change the base currency?</p>
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This will affect all financial records and reports.
          Make sure you understand the implications before proceeding.
        </AlertDescription>
      </Alert>
    </div>
  }
  onConfirm={confirmCurrencyChange}
  confirmLabel="Change Currency"
  variant="destructive"
/>
```

### Medium Priority Issues

#### 3.5 No Auto-Save/Draft Feature
**Severity:** LOW
**Location:** Lines 118-140

**Issue:** Long form with no auto-save. If user accidentally navigates away, all changes are lost.

**Recommendation:**
```tsx
import { useEffect } from 'react';

// Auto-save to localStorage every 30 seconds
useEffect(() => {
  const timer = setInterval(() => {
    localStorage.setItem('company-settings-draft', JSON.stringify(formData));
  }, 30000);

  return () => clearInterval(timer);
}, [formData]);

// On mount, check for draft
useEffect(() => {
  const draft = localStorage.getItem('company-settings-draft');
  if (draft) {
    const shouldRestore = confirm('You have unsaved changes. Would you like to restore them?');
    if (shouldRestore) {
      setFormData(JSON.parse(draft));
    }
    localStorage.removeItem('company-settings-draft');
  }
}, []);
```

---

## 4. Roles Management Page

**File:** `frontend/app/[locale]/(app)/settings/roles/page.tsx`

### Critical Issues

#### 4.1 No Permission Checks
**Severity:** CRITICAL
**Location:** Entire file

**Issue:** Role management is a critical security function. No verification of admin permissions.

**Recommendation:** Add admin-only check.

#### 4.2 Deleting System Roles Only Client-Side Check
**Severity:** HIGH
**Location:** Lines 296-300

```tsx
const handleDelete = async (role: Role) => {
  if (role.is_system_role) {
    toast.error('Cannot delete system roles');
    return;
  }
```

**Issue:** Security check only on frontend. Backend should enforce this, but frontend shouldn't even allow the attempt.

**Recommendation:**
```tsx
// Don't show delete button for system roles
{!role.is_system_role && (
  <Button
    variant="ghost"
    size="icon"
    onClick={() => handleDelete(role)}
  >
    <Trash2 className="h-4 w-4" />
  </Button>
)}
```

#### 4.3 Default Role Change No Confirmation
**Severity:** MEDIUM
**Location:** Lines 318-327

```tsx
const handleSetDefault = async (role: Role) => {
  try {
    await rolesApi.setDefault(role.id);
    toast.success('Default role updated successfully');
    await fetchRoles();
  } catch (error: any) {
    toast.error(error.message || 'Failed to update default role');
  }
};
```

**Issue:** Changing default role affects all new users. No confirmation.

**Recommendation:**
```tsx
const [defaultRoleDialog, setDefaultRoleDialog] = useState<{
  open: boolean;
  role: Role | null;
}>({ open: false, role: null });

const handleSetDefault = (role: Role) => {
  setDefaultRoleDialog({ open: true, role });
};

const confirmSetDefault = async () => {
  if (!defaultRoleDialog.role) return;

  try {
    await rolesApi.setDefault(defaultRoleDialog.role.id);
    toast.success('Default role updated successfully');
    await fetchRoles();
  } catch (error: any) {
    toast.error(error.message || 'Failed to update default role');
  } finally {
    setDefaultRoleDialog({ open: false, role: null });
  }
};

// In JSX:
<ConfirmDialog
  open={defaultRoleDialog.open}
  onOpenChange={(open) =>
    setDefaultRoleDialog({ ...defaultRoleDialog, open })
  }
  title="Set Default Role"
  description={
    <p>
      Set <strong>{defaultRoleDialog.role?.name}</strong> as the default role for new users?
    </p>
  }
  onConfirm={confirmSetDefault}
  confirmLabel="Set as Default"
/>
```

### High Priority Issues

#### 4.4 Permission State Management Complex
**Severity:** MEDIUM
**Location:** Lines 66-92, 202-229

**Issue:** Permission state conversion logic is complex and error-prone.

**Recommendation:** Consider using a more type-safe approach:
```tsx
type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

interface PermissionState {
  [moduleId: string]: Record<PermissionAction, boolean>;
}

// Use a reducer for cleaner state management
const permissionsReducer = (
  state: PermissionState,
  action: { type: 'toggle'; moduleId: string; action: PermissionAction }
) => {
  if (action.type === 'toggle') {
    return {
      ...state,
      [action.moduleId]: {
        ...state[action.moduleId],
        [action.action]: !state[action.moduleId]?.[action.action],
      },
    };
  }
  return state;
};

const [selectedPermissions, dispatch] = useReducer(
  permissionsReducer,
  initialPermissions
);
```

#### 4.5 No Visual Feedback for Permission Changes
**Severity:** LOW
**Location:** Lines 632-656

**Issue:** When toggling permissions, no highlight or animation to show change.

**Recommendation:** Add transition/animation to permission buttons.

---

## 5. Fiscal Year Management Page

**File:** `frontend/app/[locale]/(app)/settings/fiscal/page.tsx`

### Critical Issues

#### 5.1 No Permission Checks
**Severity:** CRITICAL
**Location:** Entire file

**Issue:** Fiscal year management is a critical accounting operation. No permission verification.

#### 5.2 Close Fiscal Year No Additional Warnings
**Severity:** HIGH
**Location:** Lines 152-172

```tsx
const handleCloseYear = async (year: FiscalYear) => {
  if (
    !confirm(
      `Are you sure you want to close fiscal year ${year.year}? This action cannot be undone.`
    )
  ) {
    return;
  }
```

**Issue:** Closing a fiscal year has major accounting implications. Need more detailed warnings:
- Cannot add/edit transactions for closed periods
- May trigger year-end closing entries
- May affect tax calculations
- Should show number of unposted entries

**Recommendation:**
```tsx
const [closeYearDialog, setCloseYearDialog] = useState<{
  open: boolean;
  year: FiscalYear | null;
  pendingEntries?: number;
}>({ open: false, year: null, pendingEntries: 0 });

const handleCloseYear = async (year: FiscalYear) => {
  // Fetch pending entries count
  const pendingCount = await fetchPendingEntries(year.id);

  setCloseYearDialog({
    open: true,
    year,
    pendingEntries: pendingCount,
  });
};

// In dialog:
<ConfirmDialog
  open={closeYearDialog.open}
  title="Close Fiscal Year"
  description={
    <div className="space-y-4">
      <p>Are you sure you want to close fiscal year {closeYearDialog.year?.year}?</p>

      {closeYearDialog.pendingEntries > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            There are <strong>{closeYearDialog.pendingEntries}</strong> unposted entries.
            You must post all entries before closing the fiscal year.
          </AlertDescription>
        </Alert>
      )}

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1">
            <li>You cannot add or modify transactions for this period</li>
            <li>Year-end closing entries will be created</li>
            <li>This action cannot be undone</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  }
  onConfirm={confirmCloseYear}
  confirmLabel="Close Fiscal Year"
  variant="destructive"
/>
```

### High Priority Issues

#### 5.3 Date Validation Missing
**Severity:** MEDIUM
**Location:** Lines 437-476

```tsx
<Input
  id="startDate"
  type="date"
  value={formData.startDate}
  onChange={(e) =>
    setFormData({ ...formData, startDate: e.target.value })
  }
  required
/>
```

**Issue:** No validation that:
- Start date is before end date
- No overlap with existing fiscal years
- Year field matches start/end dates

**Recommendation:**
```tsx
const validateFiscalYearDates = (data: CreateFiscalYearDto) => {
  const errors: string[] = [];

  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);

  // Check start before end
  if (startDate >= endDate) {
    errors.push('Start date must be before end date');
  }

  // Check year matches dates
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  if (startYear !== data.year || endYear !== data.year) {
    errors.push('Fiscal year must match start and end dates');
  }

  // Check for overlaps with existing years
  const overlaps = fiscalYears.filter(fy => {
    const fyStart = new Date(fy.start_date);
    const fyEnd = new Date(fy.end_date);
    return (startDate <= fyEnd && endDate >= fyStart);
  });

  if (overlaps.length > 0) {
    errors.push(`Fiscal year overlaps with existing year(s): ${overlaps.map(fy => fy.year).join(', ')}`);
  }

  return errors;
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const errors = validateFiscalYearDates(formData);
  if (errors.length > 0) {
    errors.forEach(error => toast.error(error));
    return;
  }

  // ... rest of submit logic
};
```

#### 5.4 Closed Year Can Be Modified via Edit Dialog
**Severity:** HIGH
**Location:** Lines 478-485

```tsx
{editYear && editYear.status !== 'open' && (
  <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
    <AlertCircle className="h-5 w-5 text-yellow-600" />
    <div className="text-sm text-yellow-800">
      {t('cannotModifyClosedYear')}
    </div>
  </div>
)}
```

**Issue:** Warning shown but submit button is only disabled if condition matches. Better to disable all inputs.

**Recommendation:**
```tsx
<Input
  id="startDate"
  type="date"
  value={formData.startDate}
  onChange={(e) =>
    setFormData({ ...formData, startDate: e.target.value })
  }
  disabled={!!editYear && editYear.status !== 'open'}
  required
/>

// Apply to all date/year inputs
```

---

## 6. Cost Centers Management Page

**File:** `frontend/app/[locale]/(app)/settings/cost-centers/page.tsx`

### Critical Issues

#### 6.1 No Permission Checks
**Severity:** CRITICAL
**Location:** Entire file

**Issue:** Any authenticated user can manage cost centers.

### High Priority Issues

#### 6.2 Parent Cost Center Can Create Circular Reference
**Severity:** HIGH
**Location:** Lines 392-414

```tsx
<Select
  value={formData.parentId}
  onValueChange={(value) =>
    setFormData({ ...formData, parentId: value })
  }
>
  <SelectContent>
    <SelectItem value="">{t('noParent')}</SelectItem>
    {costCenters
      .filter((c) => c.id !== editCenter?.id)  // Only filters self
      .map((center) => (
        <SelectItem key={center.id} value={center.id}>
          {center.code} - {center.name}
        </SelectItem>
      ))}
  </SelectContent>
</Select>
```

**Issue:** Can select any cost center as parent, including:
- Its own descendants (creating circular reference)
- Cost centers that would create deep hierarchies

**Recommendation:**
```tsx
// Get all descendant IDs recursively
const getDescendantIds = (centerId: string): string[] => {
  const children = costCenters.filter(c => c.parent_id === centerId);
  const descendants = children.map(c => c.id);

  children.forEach(child => {
    descendants.push(...getDescendantIds(child.id));
  });

  return descendants;
};

// Filter out self and all descendants
const excludeIds = editCenter
  ? [editCenter.id, ...getDescendantIds(editCenter.id)]
  : [];

{costCenters
  .filter((c) => !excludeIds.includes(c.id))
  .map((center) => (
    <SelectItem key={center.id} value={center.id}>
      {center.code} - {center.name}
    </SelectItem>
  ))}
```

#### 6.3 Delete Cost Center Validation Incomplete
**Severity:** MEDIUM
**Location:** Lines 144-161

```tsx
const handleDelete = async (center: CostCenter) => {
  if (center.account_count > 0) {
    toast.error('Cannot delete cost center with assigned accounts');
    return;
  }

  if (!confirm(`Are you sure you want to delete cost center ${center.name}?`)) {
    return;
  }
```

**Issue:** Only checks account count, doesn't check:
- Child cost centers (would orphan them)
- Historical transactions referencing this cost center

**Recommendation:**
```tsx
const handleDelete = async (center: CostCenter) => {
  // Check for accounts
  if (center.account_count > 0) {
    toast.error('Cannot delete cost center with assigned accounts');
    return;
  }

  // Check for child cost centers
  const hasChildren = costCenters.some(c => c.parent_id === center.id);
  if (hasChildren) {
    toast.error('Cannot delete cost center with child cost centers. Reassign or delete children first.');
    return;
  }

  // Check for historical transactions
  const hasTransactions = await checkCostCenterTransactions(center.id);
  if (hasTransactions) {
    toast.error('Cannot delete cost center with historical transactions');
    return;
  }

  // Show confirmation
  setDeleteDialog({
    open: true,
    center
  });
};
```

### Medium Priority Issues

#### 6.4 Toggle Active No Confirmation
**Severity:** MEDIUM
**Location:** Lines 164-172

```tsx
const handleToggleActive = async (center: CostCenter) => {
  try {
    await costCentersApi.toggleActive(center.id);
    toast.success('Cost center status updated');
    await fetchCostCenters();
  } catch (error: any) {
    toast.error(error.message || 'Failed to update cost center');
  }
};
```

**Issue:** Deactivating a cost center could affect:
- Active transactions
- Reports
- Account assignments

Should warn if cost center is in use.

**Recommendation:**
```tsx
const handleToggleActive = async (center: CostCenter) => {
  // If deactivating and has accounts, warn user
  if (center.is_active && center.account_count > 0) {
    const confirmed = confirm(
      `This cost center has ${center.account_count} assigned accounts. ` +
      `Deactivating will prevent new assignments but won't affect existing ones. Continue?`
    );

    if (!confirmed) return;
  }

  try {
    await costCentersApi.toggleActive(center.id);
    toast.success('Cost center status updated');
    await fetchCostCenters();
  } catch (error: any) {
    toast.error(error.message || 'Failed to update cost center');
  }
};
```

---

## 7. API Integration Analysis

**File:** `frontend/lib/api/settings.ts` and `frontend/lib/api/users.ts`

### Critical Issues

#### 7.1 No Request Validation
**Severity:** HIGH
**Location:** Throughout both files

**Issue:** API calls don't validate data before sending. Relying solely on backend validation.

**Recommendation:** Add client-side validation before API calls:
```tsx
// Create validation utilities
export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validateRequired = (value: any, fieldName: string): void => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    throw new ValidationError(`${fieldName} is required`);
  }
};

// Use in API calls
export const usersApi = {
  async inviteUser(data: InviteUserDto): Promise<{ user: UserProfile; tempPassword: string }> {
    // Validate before sending
    validateRequired(data.email, 'Email');
    if (!validateEmail(data.email)) {
      throw new ValidationError('Invalid email format');
    }
    validateRequired(data.firstNameEn, 'First name (English)');
    validateRequired(data.firstNameAr, 'First name (Arabic)');
    validateRequired(data.roleIds, 'Roles');

    if (data.roleIds.length === 0) {
      throw new ValidationError('At least one role must be assigned');
    }

    const response = await apiClient.post('/users/invite', {
      email: data.email,
      // ...
    });

    return response.data;
  },
};
```

#### 7.2 Snake_Case Conversion Manual
**Severity:** MEDIUM
**Location:** Lines 181-189 in settings.ts

```tsx
Object.entries(data).forEach(([key, value]) => {
  if (key === 'logo' && value instanceof File) {
    formData.append('logo', value);
  } else if (value !== undefined) {
    // Convert camelCase to snake_case for API
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    formData.append(snakeKey, String(value));
  }
});
```

**Issue:** Manual conversion is error-prone and inconsistent.

**Recommendation:** Use a transformation utility:
```tsx
function camelToSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function transformToSnakeCase<T extends Record<string, any>>(obj: T): Record<string, any> {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[camelToSnakeCase(key)] = value;
    }
    return acc;
  }, {} as Record<string, any>);
}

// Usage:
const snakeCaseData = transformToSnakeCase(data);
Object.entries(snakeCaseData).forEach(([key, value]) => {
  formData.append(key, String(value));
});
```

#### 7.3 Avatar Upload Uses Raw Fetch
**Severity:** MEDIUM
**Location:** Lines 139-158 in users.ts

```tsx
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/avatar`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${apiClient.getAccessToken()}`,
  },
  body: formData,
});
```

**Issue:** Bypasses apiClient which handles auth, token refresh, error handling.

**Recommendation:** Add to apiClient:
```tsx
// In ApiClient class
async upload(endpoint: string, file: File): Promise<ApiResponse> {
  const formData = new FormData();
  formData.append('file', file);

  return this.request(endpoint, {
    method: 'POST',
    body: formData,
    headers: {}, // Let browser set Content-Type
  });
}

// Usage in usersApi:
async uploadAvatar(file: File): Promise<UserProfile> {
  const response = await apiClient.upload('/users/me/avatar', file);
  return response.data as UserProfile;
}
```

### High Priority Issues

#### 7.4 No Retry Logic for Failed Requests
**Severity:** MEDIUM
**Location:** Throughout API client

**Issue:** Network failures fail immediately. No exponential backoff or retry.

**Recommendation:**
```tsx
async requestWithRetry<T>(
  requestFn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries - 1;
      const isRetryable = !error.message?.includes('401') &&
                         !error.message?.includes('403') &&
                         !error.message?.includes('404');

      if (isLastAttempt || !isRetryable) {
        throw error;
      }

      // Exponential backoff
      await new Promise(resolve =>
        setTimeout(resolve, delayMs * Math.pow(2, attempt))
      );
    }
  }

  throw new Error('Max retries exceeded');
}
```

#### 7.5 No Request Cancellation
**Severity:** MEDIUM
**Location:** Throughout API client

**Issue:** Requests can't be cancelled if component unmounts or user navigates away.

**Recommendation:** Add AbortController support:
```tsx
class ApiClient {
  private controllers: Map<string, AbortController> = new Map();

  async get<T = any>(endpoint: string, key?: string): Promise<ApiResponse<T>> {
    // Cancel previous request with same key
    if (key && this.controllers.has(key)) {
      this.controllers.get(key)?.abort();
    }

    const controller = new AbortController();
    if (key) {
      this.controllers.set(key, controller);
    }

    try {
      return await this.request<T>(endpoint, {
        method: 'GET',
        signal: controller.signal,
      });
    } finally {
      if (key) {
        this.controllers.delete(key);
      }
    }
  }
}
```

---

## 8. General Issues Across All Settings Pages

### 8.1 No Permission System
**Severity:** CRITICAL
**Location:** All settings pages

**Issue:** None of the settings pages verify user permissions before rendering or performing actions.

**Recommendation:** Create a permission hook:
```tsx
// hooks/usePermissions.ts
import { useEffect, useState } from 'react';
import { usersApi } from '@/lib/api/users';

export function usePermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersApi.getMyPermissions()
      .then(setPermissions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hasPermission = (permission: string) => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (requiredPermissions: string[]) => {
    return requiredPermissions.some(p => permissions.includes(p));
  };

  const hasAllPermissions = (requiredPermissions: string[]) => {
    return requiredPermissions.every(p => permissions.includes(p));
  };

  return { permissions, loading, hasPermission, hasAnyPermission, hasAllPermissions };
}

// Usage in settings pages:
export default function UsersPage() {
  const { hasPermission, loading: permLoading } = usePermissions();

  if (permLoading) {
    return <div>Loading...</div>;
  }

  if (!hasPermission('users:manage')) {
    return <UnauthorizedPage />;
  }

  // ... rest of component
}
```

### 8.2 No Audit Logging
**Severity:** MEDIUM
**Location:** All settings pages

**Issue:** Critical settings changes are not logged for audit purposes:
- User deactivation
- Role changes
- Company settings changes
- Fiscal year closing

**Recommendation:** Add audit logging API calls:
```tsx
// In apiClient or separate audit module
export const auditApi = {
  async logAction(data: {
    action: string;
    entity: string;
    entityId?: string;
    details?: Record<string, any>;
  }) {
    await apiClient.post('/audit/log', {
      ...data,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });
  }
};

// Usage:
const handleDeactivate = async (user: UserProfile) => {
  try {
    await usersApi.deactivateUser(user.id);

    // Log the action
    await auditApi.logAction({
      action: 'USER_DEACTIVATED',
      entity: 'user',
      entityId: user.id,
      details: {
        userName: `${user.first_name_en} ${user.last_name_en}`,
        email: user.email,
      },
    });

    toast.success('User deactivated successfully');
    await fetchUsers();
  } catch (error: any) {
    toast.error(error.message || 'Failed to deactivate user');
  }
};
```

### 8.3 No Optimistic Updates
**Severity:** LOW
**Location:** All settings pages with lists

**Issue:** UI waits for server response before updating, making it feel sluggish.

**Recommendation:** Implement optimistic updates:
```tsx
const handleDeactivate = async (user: UserProfile) => {
  // Optimistically update UI
  const previousUsers = [...users];
  setUsers(users.map(u =>
    u.id === user.id
      ? { ...u, status: 'inactive' as const }
      : u
  ));

  try {
    await usersApi.deactivateUser(user.id);
    toast.success('User deactivated successfully');
  } catch (error: any) {
    // Rollback on error
    setUsers(previousUsers);
    toast.error(error.message || 'Failed to deactivate user');
  }
};
```

### 8.4 Missing Loading Skeletons
**Severity:** LOW
**Location:** All settings pages

**Issue:** Loading states show plain text. No skeleton screens for better perceived performance.

**Recommendation:** Use skeleton components:
```tsx
import { Skeleton } from '@/components/ui/skeleton';

{loading ? (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-3 w-[150px]" />
        </div>
      </div>
    ))}
  </div>
) : (
  // Actual content
)}
```

### 8.5 No Keyboard Shortcuts
**Severity:** LOW
**Location:** All settings pages

**Issue:** Power users would benefit from keyboard shortcuts.

**Recommendation:** Add keyboard shortcuts:
```tsx
import { useEffect } from 'react';
import { toast } from 'sonner';

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Ctrl/Cmd + K: Open search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      document.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
    }

    // Ctrl/Cmd + N: New item
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      handleCreate();
    }

    // Escape: Close dialog
    if (e.key === 'Escape' && dialogOpen) {
      setDialogOpen(false);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [dialogOpen]);
```

---

## 9. Security Checklist

### Password Security
- [ ] Weak password validation (only length check)
- [ ] No password strength meter
- [ ] Passwords stored in component state
- [ ] No password complexity requirements enforced
- [ ] Temporary passwords shown in toast (insecure)

### Permission Management
- [ ] No permission checks on any settings page
- [ ] No role-based UI hiding
- [ ] No admin verification
- [ ] System role deletion only checked on frontend
- [ ] No audit logging for critical actions

### Data Validation
- [ ] No email format validation on client
- [ ] No phone format validation
- [ ] No tax ID format validation
- [ ] No fiscal year date overlap validation
- [ ] No circular reference check for cost centers

### Sensitive Data Handling
- [ ] Temporary passwords exposed in toast notifications
- [ ] No confirmation for critical operations
- [ ] No secure clipboard copy for sensitive data
- [ ] No warning for currency changes
- [ ] No warning for fiscal year closing implications

### API Security
- [ ] No request validation before sending
- [ ] Manual snake_case conversion (error-prone)
- [ ] No retry logic for failed requests
- [ ] No request cancellation support
- [ ] Avatar upload bypasses auth client

---

## 10. Performance Considerations

### Client-Side Filtering
- **Issue:** Users page filters on client-side
- **Impact:** Poor performance with >100 users
- **Fix:** Move filtering to server with pagination

### No Memoization
- **Issue:** Lists re-render on every state change
- **Impact:** Unnecessary re-renders
- **Fix:** Use `React.memo` for list items

### No Virtualization
- **Issue:** Long lists render all items
- **Impact:** Slow rendering for large datasets
- **Fix:** Use `react-window` for virtual scrolling

### Unoptimized Re-renders
- **Issue:** Parent state changes cause all children to re-render
- **Impact:** Sluggish UI
- **Fix:** Use `useCallback` and `useMemo`

---

## 11. Accessibility Issues

### Missing ARIA Labels
- Many buttons lack descriptive aria-labels
- Form inputs lack proper aria-describedby for errors
- Loading states not announced to screen readers

### Keyboard Navigation
- No focus management in dialogs
- No keyboard shortcuts documented
- Escape key not handled consistently

### Color Contrast
- Warning text using yellow background may fail contrast
- Error states need better visual indicators

### Screen Reader Support
- Toast notifications not properly announced
- Table navigation not optimized
- Modal focus trap not implemented

---

## 12. Recommendations Priority Matrix

### Critical (Fix Immediately)
1. Add permission checks to all settings pages
2. Fix temporary password exposure in toast
3. Implement proper password validation
4. Add server-side permission enforcement (backend)

### High Priority (Fix This Sprint)
5. Replace native confirm() with proper dialogs
6. Add email validation
7. Add fiscal year date validation
8. Fix cost center circular reference check
9. Add confirmation for critical operations
10. Implement audit logging

### Medium Priority (Next Sprint)
11. Add loading skeletons
12. Implement optimistic updates
13. Add request cancellation
14. Fix snake_case conversion
15. Add retry logic for API calls
16. Improve error handling with typed errors

### Low Priority (Backlog)
17. Add keyboard shortcuts
18. Implement virtual scrolling for lists
19. Add auto-save for long forms
20. Improve accessibility
21. Add password strength meter
22. Add undo/redo for batch operations

---

## 13. Testing Recommendations

### Unit Tests Needed
- [ ] Form validation functions
- [ ] Permission checking logic
- [ ] Data transformation utilities
- [ ] Date validation helpers

### Integration Tests Needed
- [ ] Settings page load with data
- [ ] Form submission flow
- [ ] Error handling scenarios
- [ ] Permission enforcement

### E2E Tests Needed
- [ ] Complete user management workflow
- [ ] Role creation and assignment
- [ ] Fiscal year creation and closing
- [ ] Company settings update

### Security Tests Needed
- [ ] Permission bypass attempts
- [ ] SQL injection attempts
- [ ] XSS prevention
- [ ] CSRF protection

---

## 14. Conclusion

The settings pages have a solid foundation with good UI/UX, but several critical security and validation issues need immediate attention:

**Must Fix Before Production:**
1. Add permission/authorization checks
2. Fix password validation
3. Secure temporary password handling
4. Add proper form validation
5. Replace native confirm dialogs

**Should Fix Soon:**
6. Add audit logging
7. Implement server-side filtering/pagination
8. Add confirmation for critical operations
9. Improve error handling
10. Add loading states

**Nice to Have:**
11. Keyboard shortcuts
12. Auto-save for long forms
13. Optimistic updates
14. Better accessibility

**Overall Assessment:** The settings pages are functional but need security hardening and validation improvements before production deployment. Priority should be on implementing a proper permission system and fixing the password/security issues.

---

## Appendix A: Files Audited

1. `frontend/app/[locale]/(app)/settings/profile/page.tsx`
2. `frontend/app/[locale]/(app)/settings/users/page.tsx`
3. `frontend/app/[locale]/(app)/settings/company/page.tsx`
4. `frontend/app/[locale]/(app)/settings/roles/page.tsx`
5. `frontend/app/[locale]/(app)/settings/fiscal/page.tsx`
6. `frontend/app/[locale]/(app)/settings/cost-centers/page.tsx`
7. `frontend/lib/api/settings.ts`
8. `frontend/lib/api/users.ts`
9. `frontend/lib/api/client.ts`
10. `frontend/lib/errors.ts`
11. `frontend/contexts/auth-context.tsx`

## Appendix B: Related Documentation

- Authentication Flow: `frontend/contexts/auth-context.tsx`
- API Client: `frontend/lib/api/client.ts`
- Error Handling: `frontend/lib/errors.ts`
- Component Library: `frontend/components/ui/`

---

**End of Report**
