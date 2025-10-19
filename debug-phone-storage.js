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

async function debugPhoneStorage() {
  console.log('\n=== Debugging phone storage ===');
  
  try {
    // Let's test the exact flow that happens when a user is created
    console.log('Testing user creation flow...');
    
    // Create an anonymous session
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    
    if (authError) {
      console.error('Auth error:', authError);
      return;
    }
    
    console.log('Anonymous session created:', authData.user?.id);
    
    // Try to insert with a new phone number to see what gets stored
    const newPhone = '998991234567';
    console.log(`\nTrying to insert with phone: "${newPhone}"`);
    
    const cleanPhone = newPhone.replace(/\D/g, '');
    console.log(`Clean phone: "${cleanPhone}"`);
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        phone: cleanPhone, // This is what gets stored
        onboarding_completed: false,
      })
      .select();
    
    if (error) {
      console.log('Insert error:', error.message);
      // This might be because the phone already exists or other issues
    } else {
      console.log('Insert success!');
      console.log('Data returned:', data);
      
      if (data && data.length > 0) {
        console.log('Stored phone value:', `"${data[0].phone}"`);
        console.log('Phone value type:', typeof data[0].phone);
        console.log('Phone value length:', data[0].phone?.length);
        
        // Test if we can find this user with our function
        console.log('\nTesting function with stored phone...');
        const { data: functionResult, error: functionError } = await supabase.rpc('check_phone_exists', { phone_text: cleanPhone });
        
        if (functionError) {
          console.log('Function error:', functionError);
        } else {
          console.log('Function result:', JSON.stringify(functionResult, null, 2));
        }
      }
    }
    
    // Clean up
    await supabase.auth.signOut();
    
    // Let's also test what happens with different phone formats
    console.log('\n=== Testing different phone formats ===');
    const testFormats = [
      '998997961877',
      '+998997961877',
      '+998 99 796 18 77',
      '998 99 796 18 77'
    ];
    
    for (const format of testFormats) {
      const clean = format.replace(/\D/g, '');
      console.log(`Format: "${format}" -> Clean: "${clean}"`);
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugPhoneStorage();