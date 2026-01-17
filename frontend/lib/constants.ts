/**
 * Application Constants
 *
 * Centralized constants to avoid magic numbers and strings
 * throughout the codebase (Issue #9)
 */

// ============================================
// Application Configuration
// ============================================

export const APP_CONFIG = {
  /** Default locale if none specified */
  DEFAULT_LOCALE: "en" as const,

  /** Supported locales */
  SUPPORTED_LOCALES: ["en", "ar"] as const,

  /** Application name */
  APP_NAME: "المحاسب" as const,

  /** Default timeout for API requests in milliseconds */
  API_TIMEOUT: 10000,

  /** Session check interval in milliseconds */
  SESSION_CHECK_INTERVAL: 60000,
} as const;

// ============================================
// Route Configuration
// ============================================

export const ROUTE_CONFIG = {
  /** Locale segment index in URL path */
  LOCALE_SEGMENT_INDEX: 1,

  /** Common routes */
  DASHBOARD: "/dashboard",
  SIGNIN: "/signin",
  SIGNUP: "/signup",

  /** Accounting routes */
  CHART_OF_ACCOUNTS: "/accounting/chart-of-accounts",
  GENERAL_LEDGER: "/accounting/general-ledger",
  JOURNALS: "/accounting/journals",
  TRIAL_BALANCE: "/accounting/trial-balance",

  /** Sales routes */
  CUSTOMERS: "/sales/customers",
  INVOICES: "/sales/invoices",
  QUOTATIONS: "/sales/quotations",

  /** Purchasing routes */
  VENDORS: "/purchases/vendors",
  PURCHASE_ORDERS: "/purchases/purchase-orders",

  /** Banking routes */
  BANK_ACCOUNTS: "/banking/accounts",
  BANK_RECONCILIATION: "/banking/reconciliation",

  /** Reports routes */
  FINANCIAL_STATEMENTS: "/reports/financial-statements",
  VAT_REPORTS: "/reports/vat",

  /** Settings routes */
  PROFILE: "/settings/profile",
  USERS: "/settings/users",
  FISCAL_YEARS: "/settings/fiscal-years",
} as const;

// ============================================
// Pagination Configuration
// ============================================

export const PAGINATION = {
  /** Default page size */
  DEFAULT_PAGE_SIZE: 20,

  /** Page size options */
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],

  /** Maximum page size */
  MAX_PAGE_SIZE: 100,
} as const;

// ============================================
// Date & Time Configuration
// ============================================

export const DATE_CONFIG = {
  /** Default timezone */
  TIMEZONE: "Asia/Qatar" as const,

  /** Date format for display */
  DISPLAY_FORMAT: "dd/MM/yyyy" as const,

  /** Date format for input */
  INPUT_FORMAT: "yyyy-MM-dd" as const,

  /** Date format for API */
  API_FORMAT: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx" as const,
} as const;

// ============================================
// Validation Rules
// ============================================

export const VALIDATION = {
  /** Password requirements */
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: false,
  },

  /** Email validation */
  EMAIL: {
    MAX_LENGTH: 255,
    PATTERN: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
  },

  /** Phone number validation (Qatar) */
  PHONE: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 15,
    PATTERN: /^[+]?[0-9]{10,15}$/,
  },

  /** Text field limits */
  TEXT: {
    SHORT_MAX: 50,
    MEDIUM_MAX: 255,
    LONG_MAX: 1000,
    VERY_LONG_MAX: 5000,
  },

  /** Numeric field limits */
  NUMBER: {
    DECIMAL_PLACES: 2,
    MAX_PRECISION: 18,
  },

  /** Account code validation */
  ACCOUNT_CODE: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[0-9.-]+$/,
  },
} as const;

// ============================================
// Currency Configuration
// ============================================

export const CURRENCY = {
  /** Default currency */
  DEFAULT: "QAR" as const,

  /** Supported currencies */
  SUPPORTED: ["QAR", "USD", "EUR", "GBP", "AED"] as const,

  /** Currency symbols */
  SYMBOLS: {
    QAR: "ر.ق",
    USD: "$",
    EUR: "€",
    GBP: "£",
    AED: "د.إ",
  } as const,

  /** Decimal places for currency */
  DECIMAL_PLACES: 2,
} as const;

// ============================================
// VAT Configuration
// ============================================

