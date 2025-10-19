#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://djnbuvumslqlpvdyjnrt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqbmJ1dnVtc2xxbHB2ZHlqbnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMTUzMDQsImV4cCI6MjA3NTc5MTMwNH0.ZTYpM22Am6pZZ731acNjGrR0C1oJQTfH4NQgRASeWk8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function applyMigration() {
  console.log('🚀 Applying database migration...\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📝 Migration SQL loaded\n');
    console.log('⚠️  Note: Due to RLS policies, this script needs to be run via Supabase SQL Editor\n');
    console.log('📋 Instructions:');
    console.log('1. Go to: https://app.supabase.com/project/djnbuvumslqlpvdyjnrt/sql/new');
    console.log('2. Copy and paste the entire content from: supabase/migrations/001_initial_schema.sql');
    console.log('3. Click "Run" button\n');
    console.log('✅ Done! The migration will create:');
    console.log('   - users table');
    console.log('   - user_profiles table');
    console.log('   - user_goals table');
    console.log('   - RLS policies for all tables\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

applyMigration();
