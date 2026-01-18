/**
 * Payments API
 * All payment-related API calls
 */

import { apiClient } from "./client";

export interface PaymentAllocation {
  id: string;
  payment_id: string;
  invoice_id: string;
  amount: number;
  invoice?: {
    id: string;
    invoice_number: string;
  };
}

export interface Payment {
  id: string;
  tenant_id: string;
  payment_number: string;
  payment_type: "receipt" | "payment";
  party_id: string;
  party_type: "customer" | "vendor";
  party?: {
    id: string;
    name_en: string;
    name_ar: string;
  };
  payment_date: string;
  currency: string;
  exchange_rate: number;
  payment_method: "cash" | "bank_transfer" | "check";
  amount: number;
  bank_account_id?: string;
  reference_number?: string;
  check_number?: string;
  check_date?: string;
  bank_name?: string;
  notes?: string;
  status: "draft" | "submitted" | "approved" | "posted" | "cancelled";
  allocations?: PaymentAllocation[];
  submitted_by?: string;
  submitted_at?: string;
  approved_by?: string;
  approved_at?: string;
  posted_by?: string;
  posted_at?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentDto {
  payment_type: "receipt" | "payment";
  party_id: string;
  party_type: "customer" | "vendor";
  payment_date: Date | string;
  currency?: string;
  exchange_rate?: number;
  payment_method: "cash" | "bank_transfer" | "check";
  amount: number;
  bank_account_id?: string;
  reference_number?: string;
  check_number?: string;
  check_date?: Date | string;
  bank_name?: string;
  notes?: string;
  allocations: Array<{
    invoice_id: string;
    amount: number;
  }>;
}

export interface UpdatePaymentDto {
  payment_date?: Date | string;
  currency?: string;
  exchange_rate?: number;
  payment_method?: "cash" | "bank_transfer" | "check";
  amount?: number;
  bank_account_id?: string;
  reference_number?: string;
  check_number?: string;
  check_date?: Date | string;
  bank_name?: string;
  notes?: string;
}

export interface PaymentFilters {
  payment_type?: "receipt" | "payment";
  status?: string;
  party_type?: "customer" | "vendor";
  start_date?: string;
  end_date?: string;
}

export const paymentsApi = {
  /**
   * Get all payments
   */
  async getAll(filters?: PaymentFilters): Promise<Payment[]> {
    const params = new URLSearchParams();
    if (filters?.payment_type) params.append("payment_type", filters.payment_type);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.party_type) params.append("party_type", filters.party_type);
    if (filters?.start_date) params.append("start_date", filters.start_date);
    if (filters?.end_date) params.append("end_date", filters.end_date);

    const query = params.toString();
    const response = await apiClient.get<Payment[]>(query ? `/payments?${query}` : "/payments");
    return response.data || [];
  },

  /**
   * Get payment by ID
   */
  async getById(id: string): Promise<Payment> {
    const response = await apiClient.get<Payment>(`/payments/${id}`);
    return response.data as Payment;
  },

  /**
   * Create new payment
   */
  async create(data: CreatePaymentDto): Promise<Payment> {
    const response = await apiClient.post<Payment>("/payments", {
      payment_type: data.payment_type,
      party_id: data.party_id,
      party_type: data.party_type,
      payment_date: typeof data.payment_date === 'string' ? data.payment_date : data.payment_date.toISOString(),
      currency: data.currency || "QAR",
      exchange_rate: data.exchange_rate || 1,
      payment_method: data.payment_method,
      amount: data.amount,
      bank_account_id: data.bank_account_id,
      reference_number: data.reference_number,
      check_number: data.check_number,
      check_date: data.check_date ? (typeof data.check_date === 'string' ? data.check_date : data.check_date.toISOString()) : undefined,
      bank_name: data.bank_name,
      notes: data.notes,
      allocations: data.allocations.map((alloc) => ({
        invoice_id: alloc.invoice_id,
        amount: alloc.amount,
      })),
    });
    return response.data as Payment;
  },

  /**
   * Update payment (draft only)
   */
  async update(id: string, data: UpdatePaymentDto): Promise<Payment> {
    const response = await apiClient.patch<Payment>(`/payments/${id}`, {
      payment_date: data.payment_date ? (typeof data.payment_date === 'string' ? data.payment_date : data.payment_date.toISOString()) : undefined,
      currency: data.currency,
      exchange_rate: data.exchange_rate,
      payment_method: data.payment_method,
      amount: data.amount,
      bank_account_id: data.bank_account_id,
      reference_number: data.reference_number,
      check_number: data.check_number,
      check_date: data.check_date ? (typeof data.check_date === 'string' ? data.check_date : data.check_date.toISOString()) : undefined,
      bank_name: data.bank_name,
      notes: data.notes,
    });
    return response.data as Payment;
  },

  /**
   * Delete payment (draft only)
   */
  async delete(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/payments/${id}`);
    return response.data as { success: boolean };
  },

  /**
   * Submit payment for approval
   */
  async submit(id: string): Promise<Payment> {
    const response = await apiClient.post<Payment>(`/payments/${id}/submit`);
    return response.data as Payment;
  },

  /**
   * Approve payment
   */
  async approve(id: string): Promise<Payment> {
    const response = await apiClient.post<Payment>(`/payments/${id}/approve`);
    return response.data as Payment;
  },

  /**
   * Post payment to ledger
   */
  async post(id: string): Promise<Payment> {
    const response = await apiClient.post<Payment>(`/payments/${id}/post`);
    return response.data as Payment;
  },

  /**
   * Cancel payment
   */
  async cancel(id: string, reason?: string): Promise<Payment> {
    const response = await apiClient.post<Payment>(`/payments/${id}/cancel`, {
      reason,
    });
    return response.data as Payment;
  },
};
