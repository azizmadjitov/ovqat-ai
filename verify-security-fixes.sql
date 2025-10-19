-- Verify Supabase Security Fixes
-- This script checks if the security fixes have been applied correctly

-- Check policies on auth.users (should be empty)
SELECT tablename, policyname, roles, permissive, cmd 
FROM pg_policy pol
JOIN pg_class pc ON pc.oid = pol.polrelid
WHERE pc.relname = 'users' AND pc.relnamespace = 'auth'::regnamespace;

-- Check policies on public.users (should only have select_own, insert_own, update_own, delete_own for authenticated role)
SELECT tablename, policyname, roles, permissive, cmd 
FROM pg_policy pol
JOIN pg_class pc ON pc.oid = pol.polrelid
WHERE pc.relname = 'users' AND pc.relnamespace = 'public'::regnamespace;

-- Check policies on public.user_profiles (should only have select_own, insert_own, update_own, delete_own for authenticated role)
SELECT tablename, policyname, roles, permissive, cmd 
FROM pg_policy pol
JOIN pg_class pc ON pc.oid = pol.polrelid
WHERE pc.relname = 'user_profiles' AND pc.relnamespace = 'public'::regnamespace;

-- Check policies on public.user_goals (should only have select_own, insert_own, update_own, delete_own for authenticated role)
SELECT tablename, policyname, roles, permissive, cmd 
FROM pg_policy pol
JOIN pg_class pc ON pc.oid = pol.polrelid
WHERE pc.relname = 'user_goals' AND pc.relnamespace = 'public'::regnamespace;

-- Check if check_phone_exists function exists and has secure search_path
SELECT proname, probin, prosecdef, proconfig
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE proname = 'check_phone_exists' AND n.nspname = 'public';

-- Check if update_updated_at_column function exists and has secure search_path
SELECT proname, probin, prosecdef, proconfig
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE proname = 'update_updated_at_column' AND n.nspname = 'public';

-- Check table permissions for anon role (should be minimal)
SELECT grantee, table_schema, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'anon' AND table_schema = 'public';

-- Check if leaked password protection is enabled (this would need to be checked in the dashboard)
DO $$
BEGIN
    RAISE NOTICE '✅ Manual check required: Leaked Password Protection should be enabled in Supabase Dashboard';
    RAISE NOTICE '   Go to: Authentication → Settings → Leaked Password Protection → Enable';
    
    -- Verify that the function works
    RAISE NOTICE '✅ Verifying check_phone_exists function exists...';
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE proname = 'check_phone_exists' AND n.nspname = 'public'
    ) THEN
        RAISE NOTICE '✅ Function check_phone_exists exists';
    ELSE
        RAISE NOTICE '❌ Function check_phone_exists does not exist';
    END IF;
    
    -- Verify policies on public.users
    RAISE NOTICE '✅ Verifying RLS policies on public.users...';
    IF EXISTS (
        SELECT 1 FROM pg_policy pol
        JOIN pg_class pc ON pc.oid = pol.polrelid
        WHERE pc.relname = 'users' AND pc.relnamespace = 'public'::regnamespace
        AND pol.policyname IN ('select_own', 'insert_own', 'update_own', 'delete_own')
    ) THEN
        RAISE NOTICE '✅ RLS policies exist on public.users';
    ELSE
        RAISE NOTICE '❌ RLS policies missing on public.users';
    END IF;
    
    -- Verify functions have secure search paths
    RAISE NOTICE '✅ Verifying functions have secure search paths...';
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE proname IN ('check_phone_exists', 'update_updated_at_column') 
        AND n.nspname = 'public'
        AND p.proconfig IS NOT NULL
        AND ARRAY['search_path=public, pg_temp'] && p.proconfig
    ) THEN
        RAISE NOTICE '✅ Functions have secure search paths';
    ELSE
        RAISE NOTICE '⚠️  Some functions may not have secure search paths';
    END IF;
END $$;