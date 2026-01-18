/**
 * Expenses API
 * All expense-related API calls
 */

import { apiClient } from "./client";

export type ExpenseStatus = "pending" | "approved" | "rejected" | "paid";
export type ExpenseCategory =
  | "supplies"
  | "travel"
  | "meals"
  | "utilities"
  | "rent"
  | "marketing"
  | "other";

export interface Expense {
  id: string;
  tenant_id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  vendor_name?: string;
  vendor_id?: string;
  employee_id?: string;
  employee_name?: string;
  amount: number;
  currency: string;
  status: ExpenseStatus;
  receipt_url?: string;
  receipt_file_name?: string;
  notes?: string;
  rejection_reason?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseDto {
  date: Date | string;
  category: ExpenseCategory;
  description: string;
  vendor_name?: string;
  vendor_id?: string;
  amount: number;
  currency?: string;
  notes?: string;
}

// Alias for backward compatibility
export type ExpenseCreateDto = CreateExpenseDto;

export interface UpdateExpenseDto {
  date?: Date | string;
  category?: ExpenseCategory;
  description?: string;
  vendor_name?: string;
  vendor_id?: string;
  amount?: number;
  currency?: string;
  notes?: string;
}

export interface ExpenseFilters {
  category?: ExpenseCategory;
  status?: ExpenseStatus;
  employee_id?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;
}

export interface ExpenseSummary {
  totalThisMonth: number;
  pendingApproval: number;
  thisWeek: number;
  byCategory: Record<ExpenseCategory, number>;
}

export const expensesApi = {
  /**
   * Get all expenses with optional filters
   */
  async getAll(filters?: ExpenseFilters): Promise<Expense[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append("category", filters.category);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.employee_id) params.append("employee_id", filters.employee_id);
    if (filters?.start_date) params.append("start_date", filters.start_date);
    if (filters?.end_date) params.append("end_date", filters.end_date);
    if (filters?.min_amount) params.append("min_amount", String(filters.min_amount));
    if (filters?.max_amount) params.append("max_amount", String(filters.max_amount));
    if (filters?.search) params.append("search", filters.search);

    const query = params.toString();
    const response = await apiClient.get<Expense[]>(
      query ? `/expenses?${query}` : "/expenses"
    );
    return response.data || [];
  },

  /**
   * Get expense by ID
   */
  async getById(id: string): Promise<Expense> {
    const response = await apiClient.get<Expense>(`/expenses/${id}`);
    return response.data as Expense;
  },

  /**
   * Create new expense
   */
  async create(data: CreateExpenseDto): Promise<Expense> {
    const payload = {
      ...data,
      date: typeof data.date === 'string' ? data.date : data.date.toISOString(),
    };
    const response = await apiClient.post<Expense>("/expenses", payload);
    return response.data as Expense;
  },

  /**
   * Update expense
   */
  async update(id: string, data: UpdateExpenseDto): Promise<Expense> {
    const payload = {
      ...data,
      date: data.date ? (typeof data.date === 'string' ? data.date : data.date.toISOString()) : undefined,
    };
    const response = await apiClient.put<Expense>(`/expenses/${id}`, payload);
    return response.data as Expense;
  },

  /**
   * Delete expense (only pending expenses)
   */
  async delete(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/expenses/${id}`);
    return response.data as { success: boolean };
  },

  /**
   * Approve expense
   */
  async approve(id: string): Promise<Expense> {
    const response = await apiClient.post<Expense>(`/expenses/${id}/approve`, {});
    return response.data as Expense;
  },

  /**
   * Reject expense
   */
  async reject(id: string, reason?: string): Promise<Expense> {
    const response = await apiClient.post<Expense>(`/expenses/${id}/reject`, { reason });
    return response.data as Expense;
  },

  /**
   * Upload receipt for expense
   */
  async uploadReceipt(id: string, file: File): Promise<Expense> {
    const formData = new FormData();
    formData.append("receipt", file);

    const response = await apiClient.upload<{ data: Expense }>(
      `/expenses/${id}/receipt`,
      formData,
      { method: "POST" }
    );

    return response.data as unknown as Expense;
  },

  /**
   * Get expense summary statistics
   */
  async getSummary(): Promise<ExpenseSummary> {
    const response = await apiClient.get<ExpenseSummary>("/expenses/summary");
    return response.data as ExpenseSummary;
  },

  /**
   * Export expenses to Excel
   */
  async exportToExcel(filters?: ExpenseFilters): Promise<void> {
    const filtersObj: Record<string, any> = {};
    if (filters?.category) filtersObj.category = filters.category;
    if (filters?.status) filtersObj.status = filters.status;
    if (filters?.employee_id) filtersObj.employee_id = filters.employee_id;
    if (filters?.start_date) filtersObj.start_date = filters.start_date;
    if (filters?.end_date) filtersObj.end_date = filters.end_date;
    if (filters?.min_amount) filtersObj.min_amount = filters.min_amount;
    if (filters?.max_amount) filtersObj.max_amount = filters.max_amount;
    if (filters?.search) filtersObj.search = filters.search;

    return apiClient.download("/expenses/export/excel", filtersObj);
  },
};
