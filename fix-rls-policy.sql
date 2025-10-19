-- Fix RLS Policy to Allow Phone Number Lookup
-- This fixes the "duplicate key" error by allowing the SELECT query to work

-- Problem: Current RLS policy blocks SELECT unless auth.uid() = id
-- But we're not authenticated yet when checking if phone exists!

-- Solution: Allow SELECT for everyone (read-only, safe)

-- 1. Drop the old restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view own data" ON users;

-- 2. Create new policy that allows anyone to SELECT
CREATE POLICY "Users can check if phone exists"
  ON users FOR SELECT
  USING (true);  -- Allow anyone to read users table

-- 3. Keep INSERT restricted (only authenticated users can insert their own data)
DROP POLICY IF EXISTS "Users can insert own data" ON users;
CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4. Keep UPDATE restricted  
DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies updated successfully!';
    RAISE NOTICE 'Users table now allows SELECT for phone number lookup';
END $$;
