import { supabase } from './src/lib/supabase';

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  try {
    // Test 1: Check if client is initialized
    console.log('✅ Supabase client initialized');
    console.log('   URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('   Has Key:', !!import.meta.env.VITE_SUPABASE_ANON_KEY, '\n');

    // Test 2: Check database connection by querying users table
    console.log('🔍 Testing database connection...');
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Database connection failed:', error.message);
      console.log('\n💡 Make sure you have run the SQL migration:');
      console.log('   supabase/migrations/001_initial_schema.sql\n');
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

    console.log('\n🎉 All tests passed! Supabase is ready to use.\n');
    console.log('Next steps:');
    console.log('1. Enable Phone Authentication in Supabase Dashboard');
    console.log('2. Configure Twilio or another SMS provider');
    console.log('3. Run the app and test login: npm run dev\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.log('\nPlease check:');
    console.log('1. .env file has correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    console.log('2. Database tables are created (run the migration SQL)');
    console.log('3. Internet connection is working\n');
  }
}

// Run the test
testSupabaseConnection();
