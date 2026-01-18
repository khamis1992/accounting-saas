/**
 * Roles API
 * Role management API calls
 */

import { apiClient } from "./client";

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  is_granted: boolean;
}

export interface Role {
  id: string;
  tenant_id: string;
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  is_system: boolean;
  is_active: boolean;
  role_permissions?: RolePermission[];
  created_at: string;
  updated_at: string;
}

export interface CreateRoleDto {
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  is_active?: boolean;
  permissions?: string[];
}

export interface RoleFilters {
  is_active?: boolean;
  search?: string;
}

export const rolesApi = {
  async getAll(filters?: RoleFilters): Promise<Role[]> {
    const params = new URLSearchParams();
    if (filters?.is_active !== undefined) params.append("is_active", String(filters.is_active));
    if (filters?.search) params.append("search", filters.search);

    const query = params.toString();
    const response = await apiClient.get<Role[]>(
      query ? `/settings/roles?${query}` : "/settings/roles"
    );
    return response.data || [];
  },

  async getById(id: string): Promise<Role> {
    const response = await apiClient.get<Role>(`/settings/roles/${id}`);
    return response.data as Role;
  },

  async create(data: CreateRoleDto): Promise<Role> {
    const response = await apiClient.post<Role>("/settings/roles", data);
    return response.data as Role;
  },

  async update(id: string, data: Partial<CreateRoleDto>): Promise<Role> {
    const response = await apiClient.patch<Role>(`/settings/roles/${id}`, data);
    return response.data as Role;
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/settings/roles/${id}`);
    return response.data as { success: boolean };
  },
};
