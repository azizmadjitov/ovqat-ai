import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('=== FINAL VERIFICATION ===');
console.log('Supabase URL:', supabaseUrl);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function finalVerification() {
  console.log('\n1. Testing current check_phone_exists function behavior:');
  
  // Test the function with a known phone number
  const { data, error } = await supabase.rpc('check_phone_exists', { phone_text: '998997961877' });
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Result:', data);
    console.log('Type:', typeof data);
    if (data && typeof data === 'object') {
      console.log('Keys:', Object.keys(data));
      console.log('Is this the NEW function? ', !!(data.exists !== undefined && data.user_id !== undefined));
    } else {
      console.log('This is the OLD function (returns boolean)');
    }
  }
  
  console.log('\n2. Checking if phone numbers are stored correctly:');
  
  // Try to find users with phone numbers
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, phone, onboarding_completed')
    .limit(3);
  
  if (usersError) {
    console.log('Cannot fetch users due to permissions (this is normal for anon key)');
  } else {
    console.log('Sample users:');
    users.forEach(user => {
      console.log(`  ID: ${user.id.substring(0, 8)}..., Phone: "${user.phone}", Onboarding: ${user.onboarding_completed}`);
    });
  }
  
  console.log('\n=== VERIFICATION COMPLETE ===');
  console.log('\nTo fix the remaining issues:');
  console.log('1. Apply the migration in supabase/migrations/004_fix_user_account_linking.sql');
  console.log('2. This will update the check_phone_exists function to return user_id');
  console.log('3. After that, cross-device login will work properly');
}

finalVerification();