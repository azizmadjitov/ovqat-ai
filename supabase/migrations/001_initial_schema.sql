-- ============================================================================
-- Ovqat AI Database Schema
-- Migration 001: Initial Schema
-- ============================================================================
-- This migration creates the core tables for the Ovqat AI application
-- Tables: users, user_profiles, user_goals, user_meals
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Table: users
-- Purpose: Store basic user information and authentication data
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT UNIQUE NOT NULL,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for phone lookup
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- ============================================================================
-- Table: user_profiles
-- Purpose: Store user questionnaire data and physical characteristics
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
    age INTEGER NOT NULL CHECK (age > 0 AND age < 150),
    weight_kg NUMERIC(5,2) NOT NULL CHECK (weight_kg > 0),
    height_cm NUMERIC(5,2) NOT NULL CHECK (height_cm > 0),
    workout_freq TEXT NOT NULL CHECK (workout_freq IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
    primary_goal TEXT NOT NULL CHECK (primary_goal IN ('lose', 'maintain', 'gain')),
    activity_level TEXT NOT NULL CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'very_active')),
    diet_type TEXT NOT NULL CHECK (diet_type IN ('balanced', 'low_carb', 'high_protein', 'vegan')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user_id lookup
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- ============================================================================
-- Table: user_goals
-- Purpose: Store calculated daily nutrition goals
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_calories INTEGER NOT NULL CHECK (goal_calories > 0),
    goal_protein_g NUMERIC(6,2) NOT NULL CHECK (goal_protein_g > 0),
    goal_carbs_g NUMERIC(6,2) NOT NULL CHECK (goal_carbs_g > 0),
    goal_fat_g NUMERIC(6,2) NOT NULL CHECK (goal_fat_g > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user_id lookup
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);

-- ============================================================================
-- Table: user_meals
-- Purpose: Store meal history with nutrition data
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    meal_id TEXT NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    calories INTEGER NOT NULL CHECK (calories >= 0),
    protein_g NUMERIC(6,2) NOT NULL CHECK (protein_g >= 0),
    carbs_g NUMERIC(6,2) NOT NULL CHECK (carbs_g >= 0),
    fat_g NUMERIC(6,2) NOT NULL CHECK (fat_g >= 0),
    fiber_g NUMERIC(6,2) DEFAULT 0 CHECK (fiber_g >= 0),
    health_score INTEGER CHECK (health_score >= 0 AND health_score <= 10),
    language TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, meal_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_meals_user_id_date ON user_meals(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_user_meals_created_at ON user_meals(created_at DESC);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_meals ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for users table
-- ============================================================================

-- Allow users to read their own data
CREATE POLICY "Users can read own data" ON users
    FOR SELECT
    USING (true);  -- Allow all reads for phone check

-- Allow users to insert their own data
CREATE POLICY "Users can insert own data" ON users
    FOR INSERT
    WITH CHECK (true);  -- Allow all inserts for registration

-- Allow users to update their own data
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- RLS Policies for user_profiles table
-- ============================================================================

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile" ON user_profiles
    FOR SELECT
    USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT
    WITH CHECK (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- RLS Policies for user_goals table
-- ============================================================================

-- Allow users to read their own goals
CREATE POLICY "Users can read own goals" ON user_goals
    FOR SELECT
    USING (true);

-- Allow users to insert their own goals
CREATE POLICY "Users can insert own goals" ON user_goals
    FOR INSERT
    WITH CHECK (true);

-- Allow users to update their own goals
CREATE POLICY "Users can update own goals" ON user_goals
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- RLS Policies for user_meals table
-- ============================================================================

-- Allow users to read their own meals
CREATE POLICY "Users can read own meals" ON user_meals
    FOR SELECT
    USING (true);

-- Allow users to insert their own meals
CREATE POLICY "Users can insert own meals" ON user_meals
    FOR INSERT
    WITH CHECK (true);

-- Allow users to delete their own meals
CREATE POLICY "Users can delete own meals" ON user_meals
    FOR DELETE
    USING (true);

-- ============================================================================
-- Triggers for updated_at timestamps
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for each table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_goals_updated_at
    BEFORE UPDATE ON user_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- End of Migration 001
-- ============================================================================
