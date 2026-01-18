/**
 * Cost Centers API
 * Cost center management API calls
 */

import { apiClient } from "./client";

export interface CostCenter {
  id: string;
  tenant_id: string;
  code: string;
  name_en: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  parent_id?: string;
  parent?: CostCenter;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCostCenterDto {
  code: string;
  name_en: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  parent_id?: string;
  is_active?: boolean;
}

export interface CostCenterFilters {
  is_active?: boolean;
  search?: string;
}

export const costCentersApi = {
  async getAll(filters?: CostCenterFilters): Promise<CostCenter[]> {
    const params = new URLSearchParams();
    if (filters?.is_active !== undefined) params.append("is_active", String(filters.is_active));
    if (filters?.search) params.append("search", filters.search);

    const query = params.toString();
    const response = await apiClient.get<CostCenter[]>(
      query ? `/settings/cost-centers?${query}` : "/settings/cost-centers"
    );
    return response.data || [];
  },

  async getById(id: string): Promise<CostCenter> {
    const response = await apiClient.get<CostCenter>(`/settings/cost-centers/${id}`);
    return response.data as CostCenter;
  },

  async create(data: CreateCostCenterDto): Promise<CostCenter> {
    const response = await apiClient.post<CostCenter>("/settings/cost-centers", data);
    return response.data as CostCenter;
  },

  async update(id: string, data: Partial<CreateCostCenterDto>): Promise<CostCenter> {
    const response = await apiClient.patch<CostCenter>(`/settings/cost-centers/${id}`, data);
    return response.data as CostCenter;
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/settings/cost-centers/${id}`);
    return response.data as { success: boolean };
  },

  async exportToPDF(id: string): Promise<Blob> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/settings/cost-centers/${id}/export/pdf`,
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
