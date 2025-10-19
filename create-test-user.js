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

async function createTestUser() {
  console.log('\n=== Creating test user ===');
  
  try {
    // Create an anonymous session
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    
    if (authError) {
      console.error('Auth error:', authError);
      return;
    }
    
    console.log('Anonymous session created:', authData.user?.id);
    
    // Insert a test user with a known phone number
    const testPhone = '998997961877';
    console.log(`Inserting test user with phone: ${testPhone}`);
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        phone: testPhone,
        onboarding_completed: false,
      })
      .select()
      .single();
    
    if (error) {
      console.log('Insert error:', error);
      // Try with a different ID to avoid conflicts
      const { data: authData2, error: authError2 } = await supabase.auth.signInAnonymously();
      if (authError2) {
        console.error('Second auth error:', authError2);
        return;
      }
      
      console.log('Trying with new session:', authData2.user?.id);
      
      const { data: data2, error: error2 } = await supabase
        .from('users')
        .insert({
          id: authData2.user.id,
          phone: testPhone,
          onboarding_completed: false,
        })
        .select()
        .single();
      
      if (error2) {
        console.log('Second insert error:', error2);
      } else {
        console.log('Second insert success:', data2);
      }
      
      await supabase.auth.signOut();
    } else {
      console.log('Insert success:', data);
    }
    
    // Test the function again
    console.log('\n=== Testing function after insert ===');
    const { data: functionResult, error: functionError } = await supabase.rpc('check_phone_exists', { phone_text: testPhone });
    
    if (functionError) {
      console.log('Function error:', functionError);
    } else {
      console.log('Function result:', JSON.stringify(functionResult, null, 2));
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

createTestUser();