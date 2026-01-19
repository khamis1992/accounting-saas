/**
 * Quotations API
 * All quotation-related API calls
 */

import { apiClient } from "./client";

export type QuotationStatus = "draft" | "sent" | "accepted" | "rejected" | "expired" | "converted";

export interface QuotationItem {
  id?: string;
  product_id?: string;
  description: string;
  description_ar?: string;
  description_en?: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax_rate: number;
  total: number;
}

export interface Quotation {
  id: string;
  tenant_id: string;
  quotation_number: string;
  customer_id: string;
  customer_name?: string;
  customer?: {
    id: string;
    name_en: string;
    name_ar: string;
    email?: string;
    phone?: string;
  };
  date: string;
  valid_until: string;
  status: QuotationStatus;
  items: QuotationItem[];
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  total_amount?: number;
  notes?: string;
  reference_number?: string;
  converted_to_invoice?: boolean;
  invoice_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  sent_at?: string;
  accepted_at?: string;
  rejected_at?: string;
}

export interface CreateQuotationDto {
  customer_id: string;
  date: Date | string;
  valid_until: Date | string;
  items: Array<{
    description: string;
    description_ar?: string;
    description_en?: string;
    quantity: number;
    unit_price: number;
    discount: number;
    tax_rate: number;
  }>;
  notes?: string;
}

// Alias for backward compatibility
export type QuotationCreateDto = CreateQuotationDto;

export interface UpdateQuotationDto {
  date?: Date | string;
  valid_until?: Date | string;
  items?: Array<{
    id?: string;
    description: string;
    description_ar?: string;
    description_en?: string;
    quantity: number;
    unit_price: number;
    discount: number;
    tax_rate: number;
  }>;
  notes?: string;
}

export interface QuotationFilters {
  status?: QuotationStatus;
  customer_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface QuotationResponse {
  data: Quotation[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export const quotationsApi = {
  /**
   * Get all quotations with optional filters
   */
  async getAll(filters?: QuotationFilters): Promise<Quotation[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.customer_id) params.append("customer_id", filters.customer_id);
    if (filters?.start_date) params.append("start_date", filters.start_date);
    if (filters?.end_date) params.append("end_date", filters.end_date);
    if (filters?.search) params.append("search", filters.search);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const query = params.toString();
    const response = await apiClient.get<QuotationResponse>(
      query ? `/quotations?${query}` : "/quotations"
    );
    return response.data?.data || [];
  },

  /**
   * Get quotation by ID
   */
  async getById(id: string): Promise<Quotation> {
    const response = await apiClient.get<Quotation>(`/quotations/${id}`);
    return response.data as Quotation;
  },

  /**
   * Create new quotation
   */
  async create(data: CreateQuotationDto): Promise<Quotation> {
    const response = await apiClient.post<Quotation>("/quotations", {
      customer_id: data.customer_id,
      date: typeof data.date === 'string' ? data.date : data.date.toISOString(),
      valid_until: typeof data.valid_until === 'string' ? data.valid_until : data.valid_until.toISOString(),
      items: data.items,
      notes: data.notes,
    });
    return response.data as Quotation;
  },

  /**
   * Update quotation (draft only)
   */
  async update(id: string, data: UpdateQuotationDto): Promise<Quotation> {
    const response = await apiClient.put<Quotation>(`/quotations/${id}`, {
      date: data.date ? (typeof data.date === 'string' ? data.date : data.date.toISOString()) : undefined,
      valid_until: data.valid_until ? (typeof data.valid_until === 'string' ? data.valid_until : data.valid_until.toISOString()) : undefined,
      items: data.items,
      notes: data.notes,
    });
    return response.data as Quotation;
  },

  /**
   * Delete quotation (draft only)
   */
  async delete(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/quotations/${id}`);
    return response.data as { success: boolean };
  },

  /**
   * Send quotation to customer
   */
  async send(id: string): Promise<Quotation> {
    const response = await apiClient.post<Quotation>(`/quotations/${id}/send`);
    return response.data as Quotation;
  },

  /**
   * Mark quotation as accepted
   */
  async accept(id: string): Promise<Quotation> {
    const response = await apiClient.post<Quotation>(`/quotations/${id}/accept`);
    return response.data as Quotation;
  },

  /**
   * Mark quotation as rejected
   */
  async reject(id: string): Promise<Quotation> {
    const response = await apiClient.post<Quotation>(`/quotations/${id}/reject`);
    return response.data as Quotation;
  },

  /**
   * Convert quotation to invoice
   */
  async convertToInvoice(id: string): Promise<{ invoiceId: string; quotationNumber: string }> {
    const response = await apiClient.post<{ invoiceId: string; quotationNumber: string }>(
      `/quotations/${id}/convert-to-invoice`,
      {}
    );
    return response.data as { invoiceId: string; quotationNumber: string };
  },

  /**
   * Export quotation to PDF
   */
  async exportToPDF(id: string): Promise<Blob> {
    const response = await fetch(`${apiClient["baseURL"]}/quotations/${id}/export/pdf`, {
      headers: {
        Authorization: `Bearer ${apiClient.getAccessToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to export PDF");
    }

    return response.blob();
  },
};
