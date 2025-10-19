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

async function debugUserFetch() {
  console.log('\n=== Debugging user fetch ===');
  
  try {
    // First, let's try to fetch without the single() method
    const userId = 'e8e38dcc-a285-48d6-a9b2-b907a6a36cb7';
    console.log(`Fetching user with ID: ${userId}`);
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId);
      
    if (error) {
      console.log('Fetch error:', error);
    } else {
      console.log('Fetch result:', data);
      console.log('Result type:', typeof data);
      console.log('Result length:', data.length);
    }
    
    // Let's also check what the function returns for this specific user
    console.log('\n=== Testing function with exact phone ===');
    const { data: functionResult, error: functionError } = await supabase.rpc('check_phone_exists', { phone_text: '998997961877' });
    
    if (functionError) {
      console.log('Function error:', functionError);
    } else {
      console.log('Function result:', JSON.stringify(functionResult, null, 2));
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugUserFetch();