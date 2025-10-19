#!/usr/bin/env tsx
/**
 * Supabase Setup Helper Script
 * This script helps verify and complete your Supabase integration
 */

import { config } from 'dotenv';
config(); // Load environment variables from .env file

import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Supabase Setup Verification\n');

// Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please make sure your .env file contains:');
  console.log('VITE_SUPABASE_URL=your_supabase_project_url');
  console.log('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
  process.exit(1);
}

console.log('✅ Environment variables found');
console.log('   URL:', supabaseUrl);
console.log('   Key present:', !!supabaseAnonKey, '\n');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifySupabaseSetup() {
  try {
    console.log('🔍 Testing Supabase connection...\n');

    // Test 1: Check if we can connect to the database
    console.log('1. Testing database connection...');
    const { data: tableExists, error: tableError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (tableError) {
      console.log('⚠️  Users table not found - you need to apply migrations');
      console.log('   Error:', tableError.message);
      console.log('\n📋 To fix this, apply the migration files in order:');
      console.log('   1. supabase/migrations/001_initial_schema.sql');
      console.log('   2. supabase/migrations/002_security_fixes.sql');
      console.log('   3. supabase/migrations/003_fix_function_search_path.sql\n');
    } else {
      console.log('✅ Database connection successful!');
      console.log('   Users table exists and is accessible\n');
    }

    // Test 2: Check authentication
    console.log('2. Testing authentication...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('⚠️  Auth check failed:', authError.message);
    } else {
      console.log('✅ Authentication working');
      if (session) {
        console.log('   Active session found');
      } else {
        console.log('   No active session (this is normal)\n');
      }
    }

    // Test 3: Try anonymous sign-in
    console.log('3. Testing anonymous sign-in...');
    const { data: authData, error: signInError } = await supabase.auth.signInAnonymously();
    
    if (signInError) {
      console.log('⚠️  Anonymous sign-in failed:', signInError.message);
      console.log('   Make sure you have enabled anonymous sign-ins in your Supabase dashboard');
      console.log('   Go to: Authentication → Settings → Enable Anonymous Sign-ins\n');
    } else {
      console.log('✅ Anonymous sign-in successful!');
      console.log('   User ID:', authData.user?.id);
      
      // Clean up - sign out
      await supabase.auth.signOut();
      console.log('   Session cleaned up\n');
    }

    // Test 4: Check if functions exist
    console.log('4. Testing phone number checking function...');
    const { data: phoneExists, error: functionError } = await supabase
      .rpc('check_phone_exists', { phone_text: '+998997961877' });

    if (functionError) {
      console.log('⚠️  Phone check function not found:', functionError.message);
      console.log('   You may need to apply migration 003_fix_function_search_path.sql\n');
    } else {
      console.log('✅ Phone check function working!');
      console.log('   Test result for +998997961877:', phoneExists, '\n');
    }

    console.log('🎉 Supabase setup verification complete!\n');
    
    if (!tableError && !signInError && !functionError) {
      console.log('✅ All tests passed! Your Supabase integration is working correctly.');
      console.log('You can now run your application with: npm run dev\n');
    } else {
      console.log('⚠️  Some tests failed. Please check the issues above and fix them.');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the verification
verifySupabaseSetup();