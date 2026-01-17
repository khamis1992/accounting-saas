/**
 * Settings API
 * All settings-related API calls (company, roles, fiscal year, cost centers)
 */

import { apiClient } from "./client";

// Company Settings
export interface CompanySettings {
  id: string;
  tenant_id: string;
  name: string;
  legal_name: string;
  tax_registration_number?: string;
  vat_number?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  currency_code: string;
  currency_symbol: string;
  tax_year_start: string;
  tax_year_end: string;
  decimal_places: number;
  rounding: "nearest" | "up" | "down";
  base_currency: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateCompanySettingsDto {
  name?: string;
  legalName?: string;
  taxRegistrationNumber?: string;
  vatNumber?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: File;
  currencyCode?: string;
  taxYearStart?: string;
  taxYearEnd?: string;
  decimalPlaces?: number;
  rounding?: "nearest" | "up" | "down";
}

// Roles & Permissions
export interface Role {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  name_ar: string;
  description?: string;
  is_system_role: boolean;
  is_default: boolean;
  user_count: number;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  module: string;
  actions: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    [key: string]: boolean;
  };
}

export interface CreateRoleDto {
  code: string;
  name: string;
  nameAr: string;
  description?: string;
  permissions: Record<string, Permission>;
}

export interface UpdateRoleDto {
  name?: string;
  nameAr?: string;
  description?: string;
  permissions?: Record<string, Permission>;
}

export interface RoleUser {
  id: string;
  user_id: string;
  role_id: string;
  user_name: string;
  user_email: string;
  assigned_at: string;
  assigned_by: string;
}

// Fiscal Year
export interface FiscalYear {
  id: string;
  tenant_id: string;
  year: number;
  start_date: string;
  end_date: string;
  status: "open" | "closed" | "adjusting";
  closing_date?: string;
  closed_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFiscalYearDto {
  year: number;
  startDate: string;
  endDate: string;
}

export interface FiscalYearPeriod {
  id: string;
  fiscal_year_id: string;
  period_number: number;
  start_date: string;
  end_date: string;
  is_closed: boolean;
  transaction_count: number;
}

// Cost Centers
export interface CostCenter {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  name_ar: string;
  description?: string;
  parent_id?: string;
  is_active: boolean;
  account_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCostCenterDto {
  code: string;
  name: string;
  nameAr: string;
  description?: string;
  parentId?: string;
  isActive?: boolean;
}

export interface UpdateCostCenterDto {
  name?: string;
  nameAr?: string;
  description?: string;
  isActive?: boolean;
}

// Company Settings API
export const companySettingsApi = {
  /**
   * Get company settings
   */
  async get(): Promise<CompanySettings> {
    const response = await apiClient.get<CompanySettings>("/settings/company");
    return response.data as CompanySettings;
  },

  /**
   * Update company settings
   */
  async update(data: UpdateCompanySettingsDto): Promise<CompanySettings> {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (key === "logo" && value instanceof File) {
        formData.append("logo", value);
      } else if (value !== undefined) {
        // Convert camelCase to snake_case for API
        const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
        formData.append(snakeKey, String(value));
      }
    });

    const response = await apiClient.upload<CompanySettings>("/settings/company", formData, {
      method: "PATCH",
    });

    return response.data as CompanySettings;
  },

  /**
   * Upload company logo
   */
  async uploadLogo(file: File): Promise<{ logoUrl: string }> {
    const formData = new FormData();
    formData.append("logo", file);

    const response = await apiClient.upload<{ logo_url: string }>("/settings/company/logo", formData, {
      method: "POST",
    });

    return { logoUrl: response.data!.logo_url };
  },
};

