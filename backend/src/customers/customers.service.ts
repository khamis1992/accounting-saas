import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { AuditService, AuditCreate, AuditUpdate, AuditDelete } from '../audit/decorators';

@Injectable()
export class CustomersService {
  constructor(
    private supabaseService: SupabaseService,
    private auditService: AuditService
  ) {}

  async findAll(tenantId: string, includeInactive = false) {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('customers')
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
      .from('customers')
      .select('*')
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
      .from('customers')
      .select('*')
      .eq('code', code)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  @AuditCreate('customer', {
    entityIdExtractor: (result: any) => result?.id,
    metadataExtractor: (dto: CreateCustomerDto, tenantId: string) => ({
      customerCode: dto.code,
      customerName: dto.nameEn || dto.nameAr,
    }),
  })
  async create(createDto: CreateCustomerDto, tenantId: string, createdBy?: string) {
    const supabase = this.supabaseService.getClient();

    // Check if customer code already exists
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('code', createDto.code)
      .eq('tenant_id', tenantId)
      .single();

    if (existing) {
      throw new BadRequestException('Customer code already exists');
    }

    const { data, error } = await supabase
      .from('customers')
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
        credit_limit: createDto.creditLimit || 0,
        payment_terms_days: createDto.paymentTermsDays || 30,
        tax_number: createDto.taxNumber,
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

  @AuditUpdate('customer', {
    entityIdExtractor: (id: string) => id,
    oldDataExtractor: async (id: string, tenantId: string, service: CustomersService) => {
      const supabase = service.supabaseService.getClient();
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single();
      return data || {};
    },
    newDataExtractor: (result: any) => result,
    metadataExtractor: (id: string) => ({ customerId: id }),
  })
  async update(id: string, updateDto: UpdateCustomerDto, tenantId: string) {
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
    if (updateDto.creditLimit !== undefined) updateData.credit_limit = updateDto.creditLimit;
    if (updateDto.paymentTermsDays !== undefined) updateData.payment_terms_days = updateDto.paymentTermsDays;
    if (updateDto.taxNumber !== undefined) updateData.tax_number = updateDto.taxNumber;
    if (updateDto.isActive !== undefined) updateData.is_active = updateDto.isActive;
    if (updateDto.notes !== undefined) updateData.notes = updateDto.notes;

    const { data, error } = await supabase
      .from('customers')
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

  @AuditDelete('customer', {
    entityIdExtractor: (id: string) => id,
    metadataExtractor: (id: string) => ({ customerId: id }),
  })
  async remove(id: string, tenantId: string) {
    const supabase = this.supabaseService.getClient();

    // Check if customer has invoices
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id')
      .eq('party_id', id)
      .eq('party_type', 'customer')
      .limit(1);

    if (invoices && invoices.length > 0) {
      throw new BadRequestException(
        'Cannot delete customer with associated invoices',
      );
    }

    const { error } = await supabase.from('customers').delete().eq('id', id);

    if (error) {
      throw error;
    }

    return { success: true };
  }
}
