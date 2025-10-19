-- COMPLETE DATABASE RESET SCRIPT
-- This script will completely reset the database and recreate all tables from scratch

-- Disable RLS temporarily
ALTER TABLE IF EXISTS user_goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;

-- Drop tables in correct order (due to foreign key constraints)
DROP TABLE IF EXISTS user_goals CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS check_phone_exists(TEXT);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Recreate the complete schema from scratch
-- =====================================================
-- Ovqat AI Database Schema
-- =====================================================

-- =====================================================
-- Table: users
-- =====================================================
-- Main users table linked to Supabase Auth
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT UNIQUE NOT NULL,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Table: user_profiles
-- =====================================================
-- Stores user questionnaire data and profile information
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  birth_year INTEGER NOT NULL CHECK (birth_year >= 1900 AND birth_year <= 2020),
  weight_kg NUMERIC NOT NULL CHECK (weight_kg >= 30 AND weight_kg <= 300),
  height_cm INTEGER NOT NULL CHECK (height_cm >= 120 AND height_cm <= 220),
  workout_freq TEXT NOT NULL CHECK (workout_freq IN ('rarely', 'regularly', 'very_active')),
  activity_level TEXT NOT NULL CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'very_active')),
  primary_goal TEXT NOT NULL CHECK (primary_goal IN ('lose', 'maintain', 'gain')),
  diet_type TEXT NOT NULL CHECK (diet_type IN ('balanced', 'pescetarian', 'vegetarian', 'vegan')),
  bmi NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Table: user_goals
-- =====================================================
-- Stores calculated nutrition goals for users
CREATE TABLE user_goals (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  goal_calories INTEGER NOT NULL CHECK (goal_calories > 0),
  goal_protein_g INTEGER NOT NULL CHECK (goal_protein_g > 0),
  goal_fat_g INTEGER NOT NULL CHECK (goal_fat_g > 0),
  goal_carbs_g INTEGER NOT NULL CHECK (goal_carbs_g > 0),
  bmr INTEGER NOT NULL CHECK (bmr > 0),
  tdee INTEGER NOT NULL CHECK (tdee > 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Policies for 'users' table
-- =====================================================

-- Users can view their own data
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own data
CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can delete their own data
CREATE POLICY "Users can delete own data"
  ON users FOR DELETE
  USING (auth.uid() = id);

-- =====================================================
-- Policies for 'user_profiles' table
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile"
  ON user_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Policies for 'user_goals' table
-- =====================================================

-- Users can view their own goals
CREATE POLICY "Users can view own goals"
  ON user_goals FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own goals
CREATE POLICY "Users can insert own goals"
  ON user_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own goals
CREATE POLICY "Users can update own goals"
  ON user_goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own goals
CREATE POLICY "Users can delete own goals"
  ON user_goals FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Indexes for better performance
-- =====================================================

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_onboarding ON users(onboarding_completed);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_goals_user_id ON user_goals(user_id);

-- =====================================================
-- Functions for automatic timestamp updates
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- Triggers to auto-update timestamps
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_goals_updated_at
    BEFORE UPDATE ON user_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Secure phone number checking function
-- =====================================================

CREATE OR REPLACE FUNCTION check_phone_exists(phone_text TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- Execute with privileges of function creator
SET search_path = public, pg_temp
AS $$
DECLARE
    clean_phone TEXT;
BEGIN
    -- Clean the phone number by removing all non-digit characters and adding + prefix
    clean_phone := '+' || regexp_replace(phone_text, '[^0-9]', '', 'g');
    
    -- Check for exact match first
    IF EXISTS (SELECT 1 FROM public.users WHERE phone = clean_phone) THEN
        RETURN TRUE;
    END IF;
    
    -- Check for alternative formats
    IF EXISTS (SELECT 1 FROM public.users WHERE phone = regexp_replace(phone_text, '[^0-9]', '', 'g')) THEN
        RETURN TRUE;
    END IF;
    
    -- Check for phone with spaces or other formatting
    IF EXISTS (SELECT 1 FROM public.users WHERE phone = phone_text) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$;

-- Grant execute permission on the phone check function to anon role
GRANT EXECUTE ON FUNCTION check_phone_exists(TEXT) TO anon;

-- =====================================================
-- Grant permissions
-- =====================================================

-- Grant usage on schema to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant specific permissions needed for anonymous users
GRANT EXECUTE ON FUNCTION check_phone_exists(TEXT) TO anon;

-- =====================================================
-- Success message
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Ovqat AI database reset and recreated successfully!';
    RAISE NOTICE '✅ Tables created: users, user_profiles, user_goals';
    RAISE NOTICE '✅ RLS policies enabled and configured';
    RAISE NOTICE '✅ Functions and triggers created';
    RAISE NOTICE '✅ Ready for testing!';
END $$;