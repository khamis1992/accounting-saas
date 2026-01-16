import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class VatService {
  constructor(private supabaseService: SupabaseService) {}

  async getSummary(tenantId: string, startDate: Date, endDate: Date) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('v_vat_summary')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('transaction_date', startDate.toISOString())
      .lte('transaction_date', endDate.toISOString());

    if (error) throw error;
    return data;
  }

  async getVatCodes(tenantId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('vat_codes')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) throw error;
    return data;
  }
}
