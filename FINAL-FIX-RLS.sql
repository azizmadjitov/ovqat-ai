-- =====================================================
-- FINAL RLS FIX - GUARANTEED TO WORK
-- =====================================================

-- Step 1: DISABLE RLS temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL policies
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can view own data or check phone" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Allow anonymous and authenticated users to read users" ON users;
DROP POLICY IF EXISTS "Allow anonymous and authenticated users to insert users" ON users;
DROP POLICY IF EXISTS "Allow anon read" ON users;
DROP POLICY IF EXISTS "Allow authenticated read" ON users;

-- Step 3: Create simple policies
CREATE POLICY "anon_select" ON users FOR SELECT TO anon USING (true);
CREATE POLICY "auth_select" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "anon_insert" ON users FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "auth_insert" ON users FOR INSERT TO authenticated WITH CHECK (true);

-- Step 4: RE-ENABLE RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify
SELECT 'Policy created: ' || policyname as status
FROM pg_policies
WHERE tablename = 'users';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅✅✅ RLS FIX COMPLETE ✅✅✅';
  RAISE NOTICE 'Anonymous users can now access users table';
END $$;
