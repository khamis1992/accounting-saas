/**
 * Common Utility Types
 *
 * Reusable type utilities for type-safe operations
 */

/**
 * Make specific properties required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make specific properties optional
 */
export type PartialFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make all properties nullable
 */
export type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Extract promise return type
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/**
 * Make readonly properties mutable
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * Exclude null and undefined from type
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * Extract keys of specific type
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * Extract values of object type
 */
export type ValueOf<T> = T[keyof T];

/**
 * Function type definitions
 */
export type Callback<T = void> = () => T;
export type CallbackWithParam<T, R = void> = (arg: T) => R;
export type AsyncCallback<T = void> = () => Promise<T>;
export type AsyncCallbackWithParam<T, R = void> = (arg: T) => Promise<R>;

/**
 * Event handler types
 */
export type EventHandler<T = Event> = (event: T) => void;
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>;

/**
 * Request/Response types
 */
export interface RequestConfig {
  signal?: AbortSignal;
  timeout?: number;
  retries?: number;
}

export interface RequestOptions extends RequestInit {
  signal?: AbortSignal;
  timeout?: number;
}

/**
 * Error types
 */
export interface ErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ErrorResponse {
  message: string;
  code?: string;
  statusCode?: number;
  details?: ErrorDetail[];
}

/**
 * Selection types
 */
export interface Selection<T = string> {
  selected: T[];
  toggle: (item: T) => void;
  selectAll: (items: T[]) => void;
  clear: () => void;
  isSelected: (item: T) => boolean;
}

/**
 * Sort types
 */
export interface SortConfig<T = string> {
  key: T;
  direction: 'asc' | 'desc';
}

export type SortDirection = 'asc' | 'desc';

/**
 * Filter types
 */
export interface FilterConfig {
  key: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte';
  value: unknown;
}

/**
 * Async state types
 */
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Form types
 */
export interface FormFieldError {
  message: string;
  code?: string;
}

export type FormErrors<T = Record<string, unknown>> = {
  [K in keyof T]?: FormFieldError;
};

export interface FormState<T> {
  values: T;
  errors: FormErrors<T>;
  touched: Partial<Record<keyof T, boolean>>;
  dirty: boolean;
  valid: boolean;
}

/**
 * ID types
 */
export type ID = string;
export type UUID = string;

/**
 * Date types
 */
export type ISODateString = string;
export type DateFormat = 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';

/**
 * Currency types
 */
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'SAR' | 'AED' | 'EGP' | string;

/**
 * Locale types
 */
export type Locale = 'en' | 'ar' | string;

/**
 * Pagination types
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Record types for flexible key-value pairs
 */
export type StringDictionary = Record<string, string>;
export type NumberDictionary = Record<string, number>;
export type GenericDictionary<T = unknown> = Record<string, T>;
