#!/usr/bin/env node

/**
 * Apply All Migrations Script for Ovqat AI
 * This script applies all database migrations to Supabase
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? 'SET' : 'NOT SET');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please check your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applyAllMigrations() {
  console.log('🚀 Starting database migration application...\n');

  try {
    // Get all migration files in order
    const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`📝 Found ${migrationFiles.length} migration files:`);
    migrationFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file}`);
    });
    
    console.log('\n📋 IMPORTANT: You need to apply these migrations manually in the Supabase SQL Editor:');
    console.log('   https://app.supabase.com/project/_/sql/new\n');
    
    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationsDir, file);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
      
      console.log(`\n📄 ${file}:`);
      console.log('==============================================');
      console.log(migrationSQL);
      console.log('==============================================\n');
    }
    
    console.log('📋 INSTRUCTIONS:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to SQL Editor (https://app.supabase.com/project/_/sql/new)');
    console.log('3. Copy and run each migration file IN ORDER (001, 002, 003, 004)');
    console.log('4. After applying all migrations, test the application\n');
    
    console.log('💡 TIP: Use the copy-migration.sh script to copy all migrations to clipboard');
    console.log('   Run: ./copy-migration.sh\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

applyAllMigrations();