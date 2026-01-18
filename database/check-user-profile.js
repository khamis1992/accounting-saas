const { Client } = require('pg');

const USER_ID = '420e30f2-7508-45e5-bde9-68404777bc13';

const client = new Client({
  host: 'aws-1-ap-south-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.gbbmicjucestjpxtkjyp',
  password: 'Khamees1992#',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function checkUserProfile() {
  try {
    await client.connect();
    console.log('Connected to database\n');
    
    // Check if user profile exists
    const query = `
      SELECT 
        u.id, 
        u.email, 
        u.tenant_id, 
        t.name_en as tenant_name,
        ur.role_id,
        r.name as role_name
      FROM public.users u
      LEFT JOIN public.tenants t ON u.tenant_id = t.id
      LEFT JOIN public.user_roles ur ON u.id = ur.user_id
      LEFT JOIN public.roles r ON ur.role_id = r.id
      WHERE u.id = $1
    `;
    
    const result = await client.query(query, [USER_ID]);
    
    console.log('User Profile Check:');
    console.log('==================\n');
    
    if (result.rows.length > 0) {
      const profile = result.rows[0];
      console.log('✅ User profile exists!');
      console.log('   User ID:', profile.id);
      console.log('   Email:', profile.email);
      console.log('   Tenant ID:', profile.tenant_id || 'NOT SET');
      console.log('   Tenant Name:', profile.tenant_name || 'NOT SET');
      console.log('   Role ID:', profile.role_id || 'NOT SET');
      console.log('   Role Name:', profile.role_name || 'NOT SET');
    } else {
      console.log('❌ No profile found in public.users table!');
      console.log('   User exists in auth.users but not in public.users');
    }
    
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
    await client.end();
    process.exit(1);
  }
}

checkUserProfile();
