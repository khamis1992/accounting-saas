# Quick Fix Code Snippets - Settings Pages Audit

This file contains ready-to-use code snippets for the most critical issues identified in the audit.

## 1. Permission Hook (CRITICAL)

**File:** `frontend/hooks/usePermissions.ts` (NEW)

```tsx
import { useEffect, useState } from 'react';
import { usersApi } from '@/lib/api/users';

export function usePermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    usersApi.getMyPermissions()
      .then(setPermissions)
      .catch(setError)
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

  return {
    permissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
```

**Usage in any settings page:**
```tsx
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function UsersPage() {
  const { hasPermission, loading: permLoading } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    if (!permLoading && !hasPermission('users:manage')) {
      router.push('/unauthorized');
    }
  }, [permLoading, hasPermission, router]);

  if (permLoading) {
    return <div>Loading...</div>;
  }

  // ... rest of component
}
```

## 2. Secure Password Validation (HIGH)

**File:** Add to `frontend/lib/validation.ts` (NEW)

```tsx
/**
 * Password validation utilities
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];

  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    errors.push('Must include at least one uppercase letter');
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    errors.push('Must include at least one lowercase letter');
  }

  // Number check
  if (!/\d/.test(password)) {
    errors.push('Must include at least one number');
  }

  // Special character check
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Must include at least one special character');
  }

  // Common password check
  const commonPasswords = [
    'password123',
    'qwerty123',
    '12345678',
    'abc12345',
    'password1',
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Cannot use a common password');
  }

  // Calculate strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (password.length >= 12 && errors.length === 0) {
    strength = 'strong';
  } else if (password.length >= 8 && errors.length <= 1) {
    strength = 'medium';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
};

/**
 * Email validation
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Phone validation (flexible for international formats)
 */
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-+()]+$/;
  return phone.length >= 10 && phoneRegex.test(phone);
};

/**
 * Tax ID validation by country
 */
export const validateTaxId = (country: string, taxId: string): boolean => {
  const validators: Record<string, RegExp> = {
    QA: /^[1-9]\d{8}$/, // Qatar: 9 digits
    SA: /^[1-9]\d{8}$/, // Saudi: 9 digits
    AE: /^[1-9]\d{8}$/, // UAE: 9 digits
    EG: /^\d{9}$/, // Egypt: 9 digits
    KW: /^\d{12}$/, // Kuwait: 12 digits
    BH: /^\d{9}$/, // Bahrain: 9 digits
    OM: /^\d{8}$/, // Oman: 8 digits
  };

  const validator = validators[country];
  if (!validator) return true; // No validation for unknown country

  return validator.test(taxId);
};
```

**Usage in Profile page:**
```tsx
import { validatePassword } from '@/lib/validation';

const handlePasswordSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validate password
  const validation = validatePassword(passwordForm.newPassword);

  if (!validation.isValid) {
    validation.errors.forEach(error => toast.error(error));
    return;
  }

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    toast.error('Passwords do not match');
    return;
  }

  setChangingPassword(true);

  try {
    await usersApi.changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });

    toast.success('Password changed successfully');

    // Clear form
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  } catch (error: any) {
    toast.error(error.message || 'Failed to change password');
  } finally {
    setChangingPassword(false);
  }
};
```

## 3. Secure Temporary Password Modal (CRITICAL)

**File:** Add to `users/page.tsx`

```tsx
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

// In component:
const [tempPasswordDialog, setTempPasswordDialog] = useState<{
  open: boolean;
  tempPassword: string;
  email: string;
}>({ open: false, tempPassword: '', email: '' });

const [copied, setCopied] = useState(false);

const handleSubmitInvite = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);

  try {
    const result = await usersApi.inviteUser(inviteDto);

    // Show secure dialog instead of toast
    setTempPasswordDialog({
      open: true,
      tempPassword: result.tempPassword,
      email: inviteDto.email,
    });

    setDialogOpen(false);
    await fetchUsers();
  } catch (error: any) {
    toast.error(error.message || 'Failed to invite user');
  } finally {
    setSubmitting(false);
  }
};

const handleCopyPassword = () => {
  navigator.clipboard.writeText(tempPasswordDialog.tempPassword);
  setCopied(true);
  toast.success('Password copied to clipboard');

  setTimeout(() => setCopied(false), 2000);
};

const handleTempPasswordClose = () => {
  setTempPasswordDialog({ open: false, tempPassword: '', email: '' });
  setCopied(false);
};

// In JSX:
<Dialog open={tempPasswordDialog.open} onOpenChange={handleTempPasswordClose}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Check className="h-5 w-5 text-green-500" />
        User Created Successfully
      </DialogTitle>
    </DialogHeader>

    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Important!</AlertTitle>
        <AlertDescription>
          Please save this temporary password securely. The user will need it to sign in.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <div className="p-3 bg-muted rounded-md">
          {tempPasswordDialog.email}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Temporary Password</label>
        <div className="flex gap-2">
          <code className="flex-1 p-3 bg-muted rounded-md font-mono text-sm">
            {tempPasswordDialog.tempPassword}
          </code>
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopyPassword}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <Button
        className="w-full"
        onClick={handleTempPasswordClose}
      >
        I Have Saved the Password
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

## 4. Better Confirmation Dialog (HIGH)

**File:** Add to `users/page.tsx`

```tsx
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  onOpenChange={(open) =>
    setDeactivateDialog({ ...deactivateDialog, open })
  }
  title="Deactivate User"
  description={
    <div className="space-y-4">
      <p>
        Are you sure you want to deactivate{' '}
        <strong>{deactivateDialog.user?.first_name_en} {deactivateDialog.user?.last_name_en}</strong>?
      </p>

      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          This user will lose access to all systems immediately.
          They will not be able to sign in until reactivated.
        </AlertDescription>
      </Alert>

      <div className="text-sm text-muted-foreground space-y-1">
        <p><strong>Email:</strong> {deactivateDialog.user?.email}</p>
        <p><strong>Phone:</strong> {deactivateDialog.user?.phone || 'N/A'}</p>
        <p><strong>Roles:</strong> {
          deactivateDialog.user?.user_roles?.map(ur => ur.roles.name).join(', ') || 'None'
        }</p>
      </div>
    </div>
  }
  confirmLabel="Deactivate User"
  cancelLabel="Cancel"
  onConfirm={confirmDeactivate}
  variant="destructive"
