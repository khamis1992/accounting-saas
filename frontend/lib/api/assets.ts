/**
 * Assets API Client
 * Handles fixed assets and depreciation operations
 */

import { apiClient } from "./client";

export type AssetCategory =
  | "furniture"
  | "equipment"
  | "vehicles"
  | "computers"
  | "buildings"
  | "land"
  | "other";
export type AssetStatus = "active" | "fully-depreciated" | "disposed" | "sold";
export type DepreciationMethod = "straight-line" | "declining-balance" | "units-of-production";

export interface FixedAsset {
  id: string;
  asset_code: string;
  asset_name: string;
  category: AssetCategory;
  purchase_date: string;
  purchase_cost: number;
  salvage_value: number;
  useful_life_years: number;
  depreciation_method: DepreciationMethod;
  accumulated_depreciation: number;
  net_book_value: number;
  status: AssetStatus;
  disposal_date?: string;
  disposal_amount?: string;
  location?: string;
  notes?: string;
}

export type FixedAssetCreateDto = Omit<FixedAsset, "id" | "accumulated_depreciation" | "net_book_value">;

export interface DepreciationSchedule {
  asset_id: string;
  asset_name: string;
  asset_code: string;
  cost: number;
  salvage_value: number;
  useful_life_years: number;
  method: DepreciationMethod;
  annual_depreciation: number;
  this_period_depreciation: number;
  accumulated_depreciation: number;
  net_book_value: number;
}

export interface DepreciationRun {
  id: string;
  period_start: string;
  period_end: string;
  status: "calculated" | "posted";
  entries: DepreciationSchedule[];
  total_depreciation: number;
  created_at: string;
}

export interface JournalEntryPreview {
  date: string;
  description: string;
  entries: Array<{
    account_code: string;
    account_name: string;
    debit: number;
    credit: number;
  }>;
  total_debit: number;
  total_credit: number;
}

export const assetsApi = {
  /**
   * Get all fixed assets with optional filters
   */
  getAssets: async (filters?: {
    category?: AssetCategory;
    status?: AssetStatus;
    search?: string;
  }): Promise<FixedAsset[]> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append("category", filters.category);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.search) params.append("search", filters.search);

    const url = `/assets${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await apiClient.get<FixedAsset[]>(url);
    return response.data || [];
  },

  /**
   * Get a single fixed asset by ID
   */
  getAsset: async (id: string): Promise<FixedAsset> => {
    const response = await apiClient.get<FixedAsset>(`/assets/${id}`);
    return response.data as FixedAsset;
  },

  /**
   * Create a new fixed asset
   */
  createAsset: async (
    data: Omit<FixedAsset, "id" | "accumulated_depreciation" | "net_book_value">
  ): Promise<FixedAsset> => {
    const response = await apiClient.post<FixedAsset>("/assets", data);
    return response.data as FixedAsset;
  },

  /**
   * Update an existing fixed asset
   */
  updateAsset: async (id: string, data: Partial<FixedAsset>): Promise<FixedAsset> => {
    const response = await apiClient.put<FixedAsset>(`/assets/${id}`, data);
    return response.data as FixedAsset;
  },

  /**
   * Dispose or sell an asset
   */
  disposeAsset: async (
    id: string,
    disposalDate: string,
    disposalAmount: number,
    disposalType: "dispose" | "sell"
  ): Promise<void> => {
    await apiClient.post(`/assets/${id}/${disposalType}`, {
      disposal_date: disposalDate,
      disposal_amount: disposalAmount,
    });
  },

  /**
   * Calculate depreciation for a period
   */
  calculateDepreciation: async (
    periodStart: string,
    periodEnd: string
  ): Promise<DepreciationSchedule[]> => {
    const response = await apiClient.post<DepreciationSchedule[]>(
      "/assets/depreciation/calculate",
      {
        period_start: periodStart,
        period_end: periodEnd,
      }
    );
    return response.data || [];
  },

  /**
   * Preview journal entries before posting
   */
  previewJournalEntries: async (
    periodStart: string,
    periodEnd: string
  ): Promise<JournalEntryPreview> => {
    const response = await apiClient.post<JournalEntryPreview>("/assets/depreciation/preview", {
      period_start: periodStart,
      period_end: periodEnd,
    });
    return response.data as JournalEntryPreview;
  },

  /**
   * Post depreciation to journal
   */
  postToJournal: async (periodStart: string, periodEnd: string): Promise<void> => {
    await apiClient.post("/assets/depreciation/post", {
      period_start: periodStart,
      period_end: periodEnd,
    });
  },

  /**
   * Get depreciation history
   */
  getDepreciationHistory: async (): Promise<DepreciationRun[]> => {
    const response = await apiClient.get<DepreciationRun[]>("/assets/depreciation/history");
    return response.data || [];
  },

  /**
   * Get asset summary statistics
   */
  getAssetSummary: async (): Promise<{
    total_cost: number;
    total_accumulated_depreciation: number;
    total_net_book_value: number;
    asset_count: number;
  }> => {
    const response = await apiClient.get<any>("/assets/summary");
    return response.data;
  },
};
