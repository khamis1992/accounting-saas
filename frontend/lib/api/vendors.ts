/**
 * Vendors API
 * All vendor-related API calls
 */

import { apiClient } from "./client";

export interface Vendor {
  id: string;
  tenant_id: string;
  code: string;
  name_en: string;
  name_ar: string;
  vat_number?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  country?: string;
  credit_limit?: number;
  payment_terms_days?: number;
  bank_name?: string;
  bank_account_number?: string;
  iban?: string;
  swift_code?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateVendorDto {
  code: string;
  name_en: string;
  name_ar: string;
  vat_number?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  country?: string;
  credit_limit?: number;
  payment_terms_days?: number;
  bank_name?: string;
  bank_account_number?: string;
  iban?: string;
  swift_code?: string;
  is_active?: boolean;
  notes?: string;
}

export interface UpdateVendorDto {
  name_en?: string;
  name_ar?: string;
  vat_number?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  country?: string;
  credit_limit?: number;
  payment_terms_days?: number;
  bank_name?: string;
  bank_account_number?: string;
  iban?: string;
  swift_code?: string;
  is_active?: boolean;
  notes?: string;
}

export interface VendorFilters {
  is_active?: boolean;
  search?: string;
}

export const vendorsApi = {
  /**
   * Get all vendors
   */
  async getAll(filters?: VendorFilters): Promise<Vendor[]> {
    const params = new URLSearchParams();
    if (filters?.is_active !== undefined) params.append("is_active", String(filters.is_active));
    if (filters?.search) params.append("search", filters.search);

    const query = params.toString();
    const response = await apiClient.get<Vendor[]>(query ? `/vendors?${query}` : "/vendors");
    return response.data || [];
  },

  /**
   * Get vendor by ID
   */
  async getById(id: string): Promise<Vendor> {
    const response = await apiClient.get<Vendor>(`/vendors/${id}`);
    return response.data as Vendor;
  },

  /**
   * Create new vendor
   */
  async create(data: CreateVendorDto): Promise<Vendor> {
    const response = await apiClient.post<Vendor>("/vendors", {
      code: data.code,
      name_en: data.name_en,
      name_ar: data.name_ar,
      vat_number: data.vat_number,
      email: data.email,
      phone: data.phone,
      mobile: data.mobile,
      address: data.address,
      city: data.city,
      country: data.country,
      credit_limit: data.credit_limit,
      payment_terms_days: data.payment_terms_days,
      bank_name: data.bank_name,
      bank_account_number: data.bank_account_number,
      iban: data.iban,
      swift_code: data.swift_code,
      is_active: data.is_active ?? true,
      notes: data.notes,
    });
    return response.data as Vendor;
  },

  /**
   * Update vendor
   */
  async update(id: string, data: UpdateVendorDto): Promise<Vendor> {
    const response = await apiClient.patch<Vendor>(`/vendors/${id}`, {
      name_en: data.name_en,
      name_ar: data.name_ar,
      vat_number: data.vat_number,
      email: data.email,
      phone: data.phone,
      mobile: data.mobile,
      address: data.address,
      city: data.city,
      country: data.country,
      credit_limit: data.credit_limit,
      payment_terms_days: data.payment_terms_days,
      bank_name: data.bank_name,
      bank_account_number: data.bank_account_number,
      iban: data.iban,
      swift_code: data.swift_code,
      is_active: data.is_active,
      notes: data.notes,
    });
    return response.data as Vendor;
  },

  /**
   * Delete vendor
   */
  async delete(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/vendors/${id}`);
    return response.data as { success: boolean };
  },
};
