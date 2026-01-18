/**
 * Depreciation API
 * Asset depreciation management API calls
 */

import { apiClient } from "./client";

export interface Asset {
  id: string;
  tenant_id: string;
  asset_code: string;
  name_en: string;
  name_ar?: string;
  category?: string;
  purchase_date: string;
  purchase_cost: number;
  depreciation_method: string;
  useful_life_years: number;
  salvage_value: number;
  accumulated_depreciation: number;
  net_book_value: number;
  is_active: boolean;
}

export interface Depreciation {
  id: string;
  tenant_id: string;
  depreciation_number: string;
  asset_id: string;
  asset?: Asset;
  calculation_date: string;
  period_start: string;
  period_end: string;
  depreciation_method: string;
  method?: string; // Alias for depreciation_method
  depreciation_amount: number;
  total_amount?: number; // Alias for depreciation_amount
  accumulated_before: number;
  accumulated_after: number;
  status: "draft" | "calculated" | "posted" | "cancelled";
  journal_entry_id?: string;
  notes?: string;
  posted_at?: string;
  posted_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CalculateDepreciationDto {
  calculation_date: string;
  asset_ids?: string[];
}

export interface DepreciationFilters {
  status?: string;
  asset_id?: string;
  start_date?: string;
  end_date?: string;
}

export const depreciationApi = {
  async getAll(filters?: DepreciationFilters): Promise<Depreciation[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.asset_id) params.append("asset_id", filters.asset_id);

    const query = params.toString();
    const response = await apiClient.get<Depreciation[]>(
      query ? `/assets/depreciation?${query}` : "/assets/depreciation"
    );
    return response.data || [];
  },

  async getById(id: string): Promise<Depreciation> {
    const response = await apiClient.get<Depreciation>(`/assets/depreciation/${id}`);
    return response.data as Depreciation;
  },

  async calculate(data: CalculateDepreciationDto): Promise<Depreciation[]> {
    const response = await apiClient.post<Depreciation[]>("/assets/depreciation/calculate", data);
    return response.data as Depreciation[];
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/assets/depreciation/${id}`);
    return response.data as { success: boolean };
  },

  async postToJournal(id: string): Promise<Depreciation> {
    const response = await apiClient.post<Depreciation>(`/assets/depreciation/${id}/post`);
    return response.data as Depreciation;
  },

  async exportToPDF(id: string): Promise<Blob> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/assets/depreciation/${id}/export/pdf`,
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
      `${process.env.NEXT_PUBLIC_API_URL}/assets/depreciation/${id}/export/excel`,
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
