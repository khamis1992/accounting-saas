import { SupabaseClient } from '@supabase/supabase-js';

export interface TestTenant {
  id: string;
  name: string;
  name_en: string;
  name_ar: string;
  industry: string;
  country: string;
  currency: string;
  timezone: string;
  fiscal_year_start: string;
  fiscal_year_end: string;
}

export interface TestUser {
  id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
  tenant_id: string;
}

export interface TestAccount {
  id: string;
  code: string;
  name_en: string;
  name_ar: string;
  type: string;
  tenant_id: string;
  parent_id?: string;
  level: number;
}

/**
 * Create a test tenant
 */
export async function createTestTenant(
  supabase: SupabaseClient,
  overrides?: Partial<TestTenant>,
): Promise<TestTenant> {
  const tenantData: Partial<TestTenant> = {
    name: `Test Tenant ${Date.now()}`,
    name_en: `Test Tenant ${Date.now()}`,
    name_ar: `جهة اختبار ${Date.now()}`,
    industry: 'technology',
    country: 'SA',
    currency: 'SAR',
    timezone: 'Asia/Riyadh',
    fiscal_year_start: '01-01',
    fiscal_year_end: '12-31',
    ...overrides,
  };

  const { data, error } = await supabase
    .from('tenants')
    .insert(tenantData)
    .select()
    .single();

  if (error) throw error;
  return data as TestTenant;
}

/**
 * Create a test user
 */
export async function createTestUser(
  supabase: SupabaseClient,
  tenantId: string,
  overrides?: Partial<TestUser>,
): Promise<TestUser> {
  const testId = Date.now();
  const userData: Partial<TestUser> = {
    email: `test${testId}@example.com`,
    password: 'TestPassword123!',
    first_name: 'Test',
    last_name: `User ${testId}`,
    role: 'admin',
    tenant_id: tenantId,
    ...overrides,
  };

  // Hash password (in real app, use bcrypt)
  const { data, error } = await supabase
    .from('users')
    .insert({
      ...userData,
      password_hash: userData.password, // In real app, this should be hashed
    })
    .select()
    .single();

  if (error) throw error;
  return data as TestUser;
}

/**
 * Create a test account in COA
 */
export async function createTestAccount(
  supabase: SupabaseClient,
  tenantId: string,
  overrides?: Partial<TestAccount>,
): Promise<TestAccount> {
  const accountData: Partial<TestAccount> = {
    code: `ACC${Date.now()}`,
    name_en: `Test Account ${Date.now()}`,
    name_ar: `حساب اختبار ${Date.now()}`,
    type: 'asset',
    tenant_id: tenantId,
    level: 1,
    is_active: true,
    is_posting_allowed: true,
    balance_type: 'debit',
    ...overrides,
  };

  const { data, error } = await supabase
    .from('chart_of_accounts')
    .insert(accountData)
    .select()
    .single();

  if (error) throw error;
  return data as TestAccount;
}

/**
 * Create test customer
 */
export async function createTestCustomer(
  supabase: SupabaseClient,
  tenantId: string,
  overrides?: any,
) {
  const customerData = {
    code: `CUST${Date.now()}`,
    name_en: `Test Customer ${Date.now()}`,
    name_ar: `عميل اختبار ${Date.now()}`,
    tenant_id: tenantId,
    is_active: true,
    ...overrides,
  };

  const { data, error } = await supabase
    .from('customers')
    .insert(customerData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create test vendor
 */
export async function createTestVendor(
  supabase: SupabaseClient,
  tenantId: string,
  overrides?: any,
) {
  const vendorData = {
    code: `VEND${Date.now()}`,
    name_en: `Test Vendor ${Date.now()}`,
    name_ar: `مورد اختبار ${Date.now()}`,
    tenant_id: tenantId,
    is_active: true,
    ...overrides,
  };

  const { data, error } = await supabase
    .from('vendors')
    .insert(vendorData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create test fiscal period
 */
export async function createTestFiscalPeriod(
  supabase: SupabaseClient,
  tenantId: string,
  overrides?: any,
) {
  const currentDate = new Date();
  const fiscalPeriodData = {
    name: `FP${currentDate.getFullYear()}`,
    start_date: new Date(currentDate.getFullYear(), 0, 1).toISOString(),
    end_date: new Date(currentDate.getFullYear(), 11, 31).toISOString(),
    is_closed: false,
    tenant_id: tenantId,
    ...overrides,
  };

  const { data, error } = await supabase
    .from('fiscal_periods')
    .insert(fiscalPeriodData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Clean up test data by tenant ID
 */
export async function cleanupTestData(
  supabase: SupabaseClient,
  tenantId: string,
) {
  // Delete in order of dependencies
  await supabase.from('payments').delete().eq('tenant_id', tenantId);
  await supabase.from('invoices').delete().eq('tenant_id', tenantId);
  await supabase.from('journal_lines').delete().eq('tenant_id', tenantId);
  await supabase.from('journals').delete().eq('tenant_id', tenantId);
  await supabase.from('customers').delete().eq('tenant_id', tenantId);
  await supabase.from('vendors').delete().eq('tenant_id', tenantId);
  await supabase.from('chart_of_accounts').delete().eq('tenant_id', tenantId);
  await supabase.from('users').delete().eq('tenant_id', tenantId);
  await supabase.from('tenants').delete().eq('id', tenantId);
}

/**
 * Get auth token for test user
 */
export async function getTestAuthToken(
  supabase: SupabaseClient,
  email: string,
  password: string,
): Promise<string | null> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data.session?.access_token || null;
}

/**
 * Generate unique test email
 */
export function generateTestEmail(): string {
  return `test${Date.now()}@${Math.random().toString(36).substr(2, 9)}.com`;
}

/**
 * Generate unique test code
 */
export function generateTestCode(prefix: string): string {
  return `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 4)}`;
}
