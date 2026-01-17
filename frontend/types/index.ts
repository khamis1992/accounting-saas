/**
 * Central Type Definitions
 *
 * Export all shared types used across the application.
 * This ensures type consistency and makes imports easier.
 */

// ============================================================================
// Database & Supabase Types
// ============================================================================

export * from "./database";
export * from "./supabase";

// ============================================================================
// API Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  user?: User;
  session?: Session;
  tenant?: Tenant;
  accessToken?: string;
  refreshToken?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================================================
// Filter Types
// ============================================================================

export interface DateRange {
  from?: string;
  to?: string;
}

export interface StatusFilter {
  status?: string;
}

export interface SearchFilter {
  search?: string;
}

export type BaseFilters = DateRange & StatusFilter & SearchFilter;

// ============================================================================
// Domain Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user?: User;
}

export interface Tenant {
  id: string;
  name: string;
  nameAr?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  logo?: string;
  fiscalYearStart?: string;
  currency?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  accountType: string;
  parent_id?: string | null;
  balance?: number;
  currency?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  contactPerson?: string;
  creditLimit?: number;
  balance?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Vendor {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  contactPerson?: string;
  paymentTerms?: number;
  balance?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: "sales" | "purchase";
  customerId?: string;
  vendorId?: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  paidAmount?: number;
  balance?: number;
  status: "draft" | "sent" | "paid" | "partial" | "overdue" | "cancelled";
  notes?: string;
  items?: InvoiceItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceItem {
  id?: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  discount?: number;
  total: number;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  type: "receivable" | "payable";
  customerId?: string;
  vendorId?: string;
  invoiceId?: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  reference?: string;
  notes?: string;
  status: "pending" | "completed" | "cancelled";
  createdAt?: string;
  updatedAt?: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  description?: string;
  status: "draft" | "posted" | "void";
  lines?: JournalLine[];
  createdAt?: string;
  updatedAt?: string;
}

export interface JournalLine {
  id?: string;
  accountId: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface FixedAsset {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  categoryId?: string;
  location?: string;
  purchaseDate: string;
  purchaseCost: number;
  salvageValue?: number;
  usefulLife: number;
  depreciationMethod: "straight-line" | "declining-balance" | "units-of-production";
  currentValue?: number;
  accumulatedDepreciation?: number;
  status: "active" | "disposed" | "fully-depreciated";
  createdAt?: string;
  updatedAt?: string;
}

export interface BankAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  accountType: "checking" | "savings" | "credit";
  currency: string;
  balance?: number;
  isActive?: boolean;
  lastReconciledDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Expense {
  id: string;
  expenseNumber: string;
  vendorId?: string;
  categoryId?: string;
  amount: number;
  currency: string;
  expenseDate: string;
  paymentMethod?: string;
  description?: string;
  status: "pending" | "approved" | "paid" | "rejected";
  receiptUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  vendorId?: string;
  orderDate: string;
  expectedDate?: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: "draft" | "sent" | "approved" | "received" | "cancelled";
  notes?: string;
  items?: InvoiceItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  customerId?: string;
  validUntil?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount?: number;
  total: number;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired" | "converted";
  notes?: string;
  items?: InvoiceItem[];
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// UI Component Props Types
// ============================================================================

export interface TableColumn<T = unknown> {
  key: string;
  title: string;
  titleAr?: string;
  sortable?: boolean;
  width?: string | number;
  render?: (value: unknown, record: T) => React.ReactNode;
}

export interface TableProps<T = unknown> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: PaginationParams;
  onRowClick?: (record: T) => void;
  onSort?: (sortBy: string, sortOrder: "asc" | "desc") => void;
}

export interface FormFieldProps {
  name: string;
  label?: string;
  labelAr?: string;
  type?: "text" | "number" | "email" | "password" | "date" | "select" | "textarea";
  placeholder?: string;
  placeholderAr?: string;
  required?: boolean;
  disabled?: boolean;
  options?: Array<{ value: string; label: string; labelAr?: string }>;
  validation?: (value: unknown) => string | undefined;
}

// ============================================================================
// Feature Flag Types
// ============================================================================

export interface FeatureFlags {
  enableCommandPalette: boolean;
  enableAnimations: boolean;
  enableFavorites: boolean;
  enableRecentItems: boolean;
  enableEnhancedNavigation: boolean;
  enableAdvancedReports: boolean;
  enableMultiCurrency: boolean;
  enableInventory: boolean;
}

// ============================================================================
// Navigation Types
// ============================================================================

export interface NavItem {
  title: string;
  titleAr?: string;
  href: string;
  icon?: string;
  children?: NavItem[];
  badge?: string | number;
  roles?: string[];
}

export interface BreadcrumbItem {
  title: string;
  titleAr?: string;
  href?: string;
}

// ============================================================================
// Report Types
// ============================================================================

export interface ReportFilters extends BaseFilters {
  accountId?: string;
  customerId?: string;
  vendorId?: string;
  currency?: string;
}

export interface ReportData {
  title: string;
  titleAr?: string;
  data: unknown[];
  summary?: Record<string, number | string>;
  generatedAt: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Nullable<T> = T | null;
export type MaybePromise<T> = T | Promise<T>;

export interface AsyncState<T = unknown> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: BodyInit | null;
  signal?: AbortSignal;
}
