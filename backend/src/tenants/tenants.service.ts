import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

interface CreateTenantDto {
  name: string;
  nameAr: string;
  status: string;
}

interface UpdateTenantDto {
  name?: string;
  nameAr?: string;
  status?: string;
}

interface CreateTenantWithAdminDto {
  companyNameEn: string;
  companyNameAr: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface TenantWithAdminResponse {
  tenant: any;
  user: any;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class TenantsService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll() {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.from('tenants').select('*');

    if (error) {
      throw error;
    }

    return data;
  }

  async findOne(id: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async create(createTenantDto: CreateTenantDto, tenantId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('tenants')
      .insert({
        ...createTenantDto,
        created_by: tenantId,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('tenants')
      .update(updateTenantDto)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async remove(id: string) {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase.from('tenants').delete().eq('id', id);

    if (error) {
      throw error;
    }

    return { success: true };
  }

  async getTenantStats(id: string) {
    const supabase = this.supabaseService.getClient();

    const [
      { count: userCount },
      { count: branchCount },
      { count: customerCount },
      { count: vendorCount },
      { count: invoiceCount },
    ] = await Promise.all([
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', id),
      supabase
        .from('branches')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', id),
      supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', id),
      supabase
        .from('vendors')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', id),
      supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', id),
    ]);

    return {
      users: userCount || 0,
      branches: branchCount || 0,
      customers: customerCount || 0,
      vendors: vendorCount || 0,
      invoices: invoiceCount || 0,
    };
  }

  /**
   * Generate a unique tenant code
   * Format: TEN + 6 digit sequential number (e.g., TEN000001)
   */
  private async generateTenantCode(): Promise<string> {
    const supabase = this.supabaseService.getServiceRoleClient();

    // Get the highest existing tenant code
    const { data, error } = await supabase
      .from('tenants')
      .select('code')
      .order('code', { ascending: false })
      .limit(1)
      .ilike('code', 'TEN%');

    if (error) {
      throw new BadRequestException('Failed to generate tenant code');
    }

    let nextNumber = 1;
    if (data && data.length > 0) {
      const lastCode = data[0].code;
      const lastNumber = parseInt(lastCode.replace('TEN', ''), 10);
      nextNumber = lastNumber + 1;
    }

    return `TEN${String(nextNumber).padStart(6, '0')}`;
  }

  /**
   * Copy Chart of Accounts template to a new tenant
   * Template accounts are those where tenant_id is null
   */
  private async copyCoaTemplate(tenantId: string): Promise<number> {
    const supabase = this.supabaseService.getServiceRoleClient();

    // Fetch all template accounts (tenant_id is null)
    const { data: templateAccounts, error: fetchError } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .is('tenant_id', null)
      .order('code');

    if (fetchError) {
      throw new BadRequestException('Failed to fetch COA template');
    }

    if (!templateAccounts || templateAccounts.length === 0) {
      return 0; // No template accounts to copy
    }

    // Create a map to track old ID to new ID mappings for parent relationships
    const idMap = new Map<string, string>();
    const accountsToInsert = [];

    // First pass: Create all accounts without parent_id
    for (const account of templateAccounts) {
      const newId = crypto.randomUUID();
      idMap.set(account.id, newId);

      accountsToInsert.push({
        id: newId,
        tenant_id: tenantId,
        code: account.code,
        name_ar: account.name_ar,
        name_en: account.name_en,
        type: account.type,
        subtype: account.subtype,
        parent_id: null, // Will be updated in second pass
        level: account.level,
        is_control_account: account.is_control_account,
        is_posting_allowed: account.is_posting_allowed,
        is_active: account.is_active,
        balance_type: account.balance_type,
        description: account.description,
        currency: account.currency,
        cost_center_required: account.cost_center_required,
      });
    }

    // Insert all accounts
    const { error: insertError } = await supabase
      .from('chart_of_accounts')
      .insert(accountsToInsert);

    if (insertError) {
      throw new BadRequestException('Failed to copy COA template');
    }

    // Second pass: Update parent_id relationships
    for (const account of templateAccounts) {
      if (account.parent_id && idMap.has(account.parent_id)) {
        const newAccountId = idMap.get(account.id);
        const newParentId = idMap.get(account.parent_id);

        if (newAccountId && newParentId) {
          const { error: updateError } = await supabase
            .from('chart_of_accounts')
            .update({ parent_id: newParentId })
            .eq('id', newAccountId);

          if (updateError) {
            throw new BadRequestException('Failed to update COA parent relationships');
          }
        }
      }
    }

    return templateAccounts.length;
  }

  /**
   * Create default fiscal year for a new tenant
   */
  private async createDefaultFiscalYear(tenantId: string): Promise<void> {
    const supabase = this.supabaseService.getServiceRoleClient();

    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1); // January 1st
    const endDate = new Date(currentYear, 11, 31); // December 31st

    // Create fiscal year
    const { data: fiscalYear, error: yearError } = await supabase
      .from('fiscal_years')
      .insert({
        tenant_id: tenantId,
        name: `FY${currentYear}`,
        name_ar: `السنة المالية ${currentYear}`,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        is_closed: false,
      })
      .select()
      .single();

    if (yearError) {
      throw new BadRequestException('Failed to create fiscal year');
    }

    // Create 12 fiscal periods (months)
    const periods = [];
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthNamesAr = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    for (let month = 0; month < 12; month++) {
      const periodStart = new Date(currentYear, month, 1);
      const periodEnd = new Date(currentYear, month + 1, 0); // Last day of month

      periods.push({
        fiscal_year_id: fiscalYear.id,
        tenant_id: tenantId,
        name: monthNames[month],
        name_ar: monthNamesAr[month],
        period_number: month + 1,
        start_date: periodStart.toISOString().split('T')[0],
        end_date: periodEnd.toISOString().split('T')[0],
        is_locked: false,
      });
    }

    const { error: periodError } = await supabase
      .from('fiscal_periods')
      .insert(periods);

    if (periodError) {
      throw new BadRequestException('Failed to create fiscal periods');
    }
  }

  /**
   * Create a new tenant with an admin user
   * This is a comprehensive operation that:
   * 1. Creates the tenant
   * 2. Creates the admin user in Supabase Auth
   * 3. Creates the user profile
   * 4. Assigns admin role
   * 5. Copies COA template
   * 6. Creates default fiscal year
   * 7. Returns auth tokens
   */
  async createTenantWithAdmin(
    createTenantDto: CreateTenantWithAdminDto,
  ): Promise<TenantWithAdminResponse> {
    const supabase = this.supabaseService.getServiceRoleClient();

    try {
      // Step 1: Check if company name already exists
      const { data: existingTenant, error: checkError } = await supabase
        .from('tenants')
        .select('id, name_en, name_ar')
        .or(`name_en.eq.${createTenantDto.companyNameEn},name_ar.eq.${createTenantDto.companyNameAr}`)
        .limit(1);

      if (checkError) {
        throw new BadRequestException('Failed to validate company name');
      }

      if (existingTenant && existingTenant.length > 0) {
        throw new ConflictException('Company name already exists');
      }

      // Step 2: Check if email already exists
      const { data: existingUser, error: emailCheckError } = await supabase.auth.admin.listUsers();

      if (emailCheckError) {
        throw new BadRequestException('Failed to validate email');
      }

      const emailExists = existingUser.users.some(
        (user) => user.email === createTenantDto.email
      );

      if (emailExists) {
        throw new ConflictException('Email already registered');
      }

      // Step 3: Generate tenant code
      const tenantCode = await this.generateTenantCode();

      // Step 4: Create tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          code: tenantCode,
          name_en: createTenantDto.companyNameEn,
          name_ar: createTenantDto.companyNameAr,
          status: 'active',
          subscription_plan: 'trial',
          trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days trial
        })
        .select()
        .single();

      if (tenantError || !tenant) {
        throw new BadRequestException('Failed to create tenant');
      }

      // Step 5: Create admin user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: createTenantDto.email,
        password: createTenantDto.password,
        email_confirm: true,
        user_metadata: {
          tenant_id: tenant.id,
          first_name: createTenantDto.firstName,
          last_name: createTenantDto.lastName,
        },
      });

      if (authError || !authData.user) {
        // Rollback: delete tenant
        await supabase.from('tenants').delete().eq('id', tenant.id);
        throw new BadRequestException('Failed to create admin user');
      }

      // Step 6: Create user profile
      const { error: profileError } = await supabase.from('users').insert({
        id: authData.user.id,
        tenant_id: tenant.id,
        email: createTenantDto.email,
        first_name_en: createTenantDto.firstName,
        last_name_en: createTenantDto.lastName,
        phone: createTenantDto.phone || null,
        status: 'active',
        language: 'ar',
        timezone: 'Asia/Qatar',
      });

      if (profileError) {
        // Rollback: delete user and tenant
        await supabase.auth.admin.deleteUser(authData.user.id);
        await supabase.from('tenants').delete().eq('id', tenant.id);
        throw new BadRequestException('Failed to create user profile');
      }

      // Step 7: Get COMPANY_ADMIN role
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'COMPANY_ADMIN')
        .single();

      if (roleError || !roleData) {
        // Rollback
        await supabase.auth.admin.deleteUser(authData.user.id);
        await supabase.from('users').delete().eq('id', authData.user.id);
        await supabase.from('tenants').delete().eq('id', tenant.id);
        throw new BadRequestException('Failed to find admin role');
      }

      // Step 8: Assign admin role to user
      const { error: roleAssignError } = await supabase.from('user_roles').insert({
        user_id: authData.user.id,
        role_id: roleData.id,
        tenant_id: tenant.id,
      });

      if (roleAssignError) {
        // Rollback
        await supabase.auth.admin.deleteUser(authData.user.id);
        await supabase.from('users').delete().eq('id', authData.user.id);
        await supabase.from('tenants').delete().eq('id', tenant.id);
        throw new BadRequestException('Failed to assign admin role');
      }

      // Step 9: Copy COA template
      try {
        const copiedAccounts = await this.copyCoaTemplate(tenant.id);
        console.log(`Copied ${copiedAccounts} accounts from template`);
      } catch (coaError) {
        // Rollback everything
        await supabase.from('user_roles').delete().eq('user_id', authData.user.id);
        await supabase.auth.admin.deleteUser(authData.user.id);
        await supabase.from('users').delete().eq('id', authData.user.id);
        await supabase.from('tenants').delete().eq('id', tenant.id);
        throw new BadRequestException('Failed to copy COA template');
      }

      // Step 10: Create default fiscal year
      try {
        await this.createDefaultFiscalYear(tenant.id);
      } catch (fiscalError) {
        // Rollback everything
        await supabase.from('chart_of_accounts').delete().eq('tenant_id', tenant.id);
        await supabase.from('user_roles').delete().eq('user_id', authData.user.id);
        await supabase.auth.admin.deleteUser(authData.user.id);
        await supabase.from('users').delete().eq('id', authData.user.id);
        await supabase.from('tenants').delete().eq('id', tenant.id);
        throw new BadRequestException('Failed to create fiscal year');
      }

      // Step 11: Generate auth tokens by signing in the user
      const clientSupabase = this.supabaseService.getClient();
      const { data: sessionData, error: sessionError } = await clientSupabase.auth.signInWithPassword({
        email: createTenantDto.email,
        password: createTenantDto.password,
      });

      if (sessionError || !sessionData.session) {
        // Don't rollback, just return error about tokens
        throw new BadRequestException('Tenant created but failed to generate tokens');
      }

      // Return success response
      return {
        tenant: {
          id: tenant.id,
          code: tenant.code,
          name_en: tenant.name_en,
          name_ar: tenant.name_ar,
          status: tenant.status,
        },
        user: {
          id: authData.user.id,
          email: authData.user.email,
          first_name: createTenantDto.firstName,
          last_name: createTenantDto.lastName,
        },
        accessToken: sessionData.session.access_token,
        refreshToken: sessionData.session.refresh_token,
      };
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create tenant with admin: ${error.message}`);
    }
  }
}
