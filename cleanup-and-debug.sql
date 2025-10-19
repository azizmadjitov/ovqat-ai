-- Debug and cleanup script for Ovqat AI database

-- 1. Check if tables exist
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'users'
) as users_table_exists;

SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
) as user_profiles_table_exists;

SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_goals'
) as user_goals_table_exists;

-- 2. Show all users (to see what's in the database)
SELECT id, phone, onboarding_completed, created_at 
FROM users 
ORDER BY created_at DESC;

-- 3. Delete all test users (OPTIONAL - uncomment if you want to clean up)
-- DELETE FROM user_goals;
-- DELETE FROM user_profiles;
-- DELETE FROM users;

-- 4. Show unique constraint on users table
SELECT con.conname as constraint_name,
       con.contype as constraint_type,
       att.attname as column_name
FROM pg_constraint con
JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
WHERE con.conrelid = 'users'::regclass
  AND con.contype = 'u';  -- unique constraints

-- 5. Alternative: If you want to make phone non-unique (NOT RECOMMENDED)
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_key;
-- ALTER TABLE users ADD CONSTRAINT users_phone_unique UNIQUE (phone);
