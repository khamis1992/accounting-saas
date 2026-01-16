/**
 * Invoices API
 * All invoice-related API calls
 */

import { apiClient } from './client';

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
  invoice_type: 'sales' | 'purchase';
  party_id: string;
  party_type: 'customer' | 'vendor';
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
  status: 'draft' | 'submitted' | 'approved' | 'posted' | 'paid' | 'partial';
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
  invoiceType: 'sales' | 'purchase';
  partyId: string;
  partyType: 'customer' | 'vendor';
  invoiceDate: Date;
  dueDate?: Date;
  currency?: string;
  exchangeRate?: number;
  notes?: string;
  attachmentUrl?: string;
  lines: Array<{
    lineNumber: number;
    descriptionAr?: string;
    descriptionEn?: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    discountPercent: number;
    accountId?: string;
  }>;
}

export interface UpdateInvoiceDto {
  invoiceDate?: Date;
  dueDate?: Date;
  currency?: string;
  exchangeRate?: number;
  notes?: string;
  attachmentUrl?: string;
}

export interface InvoiceFilters {
  invoiceType?: 'sales' | 'purchase';
  status?: string;
  partyType?: 'customer' | 'vendor';
  startDate?: string;
  endDate?: string;
}

export const invoicesApi = {
  /**
   * Get all invoices
   */
  async getAll(filters?: InvoiceFilters): Promise<Invoice[]> {
    const params = new URLSearchParams();
    if (filters?.invoiceType) params.append('invoiceType', filters.invoiceType);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.partyType) params.append('partyType', filters.partyType);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const query = params.toString();
    const response = await apiClient.get<Invoice[]>(
      query ? `/invoices?${query}` : '/invoices',
    );
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
    const response = await apiClient.post<Invoice>('/invoices', {
      invoice_type: data.invoiceType,
      party_id: data.partyId,
      party_type: data.partyType,
      invoice_date: data.invoiceDate.toISOString(),
      due_date: data.dueDate?.toISOString(),
      currency: data.currency || 'QAR',
      exchange_rate: data.exchangeRate || 1,
      notes: data.notes,
      attachment_url: data.attachmentUrl,
      lines: data.lines.map((line) => ({
        line_number: line.lineNumber,
        description_ar: line.descriptionAr,
        description_en: line.descriptionEn,
        quantity: line.quantity,
        unit_price: line.unitPrice,
        tax_rate: line.taxRate,
        discount_percent: line.discountPercent,
        account_id: line.accountId,
      })),
    });
    return response.data as Invoice;
  },

  /**
   * Update invoice (draft only)
   */
  async update(id: string, data: UpdateInvoiceDto): Promise<Invoice> {
    const response = await apiClient.patch<Invoice>(`/invoices/${id}`, {
      invoice_date: data.invoiceDate?.toISOString(),
      due_date: data.dueDate?.toISOString(),
      currency: data.currency,
      exchange_rate: data.exchangeRate,
      notes: data.notes,
      attachment_url: data.attachmentUrl,
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
