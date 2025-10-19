// This script needs to be run with a service role key
// For now, let's create a better test to understand the issue

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Try to get service role key, fallback to anon key
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Service Key Available:', !!supabaseServiceKey);

// Use service key if available, otherwise anon key
const supabaseKey = supabaseServiceKey || supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDbStructure() {
  console.log('\n=== Checking database structure ===');
  
  try {
    // Try to get a count of users
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log('Cannot get count:', countError.code, countError.message);
    } else {
      console.log(`Total users in database: ${count}`);
    }
    
    // Try to insert a test user to see the current format
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    
    if (authError) {
      console.error('Auth error:', authError);
      return;
    }
    
    console.log('\nCreated test user:', authData.user?.id);
    
    // Try to insert with different phone formats
    const testFormats = [
      { format: 'clean', phone: '998997961877' },
      { format: 'with_plus', phone: '+998997961877' },
      { format: 'formatted', phone: '+998 99 796 18 77' }
    ];
    
    for (const { format, phone } of testFormats) {
      console.log(`\nTesting insert with ${format}: "${phone}"`);
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: authData.user.id + format, // Make unique ID
          phone: phone,
          onboarding_completed: false
        })
        .select();
      
      if (error) {
        console.log(`Error (${format}):`, error.code, error.message);
      } else {
        console.log(`Success (${format}):`, data[0]?.phone);
      }
    }
    
    // Clean up
    await supabase.auth.signOut();
    
  } catch (error) {
    console.error('DB check error:', error);
  }
}

checkDbStructure();