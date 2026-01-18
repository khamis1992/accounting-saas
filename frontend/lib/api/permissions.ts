/**
 * Permissions API
 * Permission management API calls
 */

import { apiClient } from "./client";

export interface Permission {
  id: string;
  code: string;
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  module: string;
  category?: string;
  created_at: string;
  updated_at: string;
}

export interface PermissionFilters {
  module?: string;
  category?: string;
  search?: string;
}

export const permissionsApi = {
  async getAll(filters?: PermissionFilters): Promise<Permission[]> {
    const params = new URLSearchParams();
    if (filters?.module) params.append("module", filters.module);
    if (filters?.category) params.append("category", filters.category);
    if (filters?.search) params.append("search", filters.search);

    const query = params.toString();
    const response = await apiClient.get<Permission[]>(
      query ? `/settings/permissions?${query}` : "/settings/permissions"
    );
    return response.data || [];
  },

  async getById(id: string): Promise<Permission> {
    const response = await apiClient.get<Permission>(`/settings/permissions/${id}`);
    return response.data as Permission;
  },

  async getByModule(module: string): Promise<Permission[]> {
    const response = await apiClient.get<Permission[]>(`/settings/permissions/module/${module}`);
    return response.data || [];
  },
};
