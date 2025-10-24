-- ============================================
-- Fix RLS policies for user_meals table (v2)
-- ============================================
-- More aggressive approach: disable RLS, drop all policies, recreate

-- Step 1: Disable RLS temporarily
ALTER TABLE user_meals DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL policies (including any hidden ones)
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_meals'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_meals', pol.policyname);
    END LOOP;
END $$;

-- Step 3: Re-enable RLS
ALTER TABLE user_meals ENABLE ROW LEVEL SECURITY;

-- Step 4: Create correct policies for authenticated users ONLY
CREATE POLICY "Users can view their own meals" 
ON user_meals
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own meals" 
ON user_meals
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own meals" 
ON user_meals
FOR DELETE 
TO authenticated
USING (user_id = auth.uid());

-- Step 5: Verify policies are created correctly
SELECT 
  tablename,
  policyname,
  roles,
  cmd,
  CASE 
    WHEN roles = '{authenticated}' THEN '✅ CORRECT'
    ELSE '❌ WRONG - Should be authenticated, not ' || roles::text
  END as status
FROM pg_policies
WHERE tablename = 'user_meals'
ORDER BY policyname;
