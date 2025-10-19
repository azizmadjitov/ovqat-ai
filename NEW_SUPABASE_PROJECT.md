# Creating a New Supabase Project - Simple Steps

## 1. Create New Project
1. Go to https://app.supabase.com/
2. Click "New Project"
3. Name it "Ovqat-AI" (or any name you prefer)
4. Select your region
5. Set a strong password
6. Click "Create New Project"

## 2. Get API Credentials
Once created, go to Project Settings → API:
- Copy "Project URL"
- Copy "anon public" key

## 3. Update Your Environment
Edit your `.env` file:
```
VITE_SUPABASE_URL=your_new_project_url
VITE_SUPABASE_ANON_KEY=your_new_anon_key
VITE_OPENAI_API_KEY=your_openai_key
```

## 4. Enable Anonymous Sign-ins
Go to Authentication → Settings:
- Toggle "Enable Anonymous Sign-ins" to ON

## 5. Apply Migrations in Order
Run these files in your new Supabase SQL Editor:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_security_fixes.sql`
3. `supabase/migrations/003_fix_function_search_path.sql`

## 6. Test
```bash
npm run dev
```

This gives you a completely clean start with no duplicate user issues.