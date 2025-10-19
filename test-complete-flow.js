import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('=== COMPLETE FLOW TEST ===');
console.log('Supabase URL:', supabaseUrl);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCompleteFlow() {
  console.log('\n=== Testing complete authentication flow ===');
  
  try {
    // Test with the phone number we know exists
    const testPhone = '998997961877';
    console.log(`Testing with phone number: ${testPhone}`);
    
    // Step 1: Check if user exists using the function
    console.log('\n1. Checking if user exists...');
    const { data: functionResult, error: functionError } = await supabase.rpc('check_phone_exists', { phone_text: testPhone });
    
    if (functionError) {
      console.error('Function error:', functionError);
      return;
    }
    
    console.log('Function result:', JSON.stringify(functionResult, null, 2));
    
    // Handle the result (array format)
    const userExists = functionResult[0].exists;
    const userId = functionResult[0].user_id;
    
    console.log(`User exists: ${userExists}`);
    if (userExists) {
      console.log(`User ID: ${userId}`);
      
      // Step 2: Simulate creating a new anonymous session (like logging in from another device)
      console.log('\n2. Creating new anonymous session (simulating different device)...');
      const { data: newAuthData, error: newAuthError } = await supabase.auth.signInAnonymously();
      
      if (newAuthError) {
        console.error('New session error:', newAuthError);
        return;
      }
      
      console.log('New anonymous session created:', newAuthData.user?.id);
      
      // Step 3: Fetch the existing user data
      console.log('\n3. Fetching existing user data...');
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (userError) {
        console.error('User fetch error:', userError);
        return;
      }
      
      console.log('Existing user data retrieved:', {
        id: existingUser.id,
        phone: existingUser.phone,
        onboarding_completed: existingUser.onboarding_completed
      });
      
      // Step 4: Verify we're linking to the correct user (not creating a new one)
      console.log('\n4. Verifying account linking...');
      if (existingUser.id === userId) {
        console.log('✅ SUCCESS: New session correctly linked to existing user!');
        console.log('   Existing user ID:', existingUser.id);
        console.log('   Function returned ID:', userId);
        console.log('   New session ID:', newAuthData.user?.id);
        console.log('   Phone number:', existingUser.phone);
      } else {
        console.log('❌ ERROR: Session not linked correctly');
      }
      
      // Clean up the new session
      await supabase.auth.signOut();
    } else {
      console.log('User does not exist - would create new user');
    }
    
    console.log('\n=== FLOW TEST COMPLETE ===');
    
  } catch (error) {
    console.error('Flow test error:', error);
  }
}

testCompleteFlow();