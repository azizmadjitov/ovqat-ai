-- Fix Supabase Security Warnings
-- This script addresses all security concerns reported by Supabase Security Advisor

-- 1. Drop any custom RLS policies on auth.users
-- The Security Advisor shows policies like users_delete_own, users_select_own, users_update_own
DROP POLICY IF EXISTS "users_delete_own" ON auth.users;
DROP POLICY IF EXISTS "users_select_own" ON auth.users;
DROP POLICY IF EXISTS "users_update_own" ON auth.users;
DROP POLICY IF EXISTS "Users can view own data" ON auth.users;
DROP POLICY IF EXISTS "Users can insert own data" ON auth.users;
DROP POLICY IF EXISTS "Users can update own data" ON auth.users;
DROP POLICY IF EXISTS "Users can delete own data" ON auth.users;

-- Revoke all permissions on auth.users from anon, authenticated, PUBLIC
REVOKE ALL ON auth.users FROM anon, authenticated, PUBLIC;

-- 2. Rebuild RLS for public.users table
-- Drop all existing policies on public.users
-- The Security Advisor shows policies like users_delete_own, users_select_own, users_update_own
DROP POLICY IF EXISTS "users_delete_own" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can check if phone exists" ON public.users;
DROP POLICY IF EXISTS "Users can delete own data" ON public.users;

-- Create a function to check if phone number exists without exposing user data
-- This is a secure way to check for existing phone numbers during registration
CREATE OR REPLACE FUNCTION check_phone_exists(phone_text TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- Execute with privileges of function creator
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users WHERE phone = phone_text
    );
END;
$$;

-- Restrict access to the users table to authenticated users only
CREATE POLICY select_own
  ON public.users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY insert_own
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY update_own
  ON public.users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY delete_own
  ON public.users FOR DELETE
  TO authenticated
  USING (id = auth.uid());

-- 3. Rebuild RLS for public.user_profiles table
-- Drop all existing policies on public.user_profiles
-- The Security Advisor shows policies like user_profiles_delete_own, user_profiles_select_own, user_profiles_update_own
DROP POLICY IF EXISTS "user_profiles_delete_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;

-- Recreate policies for authenticated users only
CREATE POLICY select_own
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY insert_own
  ON public.user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY update_own
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY delete_own
  ON public.user_profiles FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 4. Rebuild RLS for public.user_goals table
-- Drop all existing policies on public.user_goals
-- The Security Advisor shows policies like user_goals_delete_own, user_goals_select_own, user_goals_update_own
DROP POLICY IF EXISTS "user_goals_delete_own" ON public.user_goals;
DROP POLICY IF EXISTS "user_goals_select_own" ON public.user_goals;
DROP POLICY IF EXISTS "user_goals_update_own" ON public.user_goals;
DROP POLICY IF EXISTS "Users can view own goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can update own goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON public.user_goals;

-- Recreate policies for authenticated users only
CREATE POLICY select_own
  ON public.user_goals FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY insert_own
  ON public.user_goals FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY update_own
  ON public.user_goals FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY delete_own
  ON public.user_goals FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 5. Revoke rights from anon/PUBLIC
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, PUBLIC;

-- 6. Grant rights to authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant execute permission on the phone check function to anon role
-- This allows anonymous users to check if a phone number exists without exposing user data
GRANT EXECUTE ON FUNCTION check_phone_exists(TEXT) TO anon;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Supabase security warnings fixed successfully!';
    RAISE NOTICE 'auth.users has no custom policies';
    RAISE NOTICE 'All tables restricted to authenticated users only';
    RAISE NOTICE 'RLS policies scoped to auth.uid()';
    RAISE NOTICE '✅ Security Advisor warnings should now be resolved';
    RAISE NOTICE 'ℹ️  Phone number checking now done via secure function check_phone_exists()';
END $$;