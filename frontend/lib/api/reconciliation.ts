/**
 * Reconciliation API
 * Bank reconciliation related API calls
 */

import { apiClient } from "./client";

export interface BankTransaction {
  id: string;
  bank_account_id: string;
  transaction_date: string;
  description: string;
  amount: number;
  type: "debit" | "credit";
  reference?: string;
  is_reconciled: boolean;
  reconciliation_id?: string;
}

export interface Reconciliation {
  id: string;
  tenant_id: string;
  reconciliation_number: string;
  bank_account_id: string;
  bank_account?: {
    id: string;
    name_en: string;
    name_ar: string;
    account_number: string;
  };
  start_date: string;
  end_date: string;
  opening_balance: number;
  statement_balance: number;
  reconciled_balance: number;
  difference: number;
  status: "draft" | "in_progress" | "completed" | "cancelled";
  transactions?: BankTransaction[];
  notes?: string;
  completed_at?: string;
  completed_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateReconciliationDto {
  account_id: string;
  start_date: string;
  end_date: string;
  statement_balance: number;
}

export interface ReconciliationFilters {
  status?: string;
  account_id?: string;
  start_date?: string;
  end_date?: string;
}

export const reconciliationApi = {
  async getAll(filters?: ReconciliationFilters): Promise<Reconciliation[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.account_id) params.append("account_id", filters.account_id);

    const query = params.toString();
    const response = await apiClient.get<Reconciliation[]>(
      query ? `/banking/reconciliations?${query}` : "/banking/reconciliations"
    );
    return response.data || [];
  },

  async getById(id: string): Promise<Reconciliation> {
    const response = await apiClient.get<Reconciliation>(`/banking/reconciliations/${id}`);
    return response.data as Reconciliation;
  },

  async create(data: CreateReconciliationDto): Promise<Reconciliation> {
    const response = await apiClient.post<Reconciliation>("/banking/reconciliations", data);
    return response.data as Reconciliation;
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/banking/reconciliations/${id}`);
    return response.data as { success: boolean };
  },

  async complete(id: string): Promise<Reconciliation> {
    const response = await apiClient.post<Reconciliation>(`/banking/reconciliations/${id}/complete`);
    return response.data as Reconciliation;
  },

  async exportToPDF(id: string): Promise<Blob> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/banking/reconciliations/${id}/export/pdf`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiClient.getAccessToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to export PDF");
    }

    return response.blob();
  },
};