/>
```

## 5. Fiscal Year Date Validation (HIGH)

**File:** Add to `fiscal/page.tsx`

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
    return fy.id !== editYear?.id && // Skip self if editing
           startDate <= fyEnd && endDate >= fyStart;
  });

  if (overlaps.length > 0) {
    errors.push(
      `Fiscal year overlaps with existing year(s): ${overlaps.map(fy => fy.year).join(', ')}`
    );
  }

  // Check minimum duration (at least 1 month)
  const minDuration = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
  if (endDate.getTime() - startDate.getTime() < minDuration) {
    errors.push('Fiscal year must be at least 1 month long');
  }

  return errors;
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validate dates
  const errors = validateFiscalYearDates(formData);
  if (errors.length > 0) {
    errors.forEach(error => toast.error(error));
    return;
  }

  setSubmitting(true);

  try {
    if (editYear) {
      await fiscalYearApi.update(editYear.id, formData);
      toast.success('Fiscal year updated successfully');
    } else {
      await fiscalYearApi.create(formData);
      toast.success('Fiscal year created successfully');
    }

    setOpen(false);
    await fetchFiscalYears();
  } catch (error: any) {
    toast.error(error.message || 'Failed to save fiscal year');
  } finally {
    setSubmitting(false);
  }
};
```

## 6. Cost Center Circular Reference Prevention (HIGH)

**File:** Add to `cost-centers/page.tsx`

```tsx
// Add this helper function
const getDescendantIds = (centerId: string): string[] => {
  const children = costCenters.filter(c => c.parent_id === centerId);
  const descendantIds = children.map(c => c.id);

  children.forEach(child => {
    descendantIds.push(...getDescendantIds(child.id));
  });

  return descendantIds;
};

// In the form dialog:
<div className="space-y-2">
  <Label htmlFor="parentId">Parent Cost Center</Label>
  <Select
    value={formData.parentId}
    onValueChange={(value) =>
      setFormData({ ...formData, parentId: value })
    }
  >
    <SelectTrigger id="parentId">
      <SelectValue placeholder="Select parent" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="">No Parent</SelectItem>
      {costCenters
        .filter((c) => {
          // Filter out self
          if (c.id === editCenter?.id) return false;

          // Filter out all descendants to prevent circular references
          const excludeIds = editCenter
            ? [editCenter.id, ...getDescendantIds(editCenter.id)]
            : [];

          return !excludeIds.includes(c.id);
        })
        .map((center) => (
          <SelectItem key={center.id} value={center.id}>
            {center.code} - {center.name}
          </SelectItem>
        ))}
    </SelectContent>
  </Select>
</div>
```

## 7. Form Validation Hook (MEDIUM)

**File:** `frontend/hooks/useFormValidation.ts` (NEW)

