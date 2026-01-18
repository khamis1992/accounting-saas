/**
 * Invoices API
 * All invoice-related API calls
 */

import { apiClient } from "./client";

export interface InvoiceLine {
  id: string;
  invoice_id: string;
  line_number: number;
  description_ar?: string;
  description_en?: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  discount_percent: number;
  discount_amount: number;
  total_amount: number;
  account_id?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceTax {
  id: string;
  invoice_id: string;
  tax_name: string;
  tax_rate: number;
  tax_amount: number;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  invoice_number: string;
  invoice_type: "sales" | "purchase";
  party_id: string;
  party_type: "customer" | "vendor";
  party?: {
    id: string;
    name_en: string;
    name_ar: string;
  };
  invoice_date: string;
  due_date?: string;
  currency: string;
  exchange_rate: number;
  subtotal: number;
  total_tax: number;
  total_discount: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  status: "draft" | "submitted" | "approved" | "posted" | "paid" | "partial";
  notes?: string;
  attachment_url?: string;
  submitted_by?: string;
  submitted_at?: string;
  approved_by?: string;
  approved_at?: string;
  posted_by?: string;
  posted_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  invoice_lines?: InvoiceLine[];
  invoice_taxes?: InvoiceTax[];
}

export interface CreateInvoiceDto {
  invoice_type: "sales" | "purchase";
  party_id: string;
  party_type: "customer" | "vendor";
  invoice_date: Date | string;
  due_date?: Date | string;
  currency?: string;
  exchange_rate?: number;
  notes?: string;
  attachment_url?: string;
  lines: Array<{
    line_number: number;
    description_ar?: string;
    description_en?: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    discount_percent: number;
    account_id?: string;
  }>;
}

export interface UpdateInvoiceDto {
  invoice_date?: Date | string;
  due_date?: Date | string;
  currency?: string;
  exchange_rate?: number;
  notes?: string;
  attachment_url?: string;
}

export interface InvoiceFilters {
  invoice_type?: "sales" | "purchase";
  status?: string;
  party_type?: "customer" | "vendor";
  start_date?: string;
  end_date?: string;
}

export const invoicesApi = {
  /**
   * Get all invoices
   */
  async getAll(filters?: InvoiceFilters): Promise<Invoice[]> {
    const params = new URLSearchParams();
    if (filters?.invoice_type) params.append("invoice_type", filters.invoice_type);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.party_type) params.append("party_type", filters.party_type);
    if (filters?.start_date) params.append("start_date", filters.start_date);
    if (filters?.end_date) params.append("end_date", filters.end_date);

    const query = params.toString();
    const response = await apiClient.get<Invoice[]>(query ? `/invoices?${query}` : "/invoices");
    return response.data || [];
  },

  /**
   * Get invoice by ID
   */
  async getById(id: string): Promise<Invoice> {
    const response = await apiClient.get<Invoice>(`/invoices/${id}`);
    return response.data as Invoice;
  },

  /**
   * Create new invoice
   */
  async create(data: CreateInvoiceDto): Promise<Invoice> {
    const response = await apiClient.post<Invoice>("/invoices", {
      invoice_type: data.invoice_type,
      party_id: data.party_id,
      party_type: data.party_type,
      invoice_date: typeof data.invoice_date === 'string' ? data.invoice_date : data.invoice_date.toISOString(),
      due_date: data.due_date ? (typeof data.due_date === 'string' ? data.due_date : data.due_date.toISOString()) : undefined,
      currency: data.currency || "QAR",
      exchange_rate: data.exchange_rate || 1,
      notes: data.notes,
      attachment_url: data.attachment_url,
      lines: data.lines.map((line) => ({
        line_number: line.line_number,
        description_ar: line.description_ar,
        description_en: line.description_en,
        quantity: line.quantity,
        unit_price: line.unit_price,
        tax_rate: line.tax_rate,
        discount_percent: line.discount_percent,
        account_id: line.account_id,
      })),
    });
    return response.data as Invoice;
  },

  /**
   * Update invoice (draft only)
   */
  async update(id: string, data: UpdateInvoiceDto): Promise<Invoice> {
    const response = await apiClient.patch<Invoice>(`/invoices/${id}`, {
      invoice_date: data.invoice_date ? (typeof data.invoice_date === 'string' ? data.invoice_date : data.invoice_date.toISOString()) : undefined,
      due_date: data.due_date ? (typeof data.due_date === 'string' ? data.due_date : data.due_date.toISOString()) : undefined,
      currency: data.currency,
      exchange_rate: data.exchange_rate,
      notes: data.notes,
      attachment_url: data.attachment_url,
    });
    return response.data as Invoice;
  },

  /**
   * Delete invoice (draft only)
   */
  async delete(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/invoices/${id}`);
    return response.data as { success: boolean };
  },

  /**
   * Submit invoice for approval
   */
  async submit(id: string): Promise<Invoice> {
    const response = await apiClient.post<Invoice>(`/invoices/${id}/submit`);
    return response.data as Invoice;
  },

  /**
   * Approve invoice
   */
  async approve(id: string): Promise<Invoice> {
    const response = await apiClient.post<Invoice>(`/invoices/${id}/approve`);
    return response.data as Invoice;
  },

  /**
   * Post invoice to ledger
   */
  async post(id: string): Promise<Invoice> {
    const response = await apiClient.post<Invoice>(`/invoices/${id}/post`);
    return response.data as Invoice;
  },
};
