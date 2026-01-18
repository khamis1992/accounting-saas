/**
 * Chart of Accounts API
 * All COA-related API calls
 */

import { apiClient } from "./client";

export interface Account {
  id: string;
  code: string;
  name_en: string;
  name_ar: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  subtype?: string;
  parent_id?: string;
  level: number;
  is_control_account: boolean;
  is_posting_allowed: boolean;
  is_active: boolean;
  balance_type: "debit" | "credit";
  description?: string;
  currency?: string;
  cost_center_required: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  parent?: Account;
  children?: Account[];
}

export interface AccountBalance {
  debit: number;
  credit: number;
  balance: number;
  netDebit: number;
  netCredit: number;
  balanceType: "debit" | "credit";
}

export interface CreateAccountDto {
  code: string;
  nameEn: string;
  nameAr: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  subtype?: string;
  parentId?: string;
  isControlAccount?: boolean;
  isPostingAllowed?: boolean;
  isActive?: boolean;
  balanceType?: "debit" | "credit";
  description?: string;
  currency?: string;
  costCenterRequired?: boolean;
}

export interface UpdateAccountDto {
  nameEn?: string;
  nameAr?: string;
  subtype?: string;
  isControlAccount?: boolean;
  isPostingAllowed?: boolean;
  isActive?: boolean;
  balanceType?: "debit" | "credit";
  description?: string;
  currency?: string;
  costCenterRequired?: boolean;
}

export const coaApi = {
  /**
   * Get all accounts (hierarchical)
   */
  async getAll(includeInactive = false): Promise<Account[]> {
    const response = await apiClient.get<Account[]>(`/coa?includeInactive=${includeInactive}`);
    return response.data || [];
  },

  /**
   * Get accounts by type
   */
  async getByType(type: string): Promise<Account[]> {
    const response = await apiClient.get<Account[]>(`/coa/by-type/${type}`);
    return response.data || [];
  },

  /**
   * Get account by ID
   */
  async getById(id: string): Promise<Account> {
    const response = await apiClient.get<Account>(`/coa/${id}`);
    return response.data as Account;
  },

  /**
   * Get account by code
   */
  async getByCode(code: string): Promise<Account> {
    const response = await apiClient.get<Account>(`/coa/code/${code}`);
    return response.data as Account;
  },

  /**
   * Get account balance
   */
  async getBalance(id: string, asOf?: Date): Promise<AccountBalance> {
    const url = asOf ? `/coa/${id}/balance?asOf=${asOf.toISOString()}` : `/coa/${id}/balance`;
    const response = await apiClient.get<AccountBalance>(url);
    return response.data as AccountBalance;
  },

  /**
   * Create new account
   */
  async create(data: CreateAccountDto): Promise<Account> {
    const response = await apiClient.post<Account>("/coa", {
      code: data.code,
      name_en: data.nameEn,
      name_ar: data.nameAr,
      type: data.type,
      subtype: data.subtype,
      parent_id: data.parentId,
      is_control_account: data.isControlAccount,
      is_posting_allowed: data.isPostingAllowed,
      is_active: data.isActive ?? true,
      balance_type: data.balanceType,
      description: data.description,
      currency: data.currency,
      cost_center_required: data.costCenterRequired,
    });
    return response.data as Account;
  },

  /**
   * Update account
   */
  async update(id: string, data: UpdateAccountDto): Promise<Account> {
    const response = await apiClient.patch<Account>(`/coa/${id}`, {
      name_en: data.nameEn,
      name_ar: data.nameAr,
      subtype: data.subtype,
      is_control_account: data.isControlAccount,
      is_posting_allowed: data.isPostingAllowed,
      is_active: data.isActive,
      balance_type: data.balanceType,
      description: data.description,
      currency: data.currency,
      cost_center_required: data.costCenterRequired,
    });
    return response.data as Account;
  },

  /**
   * Delete account
   */
  async delete(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/coa/${id}`);
    return response.data as { success: boolean };
  },
};