export const VAT = {
  /** Standard VAT rate in Qatar (%) */
  STANDARD_RATE: 5,

  /** VAT account codes */
  ACCOUNT_CODES: {
    OUTPUT: "2201", // VAT Output
    INPUT: "2202", // VAT Input
  } as const,

  /** VAT types */
  TYPES: {
    STANDARD: "standard",
    ZERO_RATED: "zero_rated",
    EXEMPT: "exempt",
    OUT_OF_SCOPE: "out_of_scope",
  } as const,
} as const;

// ============================================
// File Upload Configuration
// ============================================

export const FILE_UPLOAD = {
  /** Maximum file size in bytes (5MB) */
  MAX_FILE_SIZE: 5 * 1024 * 1024,

  /** Allowed file types */
  ALLOWED_TYPES: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],

  /** Maximum file name length */
  MAX_FILENAME_LENGTH: 255,
} as const;

// ============================================
// Retry Configuration
// ============================================

export const RETRY = {
  /** Maximum number of retry attempts */
  MAX_ATTEMPTS: 3,

  /** Base delay for retry in milliseconds */
  BASE_DELAY_MS: 1000,

  /** Maximum delay between retries in milliseconds */
  MAX_DELAY_MS: 30000,

  /** Status codes that should trigger retry */
  RETRYABLE_STATUS_CODES: [408, 429, 500, 502, 503, 504],
} as const;

// ============================================
// Animation Configuration
// ============================================

