-- Add OAuth support to user_profiles table
-- This migration adds OAuth-related fields to support Google/Apple authentication

-- Add new columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS provider TEXT CHECK (provider IN ('google', 'apple')),
ADD COLUMN IF NOT EXISTS questionnaire_completed BOOLEAN DEFAULT FALSE;

-- Update existing RLS policies to work with the new schema
-- We need to modify the policies to allow access based on auth.uid()

-- First, drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Create new policies that work with both phone and OAuth users
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_provider ON user_profiles(provider);

-- Update the users table to make phone optional (for OAuth users)
ALTER TABLE users 
ALTER COLUMN phone DROP NOT NULL;

-- Update RLS policies for users table to accommodate OAuth users
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add a function to handle user profile upsert for OAuth
CREATE OR REPLACE FUNCTION upsert_user_profile(
  p_user_id UUID,
  p_email TEXT DEFAULT NULL,
  p_full_name TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL,
  p_provider TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_profiles (user_id, email, full_name, avatar_url, provider, questionnaire_completed)
  VALUES (p_user_id, p_email, p_full_name, p_avatar_url, p_provider, FALSE)
  ON CONFLICT (user_id) 
  DO UPDATE SET
    email = COALESCE(EXCLUDED.email, user_profiles.email),
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
    provider = COALESCE(EXCLUDED.provider, user_profiles.provider),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION upsert_user_profile TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ OAuth support added successfully!';
    RAISE NOTICE 'Added email, full_name, avatar_url, provider, and questionnaire_completed columns to user_profiles';
    RAISE NOTICE 'Made phone column optional in users table';
    RAISE NOTICE 'Created upsert_user_profile function for OAuth user handling';
END $$;