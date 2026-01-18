/**
 * Application Constants
 *
 * Central repository for all magic strings, numbers, and configuration values.
 * This file improves maintainability by providing a single source of truth.
 *
 * @author Frontend Team
 * @created 2025-01-17
 */

/**
 * Navigation and routing constants
 */
export const NAVIGATION = {
  ROUTES: {
    DASHBOARD: "/dashboard",
    SIGN_IN: "/signin",
    SIGN_UP: "/signup",
    SETTINGS: "/settings",
  } as const,
  LOCALE_PATTERN: "/[locale]",
  QUERY_PARAMS: {
    REDIRECT_TO: "redirectTo",
    TAB: "tab",
    PAGE: "page",
    SORT: "sort",
    ORDER: "order",
    SEARCH: "search",
    FILTER: "filter",
  } as const,
} as const;

/**
 * Authentication constants
 */
export const AUTH = {
  COOKIE_NAMES: {
    ACCESS_TOKEN: "access_token",
    REFRESH_TOKEN: "refresh_token",
  } as const,
  ERROR_CODES: {
    INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
    SESSION_EXPIRED: "SESSION_EXPIRED",
    UNAUTHORIZED: "UNAUTHORIZED",
    FORBIDDEN: "FORBIDDEN",
  } as const,
} as const;

/**
 * UI/UX constants
 */
export const UI = {
  ANIMATION: {
    DURATION: {
      FAST: 150,
      NORMAL: 300,
      SLOW: 500,
    } as const,
    EASING: {
      DEFAULT: "ease-in-out",
      IN: "ease-in",
      OUT: "ease-out",
    } as const,
  } as const,
  TOAST: {
    DURATION: {
      SHORT: 2000,
      NORMAL: 3000,
      LONG: 5000,
    } as const,
  } as const,
  BREAKPOINTS: {
    SM: "640px",
    MD: "768px",
    LG: "1024px",
    XL: "1280px",
    "2XL": "1536px",
  } as const,
  Z_INDEX: {
    DROPDOWN: 1000,
    STICKY: 1020,
    FIXED: 1030,
    MODAL_BACKDROP: 1040,
    MODAL: 1050,
    POPOVER: 1060,
    TOOLTIP: 1070,
  } as const,
} as const;

/**
 * Form and validation constants
 */
export const FORM = {
  VALIDATION: {
    EMAIL_MAX_LENGTH: 255,
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
  } as const,
  ERROR_MESSAGES: {
    REQUIRED: "This field is required",
    INVALID_EMAIL: "Please enter a valid email address",
    PASSWORD_TOO_SHORT: "Password must be at least 8 characters",
    PASSWORDS_DONT_MATCH: "Passwords do not match",
  } as const,
} as const;

/**
 * Data table constants
 */
export const TABLE = {
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [5, 10, 20, 50, 100] as const,
  } as const,
  SORTING: {
    DEFAULT_DIRECTION: "asc" as const,
    DIRECTIONS: ["asc", "desc"] as const,
  } as const,
} as const;

/**
 * Date and time constants
 */
export const DATETIME = {
  FORMATS: {
    DATE_ONLY: "yyyy-MM-dd",
    TIME_ONLY: "HH:mm:ss",
    DATE_TIME: "yyyy-MM-dd HH:mm:ss",
    DISPLAY_DATE: "MMM dd, yyyy",
    DISPLAY_DATE_TIME: "MMM dd, yyyy HH:mm",
  } as const,
  TIMEZONES: {
    UTC: "UTC",
  } as const,
} as const;

/**
 * File upload constants
 */
export const FILE_UPLOAD = {
  MAX_SIZE: {
    IMAGE: 5 * 1024 * 1024, // 5MB
    DOCUMENT: 10 * 1024 * 1024, // 10MB
  } as const,
  ALLOWED_TYPES: {
    IMAGES: ["image/jpeg", "image/png", "image/gif", "image/webp"] as const,
    DOCUMENTS: ["application/pdf", "text/csv"] as const,
  } as const,
} as const;

/**
 * Feature flags and toggle constants
 */
export const FEATURES = {
  COMMAND_PALETTE: true,
  ANIMATIONS: true,
  DARK_MODE: true,
  BREADCRUMBS: true,
} as const;

/**
 * Keyboard shortcuts
 */
export const KEYBOARD = {
  SHORTCUTS: {
    COMMAND_PALETTE: "Ctrl+K",
    SEARCH: "Ctrl+F",
    SAVE: "Ctrl+S",
  } as const,
} as const;

/**
 * Type definitions for constants
 */
export type NavigationRoute = (typeof NAVIGATION.ROUTES)[keyof typeof NAVIGATION.ROUTES];
export type QueryParam = (typeof NAVIGATION.QUERY_PARAMS)[keyof typeof NAVIGATION.QUERY_PARAMS];
export type AuthErrorCode = (typeof AUTH.ERROR_CODES)[keyof typeof AUTH.ERROR_CODES];
export type AnimationDuration = (typeof UI.ANIMATION.DURATION)[keyof typeof UI.ANIMATION.DURATION];
