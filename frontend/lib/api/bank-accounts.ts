/**
 * Bank Accounts API
 * Bank account related API calls
 */

import { apiClient } from "./client";

export interface BankAccount {
  id: string;
  tenant_id: string;
  account_number: string;
  name_en: string;
  name_ar: string;
  bank_name: string;
  branch?: string;
  iban?: string;
  swift_code?: string;
  currency: string;
  opening_balance: number;
  current_balance: number;
  gl_account_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBankAccountDto {
  account_number: string;
  name_en: string;
  name_ar: string;
  bank_name: string;
  branch?: string;
  iban?: string;
  swift_code?: string;
  currency?: string;
  opening_balance?: number;
  gl_account_id?: string;
  is_active?: boolean;
}

export interface BankAccountFilters {
  is_active?: boolean;
  search?: string;
}

export const bankAccountsApi = {
  async getAll(filters?: BankAccountFilters): Promise<BankAccount[]> {
    const params = new URLSearchParams();
    if (filters?.is_active !== undefined) params.append("is_active", String(filters.is_active));
    if (filters?.search) params.append("search", filters.search);

    const query = params.toString();
    const response = await apiClient.get<BankAccount[]>(
      query ? `/banking/accounts?${query}` : "/banking/accounts"
    );
    return response.data || [];
  },

  async getById(id: string): Promise<BankAccount> {
    const response = await apiClient.get<BankAccount>(`/banking/accounts/${id}`);
    return response.data as BankAccount;
  },

  async create(data: CreateBankAccountDto): Promise<BankAccount> {
    const response = await apiClient.post<BankAccount>("/banking/accounts", data);
    return response.data as BankAccount;
  },

  async update(id: string, data: Partial<CreateBankAccountDto>): Promise<BankAccount> {
    const response = await apiClient.patch<BankAccount>(`/banking/accounts/${id}`, data);
    return response.data as BankAccount;
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/banking/accounts/${id}`);
    return response.data as { success: boolean };
  },
};
