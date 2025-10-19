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

async function testCrossDeviceAuth() {
  console.log('🔍 Testing cross-device authentication...\n');

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

    // Now we can access the users table
    console.log('\n🔍 Checking all existing phone numbers...');
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('phone');

    if (allUsersError) {
      console.error('❌ Failed to fetch users:', allUsersError.message);
      return;
    }

    console.log('✅ Found users:', allUsers?.length || 0);
    if (allUsers && allUsers.length > 0) {
      allUsers.forEach((user: any, index: number) => {
        console.log(`   ${index + 1}. ${user.phone}`);
      });
    }

    // Test the check_phone_exists function with a test phone number
    const testPhone = '+998997961877';
    console.log('\n🔍 Calling check_phone_exists function with:', testPhone);
    const { data: phoneExists, error: checkError } = await supabase
      .rpc('check_phone_exists', { phone_text: testPhone });

    if (checkError) {
      console.error('❌ Phone check function failed:', checkError.message);
      return;
    }

    console.log('✅ Phone check function executed successfully!');
    console.log('   Phone exists:', phoneExists);

    // Test fetching user by phone (simulating cross-device access)
    console.log('\n🔍 Testing cross-device user access...');
    
    // Try multiple phone formats to ensure we find the user
    const phoneFormats = [
      testPhone,
      testPhone.replace('+', ''),
      testPhone.trim()
    ];
    
    let foundUser: any = null;
    
    for (const phoneFormat of phoneFormats) {
      console.log('   Trying format:', phoneFormat);
      const { data: users, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phoneFormat);

      if (fetchError) {
        console.error('   Fetch error for format', phoneFormat, ':', fetchError.message);
        continue;
      }

      if (users && users.length > 0) {
        foundUser = users[0];
        console.log('   ✅ User found with format:', phoneFormat);
        break;
      }
    }

    if (foundUser) {
      console.log('✅ User found successfully!');
      console.log('   Existing user ID:', foundUser.id);
      console.log('   Phone number:', foundUser.phone);
      console.log('   Onboarding completed:', foundUser.onboarding_completed);
    } else {
      console.log('ℹ️  User not found with test phone number (this is expected if no user exists with this number)');
    }

    // Clean up - sign out
    await supabase.auth.signOut();
    console.log('\n✅ Session cleaned up');

    console.log('\n🎉 Cross-device authentication test completed!');
    console.log('The system should now properly handle cross-device access.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testCrossDeviceAuth();