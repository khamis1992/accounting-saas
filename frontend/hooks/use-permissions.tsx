/**
 * Permission Hook
 *
 * Provides role-based access control (RBAC) for frontend components.
 * Checks user permissions before rendering protected UI elements or routes.
 *
 * @version 1.0.0
 * @lastUpdated 2025-01-17
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { User } from '@supabase/supabase-js';

/**
 * User roles in the system
 */
export type UserRole = 'admin' | 'manager' | 'accountant' | 'viewer' | 'employee';

/**
 * Permission types for different actions
 */
export type Permission =
  // User management
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.delete'
  | 'users.activate'
  | 'users.deactivate'

  // Role management
  | 'roles.view'
  | 'roles.create'
  | 'roles.edit'
  | 'roles.delete'

  // Company settings
  | 'company.view'
  | 'company.edit'

  // Financial data
  | 'accounting.view'
  | 'accounting.create'
  | 'accounting.edit'
  | 'accounting.delete'
  | 'accounting.approve'

  // Reports
  | 'reports.view'
  | 'reports.export'

  // Banking
  | 'banking.view'
  | 'banking.create'
  | 'banking.edit'
  | 'banking.delete'

  // Sales
  | 'sales.view'
  | 'sales.create'
  | 'sales.edit'
  | 'sales.delete'

  // Purchases
  | 'purchases.view'
  | 'purchases.create'
  | 'purchases.edit'
  | 'purchases.delete'

  // Assets
  | 'assets.view'
  | 'assets.create'
  | 'assets.edit'
  | 'assets.delete'

  // Tax
  | 'tax.view'
  | 'tax.create'
  | 'tax.edit'
  | 'tax.delete'

  // Settings
  | 'settings.view'
  | 'settings.edit';

/**
 * Role permissions mapping
 *
 * SECURITY: This defines what each role can do.
 * Uses principle of least privilege - only grant necessary permissions.
 *
 * Admin: All permissions
 * Manager: Most permissions except user/role management
 * Accountant: Accounting and reporting permissions
 * Viewer: Read-only permissions
 * Employee: Limited permissions
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    // User management
    'users.view',
    'users.create',
    'users.edit',
    'users.delete',
    'users.activate',
    'users.deactivate',

    // Role management
    'roles.view',
    'roles.create',
    'roles.edit',
    'roles.delete',

    // Company settings
    'company.view',
    'company.edit',

    // Financial data
    'accounting.view',
    'accounting.create',
    'accounting.edit',
    'accounting.delete',
    'accounting.approve',

    // Reports
    'reports.view',
    'reports.export',

    // Banking
    'banking.view',
    'banking.create',
    'banking.edit',
    'banking.delete',

    // Sales
    'sales.view',
    'sales.create',
    'sales.edit',
    'sales.delete',

    // Purchases
    'purchases.view',
    'purchases.create',
    'purchases.edit',
    'purchases.delete',

    // Assets
    'assets.view',
    'assets.create',
    'assets.edit',
    'assets.delete',

    // Tax
    'tax.view',
    'tax.create',
    'tax.edit',
    'tax.delete',

    // Settings
    'settings.view',
    'settings.edit',
  ],

  manager: [
    // View users (but not manage)
    'users.view',

    // View roles (but not manage)
    'roles.view',

    // Company settings
    'company.view',
    'company.edit',

    // Financial data
    'accounting.view',
    'accounting.create',
    'accounting.edit',
    'accounting.approve',

    // Reports
    'reports.view',
    'reports.export',

    // Banking
    'banking.view',
    'banking.create',
    'banking.edit',

    // Sales
    'sales.view',
    'sales.create',
    'sales.edit',

    // Purchases
    'purchases.view',
    'purchases.create',
    'purchases.edit',

    // Assets
    'assets.view',
    'assets.create',
    'assets.edit',

    // Tax
    'tax.view',
    'tax.create',
    'tax.edit',

    // Settings
    'settings.view',
    'settings.edit',
  ],

  accountant: [
    // Financial data
    'accounting.view',
    'accounting.create',
    'accounting.edit',
    'accounting.approve',

    // Reports
    'reports.view',
    'reports.export',

    // Banking (view only)
    'banking.view',

    // View other modules
    'sales.view',
    'purchases.view',
    'assets.view',
    'tax.view',

    // Settings (view only)
    'settings.view',
  ],

  viewer: [
    // Read-only access to most modules
    'users.view',
    'roles.view',
    'company.view',
    'accounting.view',
    'reports.view',
    'banking.view',
    'sales.view',
    'purchases.view',
    'assets.view',
    'tax.view',
    'settings.view',
  ],

  employee: [
    // Limited access - can only view/create own records
    'sales.view',
    'purchases.view',
    'banking.view',

    // Settings (view only profile)
    'settings.view',
  ],
};

/**
 * Hook return type
 */
