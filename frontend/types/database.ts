/**
 * Database Function Type Definitions
 *
 * Provides TypeScript types for Supabase RPC functions and database
 * operations to ensure type safety when calling database functions.
 */

/**
 * Tenant ID type (UUID)
 */
export type TenantId = string;

/**
 * User ID type (UUID)
 */
export type UserId = string;

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  has_permission: boolean;
  error?: string;
}

/**
 * User permission structure
 */
export interface UserPermission {
  module: string;
  action: string;
  resource: string;
}

/**
 * User permissions result
 */
export interface UserPermissionsResult {
  permissions: UserPermission[];
}

/**
 * Database function signatures for Supabase RPC calls
 */
export interface DatabaseFunctions {
  /**
   * Get current user's tenant ID
   *
   * @returns UUID of user's tenant
   *
   * @example
   * ```typescript
   * const { data } = await supabase.rpc('get_current_user_tenant');
   * const tenantId = data as TenantId;
   * ```
   */
  get_current_user_tenant: {
    Args: Record<string, never>;
    Returns: TenantId;
  };

  /**
   * Check if user has specific permission
   *
   * @param user_id - User ID to check
   * @param p_module - Module name (e.g., 'coa', 'journals')
   * @param p_action - Action (e.g., 'create', 'edit', 'delete', 'view')
   * @param p_resource - Optional specific resource
   * @returns True if user has permission
   *
   * @example
   * ```typescript
   * const { data } = await supabase.rpc('user_has_permission', {
   *   user_id: userId,
   *   p_module: 'journals',
   *   p_action: 'create',
   *   p_resource: '*'
   * });
   * const hasPermission = data as boolean;
   * ```
   */
  user_has_permission: {
    Args: {
      user_id: UserId;
      p_module: string;
      p_action: string;
      p_resource?: string;
    };
    Returns: boolean;
  };

  /**
   * Get all permissions for a user
   *
   * @param user_id - User ID to get permissions for
   * @returns Array of permissions
   *
   * @example
   * ```typescript
   * const { data } = await supabase.rpc('get_user_permissions', {
   *   user_id: userId
   * });
   * const permissions = data as UserPermission[];
   * ```
   */
  get_user_permissions: {
    Args: {
      user_id: UserId;
    };
    Returns: UserPermissionsResult["permissions"];
  };

  /**
   * Check if user is platform super admin
   *
   * @param user_id - User ID to check
   * @returns True if user is super admin
   *
   * @example
   * ```typescript
   * const { data } = await supabase.rpc('is_platform_super_admin', {
   *   user_id: userId
   * });
   * const isAdmin = data as boolean;
   * ```
   */
  is_platform_super_admin: {
    Args: {
      user_id: UserId;
    };
    Returns: boolean;
  };
}

/**
 * Type-safe RPC function wrapper
 *
 * Helps ensure correct parameters when calling Supabase RPC functions.
 *
 * @example
 * ```typescript
 * import { supabase } from '@/lib/supabase/client';
 *
 * // Type-safe call
 * const tenantId = await rpcFunction(
 *   supabase,
 *   'get_current_user_tenant'
 * );
 *
 * // With parameters
 * const hasPermission = await rpcFunction(
 *   supabase,
 *   'user_has_permission',
 *   {
 *     user_id: userId,
 *     p_module: 'journals',
 *     p_action: 'create'
 *   }
 * );
 * ```
 */
export async function rpcFunction<K extends keyof DatabaseFunctions>(
  supabase: any,
  functionName: K,
  args?: DatabaseFunctions[K]["Args"]
): Promise<DatabaseFunctions[K]["Returns"]> {
  const { data, error } = await supabase.rpc(functionName, args);

  if (error) {
    throw error;
  }

  return data as DatabaseFunctions[K]["Returns"];
}

/**
 * Database table types
 */

export interface Tenant {
  id: TenantId;
  name_en: string;
  name_ar: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: UserId;
  tenant_id: TenantId;
  email: string;
  first_name_en: string;
  last_name_en: string;
  first_name_ar: string;
  last_name_ar: string;
  phone?: string;
  avatar_url?: string;
  default_branch_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  tenant_id: TenantId;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: UserId;
  role_id: string;
  tenant_id: TenantId;
  assigned_at: string;
  assigned_by: UserId;
}

/**
 * Common table types
 */

export interface Timestamped {
  created_at: string;
  updated_at: string;
}

export interface SoftDeletable {
  deleted_at?: string;
}

export interface TenantScoped {
  tenant_id: TenantId;
}

export interface UserScoped {
  created_by: UserId;
  updated_by?: UserId;
}
