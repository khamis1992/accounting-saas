/**
 * Financial Statements API
 * All financial statement-related API calls
 */

import { apiClient } from "./client";

export type StatementType = "balance-sheet" | "income-statement" | "cash-flow";

export interface FinancialStatementRow {
  id: string;
  label_en: string;
  label_ar?: string;
  amount: number | null;
  previous_amount: number | null;
  variance: number | null;
  variance_percentage: number | null;
  children?: FinancialStatementRow[];
  is_header?: boolean;
  is_total?: boolean;
}

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
  // Balance sheet specific
  balance_sheet?: {
    assets: FinancialStatementRow[];
    liabilities: FinancialStatementRow[];
    equity: FinancialStatementRow[];
    total_assets: number;
    total_liabilities: number;
    total_equity: number;
    total_liabilities_and_equity: number;
    previous_total_assets?: number;
    previous_total_liabilities?: number;
    previous_total_equity?: number;
    previous_total_liabilities_and_equity?: number;
    assets_variance?: number | null;
    assets_variance_percentage?: number | null;
    liabilities_variance?: number | null;
    liabilities_variance_percentage?: number | null;
    equity_variance?: number | null;
    equity_variance_percentage?: number | null;
    liabilities_equity_variance?: number | null;
    liabilities_equity_variance_percentage?: number | null;
  };
  // Income statement specific
  income_statement?: {
    revenue: FinancialStatementRow[];
    expenses: FinancialStatementRow[];
    cost_of_goods_sold?: FinancialStatementRow[];
    operating_expenses?: FinancialStatementRow[];
    other_income?: FinancialStatementRow[];
    other_expenses?: FinancialStatementRow[];
    total_revenue: number;
    total_expenses: number;
    gross_profit: number;
    operating_income: number;
    net_income: number;
    previous_total_revenue?: number;
    previous_total_expenses?: number;
    previous_gross_profit?: number;
    previous_operating_income?: number;
    previous_net_income?: number;
    revenue_variance?: number | null;
    revenue_variance_percentage?: number | null;
    expenses_variance?: number | null;
    expenses_variance_percentage?: number | null;
    gross_profit_variance?: number | null;
    gross_profit_variance_percentage?: number | null;
    net_income_variance?: number | null;
    net_income_variance_percentage?: number | null;
  };
  // Cash flow specific
  cash_flow?: {
    operating: FinancialStatementRow[];
    investing: FinancialStatementRow[];
    financing: FinancialStatementRow[];
    // Alias names for different naming conventions
    operating_activities?: FinancialStatementRow[];
    investing_activities?: FinancialStatementRow[];
    financing_activities?: FinancialStatementRow[];
    net_operating: number;
    net_investing: number;
    net_financing: number;
    net_change_in_cash: number;
    net_increase_decrease?: number;
    beginning_cash: number;
    ending_cash: number;
    cash_at_end_period?: number;
    previous_net_operating?: number;
    previous_net_investing?: number;
    previous_net_financing?: number;
    previous_net_change_in_cash?: number;
    previous_net_increase_decrease?: number;
    net_increase_variance?: number | null;
    net_increase_variance_percentage?: number | null;
  };
  totals: {
    assets?: number;
    liabilities?: number;
    equity?: number;
    revenue?: number;
    expenses?: number;
    net_income?: number;
    net_cash_flow?: number;
    total_assets?: number;
    total_liabilities?: number;
    total_equity?: number;
    total_revenue?: number;
    total_expenses?: number;
  };
  generated_at: string;
}

// Alias for backward compatibility
export type FinancialStatementData = FinancialStatement;

export interface StatementFilters {
  // Support both naming conventions
  type?: StatementType;
  statement_type?: StatementType;
  period_start?: string;
  start_date?: string;
  period_end?: string;
  end_date?: string;
  compare_prior?: boolean;
  compare_period?: string;
  show_variance?: boolean;
}

export const financialStatementsApi = {
  /**
   * Get financial statement by type
   */
  async get(filters: StatementFilters): Promise<FinancialStatement> {
    const params = new URLSearchParams();
    const type = filters.type || filters.statement_type;
    const periodStart = filters.period_start || filters.start_date;
    const periodEnd = filters.period_end || filters.end_date;
    
    if (type) params.append("type", type);
    if (periodStart) params.append("period_start", periodStart);
    if (periodEnd) params.append("period_end", periodEnd);
    if (filters.compare_prior !== undefined) {
      params.append("compare_prior", String(filters.compare_prior));
    }
    if (filters.compare_period && filters.compare_period !== "none") {
      params.append("compare_period", filters.compare_period);
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
    const type = filters.type || filters.statement_type;
    const periodStart = filters.period_start || filters.start_date;
    const periodEnd = filters.period_end || filters.end_date;
    
    if (type) params.append("type", type);
    if (periodStart) params.append("period_start", periodStart);
    if (periodEnd) params.append("period_end", periodEnd);
    if (filters.compare_prior !== undefined) {
      params.append("compare_prior", String(filters.compare_prior));
    }
    if (filters.compare_period && filters.compare_period !== "none") {
      params.append("compare_period", filters.compare_period);
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
    const type = filters.type || filters.statement_type;
    const periodStart = filters.period_start || filters.start_date;
    const periodEnd = filters.period_end || filters.end_date;
    
    if (type) params.append("type", type);
    if (periodStart) params.append("period_start", periodStart);
    if (periodEnd) params.append("period_end", periodEnd);
    if (filters.compare_prior !== undefined) {
      params.append("compare_prior", String(filters.compare_prior));
    }
    if (filters.compare_period && filters.compare_period !== "none") {
      params.append("compare_period", filters.compare_period);
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
