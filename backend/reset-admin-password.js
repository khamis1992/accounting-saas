const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gbbmicjucestjpxtkjyp.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiYm1pY2p1Y2VzdGpweHRranlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQwNTQ4NCwiZXhwIjoyMDgzOTgxNDg0fQ.EuWPn_MLSAHCAtioPp0clz4omKC9T2QV0LOLZ1Nk3_U';

async function resetPassword() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  console.log('🔍 Getting user info for admin@admin.com...');
  
  const { data, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('❌ Error listing users:', error.message);
    process.exit(1);
  }
  
  const admin = data.users.find(u => u.email === 'admin@admin.com');
  
  if (!admin) {
    console.error('❌ User admin@admin.com not found!');
    process.exit(1);
  }
  
  console.log('✅ User found!');
  console.log('   User ID:', admin.id);
  console.log('   Email:', admin.email);
  console.log('   Email confirmed:', admin.email_confirmed_at ? 'Yes' : 'No');
  console.log('   Created:', admin.created_at);
  
  console.log('\n🔄 Resetting password to "123456"...');
  
  const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(
    admin.id,
    {
      password: '123456',
      email_confirm: true
    }
  );
  
  if (updateError) {
    console.error('❌ Error updating password:', updateError.message);
    process.exit(1);
  }
  
  console.log('✅ Password reset successful!');
  console.log('\n📋 Login Credentials:');
  console.log('   Email: admin@admin.com');
  console.log('   Password: 123456');
  console.log('\n🌐 Try logging in at:');
  console.log('   https://frontend-ivory-eta-13.vercel.app/en/auth/signin');
}

resetPassword()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
