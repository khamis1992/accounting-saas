import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

interface AssetFilters {
  category?: string;
  status?: string;
  search?: string;
}

@Injectable()
export class AssetsService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(tenantId: string, filters?: AssetFilters) {
    const supabase = this.supabaseService.getClient();
    let query = supabase
      .from('assets')
      .select('*')
      .eq('tenant_id', tenantId);

    if (filters?.category) {
      query = query.eq('asset_category', filters.category);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.search) {
      query = query.or(`asset_code.ilike.%${filters.search}%,asset_name_en.ilike.%${filters.search}%,asset_name_ar.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform database fields to frontend expected format
    return (data || []).map(asset => this.transformAssetToFrontend(asset));
  }

  async findOne(id: string, tenantId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }

    return this.transformAssetToFrontend(data);
  }

  async getSummary(tenantId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('assets')
      .select('purchase_value, accumulated_depreciation, net_book_value')
      .eq('tenant_id', tenantId);

    if (error) throw error;

    const summary = {
      total_cost: 0,
      total_accumulated_depreciation: 0,
      total_net_book_value: 0,
      asset_count: data?.length || 0,
    };

    if (data && data.length > 0) {
      summary.total_cost = data.reduce((sum, asset) => sum + (Number(asset.purchase_value) || 0), 0);
      summary.total_accumulated_depreciation = data.reduce(
        (sum, asset) => sum + (Number(asset.accumulated_depreciation) || 0),
        0
      );
      summary.total_net_book_value = data.reduce(
        (sum, asset) => sum + (Number(asset.net_book_value) || 0),
        0
      );
    }

    return summary;
  }

  async create(tenantId: string, createAssetDto: CreateAssetDto) {
    const supabase = this.supabaseService.getClient();

    // Generate asset code if not provided
    let assetCode = createAssetDto.assetCode;
    if (!assetCode) {
      const { data: lastAsset } = await supabase
        .from('assets')
        .select('asset_code')
        .eq('tenant_id', tenantId)
        .order('asset_code', { ascending: false })
        .limit(1)
        .single();

      const nextNumber = lastAsset?.asset_code
        ? parseInt(lastAsset.asset_code.replace('AST', '')) + 1
        : 1;
      assetCode = `AST${String(nextNumber).padStart(5, '0')}`;
    }

    // Calculate initial values
    const netBookValue =
      Number(createAssetDto.purchaseValue) -
      Number(createAssetDto.salvageValue || 0);

    // Map DTO fields to database columns
    const dbRecord = {
      tenant_id: tenantId,
      branch_id: createAssetDto.branchId,
      asset_code: assetCode,
      asset_name_ar: createAssetDto.assetNameAr,
      asset_name_en: createAssetDto.assetNameEn,
      asset_category: createAssetDto.assetCategory,
      description: createAssetDto.description,
      description_ar: createAssetDto.descriptionAr,
      purchase_date: createAssetDto.purchaseDate,
      purchase_value: createAssetDto.purchaseValue,
      salvage_value: createAssetDto.salvageValue,
      useful_life_years: createAssetDto.usefulLifeYears,
      depreciation_method: createAssetDto.depreciationMethod,
      depreciation_rate: createAssetDto.depreciationRate,
      asset_account_id: createAssetDto.assetAccountId,
      depreciation_account_id: createAssetDto.depreciationAccountId,
      accumulated_depreciation_account_id: createAssetDto.accumulatedDepreciationAccountId,
      location: createAssetDto.location,
      location_ar: createAssetDto.locationAr,
      responsible_person_id: createAssetDto.responsiblePersonId,
      status: createAssetDto.status || 'active',
      notes: createAssetDto.notes,
      accumulated_depreciation: 0,
      net_book_value: netBookValue,
    };

    const { data, error } = await supabase
      .from('assets')
      .insert(dbRecord)
      .select()
      .single();

    if (error) throw error;
    return this.transformAssetToFrontend(data);
  }

  async update(id: string, tenantId: string, updateAssetDto: UpdateAssetDto) {
    const supabase = this.supabaseService.getClient();

    // Check if asset exists
    await this.findOne(id, tenantId);

    const { data, error } = await supabase
      .from('assets')
      .update({
        ...updateAssetDto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return this.transformAssetToFrontend(data);
  }

  async disposeOrSell(
    id: string,
    tenantId: string,
    disposalDate: string,
    disposalAmount: number,
    type: 'dispose' | 'sell'
  ) {
    const supabase = this.supabaseService.getClient();

    // Check if asset exists
    const asset = await this.findOne(id, tenantId);

    if (asset.status !== 'active') {
      throw new BadRequestException(`Cannot ${type} an asset that is not active`);
    }

    const status = type === 'sell' ? 'sold' : 'disposed';

    const { data, error } = await supabase
      .from('assets')
      .update({
        status,
        disposal_date: disposalDate,
        disposal_value: disposalAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return this.transformAssetToFrontend(data);
  }

  async delete(id: string, tenantId: string) {
    const supabase = this.supabaseService.getClient();

    // Check if asset exists
    await this.findOne(id, tenantId);

    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw error;
    return { success: true };
  }

  /**
   * Transform database asset record to frontend format
   */
  private transformAssetToFrontend(asset: any): any {
    return {
      id: asset.id,
      tenant_id: asset.tenant_id,
      asset_code: asset.asset_code,
      asset_name: asset.asset_name_en || asset.asset_name_ar,
      name_en: asset.asset_name_en,
      name_ar: asset.asset_name_ar,
      category: asset.asset_category,
      purchase_date: asset.purchase_date,
      purchase_cost: Number(asset.purchase_value) || 0,
      salvage_value: Number(asset.salvage_value) || 0,
      useful_life_years: asset.useful_life_years,
      depreciation_method: asset.depreciation_method,
      accumulated_depreciation: Number(asset.accumulated_depreciation) || 0,
      net_book_value: Number(asset.net_book_value) || 0,
      status: asset.status,
      disposal_date: asset.disposal_date,
      disposal_amount: asset.disposal_value?.toString(),
      location: asset.location,
      notes: asset.notes,
    };
  }
}
