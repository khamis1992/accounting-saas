/**
 * Authentication Test Script
 * Tests the Supabase authentication flow
 */

const SUPABASE_URL = 'https://gbbmicjucestjpxtkjyp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiYm1pY2p1Y2VzdGpweHRranlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDU0ODQsImV4cCI6MjA4Mzk4MTQ4NH0.9dQOLyBYZRc5nBZuoc4lntEDQkqSZubwB06SgxYzAjE';

async function testAuth() {
  console.log('🧪 Testing Supabase Authentication...\n');

  // Test 1: Check environment variables
  console.log('✓ Supabase URL:', SUPABASE_URL);
  console.log('✓ Anon Key:', SUPABASE_ANON_KEY ? 'Set' : 'Missing');
  console.log('');

  // Test 2: Attempt sign in
  console.log('🔐 Attempting to sign in as admin@admin.com...\n');

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email: 'admin@admin.com',
        password: '123456',
      }),
    });

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response OK:', response.ok);

    const data = await response.json();

    if (response.ok) {
      console.log('\n✅ SUCCESS! Authentication worked!\n');
      console.log('User Details:');
      console.log('  - Email:', data.user?.email);
      console.log('  - ID:', data.user?.id);
      console.log('  - Confirmed:', data.user?.confirmed_at ? 'Yes' : 'No');
      console.log('  - Role:', data.user?.role);
      console.log('\nAccess Token (first 50 chars):', data.access_token.substring(0, 50) + '...');
    } else {
      console.log('\n❌ FAILED! Authentication failed\n');
      console.log('Error:', data);
    }
  } catch (error) {
    console.log('\n💥 ERROR! Exception occurred\n');
    console.log(error);
  }

  // Test 3: Test frontend URL
  console.log('\n\n🌐 Testing Frontend...\n');
  console.log('Frontend URL: https://frontend-ivory-eta-13.vercel.app');

  try {
    const frontendResponse = await fetch('https://frontend-ivory-eta-13.vercel.app/en/auth/signin');
    console.log('Frontend Status:', frontendResponse.status);
    console.log('Frontend OK:', frontendResponse.ok ? '✅ Yes' : '❌ No');
  } catch (error) {
    console.log('Frontend Error:', error.message);
  }
}

// Run the test
testAuth().then(() => {
  console.log('\n\n✨ Test complete!\n');
}).catch((error) => {
  console.error('Test failed:', error);
});
