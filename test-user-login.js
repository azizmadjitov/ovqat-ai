#!/usr/bin/env node

// Test script to verify user login flow
// This script simulates the login flow for existing users

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://djnbuvumslqlpvdyjnrt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqbmJ1dnVtc2xxbHB2ZHlqbnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMTUzMDQsImV4cCI6MjA3NTc5MTMwNH0.ZTYpM22Am6pZZ731acNjGrR0C1oJQTfH4NQgRASeWk8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testUserLogin() {
  console.log('🔍 Testing user login flow...\n');
  
  try {
    // Test phone number (replace with an actual test number)
    const testPhoneNumber = '+998997961877';
    
    console.log(`📱 Testing with phone number: ${testPhoneNumber}`);
    
    // Step 1: Check if user exists
    console.log('\n1️⃣ Checking if user exists...');
    const { data: phoneExists, error: checkError } = await supabase
      .rpc('check_phone_exists', { phone_text: testPhoneNumber });
    
    if (checkError) {
      console.error('❌ Error checking phone:', checkError.message);
      return;
    }
    
    console.log(`✅ Phone exists: ${phoneExists}`);
    
    if (phoneExists) {
      console.log('\n2️⃣ User exists, testing authentication flow...');
      
      // Create anonymous session
      console.log('🔐 Creating anonymous session...');
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
      
      if (authError) {
        console.error('❌ Auth error:', authError.message);
        return;
      }
      
      console.log('✅ Anonymous session created:', authData.user.id);
      
      // Fetch existing user data
      console.log('📥 Fetching existing user data...');
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', testPhoneNumber)
        .single();
      
      if (fetchError) {
        console.error('❌ Fetch error:', fetchError.message);
        return;
      }
      
      console.log('✅ Existing user data:', {
        id: existingUser.id,
        phone: existingUser.phone,
        onboarding_completed: existingUser.onboarding_completed
      });
      
      // Check onboarding status
      console.log('\n3️⃣ Checking onboarding status...');
      const needsOnboarding = !existingUser.onboarding_completed;
      console.log(`📋 Needs onboarding: ${needsOnboarding}`);
      
      if (needsOnboarding) {
        console.log('📝 User needs to complete questionnaire');
      } else {
        console.log('🏠 User can go directly to MainScreen');
      }
      
      console.log('\n✅ Test completed successfully!');
    } else {
      console.log('\n2️⃣ New user, testing registration flow...');
      console.log('📝 New user will be directed to questionnaire');
      console.log('\n✅ Test completed successfully!');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the test
testUserLogin();