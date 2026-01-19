/**
 * VAT Returns API
 * VAT return management API calls
 */

import { apiClient } from "./client";

export interface VatRate {
  id: string;
  name: string;
  rate: number;
  is_active: boolean;
}

export interface VatReturn {
  id: string;
  tenant_id: string;
  return_number: string;
  period: string;
  start_date: string;
  end_date: string;
  due_date?: string;
  total_sales: number;
  total_purchases: number;
  output_vat: number;
  input_vat: number;
  net_vat: number;
  adjustments: number;
  final_amount: number;
  status: "draft" | "calculated" | "filed" | "paid" | "cancelled";
  filed_at?: string;
  filed_by?: string;
  paid_at?: string;
  paid_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CalculateVatReturnDto {
  start_date: string;
  end_date: string;
}

export interface VatReturnFilters {
  status?: string;
  period?: string;
  start_date?: string;
  end_date?: string;
}

export const vatReturnsApi = {
  async getAll(filters?: VatReturnFilters): Promise<VatReturn[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.period) params.append("period", filters.period);

    const query = params.toString();
    const response = await apiClient.get<VatReturn[]>(
      query ? `/tax/vat-returns?${query}` : "/tax/vat-returns"
    );
    return response.data || [];
  },

  async getById(id: string): Promise<VatReturn> {
    const response = await apiClient.get<VatReturn>(`/tax/vat-returns/${id}`);
    return response.data as VatReturn;
  },

  async calculate(data: CalculateVatReturnDto): Promise<VatReturn> {
    const response = await apiClient.post<VatReturn>("/tax/vat-returns/calculate", data);
    return response.data as VatReturn;
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/tax/vat-returns/${id}`);
    return response.data as { success: boolean };
  },

  async file(id: string): Promise<VatReturn> {
    const response = await apiClient.post<VatReturn>(`/tax/vat-returns/${id}/file`);
    return response.data as VatReturn;
  },

  async markAsPaid(id: string): Promise<VatReturn> {
    const response = await apiClient.post<VatReturn>(`/tax/vat-returns/${id}/mark-paid`);
    return response.data as VatReturn;
  },

  async exportToPDF(id: string): Promise<Blob> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tax/vat-returns/${id}/export/pdf`,
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

  async exportToExcel(id: string): Promise<Blob> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tax/vat-returns/${id}/export/excel`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiClient.getAccessToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to export Excel");
    }

    return response.blob();
  },
};