```tsx
import { useState, useCallback } from 'react';
import { validateEmail, validatePhone } from '@/lib/validation';

interface ValidationRules {
  [fieldName: string]: {
    required?: boolean;
    validate?: (value: any) => boolean | string;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  };
}

interface useFormValidationReturn<T> {
  values: T;
  errors: Record<keyof T, string | undefined>;
  touched: Record<keyof T, boolean>;
  setValue: (field: keyof T, value: any) => void;
  setTouched: (field: keyof T) => void;
  validate: () => boolean;
  validateField: (field: keyof T) => boolean;
  reset: () => void;
}

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationRules: ValidationRules
): useFormValidationReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<keyof T, string | undefined>>(
    {} as Record<keyof T, string | undefined>
  );
  const [touched, setTouchedState] = useState<Record<keyof T, boolean>>(
    {} as Record<keyof T, boolean>
  );

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));

    // Validate field if already touched
    if (touched[field]) {
      validateField(field);
    }
  }, [touched]);

  const setTouched = useCallback((field: keyof T) => {
    setTouchedState(prev => ({ ...prev, [field]: true }));
    validateField(field);
  }, []);

  const validateField = useCallback((field: keyof T): boolean => {
    const rules = validationRules[field as string];
    if (!rules) return true;

    const value = values[field];
    let error: string | undefined;

    // Required validation
    if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
      error = `${String(field)} is required`;
    }
    // Custom validation
    else if (rules.validate) {
      const result = rules.validate(value);
      if (result !== true) {
        error = typeof result === 'string' ? result : 'Invalid value';
      }
    }
    // Pattern validation
    else if (rules.pattern && value && !rules.pattern.test(value)) {
      error = `Invalid format`;
    }
    // Min length
    else if (rules.minLength && value && value.length < rules.minLength) {
      error = `Must be at least ${rules.minLength} characters`;
    }
    // Max length
    else if (rules.maxLength && value && value.length > rules.maxLength) {
      error = `Must be no more than ${rules.maxLength} characters`;
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  }, [values, validationRules]);

  const validate = useCallback((): boolean => {
    let isValid = true;

    Object.keys(validationRules).forEach(field => {
      const fieldIsValid = validateField(field as keyof T);
      if (!fieldIsValid) isValid = false;
    });

    return isValid;
  }, [validationRules, validateField]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({} as Record<keyof T, string | undefined>);
    setTouchedState({} as Record<keyof T, boolean>);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    setValue,
    setTouched,
    validate,
    validateField,
    reset,
  };
}
```

**Usage example:**
```tsx
const { values, errors, touched, setValue, validate, setTouched } = useFormValidation(
  {
    email: '',
    firstNameEn: '',
    firstNameAr: '',
    // ... other fields
  },
  {
    email: {
      required: true,
      validate: (value) => validateEmail(value) || 'Invalid email format',
    },
    firstNameEn: {
      required: true,
      minLength: 2,
    },
    firstNameAr: {
      required: true,
      minLength: 2,
    },
  }
);

// In JSX:
<Input
  value={values.email}
  onChange={(e) => setValue('email', e.target.value)}
  onBlur={() => setTouched('email')}
/>
{touched.email && errors.email && (
  <p className="text-sm text-red-500">{errors.email}</p>
)}
```

## 8. Audit Logging Helper (MEDIUM)

**File:** `frontend/lib/audit.ts` (NEW)

```tsx
import { apiClient } from './client';

export interface AuditLogEntry {
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, any>;
}

export const auditApi = {
  async logAction(entry: AuditLogEntry) {
    try {
      await apiClient.post('/audit/log', {
        ...entry,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
    } catch (error) {
      // Don't throw - logging failures shouldn't break the app
      console.error('Failed to log audit entry:', error);
    }
  },

  // Convenience methods for common actions
  async logUserAction(action: string, userId: string, details?: Record<string, any>) {
    return this.logAction({
      action,
      entity: 'user',
      entityId: userId,
      details,
    });
  },

  async logRoleAction(action: string, roleId: string, details?: Record<string, any>) {
    return this.logAction({
      action,
      entity: 'role',
      entityId: roleId,
      details,
    });
  },

  async logSettingsAction(action: string, details?: Record<string, any>) {
    return this.logAction({
      action,
      entity: 'settings',
      details,
    });
  },
};
```

**Usage:**
```tsx
import { auditApi } from '@/lib/audit';

const handleDeactivate = async (user: UserProfile) => {
  try {
    await usersApi.deactivateUser(user.id);

    // Log the action
    await auditApi.logUserAction('USER_DEACTIVATED', user.id, {
      userName: `${user.first_name_en} ${user.last_name_en}`,
      email: user.email,
      roles: user.user_roles?.map(ur => ur.roles.name),
    });

    toast.success('User deactivated successfully');
    await fetchUsers();
  } catch (error: any) {
    toast.error(error.message || 'Failed to deactivate user');
  }
};
```

## 9. Loading Skeleton Component (LOW)

**File:** Add to each settings page

```tsx
import { Skeleton } from '@/components/ui/skeleton';

{loading ? (
  <div className="space-y-4">
    {/* Header skeleton */}
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>

    {/* Table skeleton */}
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-3 w-[150px]" />
          </div>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  </div>
) : (
  // Actual content
)}
```

## Summary

These snippets address the **most critical issues** from the audit:

1. ✅ Permission system
2. ✅ Secure password validation
3. ✅ Secure temporary password handling
4. ✅ Better confirmation dialogs
5. ✅ Fiscal year date validation
6. ✅ Cost center circular reference prevention
7. ✅ Form validation hook
8. ✅ Audit logging
9. ✅ Loading skeletons

**Implementation Priority:**
1. Week 1: Items 1-3 (Critical security)
2. Week 2: Items 4-6 (High priority validation)
3. Week 3: Items 7-9 (UX improvements)

---

**See full audit report:** `FRONTEND_AUDIT_SETTINGS.md`
