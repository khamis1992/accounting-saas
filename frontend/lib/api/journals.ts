/**
 * Journals API
 * All journal entry-related API calls
 */

import { apiClient } from "./client";

export interface JournalLine {
  id: string;
  journal_id: string;
  tenant_id: string;
  line_number: number;
  account_id: string;
  description_ar?: string;
  description_en?: string;
  cost_center_id?: string;
  debit: number;
  credit: number;
  currency?: string;
  exchange_rate: number;
  reference?: string;
  reference_type?: string;
  reference_id?: string;
  created_at: string;
  updated_at: string;
  chart_of_accounts?: {
    id: string;
    code: string;
    name_en: string;
    name_ar: string;
    type: string;
  };
  cost_centers?: {
    id: string;
    code: string;
    name_en: string;
    name_ar: string;
  };
}

export interface Journal {
  id: string;
  tenant_id: string;
  branch_id?: string;
  journal_number: string;
  journal_type:
    | "general"
    | "sales"
    | "purchase"
    | "receipt"
    | "payment"
    | "expense"
    | "depreciation"
    | "adjustment"
    | "opening"
    | "closing";
  reference_number?: string;
  description_ar: string;
  description_en?: string;
  transaction_date: string;
  posting_date?: string;
  currency: string;
  exchange_rate: number;
  total_debit: number;
  total_credit: number;
  status: "draft" | "submitted" | "approved" | "posted" | "reversed";
  submitted_by?: string;
  submitted_at?: string;
  approved_by?: string;
  approved_at?: string;
  posted_by?: string;
  posted_at?: string;
  reversed_by?: string;
  reversed_at?: string;
  notes?: string;
  attachment_url?: string;
  source_module?: string;
  source_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  journal_lines?: JournalLine[];
}

export interface CreateJournalDto {
  journal_number?: string;
  journal_type:
    | "general"
    | "sales"
    | "purchase"
    | "receipt"
    | "payment"
    | "expense"
    | "depreciation"
    | "adjustment"
    | "opening"
    | "closing";
  reference_number?: string;
  description_ar: string;
  description_en?: string;
  transaction_date: Date | string;
  posting_date?: Date | string;
  currency?: string;
  exchange_rate?: number;
  notes?: string;
  attachment_url?: string;
  source_module?: string;
  source_id?: string;
  lines: Array<{
    line_number: number;
    account_id: string;
    description_ar?: string;
    description_en?: string;
    cost_center_id?: string;
    debit: number;
    credit: number;
    currency?: string;
    exchange_rate?: number;
    reference?: string;
    reference_type?: string;
    reference_id?: string;
  }>;
}

export interface UpdateJournalDto {
  description_ar?: string;
  description_en?: string;
  transaction_date?: Date | string;
  posting_date?: Date | string;
  currency?: string;
  exchange_rate?: number;
  notes?: string;
  attachment_url?: string;
}

export interface JournalFilters {
  status?: string;
  journal_type?: string;
  start_date?: string;
  end_date?: string;
}

export const journalsApi = {
  /**
   * Get all journals
   */
  async getAll(filters?: JournalFilters): Promise<Journal[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.journal_type) params.append("journal_type", filters.journal_type);
    if (filters?.start_date) params.append("start_date", filters.start_date);
    if (filters?.end_date) params.append("end_date", filters.end_date);

    const query = params.toString();
    const response = await apiClient.get<Journal[]>(query ? `/journals?${query}` : "/journals");
    return response.data || [];
  },

  /**
   * Get journal by ID
   */
  async getById(id: string): Promise<Journal> {
    const response = await apiClient.get<Journal>(`/journals/${id}`);
    return response.data as Journal;
  },

  /**
   * Create new journal
   */
  async create(data: CreateJournalDto): Promise<Journal> {
    const response = await apiClient.post<Journal>("/journals", {
      journal_number: data.journal_number,
      journal_type: data.journal_type,
      reference_number: data.reference_number,
      description_ar: data.description_ar,
      description_en: data.description_en,
      transaction_date: typeof data.transaction_date === 'string' ? data.transaction_date : data.transaction_date.toISOString(),
      posting_date: data.posting_date ? (typeof data.posting_date === 'string' ? data.posting_date : data.posting_date.toISOString()) : undefined,
      currency: data.currency || "QAR",
      exchange_rate: data.exchange_rate || 1,
      notes: data.notes,
      attachment_url: data.attachment_url,
      source_module: data.source_module,
      source_id: data.source_id,
      lines: data.lines.map((line) => ({
        line_number: line.line_number,
        account_id: line.account_id,
        description_ar: line.description_ar,
        description_en: line.description_en,
        cost_center_id: line.cost_center_id,
        debit: line.debit,
        credit: line.credit,
        currency: line.currency || data.currency || "QAR",
        exchange_rate: line.exchange_rate || data.exchange_rate || 1,
        reference: line.reference,
        reference_type: line.reference_type,
        reference_id: line.reference_id,
      })),
    });
    return response.data as Journal;
  },

  /**
   * Update journal lines (draft only)
   */
  async updateLines(
    id: string,
    lines: Array<{
      line_number: number;
      account_id: string;
      description_ar?: string;
      description_en?: string;
      cost_center_id?: string;
      debit: number;
      credit: number;
    }>
  ): Promise<Journal> {
    const response = await apiClient.put<Journal>(`/journals/${id}/lines`, {
      lines: lines.map((line) => ({
        line_number: line.line_number,
        account_id: line.account_id,
        description_ar: line.description_ar,
        description_en: line.description_en,
        cost_center_id: line.cost_center_id,
        debit: line.debit,
        credit: line.credit,
      })),
    });
    return response.data as Journal;
  },

  /**
   * Submit journal for approval
   */
  async submit(id: string): Promise<Journal> {
    const response = await apiClient.post<Journal>(`/journals/${id}/submit`);
    return response.data as Journal;
  },

  /**
   * Approve journal
   */
  async approve(id: string): Promise<Journal> {
    const response = await apiClient.post<Journal>(`/journals/${id}/approve`);
    return response.data as Journal;
  },

  /**
   * Post journal to ledger
   */
  async post(id: string): Promise<Journal> {
    const response = await apiClient.post<Journal>(`/journals/${id}/post`);
    return response.data as Journal;
  },

  /**
   * Update journal (draft only)
   */
  async update(id: string, data: UpdateJournalDto): Promise<Journal> {
    const response = await apiClient.patch<Journal>(`/journals/${id}`, {
      description_ar: data.description_ar,
      description_en: data.description_en,
      transaction_date: data.transaction_date ? (typeof data.transaction_date === 'string' ? data.transaction_date : data.transaction_date.toISOString()) : undefined,
      posting_date: data.posting_date ? (typeof data.posting_date === 'string' ? data.posting_date : data.posting_date.toISOString()) : undefined,
      currency: data.currency,
      exchange_rate: data.exchange_rate,
      notes: data.notes,
      attachment_url: data.attachment_url,
    });
    return response.data as Journal;
  },

  /**
   * Delete journal (draft only)
   */
  async delete(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/journals/${id}`);
    return response.data as { success: boolean };
  },
};
