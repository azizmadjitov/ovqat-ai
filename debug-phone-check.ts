import { config } from 'dotenv';
config(); // Load environment variables from .env file

import { createClient } from '@supabase/supabase-js';

// Create a new Supabase client for this test
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPhoneCheck() {
  console.log('🔍 Testing phone number checking function...\n');

  try {
    // Test phone number - replace with your actual phone number
    const testPhone = '+998997961877';
    console.log('Testing with phone number:', testPhone);

    // Test the check_phone_exists function
    console.log('🔍 Calling check_phone_exists function...');
    const { data: phoneExists, error: checkError } = await supabase
      .rpc('check_phone_exists', { phone_text: testPhone });

    if (checkError) {
      console.error('❌ Phone check function failed:', checkError.message);
      console.error('Error details:', checkError);
      return;
    }

    console.log('✅ Phone check function executed successfully!');
    console.log('   Phone exists:', phoneExists);

    // Let's also test with different formats
    const testFormats = [
      testPhone,
      testPhone.replace('+', ''),
      testPhone.replace('+', '').replace(/(\d{3})(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')
    ];

    for (const format of testFormats) {
      console.log(`🔍 Testing format: "${format}"`);
      const { data: exists, error: err } = await supabase
        .rpc('check_phone_exists', { phone_text: format });
      
      if (err) {
        console.error(`❌ Error with format "${format}":`, err.message);
      } else {
        console.log(`   Format "${format}" exists:`, exists);
      }
    }

    // Let's also check what's actually in the database
    console.log('\n🔍 Checking actual database contents...');
    
    // Sign in anonymously first
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    
    if (authError) {
      console.error('❌ Anonymous sign in failed:', authError.message);
      return;
    }
    
    console.log('✅ Anonymous sign in successful');
    
    // Try to fetch all users (this might fail due to RLS)
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('*');

    if (allUsersError) {
      console.error('❌ Failed to fetch all users:', allUsersError.message);
      console.error('This is expected due to RLS policies');
    } else {
      console.log('✅ Total users in database:', allUsers?.length || 0);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testPhoneCheck();