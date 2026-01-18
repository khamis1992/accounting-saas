/**
 * Type-safe Supabase utilities
 *
 * Provides type-safe wrappers for Supabase user metadata and
 * common operations to prevent runtime errors.
 */

import { User } from "@supabase/supabase-js";

/**
 * User metadata interface
 *
 * Defines the structure of user metadata stored in Supabase auth.
 * Additional properties may exist but won't be type-safe.
 */
export interface UserMetadata {
  /** User's full name */
  full_name?: string;

  /** Company/organization name */
  company_name?: string;

  /** Profile avatar URL */
  avatar_url?: string;

  /** User's preferred locale (en, ar) */
  locale?: string;

  /** Whether user is a platform admin */
  is_platform_admin?: boolean;

  /** User's role within tenant */
  role?: string;

  /** Additional metadata properties */
  [key: string]: unknown;
}

/**
 * Extended App user with typed metadata
 */
export interface AppUser extends User {
  user_metadata: UserMetadata;
}

/**
 * Type guard to check if value is a valid UserMetadata object
 */
function isValidUserMetadata(data: unknown): data is UserMetadata {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const metadata = data as Record<string, unknown>;

  // Check optional properties have correct types if present
  if (metadata.full_name !== undefined && typeof metadata.full_name !== "string") {
    return false;
  }

  if (metadata.company_name !== undefined && typeof metadata.company_name !== "string") {
    return false;
  }

  if (metadata.avatar_url !== undefined && typeof metadata.avatar_url !== "string") {
    return false;
  }

  if (metadata.locale !== undefined && typeof metadata.locale !== "string") {
    return false;
  }

  return true;
}

/**
 * Safely extract user metadata from a Supabase User object
 *
 * @param user - Supabase User object (can be null)
 * @returns Typed UserMetadata object (empty object if user is null)
 *
 * @example
 * ```typescript
 * const metadata = getUserMetadata(user);
 * console.log(metadata.company_name); // Type-safe access
 * ```
 */
export function getUserMetadata(user: User | null): UserMetadata {
  if (!user) {
    return {};
  }

  const rawMetadata = user.user_metadata;

  if (!rawMetadata || typeof rawMetadata !== "object") {
    console.warn("Invalid user metadata format:", rawMetadata);
    return {};
  }

  if (!isValidUserMetadata(rawMetadata)) {
    console.warn("User metadata failed type validation:", rawMetadata);
    return {};
  }

  return rawMetadata;
}

/**
 * Get tenant name from user metadata
 *
 * Tries to get company_name first, falls back to full_name,
 * then defaults to Arabic text for "Accountant".
 *
 * @param user - Supabase User object (can be null)
 * @returns Tenant name as string
 *
 * @example
 * ```typescript
 * const tenantName = getTenantName(user);
 * // Returns: "Acme Corp" or "John Doe" or "المحاسب"
 * ```
 */
export function getTenantName(user: User | null): string {
  const metadata = getUserMetadata(user);
  return metadata.company_name || metadata.full_name || "المحاسب";
}

/**
 * Get user's display name
 *
 * Prioritizes full_name over company_name.
 *
 * @param user - Supabase User object (can be null)
 * @returns Display name as string
 */
export function getUserDisplayName(user: User | null): string {
  const metadata = getUserMetadata(user);
  return metadata.full_name || metadata.company_name || "User";
}

/**
 * Get user's avatar URL
 *
 * @param user - Supabase User object (can be null)
 * @returns Avatar URL or undefined
 */
export function getUserAvatar(user: User | null): string | undefined {
  const metadata = getUserMetadata(user);
  return metadata.avatar_url;
}

/**
 * Get user's preferred locale
 *
 * @param user - Supabase User object (can be null)
 * @param defaultLocale - Default locale if not set (default: 'en')
 * @returns Locale code ('en' or 'ar')
 */
export function getUserLocale(user: User | null, defaultLocale: "en" | "ar" = "en"): "en" | "ar" {
  const metadata = getUserMetadata(user);

  if (metadata.locale === "en" || metadata.locale === "ar") {
    return metadata.locale;
  }

  return defaultLocale;
}

/**
 * Check if user is a platform admin
 *
 * @param user - Supabase User object (can be null)
 * @returns True if user is platform admin
 */
export function isPlatformAdmin(user: User | null): boolean {
  const metadata = getUserMetadata(user);
  return metadata.is_platform_admin === true;
}

/**
 * Type guard to check if user has valid metadata
 *
 * @param user - Supabase User object
 * @returns True if user exists and has valid metadata
 */
export function hasValidMetadata(user: User | null): user is AppUser {
  if (!user) {
    return false;
  }

  const metadata = getUserMetadata(user);
  return Object.keys(metadata).length > 0;
}

/**
 * Cast User to AppUser (unsafe - use with caution)
 *
 * Only use this when you're certain the user has valid metadata.
 * Consider using getUserMetadata() instead for safer access.
 *
 * @param user - Supabase User object
 * @returns AppUser with typed metadata
 */
export function asAppUser(user: User): AppUser {
  return user as AppUser;
}
