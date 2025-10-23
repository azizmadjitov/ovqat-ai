-- ============================================
-- Reset all database tables for fresh testing
-- ============================================
-- Run this script in Supabase SQL Editor to clear all user data
-- and start with a clean slate for testing.

-- Step 1: Delete child records first (respecting foreign key constraints)
-- Delete all meals (references user_id)
DELETE FROM user_meals;

-- Delete all user goals (references user_id)
DELETE FROM user_goals;

-- Delete all user profiles (references user_id)
DELETE FROM user_profiles;

-- Step 2: Delete parent records
-- Delete all users
DELETE FROM users;

-- Step 3: Reset sequences (if any exist)
ALTER SEQUENCE IF EXISTS user_meals_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS user_profiles_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS user_goals_id_seq RESTART WITH 1;

-- Step 4: Verify deletion (should show 0 rows for all tables)
SELECT 'user_meals' as table_name, COUNT(*) as row_count FROM user_meals
UNION ALL
SELECT 'user_goals', COUNT(*) FROM user_goals
UNION ALL
SELECT 'user_profiles', COUNT(*) FROM user_profiles
UNION ALL
SELECT 'users', COUNT(*) FROM users
ORDER BY table_name;

-- Expected output: All counts should be 0