// Roles API
export const rolesApi = {
  /**
   * Get all roles
   */
  async getAll(): Promise<Role[]> {
    const response = await apiClient.get<Role[]>("/settings/roles");
    return response.data || [];
  },

  /**
   * Get role by ID
   */
  async getById(id: string): Promise<Role & { permissions: Record<string, Permission> }> {
    const response = await apiClient.get<Role & { permissions: Record<string, Permission> }>(
      `/settings/roles/${id}`
    );
    return response.data as Role & { permissions: Record<string, Permission> };
  },

  /**
   * Create new role
   */
  async create(data: CreateRoleDto): Promise<Role> {
    const response = await apiClient.post<Role>("/settings/roles", {
      code: data.code,
      name: data.name,
      name_ar: data.nameAr,
      description: data.description,
      permissions: data.permissions,
    });
    return response.data as Role;
  },

  /**
   * Update role
   */
  async update(id: string, data: UpdateRoleDto): Promise<Role> {
    const response = await apiClient.patch<Role>(`/settings/roles/${id}`, {
      name: data.name,
      name_ar: data.nameAr,
      description: data.description,
      permissions: data.permissions,
    });
    return response.data as Role;
  },

  /**
   * Delete role
   */
  async delete(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/settings/roles/${id}`);
    return response.data as { success: boolean };
  },

  /**
   * Get role users
   */
  async getUsers(id: string): Promise<RoleUser[]> {
    const response = await apiClient.get<RoleUser[]>(`/settings/roles/${id}/users`);
    return response.data || [];
  },

  /**
   * Assign user to role
   */
  async assignUser(roleId: string, userId: string): Promise<{ success: boolean }> {
    const response = await apiClient.post<{ success: boolean }>(`/settings/roles/${roleId}/users`, {
      userId,
    });
    return response.data as { success: boolean };
  },

  /**
   * Remove user from role
   */
  async removeUser(roleId: string, userId: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(
      `/settings/roles/${roleId}/users/${userId}`
    );
    return response.data as { success: boolean };
  },

  /**
   * Set as default role
   */
  async setDefault(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.patch<{ success: boolean }>(`/settings/roles/${id}/default`);
    return response.data as { success: boolean };
  },
};

// Fiscal Year API
export const fiscalYearApi = {
  /**
   * Get all fiscal years
   */
  async getAll(): Promise<FiscalYear[]> {
    const response = await apiClient.get<FiscalYear[]>("/settings/fiscal-years");
    return response.data || [];
  },

  /**
   * Get fiscal year by ID
   */
  async getById(id: string): Promise<FiscalYear> {
    const response = await apiClient.get<FiscalYear>(`/settings/fiscal-years/${id}`);
    return response.data as FiscalYear;
  },

  /**
   * Get current fiscal year
   */
  async getCurrent(): Promise<FiscalYear> {
    const response = await apiClient.get<FiscalYear>("/settings/fiscal-years/current");
    return response.data as FiscalYear;
  },

  /**
   * Create fiscal year
   */
  async create(data: CreateFiscalYearDto): Promise<FiscalYear> {
    const response = await apiClient.post<FiscalYear>("/settings/fiscal-years", {
      year: data.year,
      start_date: data.startDate,
      end_date: data.endDate,
    });
    return response.data as FiscalYear;
  },

  /**
   * Update fiscal year
   */
  async update(id: string, data: Partial<CreateFiscalYearDto>): Promise<FiscalYear> {
    const response = await apiClient.patch<FiscalYear>(`/settings/fiscal-years/${id}`, {
      year: data.year,
      start_date: data.startDate,
      end_date: data.endDate,
    });
    return response.data as FiscalYear;
  },

  /**
   * Close fiscal year
   */
  async close(id: string): Promise<FiscalYear> {
    const response = await apiClient.post<FiscalYear>(`/settings/fiscal-years/${id}/close`, {});
    return response.data as FiscalYear;
  },

  /**
   * Reopen fiscal year
   */
  async reopen(id: string): Promise<FiscalYear> {
    const response = await apiClient.post<FiscalYear>(`/settings/fiscal-years/${id}/reopen`, {});
    return response.data as FiscalYear;
  },

  /**
   * Get fiscal year periods
   */
  async getPeriods(fiscalYearId: string): Promise<FiscalYearPeriod[]> {
    const response = await apiClient.get<FiscalYearPeriod[]>(
      `/settings/fiscal-years/${fiscalYearId}/periods`
    );
    return response.data || [];
  },

  /**
   * Close fiscal year period
   */
  async closePeriod(fiscalYearId: string, periodId: string): Promise<{ success: boolean }> {
    const response = await apiClient.post<{ success: boolean }>(
      `/settings/fiscal-years/${fiscalYearId}/periods/${periodId}/close`,
      {}
    );
    return response.data as { success: boolean };
  },
};

// Cost Centers API
export const costCentersApi = {
  /**
   * Get all cost centers
   */
  async getAll(): Promise<CostCenter[]> {
    const response = await apiClient.get<CostCenter[]>("/settings/cost-centers");
    return response.data || [];
  },

  /**
   * Get cost center by ID
   */
  async getById(id: string): Promise<CostCenter> {
    const response = await apiClient.get<CostCenter>(`/settings/cost-centers/${id}`);
    return response.data as CostCenter;
  },

  /**
   * Create cost center
   */
  async create(data: CreateCostCenterDto): Promise<CostCenter> {
    const response = await apiClient.post<CostCenter>("/settings/cost-centers", {
      code: data.code,
      name: data.name,
      name_ar: data.nameAr,
      description: data.description,
      parent_id: data.parentId,
      is_active: data.isActive ?? true,
    });
    return response.data as CostCenter;
  },

  /**
   * Update cost center
   */
  async update(id: string, data: UpdateCostCenterDto): Promise<CostCenter> {
    const response = await apiClient.patch<CostCenter>(`/settings/cost-centers/${id}`, {
      name: data.name,
      name_ar: data.nameAr,
      description: data.description,
      is_active: data.isActive,
    });
    return response.data as CostCenter;
  },

  /**
   * Delete cost center
   */
  async delete(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/settings/cost-centers/${id}`);
    return response.data as { success: boolean };
  },

  /**
   * Toggle active status
   */
  async toggleActive(id: string): Promise<CostCenter> {
    const response = await apiClient.patch<CostCenter>(`/settings/cost-centers/${id}/toggle`);
    return response.data as CostCenter;
  },
};
