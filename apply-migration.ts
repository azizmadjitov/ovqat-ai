import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const SUPABASE_URL = 'https://djnbuvumslqlpvdyjnrt.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY environment variable is required');
  console.log('Please run: export SUPABASE_SERVICE_KEY=your_service_role_key');
  console.log('Get your service role key from: https://app.supabase.com/project/djnbuvumslqlpvdyjnrt/settings/api');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigration() {
  console.log('🚀 Applying database migration...\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '001_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Split into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error.message);
        console.error('Statement:', statement.substring(0, 100) + '...');
        throw error;
      }
    }

    console.log('\n✅ Migration applied successfully!');
    console.log('\nCreated tables:');
    console.log('  - users');
    console.log('  - user_profiles');
    console.log('  - user_goals');
    console.log('\nRLS policies enabled and configured.');

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n💡 Alternative: Copy the SQL from supabase/migrations/001_initial_schema.sql');
    console.log('   and run it manually in the Supabase SQL Editor:');
    console.log('   https://app.supabase.com/project/djnbuvumslqlpvdyjnrt/editor/sql');
    process.exit(1);
  }
}

applyMigration();
