import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkExistingUsers() {
  console.log('\n=== Checking existing users ===');
  
  try {
    // Create an anonymous session to test with admin privileges
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    
    if (authError) {
      console.error('Auth error:', authError);
      return;
    }
    
    console.log('Anonymous session created:', authData.user?.id);
    
    // Try to directly query the users table to see what phone numbers exist
    // We'll use a service role key approach by creating a temporary user record
    const testPhone = '998997961877';
    console.log(`\nChecking if phone ${testPhone} exists in database...`);
    
    // First, let's try to find users with this phone number directly
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, phone')
      .eq('phone', testPhone);
    
    if (usersError) {
      console.log('Cannot query users table directly (expected with anon key)');
      console.log('Error:', usersError.message);
    } else {
      console.log('Direct query result:', users);
    }
    
    // Try with different formats
    const formats = [
      testPhone,
      '+' + testPhone,
      '+ 998 99 796 18 77'
    ];
    
    for (const format of formats) {
      console.log(`\nTrying format: "${format}"`);
      const { data: users2, error: error2 } = await supabase
        .from('users')
        .select('id, phone')
        .eq('phone', format);
      
      if (error2) {
        console.log('Error:', error2.message);
      } else {
        console.log('Result:', users2);
      }
    }
    
    // Sign out
    await supabase.auth.signOut();
    
  } catch (error) {
    console.error('Check error:', error);
  }
}

checkExistingUsers();