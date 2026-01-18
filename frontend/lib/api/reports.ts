/**
 * Reports API
 * All report-related API calls
 */

import { apiClient } from "./client";

export interface ReportCategory {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  icon: string;
  order: number;
}

export interface Report {
  id: string;
  category_id: string;
  code: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  is_favorite: boolean;
  last_generated?: string;
  generated_count: number;
}

export interface ReportGenerationParams {
  reportCode: string;
  startDate?: string;
  endDate?: string;
  comparisonStartDate?: string;
  comparisonEndDate?: string;
  format?: "pdf" | "excel" | "csv";
  filters?: Record<string, any>;
}

export interface RecentReport {
  id: string;
  report_id: string;
  report_name: string;
  report_name_ar: string;
  generated_at: string;
  generated_by: string;
  parameters: Record<string, any>;
  file_url?: string;
}

export interface ReportTemplate {
  report_code: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  category_id: string;
  available_periods: string[];
  default_period: string;
  requires_filters: boolean;
  filter_options?: Record<string, any>;
}

export const reportsApi = {
  /**
   * Get all report categories
   */
  async getCategories(): Promise<ReportCategory[]> {
    const response = await apiClient.get<ReportCategory[]>("/reports/categories");
    return response.data || [];
  },

  /**
   * Get all reports
   */
  async getAll(filters?: {
    categoryId?: string;
    search?: string;
    isFavorite?: boolean;
  }): Promise<Report[]> {
    const params = new URLSearchParams();
    if (filters?.categoryId) params.append("categoryId", filters.categoryId);
    if (filters?.search) params.append("search", filters.search);
    if (filters?.isFavorite !== undefined) params.append("isFavorite", String(filters.isFavorite));

    const query = params.toString();
    const response = await apiClient.get<Report[]>(query ? `/reports?${query}` : "/reports");
    return response.data || [];
  },

  /**
   * Get report by ID
   */
  async getById(id: string): Promise<Report> {
    const response = await apiClient.get<Report>(`/reports/${id}`);
    return response.data as Report;
  },

  /**
   * Get report templates
   */
  async getTemplates(): Promise<ReportTemplate[]> {
    const response = await apiClient.get<ReportTemplate[]>("/reports/templates");
    return response.data || [];
  },

  /**
   * Generate report
   */
  async generate(params: ReportGenerationParams): Promise<{ reportId: string; fileUrl?: string }> {
    const response = await apiClient.post<{ reportId: string; fileUrl?: string }>(
      "/reports/generate",
      params
    );
    return response.data as { reportId: string; fileUrl?: string };
  },

  /**
   * Download report
   */
  async download(params: ReportGenerationParams): Promise<void> {
    await apiClient.download("/reports/download", params as unknown as Record<string, string | number | boolean>);
  },

  /**
   * Get recent reports
   */
  async getRecent(limit = 10): Promise<RecentReport[]> {
    const response = await apiClient.get<RecentReport[]>(`/reports/recent?limit=${limit}`);
    return response.data || [];
  },

  /**
   * Toggle favorite status
   */
  async toggleFavorite(reportId: string): Promise<{ isFavorite: boolean }> {
    const response = await apiClient.patch<{ isFavorite: boolean }>(
      `/reports/${reportId}/favorite`
    );
    return response.data as { isFavorite: boolean };
  },

  /**
   * Schedule report generation
   */
  async schedule(data: {
    reportCode: string;
    schedule: "daily" | "weekly" | "monthly";
    parameters: ReportGenerationParams;
    recipients: string[];
  }): Promise<{ scheduleId: string }> {
    const response = await apiClient.post<{ scheduleId: string }>("/reports/schedule", data);
    return response.data as { scheduleId: string };
  },

  /**
   * Get scheduled reports
   */
  async getScheduled(): Promise<any[]> {
    const response = await apiClient.get<any[]>("/reports/scheduled");
    return response.data || [];
  },

  /**
   * Delete scheduled report
   */
  async deleteScheduled(scheduleId: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(
      `/reports/scheduled/${scheduleId}`
    );
    return response.data as { success: boolean };
  },
};
