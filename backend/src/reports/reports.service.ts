import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ReportsService {
  constructor(private supabaseService: SupabaseService) {}

  async getTrialBalance(tenantId: string, fiscalPeriodId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('v_trial_balance')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('fiscal_period_id', fiscalPeriodId);

    if (error) throw error;
    return data;
  }

  async getGeneralLedger(tenantId: string, filters?: any) {
    const supabase = this.supabaseService.getClient();
    let query = supabase
      .from('v_general_ledger')
      .select('*')
      .eq('tenant_id', tenantId);

    if (filters?.accountId) {
      query = query.eq('account_id', filters.accountId);
    }
    if (filters?.startDate) {
      query = query.gte('transaction_date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('transaction_date', filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async getBalanceSheet(tenantId: string, fiscalPeriodId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('v_balance_sheet')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('fiscal_period_id', fiscalPeriodId);

    if (error) throw error;
    return data;
  }

  async getIncomeStatement(tenantId: string, fiscalPeriodId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('v_income_statement')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('fiscal_period_id', fiscalPeriodId);

    if (error) throw error;
    return data;
  }

  async getCustomerBalance(tenantId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('v_customer_balance')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) throw error;
    return data;
  }

  async getVendorBalance(tenantId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('v_vendor_balance')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) throw error;
    return data;
  }
}
