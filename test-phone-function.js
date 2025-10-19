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

async function testPhoneFunction() {
  console.log('\n=== Testing phone function ===');
  
  // Test the check_phone_exists function
  console.log('Testing check_phone_exists with 998997961877...');
  const { data, error } = await supabase.rpc('check_phone_exists', { phone_text: '998997961877' });
  
  if (error) {
    console.error('Error calling check_phone_exists:', error);
  } else {
    console.log('check_phone_exists result:', data);
    console.log('Type of result:', typeof data);
    if (data && typeof data === 'object') {
      console.log('Keys in result:', Object.keys(data));
    }
  }
  
  // Let's also test with a phone number we know doesn't exist
  console.log('\nTesting check_phone_exists with non-existent number...');
  const { data: data2, error: error2 } = await supabase.rpc('check_phone_exists', { phone_text: '123456789012' });
  
  if (error2) {
    console.error('Error calling check_phone_exists:', error2);
  } else {
    console.log('check_phone_exists result for non-existent number:', data2);
    console.log('Type of result:', typeof data2);
    if (data2 && typeof data2 === 'object') {
      console.log('Keys in result:', Object.keys(data2));
    }
  }
  
  // Try to get function definition from database
  console.log('\n=== Getting function info ===');
  const { data: functions, error: funcError } = await supabase
    .from('pg_proc')
    .select('proname, proargnames, prorettype')
    .eq('proname', 'check_phone_exists');
  
  if (funcError) {
    console.error('Error fetching function info:', funcError);
  } else {
    console.log('Function info:', functions);
  }
}

testPhoneFunction().catch(console.error);