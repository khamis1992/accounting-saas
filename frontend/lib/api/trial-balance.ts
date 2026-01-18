/**
 * Trial Balance API
 * Handles trial balance data and exports
 */

import { apiClient } from "./client";

export interface TrialBalanceEntry {
  account_id: string;
  account_code: string;
  account_name: string;
  account_name_ar?: string;
  account_type: string;
  debit: number;
  credit: number;
}

export interface TrialBalanceSummary {
  total_debit: number;
  total_credit: number;
  is_balanced: boolean;
  difference: number;
}

export interface TrialBalanceSubtotals {
  assets: { debit: number; credit: number };
  liabilities: { debit: number; credit: number };
  equity: { debit: number; credit: number };
  revenue: { debit: number; credit: number };
  expenses: { debit: number; credit: number };
}

export interface TrialBalanceResponse {
  entries: TrialBalanceEntry[];
  summary: TrialBalanceSummary;
  subtotals: TrialBalanceSubtotals;
  as_of_date: string;
}

export interface TrialBalanceFilters {
  as_of_date?: string;
  fiscal_period_id?: string;
  show_zero_balances?: boolean;
  account_type?: string;
}

export const trialBalanceApi = {
  /**
   * Get trial balance data
   */
  async get(filters?: TrialBalanceFilters): Promise<TrialBalanceResponse> {
    const params = new URLSearchParams();
    if (filters?.as_of_date) params.append("as_of_date", filters.as_of_date);
    if (filters?.fiscal_period_id) params.append("fiscal_period_id", filters.fiscal_period_id);
    if (filters?.show_zero_balances !== undefined) {
      params.append("show_zero_balances", String(filters.show_zero_balances));
    }
    if (filters?.account_type) params.append("account_type", filters.account_type);

    const query = params.toString();
    const response = await apiClient.get<TrialBalanceResponse>(
      query ? `/accounting/trial-balance?${query}` : "/accounting/trial-balance"
    );

    return response.data as TrialBalanceResponse;
  },

  /**
   * Export trial balance to PDF
   *
   * SECURITY: Uses apiClient which handles auth via httpOnly cookies.
   * Does NOT access localStorage for tokens (prevents XSS token theft).
   */
  async exportToPDF(filters: TrialBalanceFilters): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters.as_of_date) params.append("as_of_date", filters.as_of_date);
    if (filters.fiscal_period_id) params.append("fiscal_period_id", filters.fiscal_period_id);
    if (filters.show_zero_balances !== undefined) {
      params.append("show_zero_balances", String(filters.show_zero_balances));
    }
    if (filters.account_type) params.append("account_type", filters.account_type);

    const query = params.toString();

    // SECURITY: Use apiClient's download method which handles auth via cookies
    // Do NOT use localStorage for tokens (XSS vulnerability)
    const token = apiClient.getAccessToken();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"}/accounting/trial-balance/export/pdf${query ? `?${query}` : ""}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        // SECURITY: Include credentials to send httpOnly cookies
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to export PDF");
    }

    return response.blob();
  },

  /**
   * Export trial balance to Excel
   *
   * SECURITY: Uses apiClient which handles auth via httpOnly cookies.
   * Does NOT access localStorage for tokens (prevents XSS token theft).
   */
  async exportToExcel(filters: TrialBalanceFilters): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters.as_of_date) params.append("as_of_date", filters.as_of_date);
    if (filters.fiscal_period_id) params.append("fiscal_period_id", filters.fiscal_period_id);
    if (filters.show_zero_balances !== undefined) {
      params.append("show_zero_balances", String(filters.show_zero_balances));
    }
    if (filters.account_type) params.append("account_type", filters.account_type);

    const query = params.toString();

    // SECURITY: Use apiClient's download method which handles auth via cookies
    // Do NOT use localStorage for tokens (XSS vulnerability)
    const token = apiClient.getAccessToken();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"}/accounting/trial-balance/export/excel${query ? `?${query}` : ""}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        // SECURITY: Include credentials to send httpOnly cookies
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to export Excel");
    }

    return response.blob();
  },
};
