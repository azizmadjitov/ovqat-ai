#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://djnbuvumslqlpvdyjnrt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqbmJ1dnVtc2xxbHB2ZHlqbnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMTUzMDQsImV4cCI6MjA3NTc5MTMwNH0.ZTYpM22Am6pZZ731acNjGrR0C1oJQTfH4NQgRASeWk8';

console.log('📋 Migration Instructions\n');
console.log('To apply the database migration, follow these steps:\n');
console.log('1. Open Supabase SQL Editor:');
console.log('   https://app.supabase.com/project/djnbuvumslqlpvdyjnrt/sql/new\n');
console.log('2. Copy the entire SQL from: supabase/migrations/001_initial_schema.sql\n');
console.log('3. Paste it into the SQL Editor\n');
console.log('4. Click the "Run" button\n');
console.log('✅ This will create:');
console.log('   - users table (with phone and onboarding_completed)');
console.log('   - user_profiles table (questionnaire data)');
console.log('   - user_goals table (BMR, TDEE, macros)');
console.log('   - RLS policies for security\n');
console.log('💡 The migration SQL file is ready at:');
console.log('   ' + path.join(__dirname, 'supabase', 'migrations', '001_initial_schema.sql'));
console.log('\n🚀 After applying the migration, you can test the app!\n');
