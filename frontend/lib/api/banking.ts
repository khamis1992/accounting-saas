/**
 * Banking API Client
 * Handles bank accounts and reconciliation operations
 */

import { apiClient } from "./client";

export type AccountType = "checking" | "savings" | "credit-card";

export interface BankAccount {
  id: string;
  account_name: string;
  account_type: AccountType;
  account_number: string;
  bank_name: string;
  balance: number;
  currency: string;
  last_reconciled_at?: string;
  last_reconciled_balance?: number;
  is_active: boolean;
}

export interface BankTransaction {
  id: string;
  account_id: string;
  date: string;
  description: string;
  amount: number;
  type: "debit" | "credit";
  reference?: string;
  is_reconciled: boolean;
}

export interface Reconciliation {
  id: string;
  account_id: string;
  statement_date: string;
  statement_balance: number;
  book_balance: number;
  difference: number;
  status: "in-progress" | "completed";
  matches: ReconciliationMatch[];
  created_at: string;
}

export interface ReconciliationMatch {
  bank_transaction_id: string;
  book_transaction_id: string;
  amount: number;
}

export interface UnmatchedTransactions {
  bankTransactions: BankTransaction[];
  bookTransactions: Array<{
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'debit' | 'credit';
    reference?: string;
  }>;
}

export const bankingApi = {
  /**
   * Bank Accounts
   */
  getAccounts: async (): Promise<BankAccount[]> => {
    const response = await apiClient.get<BankAccount[]>("/banking/accounts");
    return response.data || [];
  },

  getAccount: async (id: string): Promise<BankAccount> => {
    const response = await apiClient.get<BankAccount>(`/banking/accounts/${id}`);
    return response.data as BankAccount;
  },

  createAccount: async (data: Omit<BankAccount, "id">): Promise<BankAccount> => {
    const response = await apiClient.post<BankAccount>("/banking/accounts", data);
    return response.data as BankAccount;
  },

  updateAccount: async (id: string, data: Partial<BankAccount>): Promise<BankAccount> => {
    const response = await apiClient.put<BankAccount>(`/banking/accounts/${id}`, data);
    return response.data as BankAccount;
  },

  deleteAccount: async (id: string): Promise<void> => {
    await apiClient.delete(`/banking/accounts/${id}`);
  },

  /**
   * Transactions
   */
  getTransactions: async (
    accountId: string,
    filters?: {
      start_date?: string;
      end_date?: string;
      type?: "debit" | "credit";
      search?: string;
    }
  ): Promise<BankTransaction[]> => {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append("start_date", filters.start_date);
    if (filters?.end_date) params.append("end_date", filters.end_date);
    if (filters?.type) params.append("type", filters.type);
    if (filters?.search) params.append("search", filters.search);

    const query = params.toString();
    const response = await apiClient.get<BankTransaction[]>(
      query
        ? `/banking/accounts/${accountId}/transactions?${query}`
        : `/banking/accounts/${accountId}/transactions`
    );
    return response.data || [];
  },

  /**
   * Reconciliation
   */
  getReconciliations: async (accountId: string): Promise<Reconciliation[]> => {
    const response = await apiClient.get<Reconciliation[]>(
      `/banking/accounts/${accountId}/reconciliations`
    );
    return response.data || [];
  },

  getReconciliation: async (id: string): Promise<Reconciliation> => {
    const response = await apiClient.get<Reconciliation>(`/banking/reconciliations/${id}`);
    return response.data as Reconciliation;
  },

  startReconciliation: async (
    accountId: string,
    statement_date: string,
    statement_balance: number
  ): Promise<Reconciliation> => {
    const response = await apiClient.post<Reconciliation>(
      `/banking/accounts/${accountId}/reconciliations`,
      {
        statement_date: statement_date,
        statement_balance: statement_balance,
      }
    );
    return response.data as Reconciliation;
  },

  getUnmatchedTransactions: async (
    accountId: string,
    reconciliationId: string
  ): Promise<UnmatchedTransactions> => {
    const response = await apiClient.get<UnmatchedTransactions>(
      `/banking/reconciliations/${reconciliationId}/unmatched`
    );
    return response.data as UnmatchedTransactions;
  },

  matchTransactions: async (
    reconciliationId: string,
    bank_transaction_id: string,
    book_transaction_id: string
  ): Promise<ReconciliationMatch> => {
    const response = await apiClient.post<ReconciliationMatch>(
      `/banking/reconciliations/${reconciliationId}/match`,
      {
        bank_transaction_id: bank_transaction_id,
        book_transaction_id: book_transaction_id,
      }
    );
    return response.data as ReconciliationMatch;
  },

  unmatchTransactions: async (reconciliationId: string, matchId: string): Promise<void> => {
    await apiClient.delete(`/banking/reconciliations/${reconciliationId}/matches/${matchId}`);
  },

  completeReconciliation: async (reconciliationId: string): Promise<Reconciliation> => {
    const response = await apiClient.post<Reconciliation>(
      `/banking/reconciliations/${reconciliationId}/complete`,
      {}
    );
    return response.data as Reconciliation;
  },

  /**
   * Dashboard/Summary
   */
  getSummary: async (): Promise<{
    totalBalance: number;
    activeAccounts: number;
    thisMonthChanges: number;
    currency: string;
  }> => {
    const response = await apiClient.get<{
      totalBalance: number;
      activeAccounts: number;
      thisMonthChanges: number;
      currency: string;
    }>("/banking/summary");
    return response.data!;
  },
};
