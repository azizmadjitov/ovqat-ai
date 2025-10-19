import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? 'SET' : 'NOT SET');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyPhoneStorage() {
  console.log('\n=== Verifying Phone Number Storage ===');
  
  try {
    // Create an anonymous session
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    
    if (authError) {
      console.error('Auth error:', authError);
      return;
    }
    
    console.log('Anonymous session created:', authData.user?.id);
    
    // Test inserting a user with phone number
    const testPhone = '998997961877';
    console.log(`\nTesting phone number storage: ${testPhone}`);
    
    // Insert test user
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        phone: testPhone,
        onboarding_completed: false,
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Insert error:', insertError);
    } else {
      console.log('Insert successful:', insertData);
      
      // Verify the phone number was stored correctly
      if (insertData.phone === testPhone) {
        console.log('✅ Phone number stored correctly');
      } else {
        console.log('❌ Phone number storage issue:');
        console.log(`  Expected: ${testPhone}`);
        console.log(`  Actual: ${insertData.phone}`);
      }
      
      // Clean up - delete the test user
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', authData.user.id);
      
      if (deleteError) {
        console.error('Delete error:', deleteError);
      } else {
        console.log('✅ Test user cleaned up');
      }
    }
    
    // Sign out
    await supabase.auth.signOut();
    
  } catch (error) {
    console.error('Verification error:', error);
  }
}

verifyPhoneStorage();