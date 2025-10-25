#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://djnbuvumslqlpvdyjnrt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqbmJ1dnVtc2xxbHB2ZHlqbnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMTUzMDQsImV4cCI6MjA3NTc5MTMwNH0.ZTYpM22Am6pZZ731acNjGrR0C1oJQTfH4NQgRASeWk8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkRLS() {
  console.log('🔍 Checking RLS policies for user_meals table...\n');

  try {
    // Test query to user_meals
    console.log('Testing SELECT on user_meals...');
    const { data, error } = await supabase
      .from('user_meals')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error:', error.message);
      console.error('Code:', error.code);
      console.error('Details:', error.details);
      console.error('Hint:', error.hint);
    } else {
      console.log('✅ Query successful!');
      console.log('Data:', data);
    }

    // Check if RLS is enabled
    console.log('\n📋 Checking RLS status...');
    const { data: rlsData, error: rlsError } = await supabase.rpc('check_rls_status');
    
    if (rlsError) {
      console.log('⚠️ Cannot check RLS status (function might not exist)');
    } else {
      console.log('RLS Status:', rlsData);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkRLS();
