import { config } from 'dotenv';
config(); // Load environment variables from .env file

import { createClient } from '@supabase/supabase-js';

// Create a new Supabase client for testing
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifySupabase() {
  console.log('🔍 Verifying Supabase setup...\n');

  try {
    // Test 1: Check if client is initialized
    console.log('✅ Supabase client initialized');
    console.log('   URL:', supabaseUrl);
    console.log('   Has Key:', !!supabaseAnonKey, '\n');

    // Test 2: Check if auth is working
    console.log('🔍 Testing auth service...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth check failed:', authError.message);
      return;
    }

    console.log('✅ Auth service working\n');

    // Test 3: Test anonymous sign-in
    console.log('🔍 Testing anonymous sign-in...');
    const { data: authData, error: signInError } = await supabase.auth.signInAnonymously();
    
    if (signInError) {
      console.error('❌ Anonymous sign-in failed:', signInError.message);
      return;
    }

    console.log('✅ Anonymous sign-in successful!');
    console.log('   User ID:', authData.user?.id, '\n');

    // Test 4: Check database connection by querying users table (now authenticated)
    console.log('🔍 Testing database connection...');
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return;
    }

    console.log('✅ Database connection successful!');
    console.log('   Table "users" exists and is accessible\n');

    // Test 5: Test phone number checking function
    console.log('🔍 Testing phone number checking function...');
    const { data: phoneExists, error: checkError } = await supabase
      .rpc('check_phone_exists', { phone_text: '+998997961877' });

    if (checkError) {
      console.error('❌ Phone check function failed:', checkError.message);
      return;
    }

    console.log('✅ Phone check function working!');
    console.log('   Test result for +998997961877:', phoneExists, '\n');

    // Clean up - sign out
    await supabase.auth.signOut();
    console.log('✅ Session cleaned up\n');

    console.log('🎉 All tests passed! Supabase is ready to use.\n');
    console.log('You can now run your application with: npm run dev\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.log('\nPlease check:');
    console.log('1. .env file has correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    console.log('2. Database tables are created (run the migration SQL files)');
    console.log('3. Anonymous sign-ins are enabled in Supabase dashboard');
    console.log('4. Internet connection is working\n');
  }
}

// Run the test
verifySupabase();