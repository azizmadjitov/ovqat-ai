#!/usr/bin/env node

/**
 * Automated Migration Script for Ovqat AI
 * This script applies the database migration to Supabase
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://djnbuvumslqlpvdyjnrt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqbmJ1dnVtc2xxbHB2ZHlqbnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMTUzMDQsImV4cCI6MjA3NTc5MTMwNH0.ZTYpM22Am6pZZ731acNjGrR0C1oJQTfH4NQgRASeWk8';

async function runMigration() {
  console.log('🚀 Starting database migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '001_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📝 Migration SQL loaded');
    console.log(`📊 SQL length: ${migrationSQL.length} characters\n`);

    // Execute SQL using Supabase REST API
    console.log('🔄 Executing migration via Supabase...\n');

    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ sql: migrationSQL })
    });

    if (!response.ok) {
      console.log('⚠️  Direct execution not available with anon key.\n');
      console.log('📋 Please apply migration manually:\n');
      console.log('1. Open: https://app.supabase.com/project/djnbuvumslqlpvdyjnrt/sql/new');
      console.log('2. Copy SQL from: supabase/migrations/001_initial_schema.sql');
      console.log('3. Paste and click "Run"\n');
      return;
    }

    console.log('✅ Migration applied successfully!\n');
    console.log('Created tables:');
    console.log('  ✓ users');
    console.log('  ✓ user_profiles');
    console.log('  ✓ user_goals');
    console.log('\n🔒 RLS policies enabled\n');
    console.log('🎉 Ready to test! Run: npm run dev\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Manual migration required:');
    console.log('1. Open: https://app.supabase.com/project/djnbuvumslqlpvdyjnrt/sql/new');
    console.log('2. Copy SQL from: supabase/migrations/001_initial_schema.sql');
    console.log('3. Paste and click "Run"\n');
  }
}

runMigration();
