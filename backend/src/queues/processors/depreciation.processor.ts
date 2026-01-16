import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

interface CalculateDepreciationDto {
  tenantId: string;
  assetId?: string;
  asOfDate: Date;
  userId: string;
}

@Processor('depreciation')
export class DepreciationProcessor {
  private readonly logger = new Logger(DepreciationProcessor.name);

  constructor(private supabaseService: SupabaseService) {}

  @Process('calculate-depreciation')
  async handleCalculateDepreciation(job: Job<CalculateDepreciationDto>) {
    const { tenantId, assetId, asOfDate, userId } = job.data;
    job.updateProgress(10);

    try {
      const supabase = this.supabaseService.getServiceRoleClient();

      // Get assets to depreciate
      let assetsQuery = supabase
        .from('fixed_assets')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .lte('acquisition_date', asOfDate.toISOString());

      if (assetId) {
        assetsQuery = assetsQuery.eq('id', assetId);
      }

      const { data: assets, error: assetsError } = await assetsQuery;

      if (assetsError) {
        throw new Error(`Failed to fetch assets: ${assetsError.message}`);
      }

      job.updateProgress(30);

      // Calculate depreciation for each asset
      const depreciationRecords = [];

      for (const asset of assets || []) {
        const depreciation = await this.calculateAssetDepreciation(
          asset,
          asOfDate,
        );

        if (depreciation) {
          // Check if depreciation record already exists for this period
          const asOfMonth = new Date(asOfDate);
          asOfMonth.setDate(1);

          const { data: existing } = await supabase
            .from('asset_depreciation')
            .select('id')
            .eq('asset_id', asset.id)
            .eq('depreciation_date', asOfMonth.toISOString())
            .single();

          if (!existing) {
            depreciationRecords.push({
              asset_id: asset.id,
              tenant_id: tenantId,
              depreciation_date: asOfMonth.toISOString(),
              depreciation_amount: depreciation.depreciationAmount,
              accumulated_depreciation: depreciation.accumulatedDeprecation,
              net_book_value: depreciation.netBookValue,
              created_by: userId,
            });
          }
        }
      }

      job.updateProgress(70);

      // Insert depreciation records
      if (depreciationRecords.length > 0) {
        const { error: insertError } = await supabase
          .from('asset_depreciation')
          .insert(depreciationRecords);

        if (insertError) {
          throw new Error(`Failed to insert depreciation records: ${insertError.message}`);
        }
      }

      job.updateProgress(90);

      // Update asset net book values
      for (const asset of assets || []) {
        const depreciation = await this.calculateAssetDepreciation(
          asset,
          asOfDate,
        );

        if (depreciation) {
          await supabase
            .from('fixed_assets')
            .update({
              accumulated_depreciation: depreciation.accumulatedDeprecation,
              net_book_value: depreciation.netBookValue,
            })
            .eq('id', asset.id);
        }
      }

      job.updateProgress(100);

      return {
        success: true,
        assetsProcessed: assets?.length || 0,
        recordsCreated: depreciationRecords.length,
      };
    } catch (error) {
      this.logger.error(`Depreciation calculation failed: ${error.message}`);
      throw error;
    }
  }

  @Process('calculate-depreciation-all')
  async handleCalculateDepreciationForAll(job: Job<CalculateDepreciationDto>) {
    const { tenantId, asOfDate, userId } = job.data;
    job.updateProgress(10);

    try {
      const supabase = this.supabaseService.getServiceRoleClient();

      // Get all active assets
      const { data: assets, error: assetsError } = await supabase
        .from('fixed_assets')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .lte('acquisition_date', asOfDate.toISOString());

      if (assetsError) {
        throw new Error(`Failed to fetch assets: ${assetsError.message}`);
      }

      job.updateProgress(30);

      // Calculate and insert depreciation
      const totalAssets = assets?.length || 0;
      let processedCount = 0;

      for (const asset of assets || []) {
        const depreciation = await this.calculateAssetDepreciation(
          asset,
          asOfDate,
        );

        if (depreciation) {
          const asOfMonth = new Date(asOfDate);
          asOfMonth.setDate(1);

          const { data: existing } = await supabase
            .from('asset_depreciation')
            .select('id')
            .eq('asset_id', asset.id)
            .eq('depreciation_date', asOfMonth.toISOString())
            .single();

          if (!existing) {
            await supabase.from('asset_depreciation').insert({
              asset_id: asset.id,
              tenant_id: tenantId,
              depreciation_date: asOfMonth.toISOString(),
              depreciation_amount: depreciation.depreciationAmount,
              accumulated_depreciation: depreciation.accumulatedDeprecation,
              net_book_value: depreciation.netBookValue,
              created_by: userId,
            });
          }

          await supabase
            .from('fixed_assets')
            .update({
              accumulated_depreciation: depreciation.accumulatedDeprecation,
              net_book_value: depreciation.netBookValue,
            })
            .eq('id', asset.id);
        }

        processedCount++;
        job.updateProgress(30 + (processedCount / totalAssets) * 60);
      }

      job.updateProgress(100);

      return {
        success: true,
        assetsProcessed: totalAssets,
      };
    } catch (error) {
      this.logger.error(`Batch depreciation calculation failed: ${error.message}`);
      throw error;
    }
  }

  private async calculateAssetDepreciation(asset: any, asOfDate: Date) {
    const acquisitionDate = new Date(asset.acquisition_date);
    const usefulLifeMonths = asset.useful_life_months || 60;
    const salvageValue = asset.salvage_value || 0;
    const cost = asset.cost || 0;
    const method = asset.depreciation_method || 'straight_line';

    // Calculate months elapsed
    const monthsElapsed = Math.max(
      0,
      Math.floor(
        (asOfDate.getTime() - acquisitionDate.getTime()) /
          (1000 * 60 * 60 * 24 * 30),
      ),
    );

    // Check if asset is fully depreciated
    if (monthsElapsed >= usefulLifeMonths) {
      return {
        depreciationAmount: 0,
        accumulatedDeprecation: cost - salvageValue,
        netBookValue: salvageValue,
      };
    }

    let depreciationAmount = 0;
    let accumulatedDeprecation = 0;
    let netBookValue = 0;

    switch (method) {
      case 'straight_line':
        const monthlyDepreciation = (cost - salvageValue) / usefulLifeMonths;
        depreciationAmount = monthlyDepreciation;
        accumulatedDeprecation = monthsElapsed * monthlyDepreciation;
        netBookValue = cost - accumulatedDeprecation;
        break;

      case 'declining_balance':
        const depreciationRate = 2 / (usefulLifeMonths / 12);
        // For declining balance, we need to calculate period by period
        // Simplified implementation
        const annualDepreciation = cost * depreciationRate;
        depreciationAmount = annualDepreciation / 12;
        accumulatedDeprecation = cost * (1 - Math.pow(1 - depreciationRate, monthsElapsed / 12));
        netBookValue = cost - accumulatedDeprecation;
        break;

      default:
        // Default to straight line
        const monthlyDep = (cost - salvageValue) / usefulLifeMonths;
        depreciationAmount = monthlyDep;
        accumulatedDeprecation = monthsElapsed * monthlyDep;
        netBookValue = cost - accumulatedDeprecation;
    }

    // Ensure values are within valid ranges
    accumulatedDeprecation = Math.min(accumulatedDeprecation, cost - salvageValue);
    netBookValue = Math.max(netBookValue, salvageValue);

    return {
      depreciationAmount,
      accumulatedDeprecation,
      netBookValue,
    };
  }
}
