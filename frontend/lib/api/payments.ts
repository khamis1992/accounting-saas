/**
 * Payments API
 * All payment-related API calls
 */

import { apiClient } from './client';

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
  payment_type: 'receipt' | 'payment';
  party_id: string;
  party_type: 'customer' | 'vendor';
  party?: {
    id: string;
    name_en: string;
    name_ar: string;
  };
  payment_date: string;
  currency: string;
  exchange_rate: number;
  payment_method: 'cash' | 'bank_transfer' | 'check';
  amount: number;
  bank_account_id?: string;
  reference_number?: string;
  check_number?: string;
  check_date?: string;
  bank_name?: string;
  notes?: string;
  status: 'draft' | 'submitted' | 'approved' | 'posted' | 'cancelled';
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
  paymentType: 'receipt' | 'payment';
  partyId: string;
  partyType: 'customer' | 'vendor';
  paymentDate: Date;
  currency?: string;
  exchangeRate?: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'check';
  amount: number;
  bankAccountId?: string;
  referenceNumber?: string;
  checkNumber?: string;
  checkDate?: Date;
  bankName?: string;
  notes?: string;
  allocations: Array<{
    invoiceId: string;
    amount: number;
  }>;
}

export interface UpdatePaymentDto {
  paymentDate?: Date;
  currency?: string;
  exchangeRate?: number;
  paymentMethod?: 'cash' | 'bank_transfer' | 'check';
  amount?: number;
  bankAccountId?: string;
  referenceNumber?: string;
  checkNumber?: string;
  checkDate?: Date;
  bankName?: string;
  notes?: string;
}

export interface PaymentFilters {
  paymentType?: 'receipt' | 'payment';
  status?: string;
  partyType?: 'customer' | 'vendor';
  startDate?: string;
  endDate?: string;
}

export const paymentsApi = {
  /**
   * Get all payments
   */
  async getAll(filters?: PaymentFilters): Promise<Payment[]> {
    const params = new URLSearchParams();
    if (filters?.paymentType) params.append('paymentType', filters.paymentType);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.partyType) params.append('partyType', filters.partyType);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const query = params.toString();
    const response = await apiClient.get<Payment[]>(
      query ? `/payments?${query}` : '/payments',
    );
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
    const response = await apiClient.post<Payment>('/payments', {
      payment_type: data.paymentType,
      party_id: data.partyId,
      party_type: data.partyType,
      payment_date: data.paymentDate.toISOString(),
      currency: data.currency || 'QAR',
      exchange_rate: data.exchangeRate || 1,
      payment_method: data.paymentMethod,
      amount: data.amount,
      bank_account_id: data.bankAccountId,
      reference_number: data.referenceNumber,
      check_number: data.checkNumber,
      check_date: data.checkDate?.toISOString(),
      bank_name: data.bankName,
      notes: data.notes,
      allocations: data.allocations.map((alloc) => ({
        invoice_id: alloc.invoiceId,
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
      payment_date: data.paymentDate?.toISOString(),
      currency: data.currency,
      exchange_rate: data.exchangeRate,
      payment_method: data.paymentMethod,
      amount: data.amount,
      bank_account_id: data.bankAccountId,
      reference_number: data.referenceNumber,
      check_number: data.checkNumber,
      check_date: data.checkDate?.toISOString(),
      bank_name: data.bankName,
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
