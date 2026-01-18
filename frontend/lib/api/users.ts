/**
 * Users API
 * All user-related API calls
 */

import { apiClient } from "./client";

export interface UserProfile {
  id: string;
  tenant_id: string;
  email: string;
  first_name_ar?: string;
  first_name_en?: string;
  last_name_ar?: string;
  last_name_en?: string;
  phone?: string;
  avatar_url?: string;
  preferred_language: "ar" | "en";
  timezone?: string;
  notification_preferences?: string;
  status: "active" | "inactive" | "pending" | "suspended";
  is_active: boolean;
  branch_id?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
  user_roles?: Array<{
    roles: Role;
  }>;
  branches?: {
    id: string;
    name: string;
    name_ar: string;
  };
}

export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface UpdateProfileDto {
  firstNameAr?: string;
  firstNameEn?: string;
  lastNameAr?: string;
  lastNameEn?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  preferredLanguage?: "ar" | "en";
  timezone?: string;
  notificationPreferences?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface InviteUserDto {
  email: string;
  firstNameAr: string;
  firstNameEn: string;
  lastNameAr?: string;
  lastNameEn?: string;
  preferredLanguage?: "ar" | "en";
  timezone?: string;
  defaultBranchId?: string;
  roleIds: string[];
  message?: string;
}

export interface UserFilters {
  status?: string;
  search?: string;
  roleId?: string;
  branchId?: string;
}

export const usersApi = {
  /**
   * Get current user profile
   */
  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>("/users/me");
    return response.data as UserProfile;
  },

  /**
   * Get current user roles
   */
  async getMyRoles(): Promise<Role[]> {
    const response = await apiClient.get<Role[]>("/users/me/roles");
    return response.data as Role[];
  },

  /**
   * Get current user permissions
   */
  async getMyPermissions(): Promise<string[]> {
    const response = await apiClient.get<string[]>("/users/me/permissions");
    return response.data as string[];
  },

  /**
   * Update current user profile
   */
  async updateProfile(data: UpdateProfileDto): Promise<UserProfile> {
    const response = await apiClient.patch<UserProfile>("/users/me/profile", {
      first_name_ar: data.firstNameAr,
      first_name_en: data.firstNameEn,
      last_name_ar: data.lastNameAr,
      last_name_en: data.lastNameEn,
      email: data.email,
      phone: data.phone,
      avatar_url: data.avatarUrl,
      preferred_language: data.preferredLanguage,
      timezone: data.timezone,
      notification_preferences: data.notificationPreferences,
    });
    return response.data as UserProfile;
  },

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordDto): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post("/users/me/change-password", {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    return response.data as { success: boolean; message: string };
  },

  /**
   * Upload avatar
   */
  async uploadAvatar(file: File): Promise<UserProfile> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/avatar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiClient.getAccessToken()}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to upload avatar");
    }

    const data = await response.json();
    return data as UserProfile;
  },

  /**
   * List all users (admin only)
   */
  async listUsers(filters?: UserFilters): Promise<UserProfile[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.search) params.append("search", filters.search);
    if (filters?.roleId) params.append("roleId", filters.roleId);
    if (filters?.branchId) params.append("branchId", filters.branchId);

    const query = params.toString();
    const response = await apiClient.get<UserProfile[]>(query ? `/users?${query}` : "/users");
    return response.data || [];
  },

  /**
   * Get user by ID (admin only)
   */
  async getById(id: string): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>(`/users/${id}`);
    return response.data as UserProfile;
  },

  /**
   * Invite new user (admin only)
   */
  async inviteUser(
    data: InviteUserDto
  ): Promise<{ user: UserProfile; tempPassword: string; message: string }> {
    const response = await apiClient.post("/users/invite", {
      email: data.email,
      firstNameAr: data.firstNameAr,
      firstNameEn: data.firstNameEn,
      lastNameAr: data.lastNameAr,
      lastNameEn: data.lastNameEn,
      preferred_language: data.preferredLanguage,
      timezone: data.timezone,
      defaultBranchId: data.defaultBranchId,
      roleIds: data.roleIds,
      message: data.message,
    });
    return response.data as { user: UserProfile; tempPassword: string; message: string };
  },

  /**
   * Update user role (admin only)
   */
  async updateRole(userId: string, roleId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.patch(`/users/${userId}/role`, { roleId });
    return response.data as { success: boolean; message: string };
  },

  /**
   * Deactivate user (admin only)
   */
  async deactivateUser(
    userId: string
  ): Promise<{ success: boolean; message: string; user: UserProfile }> {
    const response = await apiClient.patch(`/users/${userId}/deactivate`, {});
    return response.data as { success: boolean; message: string; user: UserProfile };
  },

  /**
   * Activate user (admin only)
   */
  async activateUser(
    userId: string
  ): Promise<{ success: boolean; message: string; user: UserProfile }> {
    const response = await apiClient.patch(`/users/${userId}/activate`, {});
    return response.data as { success: boolean; message: string; user: UserProfile };
  },
};
