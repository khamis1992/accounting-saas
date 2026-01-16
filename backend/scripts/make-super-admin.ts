import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: '.env' });

const ADMIN_EMAIL = 'admin@admin.com';

async function makeSuperAdmin() {
  console.log('🚀 Making admin@admin.com a Super Admin...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Step 1: Get the user from Supabase Auth
    console.log('🔍 Step 1: Looking up user in Supabase Auth...');
    const { data: userList, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    const authUser = userList.users.find((u: any) => u.email === ADMIN_EMAIL);

    if (!authUser) {
      throw new Error(`User ${ADMIN_EMAIL} not found in Supabase Auth!`);
    }

    console.log(`✅ Found user: ${authUser.id}`);
    console.log(`   Email: ${authUser.email}`);
    console.log(`   Created: ${authUser.created_at}\n`);

    // Step 2: Check if user has a tenant, if not create one
    console.log('📋 Step 2: Checking tenant...');
    let { data: profiles } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id);

    let tenantId;

    if (!profiles || profiles.length === 0) {
      console.log('   No profile found, creating tenant and profile...');

      // Create tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          code: 'SUPER_ADMIN',
          name_en: 'Super Admin Tenant',
          name_ar: 'مستخدم مسؤول النظام',
          status: 'active',
          subscription_tier: 'enterprise',
          trial_ends_at: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 10 years
        })
        .select()
        .single();

      if (tenantError) {
        throw new Error(`Failed to create tenant: ${tenantError.message}`);
      }

      tenantId = tenant.id;
      console.log(`   ✅ Created tenant: ${tenantId}`);

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          tenant_id: tenantId,
          email: ADMIN_EMAIL,
          first_name: 'Super',
          last_name: 'Admin',
          status: 'active',
          is_active: true,
        });

      if (profileError) {
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }

      console.log('   ✅ Created user profile\n');
    } else {
      tenantId = profiles[0].tenant_id;
      console.log(`   ✅ User profile exists`);
      console.log(`   Tenant ID: ${tenantId}\n`);
    }

    // Step 3: Get or Create SUPER_ADMIN role
    console.log('🔑 Step 3: Setting up SUPER_ADMIN role...');
    const { data: existingRole } = await supabase
      .from('roles')
      .select('*')
      .eq('name', 'SUPER_ADMIN')
      .single();

    let roleId;

    if (existingRole) {
      roleId = existingRole.id;
      console.log(`   ✅ SUPER_ADMIN role exists: ${roleId}\n`);
    } else {
      const { data: newRole, error: roleError } = await supabase
        .from('roles')
        .insert({
          name: 'SUPER_ADMIN',
          name_en: 'System Super Administrator',
          name_ar: 'مسؤول النظام الرئيسي',
          description: 'Full access to all tenants and system settings',
          is_system: true,
          tenant_id: tenantId,
          permissions: {
            all: true,
            tenants: ['create', 'read', 'update', 'delete', 'manage_all'],
            users: ['create', 'read', 'update', 'delete', 'impersonate'],
            roles: ['create', 'read', 'update', 'delete'],
            settings: ['read', 'update'],
            modules: ['all'],
          },
        })
        .select()
        .single();

      if (roleError) {
        throw new Error(`Failed to create role: ${roleError.message}`);
      }

      roleId = newRole.id;
      console.log(`   ✅ Created SUPER_ADMIN role: ${roleId}\n`);
    }

    // Step 4: Assign SUPER_ADMIN role to user
    console.log('🎯 Step 4: Assigning SUPER_ADMIN role to user...');

    // Check if role already assigned
    const { data: existingAssignment } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', authUser.id)
      .eq('role_id', roleId)
      .single();

    if (existingAssignment) {
      console.log('   ℹ️  Role already assigned');
      console.log('   ✅ Skipping (already has SUPER_ADMIN role)\n');
    } else {
      const { error: assignError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authUser.id,
          tenant_id: tenantId,
          role_id: roleId,
          assigned_by: authUser.id,
        });

      if (assignError && !assignError.message.includes('duplicate')) {
        throw new Error(`Failed to assign role: ${assignError.message}`);
      }

      console.log('   ✅ Role assigned successfully\n');
    }

    // Step 5: Update user metadata to mark as super admin
    console.log('📝 Step 5: Updating user metadata...');
    const { error: updateError } = await supabase.auth.admin.updateUserById(authUser.id, {
      user_metadata: {
        ...authUser.user_metadata,
        is_super_admin: true,
        role: 'SUPER_ADMIN',
      },
    });

    if (updateError) {
      console.log('   ⚠️  Could not update auth metadata (may not have permission)');
    } else {
      console.log('   ✅ User metadata updated\n');
    }

    // Success!
    console.log('==================================================');
    console.log('🎉 Super Admin Setup Complete!');
    console.log('==================================================\n');
    console.log('👤 User Details:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   User ID: ${authUser.id}`);
    console.log(`   Role: SUPER_ADMIN`);
    console.log(`   Tenant ID: ${tenantId}\n`);
    console.log('✨ Super Admin Privileges:');
    console.log('   ✅ Full access to all system modules');
    console.log('   ✅ Can manage all tenants');
    console.log('   ✅ Can create/edit/delete users');
    console.log('   ✅ Can assign roles');
    console.log('   ✅ Full system settings access\n');
    console.log('🌐 Login URL:');
    console.log('   http://localhost:3001/auth/signin');
    console.log('==================================================\n');
    console.log('📋 Next Steps:');
    console.log('   1. Open browser to: http://localhost:3001');
    console.log('   2. Sign in with: admin@admin.com');
    console.log('   3. Password: 123456');
    console.log('   4. You will have full super admin access!');
    console.log('==================================================\n');

    return {
      success: true,
      userId: authUser.id,
      email: ADMIN_EMAIL,
      roleId,
      tenantId,
    };

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Make sure user exists in Supabase Auth');
    console.error('   2. Check that database tables are created');
    console.error('   3. Verify SUPABASE_SERVICE_ROLE_KEY is correct in .env file');
    console.error('   4. Try running the database migrations first');
    throw error;
  }
}

// Run the script
makeSuperAdmin()
  .then(() => {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
