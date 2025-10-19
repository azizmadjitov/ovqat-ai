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

async function debugFunction() {
  console.log('\n=== Debugging check_phone_exists function ===');
  
  try {
    // Test with a phone number we know exists
    console.log('Testing with 998997961877...');
    const { data, error } = await supabase.rpc('check_phone_exists', { phone_text: '998997961877' });
    
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Raw result:', JSON.stringify(data, null, 2));
      console.log('Type:', typeof data);
      if (Array.isArray(data)) {
        console.log('Array length:', data.length);
        if (data.length > 0) {
          console.log('First element:', data[0]);
          console.log('First element type:', typeof data[0]);
          if (data[0] && typeof data[0] === 'object') {
            console.log('First element keys:', Object.keys(data[0]));
          }
        }
      } else if (data && typeof data === 'object') {
        console.log('Object keys:', Object.keys(data));
      }
    }
    
    // Test with a non-existent phone number
    console.log('\nTesting with non-existent number 123456789012...');
    const { data: data2, error: error2 } = await supabase.rpc('check_phone_exists', { phone_text: '123456789012' });
    
    if (error2) {
      console.error('Error:', error2);
    } else {
      console.log('Raw result:', JSON.stringify(data2, null, 2));
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugFunction();