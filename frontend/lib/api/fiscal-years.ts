/**
 * Fiscal Years API
 * Fiscal year and accounting period management
 */

import { apiClient } from "./client";

export interface AccountingPeriod {
  id: string;
  fiscal_year_id: string;
  period_number: number;
  name: string;
  start_date: string;
  end_date: string;
  is_closed: boolean;
}

export interface FiscalYear {
  id: string;
  tenant_id: string;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
  is_locked: boolean;
  is_current: boolean;
  description?: string;
  accounting_periods?: AccountingPeriod[];
  created_at: string;
  updated_at: string;
}

export interface CreateFiscalYearDto {
  name: string;
  year: number;
  start_date: string;
  end_date: string;
  is_locked?: boolean;
  description?: string;
}

export interface FiscalYearFilters {
  is_locked?: boolean;
  search?: string;
}

export const fiscalYearsApi = {
  async getAll(filters?: FiscalYearFilters): Promise<FiscalYear[]> {
    const params = new URLSearchParams();
    if (filters?.is_locked !== undefined) params.append("is_locked", String(filters.is_locked));
    if (filters?.search) params.append("search", filters.search);

    const query = params.toString();
    const response = await apiClient.get<FiscalYear[]>(
      query ? `/settings/fiscal-years?${query}` : "/settings/fiscal-years"
    );
    return response.data || [];
  },

  async getById(id: string): Promise<FiscalYear> {
    const response = await apiClient.get<FiscalYear>(`/settings/fiscal-years/${id}`);
    return response.data as FiscalYear;
  },

  async create(data: CreateFiscalYearDto): Promise<FiscalYear> {
    const response = await apiClient.post<FiscalYear>("/settings/fiscal-years", data);
    return response.data as FiscalYear;
  },

  async update(id: string, data: Partial<CreateFiscalYearDto>): Promise<FiscalYear> {
    const response = await apiClient.patch<FiscalYear>(`/settings/fiscal-years/${id}`, data);
    return response.data as FiscalYear;
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/settings/fiscal-years/${id}`);
    return response.data as { success: boolean };
  },

  async lock(id: string): Promise<FiscalYear> {
    const response = await apiClient.post<FiscalYear>(`/settings/fiscal-years/${id}/lock`);
    return response.data as FiscalYear;
  },

  async unlock(id: string): Promise<FiscalYear> {
    const response = await apiClient.post<FiscalYear>(`/settings/fiscal-years/${id}/unlock`);
    return response.data as FiscalYear;
  },

  async setCurrent(id: string): Promise<FiscalYear> {
    const response = await apiClient.post<FiscalYear>(`/settings/fiscal-years/${id}/set-current`);
    return response.data as FiscalYear;
  },
};
