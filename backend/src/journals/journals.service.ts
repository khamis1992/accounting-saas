import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

interface CreateJournalDto {
  journalNumber?: string;
  journalType: 'general' | 'sales' | 'purchase' | 'receipt' | 'payment' | 'expense' | 'depreciation' | 'adjustment' | 'opening' | 'closing';
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

interface UpdateJournalDto {
  descriptionAr?: string;
  descriptionEn?: string;
  transactionDate?: Date;
  postingDate?: Date;
  currency?: string;
  exchangeRate?: number;
  notes?: string;
  attachmentUrl?: string;
}

@Injectable()
export class JournalsService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(tenantId: string, filters?: any) {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('journals')
      .select(
        `
        *,
        fiscal_period_id,
        journal_lines(
          *,
          chart_of_accounts(id, code, name_en, name_ar, type),
          cost_centers(id, code, name_en, name_ar)
        )
      `,
      )
      .eq('tenant_id', tenantId)
      .order('transaction_date', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.journalType) {
      query = query.eq('journal_type', filters.journalType);
    }

    if (filters?.startDate && filters?.endDate) {
      query = query.gte('transaction_date', filters.startDate)
                  .lte('transaction_date', filters.endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data;
  }

  async findOne(id: string, tenantId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('journals')
      .select(
        `
        *,
        journal_lines(
          *,
          chart_of_accounts(id, code, name_en, name_ar, type, balance_type),
          cost_centers(id, code, name_en, name_ar)
        )
      `,
      )
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async create(
    createJournalDto: CreateJournalDto,
    tenantId: string,
    userId: string,
    branchId?: string,
  ) {
    const supabase = this.supabaseService.getClient();

    // Validate double-entry: debit must equal credit
    const totalDebit = createJournalDto.lines.reduce(
      (sum, l) => sum + l.debit,
      0,
    );
    const totalCredit = createJournalDto.lines.reduce(
      (sum, l) => sum + l.credit,
      0,
    );

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException('Debit must equal credit');
    }

    if (totalDebit === 0) {
      throw new BadRequestException('Journal must have non-zero amounts');
    }

    // Validate each line has either debit OR credit, not both
    for (const line of createJournalDto.lines) {
      if ((line.debit > 0 && line.credit > 0) || (line.debit === 0 && line.credit === 0)) {
        throw new BadRequestException(
          'Each line must have either a debit or credit amount (not both, not neither)',
        );
      }
    }

    // Get transaction date's fiscal period
    const transactionDate = createJournalDto.transactionDate;
    const { data: fiscalPeriod } = await supabase
      .from('fiscal_periods')
      .select('id, is_locked')
      .eq('tenant_id', tenantId)
      .lte('start_date', transactionDate.toISOString())
      .gte('end_date', transactionDate.toISOString())
      .single();

    if (!fiscalPeriod) {
      throw new BadRequestException('No fiscal period found for transaction date');
    }

    if (fiscalPeriod.is_locked) {
      throw new BadRequestException('Fiscal period is locked');
    }

    // Validate accounts exist and are active/posting allowed
    const accountIds = createJournalDto.lines.map((l) => l.accountId);
    const { data: accounts } = await supabase
      .from('chart_of_accounts')
      .select('id, code, name_en, is_active, is_posting_allowed')
      .in('id', accountIds);

    if (!accounts || accounts.length !== accountIds.length) {
      throw new BadRequestException('One or more accounts not found');
    }

    const invalidAccounts = accounts.filter(
      (a) => !a.is_active || !a.is_posting_allowed,
    );
    if (invalidAccounts.length > 0) {
      throw new BadRequestException(
        'Cannot post to inactive or non-posting accounts',
      );
    }

    // Generate journal number if not provided
    let journalNumber = createJournalDto.journalNumber;
    if (!journalNumber) {
      journalNumber = await this.generateJournalNumber(tenantId, createJournalDto.journalType);
    }

    // Create journal
    const { data: journal, error: journalError } = await supabase
      .from('journals')
      .insert({
        tenant_id: tenantId,
        branch_id: branchId,
        journal_number: journalNumber,
        journal_type: createJournalDto.journalType,
        reference_number: createJournalDto.referenceNumber,
        description_ar: createJournalDto.descriptionAr,
        description_en: createJournalDto.descriptionEn,
        transaction_date: transactionDate.toISOString(),
        posting_date: createJournalDto.postingDate?.toISOString(),
        currency: createJournalDto.currency || 'QAR',
        exchange_rate: createJournalDto.exchangeRate || 1,
        total_debit: totalDebit,
        total_credit: totalCredit,
        status: 'draft',
        notes: createJournalDto.notes,
        attachment_url: createJournalDto.attachmentUrl,
        source_module: createJournalDto.sourceModule,
        source_id: createJournalDto.sourceId,
        created_by: userId,
      })
      .select()
      .single();

    if (journalError) {
      throw journalError;
    }

    // Create journal lines
    const linesToInsert = createJournalDto.lines.map((line) => ({
      journal_id: journal.id,
      tenant_id: tenantId,
      line_number: line.lineNumber,
      account_id: line.accountId,
      description_ar: line.descriptionAr,
      description_en: line.descriptionEn,
      cost_center_id: line.costCenterId,
      debit: line.debit,
      credit: line.credit,
      currency: line.currency || createJournalDto.currency || 'QAR',
      exchange_rate: line.exchangeRate || createJournalDto.exchangeRate || 1,
      reference: line.reference,
      reference_type: line.referenceType,
      reference_id: line.referenceId,
    }));

    const { error: linesError } = await supabase
      .from('journal_lines')
      .insert(linesToInsert);

    if (linesError) {
      // Rollback journal creation
      await supabase.from('journals').delete().eq('id', journal.id);
      throw linesError;
    }

    return this.findOne(journal.id, tenantId);
  }

  async update(
    id: string,
    updateJournalDto: UpdateJournalDto,
    tenantId: string,
  ) {
    const supabase = this.supabaseService.getClient();

    // Build update object with proper column names
    const updateData: any = {};
    if (updateJournalDto.descriptionAr !== undefined) updateData.description_ar = updateJournalDto.descriptionAr;
    if (updateJournalDto.descriptionEn !== undefined) updateData.description_en = updateJournalDto.descriptionEn;
    if (updateJournalDto.transactionDate !== undefined) updateData.transaction_date = updateJournalDto.transactionDate.toISOString();
    if (updateJournalDto.postingDate !== undefined) updateData.posting_date = updateJournalDto.postingDate.toISOString();
    if (updateJournalDto.currency !== undefined) updateData.currency = updateJournalDto.currency;
    if (updateJournalDto.exchangeRate !== undefined) updateData.exchange_rate = updateJournalDto.exchangeRate;
    if (updateJournalDto.notes !== undefined) updateData.notes = updateJournalDto.notes;
    if (updateJournalDto.attachmentUrl !== undefined) updateData.attachment_url = updateJournalDto.attachmentUrl;

    const { data, error } = await supabase
      .from('journals')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .eq('status', 'draft')
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new BadRequestException('Can only update draft journals');
    }

    return data;
  }

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
      currency?: string;
      exchangeRate?: number;
    }>,
    tenantId: string,
  ) {
    const supabase = this.supabaseService.getClient();

    // Validate journal is in draft status
    const { data: journal } = await supabase
      .from('journals')
      .select('id, status')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (!journal) {
      throw new BadRequestException('Journal not found');
    }

    if (journal.status !== 'draft') {
      throw new BadRequestException('Can only update draft journals');
    }

    // Validate double-entry
    const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException('Debit must equal credit');
    }

    // Delete existing lines
    await supabase.from('journal_lines').delete().eq('journal_id', id);

    // Insert new lines
    const linesToInsert = lines.map((line) => ({
      journal_id: id,
      tenant_id: tenantId,
      line_number: line.lineNumber,
      account_id: line.accountId,
      description_ar: line.descriptionAr,
      description_en: line.descriptionEn,
      cost_center_id: line.costCenterId,
      debit: line.debit,
      credit: line.credit,
      currency: line.currency || 'QAR',
      exchange_rate: line.exchangeRate || 1,
    }));

    const { error: linesError } = await supabase
      .from('journal_lines')
      .insert(linesToInsert);

    if (linesError) {
      throw linesError;
    }

    // Update totals
    await supabase
      .from('journals')
      .update({
        total_debit: totalDebit,
        total_credit: totalCredit,
      })
      .eq('id', id);

    return this.findOne(id, tenantId);
  }

  async submit(id: string, tenantId: string, userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('journals')
      .update({
        status: 'submitted',
        submitted_by: userId,
        submitted_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .eq('status', 'draft')
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new BadRequestException('Journal not found or not in draft status');
    }

    return data;
  }

  async approve(id: string, tenantId: string, userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('journals')
      .update({
        status: 'approved',
        approved_by: userId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .eq('status', 'submitted')
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new BadRequestException('Journal not found or not in submitted status');
    }

    return data;
  }

  async post(id: string, tenantId: string, userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('journals')
      .update({
        status: 'posted',
        posted_by: userId,
        posted_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .eq('status', 'approved')
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new BadRequestException('Journal not found or not in approved status');
    }

    return data;
  }

  async remove(id: string, tenantId: string) {
    const supabase = this.supabaseService.getClient();

    // Only allow deletion of draft journals
    const { data: journal } = await supabase
      .from('journals')
      .select('status')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (!journal) {
      throw new BadRequestException('Journal not found');
    }

    if (journal.status !== 'draft') {
      throw new BadRequestException('Can only delete draft journals');
    }

    const { error } = await supabase.from('journals').delete().eq('id', id);

    if (error) {
      throw error;
    }

    return { success: true };
  }

  private async generateJournalNumber(tenantId: string, journalType: string): Promise<string> {
    const supabase = this.supabaseService.getClient();

    // Get the highest journal number for this type
    const typePrefix = {
      general: 'GN',
      sales: 'SL',
      purchase: 'PU',
      receipt: 'RC',
      payment: 'PM',
      expense: 'EX',
      depreciation: 'DP',
      adjustment: 'AD',
      opening: 'OP',
      closing: 'CL',
    }[journalType] || 'JR';

    const { data, error } = await supabase
      .from('journals')
      .select('journal_number')
      .eq('tenant_id', tenantId)
      .eq('journal_type', journalType)
      .ilike('journal_number', `${typePrefix}%`)
      .order('journal_number', { ascending: false })
      .limit(1);

    if (error) {
      throw error;
    }

    let nextNumber = 1;
    if (data && data.length > 0) {
      const lastNumber = data[0].journal_number.slice(typePrefix.length);
      nextNumber = parseInt(lastNumber, 10) + 1;
    }

    return `${typePrefix}${String(nextNumber).padStart(6, '0')}`;
  }
}
