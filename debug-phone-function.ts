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

async function debugPhoneFunction() {
  console.log('🔍 Debugging phone number checking function...\n');

  try {
    // Test anonymous sign-in first
    console.log('🔍 Testing anonymous sign-in...');
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    
    if (authError) {
      console.error('❌ Anonymous sign-in failed:', authError.message);
      return;
    }

    console.log('✅ Anonymous sign-in successful!');
    console.log('   User ID:', authData.user?.id);

    // First, let's see what's actually in the users table
    console.log('\n🔍 Checking actual users table contents...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) {
      console.error('❌ Failed to fetch users:', usersError.message);
    } else {
      console.log('✅ Found users:', users?.length || 0);
      if (users && users.length > 0) {
        users.forEach((user: any, index: number) => {
          console.log(`   ${index + 1}. ID: ${user.id}, Phone: "${user.phone}", Onboarding: ${user.onboarding_completed}`);
        });
      } else {
        console.log('   No users found in table');
      }
    }

    // Test different phone numbers with the check_phone_exists function
    const testNumbers = [
      '+998997961877',
      '998997961877',
      '+998 99 796 18 77',
      '998 99 796 18 77'
    ];

    for (const phone of testNumbers) {
      console.log(`\n🔍 Testing phone number: "${phone}"`);
      const { data: phoneExists, error: checkError } = await supabase
        .rpc('check_phone_exists', { phone_text: phone });

      if (checkError) {
        console.error('❌ Phone check function failed:', checkError.message);
      } else {
        console.log('   Result:', phoneExists);
      }
      
      // Also try to directly query for this phone number
      console.log('   🔍 Direct query for this phone number:');
      const { data: directUsers, error: directError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone);
        
      if (directError) {
        console.error('   ❌ Direct query failed:', directError.message);
      } else {
        console.log('   ✅ Direct query found:', directUsers?.length || 0, 'users');
        if (directUsers && directUsers.length > 0) {
          directUsers.forEach((user: any, index: number) => {
            console.log(`     ${index + 1}. ID: ${user.id}, Phone: "${user.phone}"`);
          });
        }
      }
    }

    // Clean up - sign out
    await supabase.auth.signOut();
    console.log('\n✅ Session cleaned up');

    console.log('\n🎉 Phone function debugging completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the debug
debugPhoneFunction();