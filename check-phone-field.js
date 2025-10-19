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

async function checkPhoneField() {
  console.log('\n=== Checking phone field in database ===');
  
  try {
    // Create an anonymous session
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    
    if (authError) {
      console.error('Auth error:', authError);
      return;
    }
    
    console.log('Anonymous session created:', authData.user?.id);
    
    // Try to insert a user with phone number to see what gets stored
    const testPhone = '998997961877';
    console.log(`\nInserting user with phone: "${testPhone}"`);
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        phone: testPhone,
        onboarding_completed: false,
      })
      .select();
    
    if (error) {
      console.log('Insert error:', error);
      
      // Try to query existing users to see what's in the database
      console.log('\nChecking existing users...');
      // We can't directly query due to RLS, but let's test the function
      const { data: functionResult, error: functionError } = await supabase.rpc('check_phone_exists', { phone_text: testPhone });
      
      if (functionError) {
        console.log('Function error:', functionError);
      } else {
        console.log('Function result:', JSON.stringify(functionResult, null, 2));
      }
    } else {
      console.log('Insert success!');
      console.log('Stored data:', data);
      
      // Check what was actually stored
      if (data && data.length > 0) {
        console.log('Phone field value:', `"${data[0].phone}"`);
        console.log('Phone field type:', typeof data[0].phone);
        console.log('Phone field length:', data[0].phone?.length);
      }
    }
    
    // Clean up
    await supabase.auth.signOut();
    
  } catch (error) {
    console.error('Check error:', error);
  }
}

checkPhoneField();