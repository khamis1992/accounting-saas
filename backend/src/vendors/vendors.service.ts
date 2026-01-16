import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';

@Injectable()
export class VendorsService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(tenantId: string, includeInactive = false) {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('vendors')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('code');

    if (!includeInactive) {
      query = query.eq('is_active', true);
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
      .from('vendors')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async create(createDto: CreateVendorDto, tenantId: string, createdBy?: string) {
    const supabase = this.supabaseService.getClient();

    // Check if vendor code already exists
    const { data: existing } = await supabase
      .from('vendors')
      .select('id')
      .eq('code', createDto.code)
      .eq('tenant_id', tenantId)
      .single();

    if (existing) {
      throw new BadRequestException('Vendor code already exists');
    }

    const { data, error } = await supabase
      .from('vendors')
      .insert({
        code: createDto.code,
        name_en: createDto.nameEn,
        name_ar: createDto.nameAr,
        vat_number: createDto.vatNumber,
        national_id: createDto.nationalId,
        contact_person: createDto.contactPerson,
        email: createDto.email,
        phone: createDto.phone,
        mobile: createDto.mobile,
        address_ar: createDto.addressAr,
        address_en: createDto.addressEn,
        city_ar: createDto.cityAr,
        city_en: createDto.cityEn,
        country: createDto.country || 'QA',
        payment_terms_days: createDto.paymentTermsDays || 30,
        bank_name: createDto.bankName,
        bank_account_number: createDto.bankAccountNumber,
        iban: createDto.iban,
        swift_code: createDto.swiftCode,
        is_active: createDto.isActive ?? true,
        notes: createDto.notes,
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

  async update(id: string, updateDto: UpdateVendorDto, tenantId: string) {
    const supabase = this.supabaseService.getClient();

    const updateData: any = {};
    if (updateDto.nameEn !== undefined) updateData.name_en = updateDto.nameEn;
    if (updateDto.nameAr !== undefined) updateData.name_ar = updateDto.nameAr;
    if (updateDto.vatNumber !== undefined) updateData.vat_number = updateDto.vatNumber;
    if (updateDto.nationalId !== undefined) updateData.national_id = updateDto.nationalId;
    if (updateDto.contactPerson !== undefined) updateData.contact_person = updateDto.contactPerson;
    if (updateDto.email !== undefined) updateData.email = updateDto.email;
    if (updateDto.phone !== undefined) updateData.phone = updateDto.phone;
    if (updateDto.mobile !== undefined) updateData.mobile = updateDto.mobile;
    if (updateDto.addressAr !== undefined) updateData.address_ar = updateDto.addressAr;
    if (updateDto.addressEn !== undefined) updateData.address_en = updateDto.addressEn;
    if (updateDto.cityAr !== undefined) updateData.city_ar = updateDto.cityAr;
    if (updateDto.cityEn !== undefined) updateData.city_en = updateDto.cityEn;
    if (updateDto.country !== undefined) updateData.country = updateDto.country;
    if (updateDto.paymentTermsDays !== undefined) updateData.payment_terms_days = updateDto.paymentTermsDays;
    if (updateDto.bankName !== undefined) updateData.bank_name = updateDto.bankName;
    if (updateDto.bankAccountNumber !== undefined) updateData.bank_account_number = updateDto.bankAccountNumber;
    if (updateDto.iban !== undefined) updateData.iban = updateDto.iban;
    if (updateDto.swiftCode !== undefined) updateData.swift_code = updateDto.swiftCode;
    if (updateDto.isActive !== undefined) updateData.is_active = updateDto.isActive;
    if (updateDto.notes !== undefined) updateData.notes = updateDto.notes;

    const { data, error } = await supabase
      .from('vendors')
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

    // Check if vendor has invoices
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id')
      .eq('party_id', id)
      .eq('party_type', 'vendor')
      .limit(1);

    if (invoices && invoices.length > 0) {
      throw new BadRequestException(
        'Cannot delete vendor with associated invoices',
      );
    }

    const { error } = await supabase.from('vendors').delete().eq('id', id);

    if (error) {
      throw error;
    }

    return { success: true };
  }
}
