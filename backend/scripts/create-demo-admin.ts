import { createClient } from '@supabase/supabase-js';

// ============================================================================
// Demo Admin Account Creation Script
// ============================================================================
// This script creates a demo tenant and admin user for testing purposes
// ============================================================================

// Configuration - Update these with your Supabase credentials
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

// Demo Account Credentials
const DEMO_ADMIN = {
  email: 'admin@demo.com',
  password: 'Demo@123456',
  firstName: 'Demo',
  lastName: 'Admin',
  tenantName: 'Demo Company',
  tenantNameAr: 'شركة تجريبية',
};

async function createDemoAdmin() {
  console.log('🚀 Starting demo admin account creation...\n');

  // Create Supabase client with service role key (bypasses RLS)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Step 1: Create Tenant
    console.log('📋 Step 1: Creating demo tenant...');
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name_en: DEMO_ADMIN.tenantName,
        name_ar: DEMO_ADMIN.tenantNameAr,
        status: 'active',
        subscription_tier: 'enterprise',
        trial_ends_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year trial
      })
      .select()
      .single();

    if (tenantError) {
      throw new Error(`Failed to create tenant: ${tenantError.message}`);
    }

    console.log(`✅ Tenant created: ${tenant.id}`);
    console.log(`   Name: ${DEMO_ADMIN.tenantName} / ${DEMO_ADMIN.tenantNameAr}\n`);

    // Step 2: Create Admin User in Supabase Auth
    console.log('👤 Step 2: Creating admin user in Supabase Auth...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: DEMO_ADMIN.email,
      password: DEMO_ADMIN.password,
      email_confirm: true, // Auto-confirm email for demo
      user_metadata: {
        tenant_id: tenant.id,
        first_name: DEMO_ADMIN.firstName,
        last_name: DEMO_ADMIN.lastName,
        is_demo_admin: true,
      },
    });

    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    console.log(`✅ Auth user created: ${authUser.user.id}\n`);

    // Step 3: Create User Profile
    console.log('📝 Step 3: Creating user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        tenant_id: tenant.id,
        email: DEMO_ADMIN.email,
        first_name: DEMO_ADMIN.firstName,
        last_name: DEMO_ADMIN.lastName,
        status: 'active',
        is_active: true,
      })
      .select()
      .single();

    if (profileError) {
      throw new Error(`Failed to create user profile: ${profileError.message}`);
    }

    console.log(`✅ User profile created\n`);

    // Step 4: Get Admin Role
    console.log('🔑 Step 4: Assigning admin role...');
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'admin')
      .single();

    if (roleError || !role) {
      console.log('⚠️  Admin role not found, creating it...');
      const { data: newRole, error: newRoleError } = await supabase
        .from('roles')
        .insert({
          name: 'admin',
          name_en: 'Administrator',
          name_ar: 'مدير النظام',
          description: 'Full system access',
          permissions: {
            all: true,
            modules: ['all'],
          },
          tenant_id: tenant.id,
        })
        .select()
        .single();

      if (newRoleError) {
        throw new Error(`Failed to create admin role: ${newRoleError.message}`);
      }

      console.log(`✅ Admin role created: ${newRole.id}\n`);
    } else {
      console.log(`✅ Admin role found: ${role.id}\n`);
    }

    // Step 5: Assign Role to User
    const roleResult = role?.id ? { data: { id: role.id } } : await supabase.from('roles').select('id').eq('name', 'admin').single();
    const roleId = role?.id || roleResult.data?.id;
    if (!roleId) {
      throw new Error('Failed to get admin role ID');
    }
    const { error: assignError } = await supabase
      .from('user_roles')
      .insert({
        user_id: authUser.user.id,
        tenant_id: tenant.id,
        role_id: roleId,
        assigned_by: authUser.user.id,
      });

    if (assignError) {
      throw new Error(`Failed to assign role: ${assignError.message}`);
    }

    console.log(`✅ Admin role assigned to user\n`);

    // Step 6: Create Default Chart of Accounts
    console.log('📊 Step 5: Creating default Chart of Accounts...');
    const defaultAccounts = [
      // Assets
      { code: '1000', name_en: 'Assets', name_ar: 'الأصول', type: 'asset', parent_id: null },
      { code: '1100', name_en: 'Current Assets', name_ar: 'الأصول المتداولة', type: 'asset', parent_id: null },
      { code: '1110', name_en: 'Cash', name_ar: 'النقدية', type: 'asset', balance_type: 'debit', is_posting_allowed: true },
      { code: '1120', name_en: 'Bank', name_ar: 'البنك', type: 'asset', balance_type: 'debit', is_posting_allowed: true },
      { code: '1130', name_en: 'Accounts Receivable', name_ar: 'الذمم المدينة', type: 'asset', balance_type: 'debit', is_posting_allowed: true },

      // Liabilities
      { code: '2000', name_en: 'Liabilities', name_ar: 'الخصوم', type: 'liability', parent_id: null },
      { code: '2100', name_en: 'Current Liabilities', name_ar: 'الخصوم المتداولة', type: 'liability', parent_id: null },
      { code: '2110', name_en: 'Accounts Payable', name_ar: 'الذمم الدائنة', type: 'liability', balance_type: 'credit', is_posting_allowed: true },

      // Equity
      { code: '3000', name_en: 'Equity', name_ar: 'حقوق الملكية', type: 'equity', parent_id: null },
      { code: '3100', name_en: 'Owner Equity', name_ar: 'حقوق المالك', type: 'equity', balance_type: 'credit', is_posting_allowed: true },

      // Revenue
      { code: '4000', name_en: 'Revenue', name_ar: 'الإيرادات', type: 'revenue', parent_id: null },
      { code: '4100', name_en: 'Sales Revenue', name_ar: 'إيرادات المبيعات', type: 'revenue', balance_type: 'credit', is_posting_allowed: true },

      // Expenses
      { code: '5000', name_en: 'Expenses', name_ar: 'المصروفات', type: 'expense', parent_id: null },
      { code: '5100', name_en: 'Operating Expenses', name_ar: 'مصروفات التشغيل', type: 'expense', balance_type: 'debit', is_posting_allowed: true },
    ];

    let parentMap: { [key: string]: string } = {};

    for (const account of defaultAccounts) {
      const { data: newAccount, error: accountError } = await supabase
        .from('chart_of_accounts')
        .insert({
          tenant_id: tenant.id,
          code: account.code,
          name_en: account.name_en,
          name_ar: account.name_ar,
          type: account.type,
          balance_type: account.balance_type || (account.type === 'asset' || account.type === 'expense' ? 'debit' : 'credit'),
          is_posting_allowed: account.is_posting_allowed ?? false,
          is_active: true,
          created_by: authUser.user.id,
        })
        .select()
        .single();

      if (!accountError && newAccount) {
        parentMap[account.code] = newAccount.id;
        console.log(`   ✅ Created account: ${account.code} - ${account.name_en}`);
      }
    }

    console.log(`✅ Default Chart of Accounts created\n`);

    // Step 7: Create Sample Customers
    console.log('👥 Step 6: Creating sample customers...');
    const sampleCustomers = [
      {
        code: 'CUST001',
        name_en: 'ABC Trading Co.',
        name_ar: 'شركة ABC التجارية',
        email: 'info@abctrading.com',
        phone: '+974 4444 1001',
        credit_limit: 50000,
      },
      {
        code: 'CUST002',
        name_en: 'Gulf Supplies LLC',
        name_ar: 'خليج للتوريات ذ.م.م',
        email: 'sales@gulfsupplies.com',
        phone: '+974 4444 1002',
        credit_limit: 75000,
      },
    ];

    for (const customer of sampleCustomers) {
      const { error: custError } = await supabase
        .from('customers')
        .insert({
          tenant_id: tenant.id,
          ...customer,
          is_active: true,
          created_by: authUser.user.id,
        });

      if (!custError) {
        console.log(`   ✅ Created customer: ${customer.code} - ${customer.name_en}`);
      }
    }

    console.log(`✅ Sample customers created\n`);

    // Step 8: Create Sample Vendors
    console.log('🏢 Step 7: Creating sample vendors...');
    const sampleVendors = [
      {
        code: 'VEND001',
        name_en: 'Tech Solutions Inc.',
        name_ar: 'الحلول التقنية',
        email: 'sales@techsolutions.com',
        phone: '+974 4444 2001',
        payment_terms_days: 30,
      },
      {
        code: 'VEND002',
        name_en: 'Office Supplies Ltd',
        name_ar: 'لوازم المكتب المحدودة',
        email: 'orders@officesupplies.com',
        phone: '+974 4444 2002',
        payment_terms_days: 45,
      },
    ];

    for (const vendor of sampleVendors) {
      const { error: vendError } = await supabase
        .from('vendors')
        .insert({
          tenant_id: tenant.id,
          ...vendor,
          is_active: true,
          created_by: authUser.user.id,
        });

      if (!vendError) {
        console.log(`   ✅ Created vendor: ${vendor.code} - ${vendor.name_en}`);
      }
    }

    console.log(`✅ Sample vendors created\n`);

    // Success!
    console.log('==================================================');
    console.log('🎉 Demo Admin Account Created Successfully!');
    console.log('==================================================\n');
    console.log('📧 Login Credentials:');
    console.log(`   Email:    ${DEMO_ADMIN.email}`);
    console.log(`   Password: ${DEMO_ADMIN.password}\n`);
    console.log('🏢 Tenant Information:');
    console.log(`   Name: ${DEMO_ADMIN.tenantName}`);
    console.log(`   ID: ${tenant.id}\n`);
    console.log('👤 User Information:');
    console.log(`   Name: ${DEMO_ADMIN.firstName} ${DEMO_ADMIN.lastName}`);
    console.log(`   ID: ${authUser.user.id}\n`);
    console.log('✨ Pre-configured Features:');
    console.log('   ✅ Admin role with full permissions');
    console.log('   ✅ Default Chart of Accounts (11 accounts)');
    console.log('   ✅ 2 Sample customers');
    console.log('   ✅ 2 Sample vendors');
    console.log('   ✅ Active subscription (1 year trial)\n');
    console.log('🌐 Access the application at:');
    console.log('   http://localhost:3001');
    console.log('==================================================\n');

    return {
      success: true,
      tenant,
      user: authUser.user,
      profile,
      credentials: {
        email: DEMO_ADMIN.email,
        password: DEMO_ADMIN.password,
      },
    };

  } catch (error) {
    console.error('❌ Error creating demo admin:', error.message);
    throw error;
  }
}

// Run the script
createDemoAdmin()
  .then(() => {
    console.log('✅ Demo admin creation completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Demo admin creation failed:', error);
    process.exit(1);
  });
