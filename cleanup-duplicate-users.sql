-- Run this SQL in your Supabase SQL editor to clean up duplicate users
-- This will keep the most recently created user for each phone number

-- First, let's see what duplicates we have
SELECT phone, COUNT(*) as count
FROM users
WHERE phone IS NOT NULL
GROUP BY phone
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Create a temporary table with the user IDs we want to keep (most recent for each phone)
CREATE TEMP TABLE users_to_keep AS
SELECT DISTINCT ON (phone) id, phone
FROM users
WHERE phone IS NOT NULL
ORDER BY phone, created_at DESC;

-- Delete duplicate user_profiles
DELETE FROM user_profiles
WHERE user_id NOT IN (SELECT id FROM users_to_keep)
AND user_id IN (SELECT id FROM users WHERE phone IN (SELECT phone FROM users_to_keep));

-- Delete duplicate user_goals
DELETE FROM user_goals
WHERE user_id NOT IN (SELECT id FROM users_to_keep)
AND user_id IN (SELECT id FROM users WHERE phone IN (SELECT phone FROM users_to_keep));

-- Delete duplicate users
DELETE FROM users
WHERE id NOT IN (SELECT id FROM users_to_keep)
AND phone IN (SELECT phone FROM users_to_keep);

-- Drop the temporary table
DROP TABLE users_to_keep;

-- Verify the cleanup
SELECT phone, COUNT(*) as count
FROM users
WHERE phone IS NOT NULL
GROUP BY phone
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- If the above query returns no results, then cleanup was successful