-- ============================================
-- Fix RLS policies for user_meals table
-- ============================================
-- Problem: Policies were applied to 'public' instead of 'authenticated'
-- Solution: Recreate policies with correct role

-- Step 1: Drop existing incorrect policies
DROP POLICY IF EXISTS "Users can view their own meals" ON user_meals;
DROP POLICY IF EXISTS "Users can insert their own meals" ON user_meals;
DROP POLICY IF EXISTS "Users can delete their own meals" ON user_meals;

-- Step 2: Create correct policies for authenticated users
CREATE POLICY "Users can view their own meals" ON user_meals
  FOR SELECT 
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own meals" ON user_meals
  FOR INSERT 
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own meals" ON user_meals
  FOR DELETE 
  TO authenticated
  USING (user_id = auth.uid());

-- Step 3: Verify policies are created correctly
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_meals'
ORDER BY policyname;