interface UsePermissionsReturn {
  /**
   * Check if user has a specific permission
   */
  hasPermission: (permission: Permission) => boolean;

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions: (permissions: Permission[]) => boolean;

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission: (permissions: Permission[]) => boolean;

  /**
   * User's role
   */
  role: UserRole | null;

  /**
   * All permissions for user's role
   */
  permissions: Permission[];

  /**
   * Is the data still loading?
   */
  loading: boolean;
}

/**
 * Extract user role from user metadata
 *
 * @param user - Supabase user object
 * @returns User role or null
 */
function extractUserRole(user: User | null): UserRole | null {
  if (!user) return null;

  // Check user_metadata for role
  const role = user?.user_metadata?.role;
  if (role && ROLE_PERMISSIONS[role as UserRole]) {
    return role as UserRole;
  }

  // Check app_metadata for role
  const appRole = user?.app_metadata?.role;
  if (appRole && ROLE_PERMISSIONS[appRole as UserRole]) {
    return appRole as UserRole;
  }

  // Check user's role from user_roles (via custom claim)
  const customRole = user?.user_metadata?.role_name?.toLowerCase();
  if (customRole) {
    // Map role names to UserRole enum
    const roleMap: Record<string, UserRole> = {
      admin: 'admin',
      manager: 'manager',
      accountant: 'accountant',
      viewer: 'viewer',
      employee: 'employee',
    };
    return roleMap[customRole] || null;
  }

  return null;
}

/**
 * Permission Hook
 *
 * Provides permission checking functions for role-based access control.
 *
 * @example
 * function ProtectedButton() {
 *   const { hasPermission } = usePermissions();
 *
 *   if (!hasPermission('users.delete')) {
 *     return null;
 *   }
 *
 *   return <button>Delete User</button>;
 * }
 */
export function usePermissions(): UsePermissionsReturn {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Extract role from user
  useEffect(() => {
    if (!authLoading) {
      const extractedRole = extractUserRole(user);
      setRole(extractedRole);
      setLoading(false);
    }
  }, [user, authLoading]);

  // Get permissions for role
  const permissions = role ? ROLE_PERMISSIONS[role] : [];

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: Permission): boolean => {
    if (!role) return false;
    return permissions.includes(permission);
  };

  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = (requiredPermissions: Permission[]): boolean => {
    if (!role) return false;
    return requiredPermissions.every(permission => permissions.includes(permission));
  };

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = (requiredPermissions: Permission[]): boolean => {
    if (!role) return false;
    return requiredPermissions.some(permission => permissions.includes(permission));
  };

  return {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    role,
    permissions,
    loading: authLoading || loading,
  };
}

/**
 * Higher-order component for permission-based rendering
 *
 * Wraps a component and only renders it if user has the required permission.
 *
 * @example
 * <RequirePermission permission="users.delete">
 *   <DeleteButton />
 * </RequirePermission>
 */
interface RequirePermissionProps {
  permission: Permission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RequirePermission({ permission, fallback = null, children }: RequirePermissionProps) {
  const { hasPermission, loading } = usePermissions();

  if (loading) {
    return null; // Or show loading spinner
  }

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Higher-order component for multiple permissions
 *
 * Renders only if user has ALL specified permissions.
 *
 * @example
 * <RequireAll permissions={['users.edit', 'users.delete']}>
 *   <UserManagementActions />
 * </RequireAll>
 */
interface RequireAllProps {
  permissions: Permission[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RequireAll({ permissions, fallback = null, children }: RequireAllProps) {
  const { hasAllPermissions, loading } = usePermissions();

  if (loading) {
    return null;
  }

  if (!hasAllPermissions(permissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Higher-order component for requiring any of multiple permissions
 *
 * Renders if user has ANY of the specified permissions.
 *
 * @example
 * <RequireAny permissions={['sales.create', 'purchases.create']}>
 *   <CreateTransactionButton />
 * </RequireAny>
 */
interface RequireAnyProps {
  permissions: Permission[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RequireAny({ permissions, fallback = null, children }: RequireAnyProps) {
  const { hasAnyPermission, loading } = usePermissions();

  if (loading) {
    return null;
  }

  if (!hasAnyPermission(permissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook to check if user has a specific role
 *
 * @example
 * function AdminPanel() {
 *   if (!useHasRole('admin')) {
 *     return <AccessDenied />;
 *   }
 *   return <AdminContent />;
 * }
 */
export function useHasRole(requiredRole: UserRole): boolean {
  const { role, loading } = usePermissions();

  if (loading) {
    return false;
  }

  return role === requiredRole;
}

/**
 * Hook to check if user has any of the specified roles
 *
 * @example
 * function ManagementPanel() {
 *   if (!useHasAnyRole(['admin', 'manager'])) {
 *     return <AccessDenied />;
 *   }
 *   return <ManagementContent />;
 * }
 */
export function useHasAnyRole(requiredRoles: UserRole[]): boolean {
  const { role, loading } = usePermissions();

  if (loading) {
    return false;
  }

  return role ? requiredRoles.includes(role) : false;
}
