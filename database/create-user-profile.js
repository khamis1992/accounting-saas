const { Client } = require('pg');

const USER_ID = '420e30f2-7508-45e5-bde9-68404777bc13';
const EMAIL = 'admin@admin.com';

const client = new Client({
  host: 'aws-1-ap-south-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.gbbmicjucestjpxtkjyp',
  password: 'Khamees1992#',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function createUserProfile() {
  try {
    await client.connect();
    console.log('Connected to database\n');
    
    // Step 1: Check if DEMO001 tenant exists, if not create it
    console.log('Step 1: Checking for demo tenant...');
    let tenantResult = await client.query(`
      SELECT id FROM public.tenants WHERE code = 'DEMO001' LIMIT 1
    `);
    
    let tenantId;
    if (tenantResult.rows.length === 0) {
      console.log('Creating demo tenant...');
      const insertTenant = await client.query(`
        INSERT INTO public.tenants (
          code, name_ar, name_en, cr_number, vat_number, 
          base_currency, language, status, subscription_plan
        ) VALUES (
          'DEMO001', 'شركة تجريبية', 'Demo Company Ltd.',
          '12345678', '302012345600001', 'QAR', 'ar', 'active', 'professional'
        )
        RETURNING id
      `);
      tenantId = insertTenant.rows[0].id;
      console.log('✅ Demo tenant created:', tenantId);
    } else {
      tenantId = tenantResult.rows[0].id;
      console.log('✅ Demo tenant exists:', tenantId);
    }
    
    // Step 2: Create user profile
    console.log('\nStep 2: Creating user profile...');
    try {
      await client.query(`
        INSERT INTO public.users (id, tenant_id, email, status)
        VALUES ($1, $2, $3, 'active')
        ON CONFLICT (id) DO UPDATE SET
          tenant_id = EXCLUDED.tenant_id,
          email = EXCLUDED.email,
          status = EXCLUDED.status
      `, [USER_ID, tenantId, EMAIL]);
      console.log('✅ User profile created/updated');
    } catch (err) {
      console.error('❌ Error creating user profile:', err.message);
      throw err;
    }
    
    // Step 3: Get COMPANY_ADMIN role
    console.log('\nStep 3: Getting COMPANY_ADMIN role...');
    const roleResult = await client.query(`
      SELECT id FROM public.roles WHERE name = 'COMPANY_ADMIN' LIMIT 1
    `);
    
    if (roleResult.rows.length === 0) {
      console.error('❌ COMPANY_ADMIN role not found! Roles table might be empty.');
      console.log('Available roles:');
      const rolesCheck = await client.query('SELECT name FROM public.roles');
      console.log(rolesCheck.rows);
      await client.end();
      process.exit(1);
    }
    
    const roleId = roleResult.rows[0].id;
    console.log('✅ COMPANY_ADMIN role found:', roleId);
    
    // Step 4: Assign role to user
    console.log('\nStep 4: Assigning role to user...');
    try {
      // Check if role assignment already exists
      const checkRole = await client.query(`
        SELECT id FROM public.user_roles 
        WHERE user_id = $1 AND role_id = $2
      `, [USER_ID, roleId]);
      
      if (checkRole.rows.length === 0) {
        await client.query(`
          INSERT INTO public.user_roles (user_id, role_id, tenant_id)
          VALUES ($1, $2, $3)
        `, [USER_ID, roleId, tenantId]);
        console.log('✅ Role assigned to user');
      } else {
        console.log('✅ Role already assigned');
      }
    } catch (err) {
      console.error('❌ Error assigning role:', err.message);
      throw err;
    }
    
    // Verify the setup
    console.log('\n' + '='.repeat(50));
    console.log('✅ SETUP COMPLETE!');
    console.log('='.repeat(50));
    console.log('\n📋 Login Credentials:');
    console.log('   Email: admin@admin.com');
    console.log('   Password: 123456');
    console.log('\n🏢 Tenant: DEMO001 - Demo Company Ltd.');
    console.log('🔑 Role: COMPANY_ADMIN');
    console.log('\n🌐 Login URL:');
    console.log('   https://frontend-ivory-eta-13.vercel.app/en/auth/signin');
    console.log('\n' + '='.repeat(50));
    
    await client.end();
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    await client.end();
    process.exit(1);
  }
}

createUserProfile();
