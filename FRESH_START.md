# Fresh Start with New Supabase Project

Since you want to completely start over, here's exactly what you need to do:

## Step 1: Create New Supabase Project

1. Go to https://app.supabase.com/
2. Click "New Project"
3. Choose a name for your project
4. Select your region
5. Set a database password
6. Click "Create New Project"

Wait for the project to be created (this may take a few minutes).

## Step 2: Get Your Project Credentials

Once your project is ready:

1. Go to Project Settings → API
2. Copy your:
   - Project URL (starts with https://)
   - anon key (public key)
   - service_role key (secret key)

## Step 3: Update Your Environment Variables

In your project, update the `.env` file with your new credentials:

```
VITE_SUPABASE_URL=your_new_project_url_here
VITE_SUPABASE_ANON_KEY=your_new_anon_key_here
VITE_OPENAI_API_KEY=your_openai_api_key
```

## Step 4: Enable Anonymous Sign-ins

1. Go to Authentication → Settings
2. Find "Enable Anonymous Sign-ins"
3. Toggle it to ON

## Step 5: Apply Database Schema

1. Go to SQL Editor in your new Supabase project
2. Copy the contents of `/Users/azizmadjitov/qoder/ovqat-ai/supabase/migrations/001_initial_schema.sql`
3. Paste it into the SQL editor
4. Click "Run"

## Step 6: Apply Security Fixes

1. In the same SQL Editor
2. Copy the contents of `/Users/azizmadjitov/qoder/ovqat-ai/supabase/migrations/002_security_fixes.sql`
3. Paste and run it

## Step 7: Apply Function Fixes

1. In the same SQL Editor
2. Copy the contents of `/Users/azizmadjitov/qoder/ovqat-ai/supabase/migrations/003_fix_function_search_path.sql`
3. Paste and run it

## Step 8: Test Your Setup

1. Restart your development server:
   ```bash
   cd /Users/azizmadjitov/qoder/ovqat-ai
   npm run dev
   ```

2. Open http://localhost:3000 in your browser
3. Try registering with your phone number
4. Complete the questionnaire
5. Log out and log back in with the same number
6. You should be directed to your existing profile

This approach gives you a completely fresh start with no data conflicts or duplicate user issues.