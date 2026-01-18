/**
 * General Ledger API
 * All general ledger-related API calls
 */

import { apiClient } from "./client";

export interface GeneralLedgerEntry {
  id: string;
  tenant_id: string;
  journal_id: string;
  journal_number: string;
  journal_type: string;
  transaction_date: string;
  posting_date?: string;
  account_id?: string;
  account_code: string;
  account_name_ar: string;
  account_name_en: string;
  account_type: string;
  line_number: number;
  description_ar?: string;
  description_en?: string;
  debit: number;
  credit: number;
  cost_center_id?: string;
  cost_center_code?: string;
  cost_center_name_ar?: string;
  cost_center_name_en?: string;
  reference?: string;
  reference_number?: string;
  reference_type?: string;
  reference_id?: string;
  branch_name_ar?: string;
  branch_name_en?: string;
  currency: string;
  exchange_rate: number;
  created_at: string;
  // Running balance (calculated on frontend)
  balance?: number;
  running_balance?: number;
}

export interface GeneralLedgerFilters {
  accountId?: string;
  account_id?: string;
  startDate?: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
  accountType?: string;
  account_type?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface GeneralLedgerResponse {
  data: GeneralLedgerEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const generalLedgerApi = {
  /**
   * Get all general ledger entries
   */
  async getAll(filters?: GeneralLedgerFilters): Promise<GeneralLedgerEntry[]> {
    const params = new URLSearchParams();
    const accountId = filters?.accountId || filters?.account_id;
    const startDate = filters?.startDate || filters?.start_date;
    const endDate = filters?.endDate || filters?.end_date;
    
    if (accountId) params.append("accountId", accountId);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const query = params.toString();
    const response = await apiClient.get<GeneralLedgerEntry[]>(
      query ? `/reports/general-ledger?${query}` : "/reports/general-ledger"
    );

    // Calculate running balance on frontend
    const entries = response.data || [];
    let runningBalance = 0;
    return entries.map((entry) => {
      const accountType = entry.account_type;
      if (accountType === "asset" || accountType === "expense") {
        runningBalance += entry.debit - entry.credit;
      } else {
        runningBalance += entry.credit - entry.debit;
      }
      return {
        ...entry,
        balance: runningBalance,
        running_balance: runningBalance,
        account_id: entry.account_id || entry.account_code,
        reference_number: entry.reference_number || entry.reference,
      };
    });
  },

  /**
   * Get general ledger entries with pagination
   */
  async getPaginated(filters?: GeneralLedgerFilters): Promise<GeneralLedgerResponse> {
    const params = new URLSearchParams();
    if (filters?.accountId) params.append("accountId", filters.accountId);
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const query = params.toString();
    const response = await apiClient.get<GeneralLedgerEntry[]>(
      query ? `/reports/general-ledger?${query}` : "/reports/general-ledger"
    );

    const entries = response.data || [];

    // Calculate running balance
    let runningBalance = 0;
    const entriesWithBalance = entries.map((entry) => {
      const accountType = entry.account_type;
      if (accountType === "asset" || accountType === "expense") {
        runningBalance += entry.debit - entry.credit;
      } else {
        runningBalance += entry.credit - entry.debit;
      }
      return {
        ...entry,
        balance: runningBalance,
        running_balance: runningBalance,
        account_id: entry.account_id || entry.account_code,
        reference_number: entry.reference_number || entry.reference,
      };
    });

    return {
      data: entriesWithBalance,
      total: entriesWithBalance.length,
      page: filters?.page || 1,
      limit: filters?.limit || 50,
      totalPages: Math.ceil(entriesWithBalance.length / (filters?.limit || 50)),
    };
  },

  /**
   * Export to PDF
   */
  async exportToPDF(filters?: GeneralLedgerFilters): Promise<Blob> {
    const params = new URLSearchParams();
    const accountId = filters?.accountId || filters?.account_id;
    const startDate = filters?.startDate || filters?.start_date;
    const endDate = filters?.endDate || filters?.end_date;
    
    if (accountId) params.append("accountId", accountId);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const query = params.toString();
    const url = query
      ? `${process.env.NEXT_PUBLIC_API_URL}/reports/general-ledger/export/pdf?${query}`
      : `${process.env.NEXT_PUBLIC_API_URL}/reports/general-ledger/export/pdf`;

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
  async exportToExcel(filters?: GeneralLedgerFilters): Promise<Blob> {
    const params = new URLSearchParams();
    const accountId = filters?.accountId || filters?.account_id;
    const startDate = filters?.startDate || filters?.start_date;
    const endDate = filters?.endDate || filters?.end_date;
    
    if (accountId) params.append("accountId", accountId);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const query = params.toString();
    const url = query
      ? `${process.env.NEXT_PUBLIC_API_URL}/reports/general-ledger/export/excel?${query}`
      : `${process.env.NEXT_PUBLIC_API_URL}/reports/general-ledger/export/excel`;

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
