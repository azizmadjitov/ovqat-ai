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

async function debugUsers() {
  console.log('\n=== Debugging Users ===');
  
  try {
    // Try to get user count and sample data
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log('Cannot get user count due to permissions:', countError.message);
    } else {
      console.log(`Total users: ${count}`);
    }
    
    // Try to get function definition by calling it with debug info
    console.log('\n=== Testing Current Function Behavior ===');
    
    // Create an anonymous session to test
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    
    if (authError) {
      console.error('Auth error:', authError);
    } else {
      console.log('Anonymous session created:', authData.user?.id);
      
      // Test with a known phone number format
      const testNumbers = ['998997961877', '+998997961877'];
      
      for (const number of testNumbers) {
        console.log(`\nTesting with: ${number}`);
        const { data, error } = await supabase.rpc('check_phone_exists', { phone_text: number });
        
        if (error) {
          console.error('RPC Error:', error);
        } else {
          console.log('Result:', data);
          console.log('Type:', typeof data);
          if (data && typeof data === 'object') {
            console.log('Keys:', Object.keys(data));
          }
        }
      }
      
      // Sign out
      await supabase.auth.signOut();
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugUsers();