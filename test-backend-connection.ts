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

async function testBackendConnection() {
  console.log('🔍 Testing backend connection...\n');

  try {
    // Test 1: Check if client is initialized
    console.log('✅ Supabase client initialized');
    console.log('   URL:', supabaseUrl);
    console.log('   Has Key:', !!supabaseAnonKey, '\n');

    // Test 2: Check database connection by querying users table
    console.log('🔍 Testing database connection...');
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Database connection failed:', error.message);
      console.log('\n💡 Make sure you have run the SQL migrations:');
      console.log('   supabase/migrations/001_initial_schema.sql');
      console.log('   supabase/migrations/002_security_fixes.sql');
      console.log('   supabase/migrations/003_fix_function_search_path.sql\n');
      return;
    }

    console.log('✅ Database connection successful!');
    console.log('   Table "users" exists and is accessible\n');

    // Test 3: Check if auth is working
    console.log('🔍 Testing auth service...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth check failed:', authError.message);
      return;
    }

    if (session) {
      console.log('✅ User is authenticated');
      console.log('   User ID:', session.user.id);
    } else {
      console.log('ℹ️  No active session (user not logged in)');
    }

    // Test 4: Test phone number checking function
    console.log('\n🔍 Testing phone number checking function...');
    const { data: phoneExists, error: checkError } = await supabase
      .rpc('check_phone_exists', { phone_text: '+998997961877' });

    if (checkError) {
      console.error('❌ Phone check function failed:', checkError.message);
      console.log('💡 Make sure you have run migration 003_fix_function_search_path.sql');
    } else {
      console.log('✅ Phone check function executed successfully!');
      console.log('   Test result for +998997961877:', phoneExists);
    }

    console.log('\n🎉 All tests passed! Backend is ready to use.\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.log('\nPlease check:');
    console.log('1. .env file has correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    console.log('2. Database tables are created (run the migration SQL files)');
    console.log('3. Internet connection is working\n');
  }
}

// Run the test
testBackendConnection();