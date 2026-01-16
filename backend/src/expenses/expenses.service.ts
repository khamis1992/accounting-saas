import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ExpensesService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(tenantId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) throw error;
    return data;
  }
}
