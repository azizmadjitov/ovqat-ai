# Rebuild Backend from Scratch

## Step 1: Verify Your New Supabase Project

Make sure you have created a new Supabase project:
1. Go to https://app.supabase.com/
2. Create a new project with a unique name
3. Wait for the project to be fully provisioned

## Step 2: Get Your Project Credentials

From your new Supabase project dashboard:
1. Go to Project Settings → API
2. Copy your:
   - Project URL (starts with https://)
   - anon key (public key)

## Step 3: Update Environment Variables

Edit your `.env` file with the new credentials:
```
VITE_SUPABASE_URL=your_new_project_url_here
VITE_SUPABASE_ANON_KEY=your_new_anon_key_here
VITE_OPENAI_API_KEY=your_openai_api_key
```

## Step 4: Enable Anonymous Sign-ins

In your Supabase dashboard:
1. Go to Authentication → Settings
2. Toggle "Enable Anonymous Sign-ins" to ON

## Step 5: Apply Migrations in Order

Run these migrations in your new Supabase SQL Editor:

### Migration 1: Initial Schema
Run [supabase/migrations/001_initial_schema.sql](file:///Users/azizmadjitov/qoder/ovqat-ai/supabase/migrations/001_initial_schema.sql)

This creates:
- users table (with phone as unique identifier)
- user_profiles table (questionnaire data)
- user_goals table (nutrition goals)
- RLS policies for data security
- Indexes for performance
- Timestamp update functions

### Migration 2: Security Fixes
Run [supabase/migrations/002_security_fixes.sql](file:///Users/azizmadjitov/qoder/ovqat-ai/supabase/migrations/002_security_fixes.sql)

This applies:
- Enhanced security policies
- Secure phone checking function
- Proper access controls

### Migration 3: Function Improvements
Run [supabase/migrations/003_fix_function_search_path.sql](file:///Users/azizmadjitov/qoder/ovqat-ai/supabase/migrations/003_fix_function_search_path.sql)

This enhances:
- Phone number checking to handle multiple formats
- Secure function execution paths
- Better error handling

## Step 6: Verify Backend Setup

After running all migrations, verify your setup:

1. Check that all three tables exist in Table Editor:
   - users
   - user_profiles
   - user_goals

2. Verify the check_phone_exists function works:
   ```sql
   SELECT check_phone_exists('+998997961877');
   ```

## Step 7: Test Your Application

Start your development server:
```bash
cd /Users/azizmadjitov/qoder/ovqat-ai
npm run dev
```

Test the authentication flow:
1. Open http://localhost:3000
2. Enter your phone number
3. Complete the questionnaire
4. Log out
5. Log back in with the same phone number
6. You should be directed to your existing profile

## Why This Fresh Setup Works

1. **Clean Database**: No existing data conflicts
2. **Fixed Functions**: Enhanced phone number checking handles multiple formats
3. **Proper RLS**: Security policies are correctly configured from the start
4. **Consistent Formatting**: All new users will have properly formatted phone numbers
5. **No Duplicates**: The system correctly identifies existing users by phone number

## Expected Behavior

After this fresh setup:
- ✅ First login: Creates new user and prompts for questionnaire
- ✅ Subsequent logins: Recognizes existing user and skips questionnaire
- ✅ No duplicate users: Phone number is the unique identifier
- ✅ No "User not found" errors: Proper user identification
- ✅ Secure data access: RLS policies protect user data

## Troubleshooting

If you encounter issues:

1. **Check environment variables** - Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are correct
2. **Verify anonymous sign-ins** - Make sure they're enabled in Supabase Auth settings
3. **Check browser console** - Look for any error messages
4. **Verify all migrations ran** - Ensure all three migration files were executed successfully