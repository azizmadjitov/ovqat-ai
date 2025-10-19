#!/usr/bin/env node

// Debug script to check phone number lookup issues
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://djnbuvumslqlpvdyjnrt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqbmJ1dnVtc2xxbHB2ZHlqbnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMTUzMDQsImV4cCI6MjA3NTc5MTMwNH0.ZTYpM22Am6pZZ731acNjGrR0C1oJQTfH4NQgRASeWk8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugPhoneCheck() {
  console.log('🔍 Debugging phone number check...\n');
  
  try {
    // Test phone number (replace with an actual test number)
    const testPhoneNumber = '+998997961877';
    
    console.log(`📱 Testing with phone number: ${testPhoneNumber}`);
    
    // Step 1: Check if phone exists using the function
    console.log('\n1️⃣ Checking if phone exists using function...');
    const { data: phoneExists, error: functionError } = await supabase
      .rpc('check_phone_exists', { phone_text: testPhoneNumber });
    
    if (functionError) {
      console.error('❌ Function error:', functionError.message);
      return;
    }
    
    console.log(`✅ Phone exists function result: ${phoneExists}`);
    
    // Step 2: Direct query to users table
    console.log('\n2️⃣ Direct query to users table...');
    const { data: users, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('phone', testPhoneNumber);
    
    if (queryError) {
      console.error('❌ Query error:', queryError.message);
      return;
    }
    
    console.log(`✅ Found ${users.length} user(s) with this phone number`);
    if (users.length > 0) {
      console.log('User data:', JSON.stringify(users[0], null, 2));
    }
    
    // Step 3: Check for duplicates
    console.log('\n3️⃣ Checking for duplicate phone numbers...');
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('phone, count(phone)')
      .group('phone')
      .having('count(phone)', '>', 1);
    
    if (allUsersError) {
      console.error('❌ Duplicate check error:', allUsersError.message);
      return;
    }
    
    if (allUsers.length > 0) {
      console.log('⚠️  Found duplicate phone numbers:');
      allUsers.forEach(user => {
        console.log(`  Phone: ${user.phone}, Count: ${user.count}`);
      });
    } else {
      console.log('✅ No duplicate phone numbers found');
    }
    
    console.log('\n✅ Debug completed successfully!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the debug
debugPhoneCheck();