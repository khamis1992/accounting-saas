/**
 * Customers API
 * All customer-related API calls
 */

import { apiClient } from './client';

export interface Customer {
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
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerDto {
  code: string;
  nameEn: string;
  nameAr: string;
  vatNumber?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  country?: string;
  creditLimit?: number;
  paymentTermsDays?: number;
  isActive?: boolean;
  notes?: string;
}

export interface UpdateCustomerDto {
  nameEn?: string;
  nameAr?: string;
  vatNumber?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  country?: string;
  creditLimit?: number;
  paymentTermsDays?: number;
  isActive?: boolean;
  notes?: string;
}

export interface CustomerFilters {
  isActive?: boolean;
  search?: string;
}

export const customersApi = {
  /**
   * Get all customers
   */
  async getAll(filters?: CustomerFilters): Promise<Customer[]> {
    const params = new URLSearchParams();
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters?.search) params.append('search', filters.search);

    const query = params.toString();
    const response = await apiClient.get<Customer[]>(
      query ? `/customers?${query}` : '/customers',
    );
    return response.data || [];
  },

  /**
   * Get customer by ID
   */
  async getById(id: string): Promise<Customer> {
    const response = await apiClient.get<Customer>(`/customers/${id}`);
    return response.data as Customer;
  },

  /**
   * Create new customer
   */
  async create(data: CreateCustomerDto): Promise<Customer> {
    const response = await apiClient.post<Customer>('/customers', {
      code: data.code,
      name_en: data.nameEn,
      name_ar: data.nameAr,
      vat_number: data.vatNumber,
      email: data.email,
      phone: data.phone,
      mobile: data.mobile,
      address: data.address,
      city: data.city,
      country: data.country,
      credit_limit: data.creditLimit,
      payment_terms_days: data.paymentTermsDays,
      is_active: data.isActive ?? true,
      notes: data.notes,
    });
    return response.data as Customer;
  },

  /**
   * Update customer
   */
  async update(id: string, data: UpdateCustomerDto): Promise<Customer> {
    const response = await apiClient.patch<Customer>(`/customers/${id}`, {
      name_en: data.nameEn,
      name_ar: data.nameAr,
      vat_number: data.vatNumber,
      email: data.email,
      phone: data.phone,
      mobile: data.mobile,
      address: data.address,
      city: data.city,
      country: data.country,
      credit_limit: data.creditLimit,
      payment_terms_days: data.paymentTermsDays,
      is_active: data.isActive,
      notes: data.notes,
    });
    return response.data as Customer;
  },

  /**
   * Delete customer
   */
  async delete(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/customers/${id}`);
    return response.data as { success: boolean };
  },
};
