import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

interface CreateAccountDto {
  code: string;
  nameEn: string;
  nameAr: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  subtype?: string;
  parentId?: string;
  level?: number;
  isControlAccount?: boolean;
  isPostingAllowed?: boolean;
  isActive?: boolean;
  balanceType?: 'debit' | 'credit';
  description?: string;
  currency?: string;
  costCenterRequired?: boolean;
}

interface UpdateAccountDto {
  nameEn?: string;
  nameAr?: string;
  subtype?: string;
  isControlAccount?: boolean;
  isPostingAllowed?: boolean;
  isActive?: boolean;
  balanceType?: 'debit' | 'credit';
  description?: string;
  currency?: string;
  costCenterRequired?: boolean;
}

@Injectable()
export class CoaService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(tenantId: string, includeInactive = false) {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('chart_of_accounts')
      .select(
        `
        *,
        parent:parent_id(id, code, name_en, name_ar, type)
      `,
      )
      .eq('tenant_id', tenantId)
      .order('code');

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return this.buildHierarchy(data || []);
  }

  async findOne(id: string, tenantId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select(
        `
        *,
        parent:parent_id(id, code, name_en, name_ar, type),
        children:chart_of_accounts(id, code, name_en, name_ar, type)
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

  async findByCode(code: string, tenantId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('code', code)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async create(createAccountDto: CreateAccountDto, tenantId: string, createdBy?: string) {
    const supabase = this.supabaseService.getClient();

    // Check if account code already exists
    const { data: existing } = await supabase
      .from('chart_of_accounts')
      .select('id')
      .eq('code', createAccountDto.code)
      .eq('tenant_id', tenantId)
      .single();

    if (existing) {
      throw new BadRequestException('Account code already exists');
    }

    // If parent_id is provided, verify parent exists and set level
    let level = createAccountDto.level ?? 1;
    if (createAccountDto.parentId) {
      const { data: parent } = await supabase
        .from('chart_of_accounts')
        .select('id, type, level')
        .eq('id', createAccountDto.parentId)
        .eq('tenant_id', tenantId)
        .single();

      if (!parent) {
        throw new BadRequestException('Parent account not found');
      }

      // Set level to parent level + 1
      level = parent.level + 1;
    }

    // Determine balance type based on account type if not provided
    let balanceType = createAccountDto.balanceType;
    if (!balanceType) {
      const debitTypes: string[] = ['asset', 'expense'];
      balanceType = debitTypes.includes(createAccountDto.type) ? 'debit' : 'credit';
    }

    const { data, error } = await supabase
      .from('chart_of_accounts')
      .insert({
        code: createAccountDto.code,
        name_en: createAccountDto.nameEn,
        name_ar: createAccountDto.nameAr,
        type: createAccountDto.type,
        subtype: createAccountDto.subtype,
        parent_id: createAccountDto.parentId,
        level,
        is_control_account: createAccountDto.isControlAccount ?? false,
        is_posting_allowed: createAccountDto.isPostingAllowed ?? true,
        is_active: createAccountDto.isActive ?? true,
        balance_type: balanceType,
        description: createAccountDto.description,
        currency: createAccountDto.currency,
        cost_center_required: createAccountDto.costCenterRequired ?? false,
        tenant_id: tenantId,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async update(
    id: string,
    updateAccountDto: UpdateAccountDto,
    tenantId: string,
  ) {
    const supabase = this.supabaseService.getClient();

    // Build update object, mapping names
    const updateData: any = {};
    if (updateAccountDto.nameEn !== undefined) updateData.name_en = updateAccountDto.nameEn;
    if (updateAccountDto.nameAr !== undefined) updateData.name_ar = updateAccountDto.nameAr;
    if (updateAccountDto.subtype !== undefined) updateData.subtype = updateAccountDto.subtype;
    if (updateAccountDto.isControlAccount !== undefined) updateData.is_control_account = updateAccountDto.isControlAccount;
    if (updateAccountDto.isPostingAllowed !== undefined) updateData.is_posting_allowed = updateAccountDto.isPostingAllowed;
    if (updateAccountDto.isActive !== undefined) updateData.is_active = updateAccountDto.isActive;
    if (updateAccountDto.balanceType !== undefined) updateData.balance_type = updateAccountDto.balanceType;
    if (updateAccountDto.description !== undefined) updateData.description = updateAccountDto.description;
    if (updateAccountDto.currency !== undefined) updateData.currency = updateAccountDto.currency;
    if (updateAccountDto.costCenterRequired !== undefined) updateData.cost_center_required = updateAccountDto.costCenterRequired;

    const { data, error } = await supabase
      .from('chart_of_accounts')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async remove(id: string, tenantId: string) {
    const supabase = this.supabaseService.getClient();

    // Check if account has children
    const { data: children } = await supabase
      .from('chart_of_accounts')
      .select('id')
      .eq('parent_id', id)
      .limit(1);

    if (children && children.length > 0) {
      throw new BadRequestException(
        'Cannot delete account with child accounts',
      );
    }

    // Check if account has transactions
    const { data: transactions } = await supabase
      .from('journal_lines')
      .select('id')
      .eq('account_id', id)
      .limit(1);

    if (transactions && transactions.length > 0) {
      throw new BadRequestException(
        'Cannot delete account with posted transactions',
      );
    }

    const { error } = await supabase.from('chart_of_accounts').delete().eq('id', id);

    if (error) {
      throw error;
    }

    return { success: true };
  }

  private buildHierarchy(accounts: any[]): any[] {
    const accountMap = new Map<string, any>();
    const rootAccounts: any[] = [];

    // First pass: create map
    accounts.forEach((account) => {
      accountMap.set(account.id, { ...account, children: [] });
    });

    // Second pass: build hierarchy
    accounts.forEach((account) => {
      const node = accountMap.get(account.id);
      if (account.parent_id) {
        const parent = accountMap.get(account.parent_id);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        rootAccounts.push(node);
      }
    });

    return rootAccounts;
  }

  async getAccountBalance(
    accountId: string,
    tenantId: string,
    asOfDate?: Date,
  ) {
    const supabase = this.supabaseService.getClient();

    // Get journal IDs that meet the date criteria if needed
    let journalIds: string[] | undefined;

    if (asOfDate) {
      const { data: journals } = await supabase
        .from('journals')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('status', 'posted')
        .lte('transaction_date', asOfDate.toISOString());

      journalIds = journals?.map((j: any) => j.id);
    }

    // Calculate balance from journal lines
    let query = supabase
      .from('journal_lines')
      .select('debit, credit');

    if (journalIds) {
      query = query.in('journal_id', journalIds);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const entries = data || [];
    const debit = entries.reduce((sum: number, e: any) => sum + (e.debit || 0), 0);
    const credit = entries.reduce((sum: number, e: any) => sum + (e.credit || 0), 0);

    // Get account type to determine balance calculation
    const { data: account } = await supabase
      .from('chart_of_accounts')
      .select('type, balance_type')
      .eq('id', accountId)
      .single();

    if (!account) {
      throw new BadRequestException('Account not found');
    }

    // Use account's balance_type if available, otherwise determine from type
    const isDebitBalance = account.balance_type === 'debit' ||
      (!account.balance_type && ['asset', 'expense'].includes(account.type));

    const balance = isDebitBalance ? debit - credit : credit - debit;

    return {
      debit,
      credit,
      balance,
      netDebit: isDebitBalance ? balance : 0,
      netCredit: isDebitBalance ? 0 : balance,
      balanceType: isDebitBalance ? 'debit' : 'credit',
    };
  }

  async getAccountsByType(tenantId: string, type: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('type', type)
      .eq('is_active', true)
      .eq('is_posting_allowed', true)
      .order('code');

    if (error) {
      throw error;
    }

    return data;
  }
}
