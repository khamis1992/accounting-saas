/**
 * Financial Statements API
 * All financial statement-related API calls
 */

import { apiClient } from "./client";

export type StatementType = "balance-sheet" | "income-statement" | "cash-flow";

export interface StatementSection {
  title: string;
  title_ar?: string;
  items: StatementItem[];
  total: number;
  prior_total?: number;
  variance?: {
    amount: number;
    percentage: number;
  };
}

export interface StatementItem {
  id: string;
  account_code: string;
  account_name: string;
  account_name_ar?: string;
  amount: number;
  prior_amount?: number;
  variance?: {
    amount: number;
    percentage: number;
  };
  is_subtotal?: boolean;
  is_bold?: boolean;
  indent_level?: number;
}

export interface FinancialStatement {
  type: StatementType;
  title: string;
  title_ar?: string;
  period_start: string;
  period_end: string;
  prior_period_start?: string;
  prior_period_end?: string;
  currency: string;
  sections: StatementSection[];
  totals: {
    assets?: number;
    liabilities?: number;
    equity?: number;
    revenue?: number;
    expenses?: number;
    net_income?: number;
    net_cash_flow?: number;
  };
  generated_at: string;
}

export interface StatementFilters {
  type: StatementType;
  period_start: string;
  period_end: string;
  compare_prior?: boolean;
  show_variance?: boolean;
}

export const financialStatementsApi = {
  /**
   * Get financial statement by type
   */
  async get(filters: StatementFilters): Promise<FinancialStatement> {
    const params = new URLSearchParams();
    params.append("type", filters.type);
    params.append("period_start", filters.period_start);
    params.append("period_end", filters.period_end);
    if (filters.compare_prior !== undefined) {
      params.append("compare_prior", String(filters.compare_prior));
    }
    if (filters.show_variance !== undefined) {
      params.append("show_variance", String(filters.show_variance));
    }

    const query = params.toString();
    const response = await apiClient.get<FinancialStatement>(
      `/accounting/financial-statements?${query}`
    );
    return response.data as FinancialStatement;
  },

  /**
   * Get Balance Sheet
   */
  async getBalanceSheet(filters: Omit<StatementFilters, "type">): Promise<FinancialStatement> {
    return financialStatementsApi.get({ ...filters, type: "balance-sheet" });
  },

  /**
   * Get Income Statement
   */
  async getIncomeStatement(filters: Omit<StatementFilters, "type">): Promise<FinancialStatement> {
    return financialStatementsApi.get({
      ...filters,
      type: "income-statement",
    });
  },

  /**
   * Get Cash Flow Statement
   */
  async getCashFlowStatement(filters: Omit<StatementFilters, "type">): Promise<FinancialStatement> {
    return financialStatementsApi.get({ ...filters, type: "cash-flow" });
  },

  /**
   * Export to PDF
   */
  async exportToPDF(filters: StatementFilters): Promise<Blob> {
    const params = new URLSearchParams();
    params.append("type", filters.type);
    params.append("period_start", filters.period_start);
    params.append("period_end", filters.period_end);
    if (filters.compare_prior !== undefined) {
      params.append("compare_prior", String(filters.compare_prior));
    }
    if (filters.show_variance !== undefined) {
      params.append("show_variance", String(filters.show_variance));
    }

    const query = params.toString();
    const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"}/accounting/financial-statements/export/pdf?${query}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiClient.getAccessToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to export PDF");
    }

    return response.blob();
  },

  /**
   * Export to Excel
   */
  async exportToExcel(filters: StatementFilters): Promise<Blob> {
    const params = new URLSearchParams();
    params.append("type", filters.type);
    params.append("period_start", filters.period_start);
    params.append("period_end", filters.period_end);
    if (filters.compare_prior !== undefined) {
      params.append("compare_prior", String(filters.compare_prior));
    }
    if (filters.show_variance !== undefined) {
      params.append("show_variance", String(filters.show_variance));
    }

    const query = params.toString();
    const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"}/accounting/financial-statements/export/excel?${query}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiClient.getAccessToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to export Excel");
    }

    return response.blob();
  },
};
