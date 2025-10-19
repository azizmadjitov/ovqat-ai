# Complete Database Reset Guide

This guide will help you completely reset your Supabase database and set it up from scratch to fix the duplicate user issue.

## ⚠️ WARNING

**This will delete ALL data in your database!** Make sure you have backups if there's any data you want to keep.

## Steps to Reset Database

### Step 1: Run the Reset Script

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor: https://app.supabase.com/project/_/sql
3. Copy the entire contents of [reset-database.sql](file:///Users/azizmadjitov/qoder/ovqat-ai/reset-database.sql)
4. Paste it into the SQL editor
5. Click "Run" to execute the script

### Step 2: Verify the Reset

After running the script, you should see success messages like:
```
NOTICE:  ✅ Ovqat AI database reset and recreated successfully!
NOTICE:  ✅ Tables created: users, user_profiles, user_goals
NOTICE:  ✅ RLS policies enabled and configured
NOTICE:  ✅ Functions and triggers created
NOTICE:  ✅ Ready for testing!
```

### Step 3: Test the Setup

1. Restart your development server:
   ```bash
   cd /Users/azizmadjitov/qoder/ovqat-ai
   npm run dev
   ```

2. Open your app in the browser: http://localhost:3000

3. Try registering with your phone number:
   - Enter your phone number in the format: 🇺🇿 +998 XX XXX XX XX
   - Complete the questionnaire
   - Log out
   - Try logging in again with the same phone number
   - You should be directed to your existing profile without creating a duplicate

### Step 4: Verify in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to Table Editor
3. Check the [users](file:///Users/azizmadjitov/qoder/ovqat-ai/supabase/migrations/001_initial_schema.sql#L11-L17) table
4. Verify that only one user record exists for your phone number

## Troubleshooting

### If the Reset Script Fails

If you get errors when running the reset script:

1. Try running it in smaller chunks:
   - First run the DROP statements
   - Then run the CREATE TABLE statements
   - Finally run the policies, functions, and indexes

2. Make sure no other connections are using the database tables

### If Authentication Still Doesn't Work

1. Check that your environment variables are correct in `.env`:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. Verify that anonymous sign-ins are enabled in your Supabase Auth settings:
   - Go to Authentication → Settings
   - Make sure "Enable Anonymous Sign-ins" is turned ON

## Expected Behavior After Reset

After resetting the database:

1. **First login**: User enters phone number → New user created → Questionnaire completed
2. **Subsequent logins**: Same phone number → Existing user found → Directed to main screen
3. **No duplicates**: Only one user record per phone number in the database
4. **No "User not found" errors**: Phone number checking works correctly

## Need Help?

If you're still experiencing issues after the reset:

1. Check the browser console for error messages
2. Check the Supabase logs in the dashboard
3. Verify that all environment variables are correctly set
4. Make sure you're using the latest code from the repository

The reset should completely resolve the duplicate user issue by starting with a clean, properly configured database.