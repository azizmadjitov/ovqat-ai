-- Reset all database tables for fresh testing

-- Delete all meals
DELETE FROM user_meals;

-- Delete all user goals
DELETE FROM user_goals;

-- Delete all user profiles
DELETE FROM user_profiles;

-- Reset sequences (if any)
ALTER SEQUENCE IF EXISTS user_meals_id_seq RESTART WITH 1;

-- Verify deletion
SELECT 'user_meals' as table_name, COUNT(*) as row_count FROM user_meals
UNION ALL
SELECT 'user_goals', COUNT(*) FROM user_goals
UNION ALL
SELECT 'user_profiles', COUNT(*) FROM user_profiles;
