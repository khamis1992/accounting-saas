/**
 * Journals API
 * All journal entry-related API calls
 */

import { apiClient } from './client';

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
    | 'general'
    | 'sales'
    | 'purchase'
    | 'receipt'
    | 'payment'
    | 'expense'
    | 'depreciation'
    | 'adjustment'
    | 'opening'
    | 'closing';
  reference_number?: string;
  description_ar: string;
  description_en?: string;
  transaction_date: string;
  posting_date?: string;
  currency: string;
  exchange_rate: number;
  total_debit: number;
  total_credit: number;
  status: 'draft' | 'submitted' | 'approved' | 'posted' | 'reversed';
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
  journalNumber?: string;
  journalType:
    | 'general'
    | 'sales'
    | 'purchase'
    | 'receipt'
    | 'payment'
    | 'expense'
    | 'depreciation'
    | 'adjustment'
    | 'opening'
    | 'closing';
  referenceNumber?: string;
  descriptionAr: string;
  descriptionEn?: string;
  transactionDate: Date;
  postingDate?: Date;
  currency?: string;
  exchangeRate?: number;
  notes?: string;
  attachmentUrl?: string;
  sourceModule?: string;
  sourceId?: string;
  lines: Array<{
    lineNumber: number;
    accountId: string;
    descriptionAr?: string;
    descriptionEn?: string;
    costCenterId?: string;
    debit: number;
    credit: number;
    currency?: string;
    exchangeRate?: number;
    reference?: string;
    referenceType?: string;
    referenceId?: string;
  }>;
}

export interface UpdateJournalDto {
  descriptionAr?: string;
  descriptionEn?: string;
  transactionDate?: Date;
  postingDate?: Date;
  currency?: string;
  exchangeRate?: number;
  notes?: string;
  attachmentUrl?: string;
}

export interface JournalFilters {
  status?: string;
  journalType?: string;
  startDate?: string;
  endDate?: string;
}

export const journalsApi = {
  /**
   * Get all journals
   */
  async getAll(filters?: JournalFilters): Promise<Journal[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.journalType) params.append('journalType', filters.journalType);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const query = params.toString();
    const response = await apiClient.get<Journal[]>(
      query ? `/journals?${query}` : '/journals',
    );
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
    const response = await apiClient.post<Journal>('/journals', {
      journal_number: data.journalNumber,
      journal_type: data.journalType,
      reference_number: data.referenceNumber,
      description_ar: data.descriptionAr,
      description_en: data.descriptionEn,
      transaction_date: data.transactionDate.toISOString(),
      posting_date: data.postingDate?.toISOString(),
      currency: data.currency || 'QAR',
      exchange_rate: data.exchangeRate || 1,
      notes: data.notes,
      attachment_url: data.attachmentUrl,
      source_module: data.sourceModule,
      source_id: data.sourceId,
      lines: data.lines.map((line) => ({
        line_number: line.lineNumber,
        account_id: line.accountId,
        description_ar: line.descriptionAr,
        description_en: line.descriptionEn,
        cost_center_id: line.costCenterId,
        debit: line.debit,
        credit: line.credit,
        currency: line.currency || data.currency || 'QAR',
        exchange_rate: line.exchangeRate || data.exchangeRate || 1,
        reference: line.reference,
        reference_type: line.referenceType,
        reference_id: line.referenceId,
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
      lineNumber: number;
      accountId: string;
      descriptionAr?: string;
      descriptionEn?: string;
      costCenterId?: string;
      debit: number;
      credit: number;
    }>,
  ): Promise<Journal> {
    const response = await apiClient.put<Journal>(`/journals/${id}/lines`, {
      lines: lines.map((line) => ({
        line_number: line.lineNumber,
        account_id: line.accountId,
        description_ar: line.descriptionAr,
        description_en: line.descriptionEn,
        cost_center_id: line.costCenterId,
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
      description_ar: data.descriptionAr,
      description_en: data.descriptionEn,
      transaction_date: data.transactionDate?.toISOString(),
      posting_date: data.postingDate?.toISOString(),
      currency: data.currency,
      exchange_rate: data.exchangeRate,
      notes: data.notes,
      attachment_url: data.attachmentUrl,
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
