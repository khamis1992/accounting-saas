import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';

@Injectable()
export class CompanySettingsService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Get company settings for the current tenant
   * Creates default settings if they don't exist
   */
  async getCompanySettings(tenantId: string) {
    const supabase = this.supabaseService.getClient();

    let { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found, which is ok - we'll create defaults
      throw error;
    }

    // If no settings exist, create default settings
    if (!data) {
      data = await this.createDefaultSettings(tenantId);
    }

    return data;
  }

  /**
   * Update company settings for the current tenant
   */
  async updateCompanySettings(
    tenantId: string,
    userId: string,
    updateDto: UpdateCompanySettingsDto,
  ) {
    const supabase = this.supabaseService.getClient();

    // Build the update object with only provided fields
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updateDto.company_name_en !== undefined) {
      updateData.company_name_en = updateDto.company_name_en;
    }
    if (updateDto.company_name_ar !== undefined) {
      updateData.company_name_ar = updateDto.company_name_ar;
    }
    if (updateDto.legal_name !== undefined) {
      updateData.legal_name = updateDto.legal_name;
    }
    if (updateDto.business_type !== undefined) {
      updateData.business_type = updateDto.business_type;
    }
    if (updateDto.tax_number !== undefined) {
      updateData.tax_number = updateDto.tax_number;
    }
    if (updateDto.registration_number !== undefined) {
      updateData.registration_number = updateDto.registration_number;
    }
    if (updateDto.industry !== undefined) {
      updateData.industry = updateDto.industry;
    }
    if (updateDto.description !== undefined) {
      updateData.description = updateDto.description;
    }
    if (updateDto.email !== undefined) {
      updateData.email = updateDto.email;
    }
    if (updateDto.phone !== undefined) {
      updateData.phone = updateDto.phone;
    }
    if (updateDto.website !== undefined) {
      updateData.website = updateDto.website;
    }
    if (updateDto.logo_url !== undefined) {
      updateData.logo_url = updateDto.logo_url;
    }

    // Handle nested objects - merge with existing data
    if (updateDto.address) {
      // Get existing settings to merge address
      const existing = await this.getCompanySettings(tenantId);
      const existingAddress = existing.address || {};
      updateData.address = { ...existingAddress, ...updateDto.address };
    }

    if (updateDto.tax_settings) {
      const existing = await this.getCompanySettings(tenantId);
      const existingTax = existing.tax_settings || {};
      updateData.tax_settings = { ...existingTax, ...updateDto.tax_settings };
    }

    if (updateDto.currency_settings) {
      const existing = await this.getCompanySettings(tenantId);
      const existingCurrency = existing.currency_settings || {};
      updateData.currency_settings = { ...existingCurrency, ...updateDto.currency_settings };
    }

    const { data, error } = await supabase
      .from('company_settings')
      .update(updateData)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new NotFoundException('Company settings not found');
    }

    return data;
  }

  /**
   * Create default company settings for a tenant
   */
  private async createDefaultSettings(tenantId: string) {
    const supabase = this.supabaseService.getClient();

    // Get tenant info to use as default company name
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name_en, name_ar')
      .eq('id', tenantId)
      .single();

    const defaultSettings = {
      tenant_id: tenantId,
      company_name_en: tenant?.name_en || 'My Company',
      company_name_ar: tenant?.name_ar || 'شركتي',
      business_type: 'other',
      industry: 'other',
      address: {
        street: null,
        city: null,
        state: null,
        postal_code: null,
        country: 'QA',
      },
      tax_settings: {
        vat_enabled: false,
        vat_number: null,
        default_tax_rate: 0,
        tax_calculation_method: 'exclusive',
        is_tax_enabled: false,
      },
      currency_settings: {
        base_currency: 'QAR',
        decimal_places: 2,
        thousands_separator: ',',
        decimal_separator: '.',
        symbol_position: 'before',
      },
    };

    const { data, error } = await supabase
      .from('company_settings')
      .insert(defaultSettings)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create default company settings: ${error.message}`);
    }

    return data;
  }

  /**
   * Upload company logo
   */
  async uploadLogo(tenantId: string, file: any) {
    // This is a placeholder - in production, you'd upload to a storage service
    // For now, we'll just return a mock URL
    const logoUrl = `/logos/${tenantId}/${file.filename}`;

    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('company_settings')
      .update({ logo_url: logoUrl })
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { logo_url: logoUrl };
  }
}
