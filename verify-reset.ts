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

async function verifyDatabaseReset() {
  console.log('🔍 Verifying database reset...\n');

  try {
    // Test 1: Check if tables exist
    console.log('🔍 Checking if tables exist...');
    
    // Try to query each table (this will help us see if they exist)
    const tableNames = ['users', 'user_profiles', 'user_goals'];
    
    for (const tableName of tableNames) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('count')
          .limit(1);
          
        if (error) {
          console.log(`❌ Table ${tableName} check failed:`, error.message);
        } else {
          console.log(`✅ Table ${tableName} exists and is accessible`);
        }
      } catch (err) {
        console.log(`❌ Table ${tableName} check failed:`, err);
      }
    }

    // Test 2: Check if functions exist
    console.log('\n🔍 Checking if functions exist...');
    
    try {
      // Test the check_phone_exists function
      const { data: result, error } = await supabase
        .rpc('check_phone_exists', { phone_text: '+998997961877' });
        
      if (error) {
        console.log('❌ Function check_phone_exists check failed:', error.message);
      } else {
        console.log('✅ Function check_phone_exists exists and is accessible');
        console.log('   Test result for +998997961877:', result);
      }
    } catch (err) {
      console.log('❌ Function check_phone_exists check failed:', err);
    }

    // Test 3: Try to create a user (this will test the full flow)
    console.log('\n🔍 Testing user creation flow...');
    
    try {
      // Sign in anonymously
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
      
      if (authError) {
        console.log('❌ Anonymous sign in failed:', authError.message);
      } else {
        console.log('✅ Anonymous sign in successful');
        console.log('   User ID:', authData.user?.id);
        
        // Try to insert a user record
        if (authData.user?.id) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              phone: '+998997961877',
              onboarding_completed: false
            })
            .select();
            
          if (userError) {
            console.log('❌ User creation failed:', userError.message);
          } else {
            console.log('✅ User creation successful');
            console.log('   User data:', userData?.[0]);
            
            // Clean up - delete the test user
            if (userData?.[0]?.id) {
              const { error: deleteError } = await supabase
                .from('users')
                .delete()
                .eq('id', userData[0].id);
                
              if (deleteError) {
                console.log('❌ User cleanup failed:', deleteError.message);
              } else {
                console.log('✅ User cleanup successful');
              }
            }
          }
        }
      }
    } catch (err) {
      console.log('❌ User creation flow test failed:', err);
    }

    console.log('\n✅ Database verification completed!');
    console.log('If all tests passed, your database reset was successful.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the verification
verifyDatabaseReset();