export const ANIMATION = {
  /** Default animation duration in milliseconds */
  DEFAULT_DURATION: 300,

  /** Fast animation duration */
  FAST_DURATION: 150,

  /** Slow animation duration */
  SLOW_DURATION: 500,

  /** Easing function */
  EASING: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

// ============================================
// Breakpoints
// ============================================

export const BREAKPOINTS = {
  /** Mobile breakpoint */
  SM: 640,

  /** Tablet breakpoint */
  MD: 768,

  /** Desktop breakpoint */
  LG: 1024,

  /** Large desktop breakpoint */
  XL: 1280,

  /** Extra large desktop breakpoint */
  "2XL": 1536,
} as const;

// ============================================
// Storage Keys
// ============================================

export const STORAGE_KEYS = {
  /** Locale preference */
  LOCALE: "app_locale",

  /** Theme preference */
  THEME: "app_theme",

  /** Sidebar state */
  SIDEBAR_COLLAPSED: "sidebar_collapsed",

  /** Recent items */
  RECENT_ITEMS: "recent_items",

  /** Favorites */
  FAVORITES: "favorites",

  /** User currency preference */
  USER_CURRENCY: "user_currency",

  /** Auto-save drafts */
  DRAFT_PREFIX: "draft_",
} as const;

// ============================================
// Error Messages
// ============================================

export const ERROR_MESSAGES = {
  /** Network error */
  NETWORK_ERROR: "Network error. Please check your connection.",

  /** Timeout error */
  TIMEOUT_ERROR: "Request timeout. Please try again.",

  /** Unauthorized error */
  UNAUTHORIZED: "You are not authorized to perform this action.",

  /** Not found error */
  NOT_FOUND: "The requested resource was not found.",

  /** Validation error */
  VALIDATION_ERROR: "Please check your input and try again.",

  /** Server error */
  SERVER_ERROR: "A server error occurred. Please try again later.",

  /** Unknown error */
  UNKNOWN_ERROR: "An unexpected error occurred.",
} as const;

// ============================================
// Success Messages
// ============================================

export const SUCCESS_MESSAGES = {
  /** Created successfully */
  CREATED: "Created successfully",

  /** Updated successfully */
  UPDATED: "Updated successfully",

  /** Deleted successfully */
  DELETED: "Deleted successfully",

  /** Saved successfully */
  SAVED: "Saved successfully",

  /** Submitted successfully */
  SUBMITTED: "Submitted successfully",

  /** Approved successfully */
  APPROVED: "Approved successfully",

  /** Rejected successfully */
  REJECTED: "Rejected successfully",
} as const;

// ============================================
// Status Types
// ============================================

export const STATUS_TYPES = {
  /** Invoice/Journal statuses */
  DRAFT: "draft",
  SUBMITTED: "submitted",
  APPROVED: "approved",
  POSTED: "posted",
  PAID: "paid",
  PARTIALLY_PAID: "partially_paid",
  OVERDUE: "overdue",
  CANCELLED: "cancelled",

  /** User statuses */
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
} as const;

// ============================================
// Type Guards
// ============================================

/**
 * Check if a value is a valid locale
 */
export function isValidLocale(value: string): value is "en" | "ar" {
  return ["en", "ar"].includes(value as "en" | "ar");
}

/**
 * Check if a value is a valid currency code
 */
export function isValidCurrency(value: string): value is keyof typeof CURRENCY.SYMBOLS {
  return CURRENCY.SUPPORTED.includes(value as "QAR" | "USD" | "EUR" | "GBP" | "AED");
}

/**
 * Check if a file type is allowed for upload
 */
export function isAllowedFileType(mimeType: string): boolean {
  return FILE_UPLOAD.ALLOWED_TYPES.includes(mimeType as (typeof FILE_UPLOAD.ALLOWED_TYPES)[number]);
}

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

// ============================================
// UI Configuration
// ============================================

export const UI = {
  /** Default animation duration in milliseconds */
  DEFAULT_ANIMATION_DURATION: 300,

  /** Fast animation duration */
  FAST_ANIMATION_DURATION: 150,

  /** Slow animation duration */
  SLOW_ANIMATION_DURATION: 500,

  /** Debounce delay for search inputs in milliseconds */
  SEARCH_DEBOUNCE_MS: 300,

  /** Throttle delay for scroll events in milliseconds */
  SCROLL_THROTTLE_MS: 100,

  /** Default delay before showing loading state */
  LOADING_DELAY_MS: 200,

  /** Maximum modal height percentage */
  MAX_MODAL_HEIGHT_PCT: 90,

  /** Default toast duration in milliseconds */
  TOAST_DURATION_MS: 4000,

  /** Default input max length */
  DEFAULT_INPUT_MAX_LENGTH: 255,

  /** Textarea default rows */
  TEXTAREA_DEFAULT_ROWS: 3,

  /** Textarea max rows */
  TEXTAREA_MAX_ROWS: 10,

  /** Number of skeleton items to show in list */
  SKELETON_ITEMS_COUNT: 5,

  /** Number of skeleton rows in table */
  SKELETON_TABLE_ROWS: 5,

  /** Number of skeleton columns in table */
  SKELETON_TABLE_COLUMNS: 4,
} as const;

// ============================================
// Form Configuration
// ============================================

export const FORM = {
  /** Default form submission timeout in milliseconds */
  SUBMISSION_TIMEOUT_MS: 30000,

  /** Delay before showing form submission state */
  SUBMIT_LOADING_DELAY_MS: 500,

  /** Form reset delay after successful submission */
  SUCCESS_RESET_DELAY_MS: 1500,

  /** Default decimal precision for currency inputs */
  CURRENCY_DECIMALS: 2,

  /** Default decimal precision for percentage inputs */
  PERCENTAGE_DECIMALS: 1,

  /** Default number of rows for textarea inputs */
  TEXTAREA_DEFAULT_ROWS: 3,

  /** Minimum journal lines required */
  MIN_JOURNAL_LINES: 2,

  /** Maximum journal lines allowed */
  MAX_JOURNAL_LINES: 20,

  /** Maximum invoice lines allowed */
  MAX_INVOICE_LINES: 50,
} as const;

// ============================================
// Table Configuration
// ============================================

export const TABLE = {
  /** Default number of rows per page */
  DEFAULT_ROWS_PER_PAGE: 20,

  /** Rows per page options */
  ROWS_PER_PAGE_OPTIONS: [10, 20, 50, 100],

  /** Maximum rows per page */
  MAX_ROWS_PER_PAGE: 100,

  /** Minimum column width in pixels */
  MIN_COLUMN_WIDTH: 80,

  /** Default column width in pixels */
  DEFAULT_COLUMN_WIDTH: 150,
} as const;

// ============================================
// Chart Configuration
// ============================================

export const CHART = {
  /** Default chart height in pixels */
  DEFAULT_HEIGHT: 300,

  /** Small chart height */
  SMALL_HEIGHT: 200,

  /** Large chart height */
  LARGE_HEIGHT: 400,

  /** Default number of data points for trend charts */
  DEFAULT_DATA_POINTS: 12,

  /** Maximum data points for performance */
  MAX_DATA_POINTS: 100,
} as const;

// ============================================
// Validation Thresholds
// ============================================

export const THRESHOLDS = {
  /** Balance tolerance for journal entries */
  JOURNAL_BALANCE_TOLERANCE: 0.01,

  /** Minimum amount for payment allocation */
  MIN_PAYMENT_ALLOCATION: 0.01,

  /** Maximum payment over-allocation tolerance */
  PAYMENT_OVER_ALLOCATION_TOLERANCE: 0.01,

  /** Minimum search query length */
  MIN_SEARCH_LENGTH: 2,

  /** Maximum search query length */
  MAX_SEARCH_LENGTH: 100,
} as const;
