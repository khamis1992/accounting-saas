/**
 * VAT Management API
 * Handles VAT rates configuration and VAT returns
 */

import { apiClient } from "./client";

export type VatRateType = "standard" | "reduced" | "zero" | "exempt";
export type VatReturnStatus = "draft" | "calculated" | "filed" | "paid";

export interface VatRate {
  id: string;
  code: string;
  name: string;
  rate: number;
  type: VatRateType;
  effective_date: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VatReturn {
  id: string;
  period_start: string;
  period_end: string;
  status: VatReturnStatus;
  output_vat: number;
  input_vat: number;
  net_vat: number;
  filing_date?: string;
  payment_date?: string;
  payment_reference?: string;
  created_at: string;
  updated_at: string;
}

export interface VatReturnBreakdown {
  sales: {
    total_sales: number;
    vat_on_sales: number;
    by_rate: { rate: number; amount: number }[];
  };
  purchases: {
    total_purchases: number;
    vat_on_purchases: number;
    by_rate: { rate: number; amount: number }[];
  };
}

export interface CreateVatRateDto {
  code: string;
  name: string;
  rate: number;
  type: VatRateType;
  effective_date: string;
  is_default?: boolean;
}

export interface UpdateVatRateDto {
  name?: string;
  rate?: number;
  is_default?: boolean;
  is_active?: boolean;
}

export const vatApi = {
  /**
   * Get all VAT rates
   */
  async getRates(includeInactive = false): Promise<VatRate[]> {
    const response = await apiClient.get<VatRate[]>(
      `/tax/vat/rates?includeInactive=${includeInactive}`
    );
    return response.data || [];
  },

  /**
   * Get VAT rate by ID
   */
  async getRateById(id: string): Promise<VatRate> {
    const response = await apiClient.get<VatRate>(`/tax/vat/rates/${id}`);
    return response.data as VatRate;
  },

  /**
   * Create new VAT rate
   */
  async createRate(data: CreateVatRateDto): Promise<VatRate> {
    const response = await apiClient.post<VatRate>("/tax/vat/rates", data);
    return response.data as VatRate;
  },

  /**
   * Update VAT rate
   */
  async updateRate(id: string, data: UpdateVatRateDto): Promise<VatRate> {
    const response = await apiClient.put<VatRate>(`/tax/vat/rates/${id}`, data);
    return response.data as VatRate;
  },

  /**
   * Deactivate VAT rate
   */
  async deactivateRate(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/tax/vat/rates/${id}`);
    return response.data as { success: boolean };
  },

  /**
   * Get all VAT returns
   */
  async getReturns(filters?: { year?: number; status?: VatReturnStatus }): Promise<VatReturn[]> {
    const params = new URLSearchParams();
    if (filters?.year) params.append("year", String(filters.year));
    if (filters?.status) params.append("status", filters.status);

    const query = params.toString();
    const response = await apiClient.get<VatReturn[]>(
      `/tax/vat/returns${query ? `?${query}` : ""}`
    );
    return response.data || [];
  },

  /**
   * Get VAT return by ID
   */
  async getReturnById(id: string): Promise<VatReturn> {
    const response = await apiClient.get<VatReturn>(`/tax/vat/returns/${id}`);
    return response.data as VatReturn;
  },

  /**
   * Calculate VAT return for a period
   */
  async calculateReturn(periodStart: string, periodEnd: string): Promise<VatReturn> {
    const response = await apiClient.post<VatReturn>("/tax/vat/returns/calculate", {
      period_start: periodStart,
      period_end: periodEnd,
    });
    return response.data as VatReturn;
  },

  /**
   * Get VAT return breakdown
   */
  async getReturnBreakdown(id: string): Promise<VatReturnBreakdown> {
    const response = await apiClient.get<VatReturnBreakdown>(`/tax/vat/returns/${id}/breakdown`);
    return response.data as VatReturnBreakdown;
  },

  /**
   * Mark VAT return as filed
   */
  async markAsFiled(id: string, filingDate: string): Promise<VatReturn> {
    const response = await apiClient.post<VatReturn>(`/tax/vat/returns/${id}/file`, {
      filing_date: filingDate,
    });
    return response.data as VatReturn;
  },

  /**
   * Record payment for VAT return
   */
  async recordPayment(id: string, paymentDate: string, reference: string): Promise<VatReturn> {
    const response = await apiClient.post<VatReturn>(`/tax/vat/returns/${id}/payment`, {
      payment_date: paymentDate,
      payment_reference: reference,
    });
    return response.data as VatReturn;
  },

  /**
   * Export VAT return to PDF
   */
  async exportToPDF(id: string): Promise<void> {
    await apiClient.download(`/tax/vat/returns/${id}/export/pdf`);
  },
};
