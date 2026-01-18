/**
 * User Profile API
 * User profile management API calls
 */

import { apiClient } from "./client";

export interface UserProfile {
  id: string;
  user_id: string;
  tenant_id: string;
  first_name_en?: string;
  first_name_ar?: string;
  last_name_en?: string;
  last_name_ar?: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  job_title?: string;
  department?: string;
  bio?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  preferences?: {
    timezone?: string;
    language?: string;
    theme?: string;
    notifications_enabled?: boolean;
    email_notifications?: boolean;
  };
  created_at: string;
  updated_at: string;
}

export const userProfileApi = {
  async get(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>("/users/profile");
    return response.data as UserProfile;
  },

  async update(id: string, data: FormData | Partial<UserProfile>): Promise<UserProfile> {
    const response = await apiClient.patch<UserProfile>(`/users/profile/${id}`, data);
    return response.data as UserProfile;
  },

  async uploadAvatar(file: File): Promise<{ avatar_url: string }> {
    const formData = new FormData();
    formData.append("avatar", file);
    const response = await apiClient.post<{ avatar_url: string }>("/users/profile/avatar", formData);
    return response.data as { avatar_url: string };
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean }> {
    const response = await apiClient.post<{ success: boolean }>("/users/profile/change-password", {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data as { success: boolean };
  },
};
