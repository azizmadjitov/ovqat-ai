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

async function listAllUsers() {
  console.log('\n=== Listing all users (if possible) ===');
  
  try {
    // Try to get a few users to see what format phone numbers are stored in
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, phone')
      .limit(5);
    
    if (usersError) {
      console.log('Cannot list users due to permissions (expected with anon key)');
      console.log('Error code:', usersError.code);
    } else {
      console.log('Users found:', users.length);
      users.forEach(user => {
        console.log(`  ID: ${user.id.substring(0, 8)}..., Phone: "${user.phone}"`);
      });
    }
    
    // Let's test the function with an empty string to see if it returns anything
    console.log('\n=== Testing function with empty string ===');
    const { data: emptyResult, error: emptyError } = await supabase.rpc('check_phone_exists', { phone_text: '' });
    
    if (emptyError) {
      console.log('Empty test error:', emptyError);
    } else {
      console.log('Empty test result:', JSON.stringify(emptyResult, null, 2));
    }
    
  } catch (error) {
    console.error('List error:', error);
  }
}

listAllUsers();