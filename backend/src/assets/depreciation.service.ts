import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CalculateDepreciationDto } from './dto/calculate-depreciation.dto';

interface DepreciationFilters {
  status?: string;
  asset_id?: string;
  start_date?: string;
  end_date?: string;
}

@Injectable()
export class DepreciationService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(tenantId: string, filters?: DepreciationFilters) {
    const supabase = this.supabaseService.getClient();
    let query = supabase
      .from('asset_depreciation_runs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.start_date) {
      query = query.gte('run_date', filters.start_date);
    }

    if (filters?.end_date) {
      query = query.lte('run_date', filters.end_date);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform to frontend format
    return (data || []).map(run => this.transformRunToFrontend(run));
  }

  async findOne(id: string, tenantId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('asset_depreciation_runs')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Depreciation record with ID ${id} not found`);
    }

    return this.transformRunToFrontend(data);
  }

  async calculate(tenantId: string, calculateDepreciationDto: CalculateDepreciationDto) {
    const supabase = this.supabaseService.getClient();

    // Get active assets
    let assetsQuery = supabase
      .from('assets')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'active');

    if (calculateDepreciationDto.asset_ids && calculateDepreciationDto.asset_ids.length > 0) {
      assetsQuery = assetsQuery.in('id', calculateDepreciationDto.asset_ids);
    }

    const { data: assets, error: assetsError } = await assetsQuery;

    if (assetsError) throw assetsError;
    if (!assets || assets.length === 0) {
      throw new BadRequestException('No active assets found for depreciation calculation');
    }

    // Create depreciation run
    const calculationDate = new Date(calculateDepreciationDto.calculation_date);
    const periodStart = new Date(calculationDate.getFullYear(), calculationDate.getMonth(), 1);
    const periodEnd = new Date(calculationDate.getFullYear(), calculationDate.getMonth() + 1, 0);

    // Generate run number
    const { data: lastRun } = await supabase
      .from('asset_depreciation_runs')
      .select('run_number')
      .eq('tenant_id', tenantId)
      .order('run_number', { ascending: false })
      .limit(1)
      .single();

    const nextNumber = lastRun?.run_number
      ? parseInt(lastRun.run_number.replace('DEPR', '')) + 1
      : 1;
    const runNumber = `DEPR${String(nextNumber).padStart(5, '0')}`;

    let totalDepreciation = 0;
    const lines = [];

    for (const asset of assets) {
      // Calculate depreciation
      const depreciationAmount = this.calculateDepreciationAmount(asset);

      // Create depreciation line
      const { data: line } = await supabase
        .from('asset_depreciation_lines')
        .insert({
          depreciation_run_id: null, // Will update after run is created
          asset_id: asset.id,
          tenant_id: tenantId,
          depreciation_date: calculationDate.toISOString(),
          depreciation_amount: depreciationAmount,
          accumulated_depreciation_before: Number(asset.accumulated_depreciation) || 0,
          accumulated_depreciation_after: (Number(asset.accumulated_depreciation) || 0) + depreciationAmount,
          net_book_value_before: Number(asset.net_book_value) || 0,
          net_book_value_after: Number(asset.net_book_value) || 0 - depreciationAmount,
        })
        .select()
        .single();

      if (line) lines.push(line);

      // Update asset
      const newAccumulatedDepreciation = (Number(asset.accumulated_depreciation) || 0) + depreciationAmount;
      const newNetBookValue = Number(asset.purchase_value) - newAccumulatedDepreciation;

      await supabase
        .from('assets')
        .update({
          accumulated_depreciation: newAccumulatedDepreciation,
          net_book_value: newNetBookValue,
          status: newNetBookValue <= Number(asset.salvage_value) ? 'disposed' : 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', asset.id);

      totalDepreciation += depreciationAmount;
    }

    // Create the run
    const { data: run, error: runError } = await supabase
      .from('asset_depreciation_runs')
      .insert({
        tenant_id: tenantId,
        run_number: runNumber,
        run_date: calculationDate.toISOString(),
        period_start_date: periodStart.toISOString(),
        period_end_date: periodEnd.toISOString(),
        status: 'completed',
        total_depreciation: totalDepreciation,
        asset_count: assets.length,
      })
      .select()
      .single();

    if (runError) throw runError;

    // Update lines with run_id
    for (const line of lines) {
      await supabase
        .from('asset_depreciation_lines')
        .update({ depreciation_run_id: run.id })
        .eq('id', line.id);
    }

    return this.transformRunToFrontend(run);
  }

  private calculateDepreciationAmount(asset: any): number {
    const purchaseCost = Number(asset.purchase_value);
    const salvageValue = Number(asset.salvage_value || 0);
    const usefulLifeYears = Number(asset.useful_life_years);

    switch (asset.depreciation_method) {
      case 'straight_line':
        const annualDepreciation = (purchaseCost - salvageValue) / usefulLifeYears;
        return Math.round((annualDepreciation / 12) * 100) / 100;

      case 'declining_balance':
        const accumulatedDepreciation = Number(asset.accumulated_depreciation || 0);
        const currentBookValue = purchaseCost - accumulatedDepreciation;
        const annualRate = (2 / usefulLifeYears);
        const monthlyRate = annualRate / 12;
        return Math.round(currentBookValue * monthlyRate * 100) / 100;

      case 'double_declining_balance':
        const accumDep = Number(asset.accumulated_depreciation || 0);
        const bookValue = purchaseCost - accumDep;
        const doubleRate = (2 / usefulLifeYears);
        const monthlyDoubleRate = doubleRate / 12;
        return Math.round(bookValue * monthlyDoubleRate * 100) / 100;

      default:
        const straightAnnual = (purchaseCost - salvageValue) / usefulLifeYears;
        return Math.round((straightAnnual / 12) * 100) / 100;
    }
  }

  async postToJournal(id: string, tenantId: string) {
    const supabase = this.supabaseService.getClient();

    const run = await this.findOne(id, tenantId);

    if (run.status === 'posted') {
      throw new BadRequestException('Depreciation has already been posted');
    }

    // Get accounts
    const { data: accounts } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('tenant_id', tenantId)
      .limit(10);

    if (!accounts || accounts.length === 0) {
      throw new BadRequestException('No accounts found');
    }

    const expenseAccount = accounts[0];
    const contraAccount = accounts[1] || accounts[0];

    // Create journal entry
    const { data: journal } = await supabase
      .from('journals')
      .insert({
        tenant_id: tenantId,
        journal_date: run.calculation_date,
        journal_number: run.depreciation_number,
        description: `Depreciation Run ${run.depreciation_number}`,
        status: 'posted',
      })
      .select()
      .single();

    // Update run
    const { data: updatedRun } = await supabase
      .from('asset_depreciation_runs')
      .update({
        status: 'posted',
        journal_id: journal.id,
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    return this.transformRunToFrontend(updatedRun);
  }

  async delete(id: string, tenantId: string) {
    const supabase = this.supabaseService.getClient();

    const run = await this.findOne(id, tenantId);

    if (run.status === 'posted') {
      throw new BadRequestException('Cannot delete posted depreciation');
    }

    // Delete lines first
    await supabase
      .from('asset_depreciation_lines')
      .delete()
      .eq('depreciation_run_id', id);

    // Delete run
    await supabase
      .from('asset_depreciation_runs')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    return { success: true };
  }

  async exportToPDF(id: string, tenantId: string): Promise<Buffer> {
    const run = await this.findOne(id, tenantId);
    const content = `Depreciation Report\n${run.depreciation_number}\nAmount: ${run.total_amount}`;
    return Buffer.from(content);
  }

  async exportToExcel(id: string, tenantId: string): Promise<Buffer> {
    const run = await this.findOne(id, tenantId);
    const content = `Depreciation,${run.depreciation_number},${run.total_amount}`;
    return Buffer.from(content);
  }

  private transformRunToFrontend(run: any): any {
    return {
      id: run.id,
      tenant_id: run.tenant_id,
      depreciation_number: run.run_number,
      asset_id: run.id, // Use run id as asset_id for compatibility
      calculation_date: run.run_date,
      period_start: run.period_start_date,
      period_end: run.period_end_date,
      depreciation_method: 'straight_line',
      method: 'straight_line',
      depreciation_amount: run.total_depreciation,
      total_amount: run.total_depreciation,
      accumulated_before: 0,
      accumulated_after: run.total_depreciation,
      status: run.status === 'completed' ? 'calculated' : run.status,
      journal_entry_id: run.journal_id,
      posted_at: run.completed_at,
      created_at: run.created_at,
      updated_at: run.updated_at,
      asset: {
        id: run.id,
        name_en: `Depreciation Run ${run.run_number}`,
        asset_code: run.run_number,
      },
    };
  }
}
