-- Fix Cross-Device Authentication Issues
-- This script addresses the cross-device login issues by modifying the approach to user authentication

-- Add a phone index if it doesn't exist (should already exist from 001_initial_schema)
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Create a function to get user data by phone number without updating the auth ID
-- This allows multiple anonymous sessions to access the same user profile
CREATE OR REPLACE FUNCTION get_user_by_phone(phone_text TEXT)
RETURNS TABLE(
    id UUID,
    phone TEXT,
    onboarding_completed BOOLEAN,
    created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY 
    SELECT u.id, u.phone, u.onboarding_completed, u.created_at
    FROM public.users u
    WHERE u.phone = phone_text
    LIMIT 1;
END;
$$;

-- Grant execute permission on the new function to anon role
GRANT EXECUTE ON FUNCTION get_user_by_phone(TEXT) TO anon;

-- Update the check_phone_exists function to be more robust
CREATE OR REPLACE FUNCTION check_phone_exists(phone_text TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    clean_phone TEXT;
BEGIN
    -- Clean the phone number by removing all non-digit characters and adding + prefix
    clean_phone := '+' || regexp_replace(phone_text, '[^0-9]', '', 'g');
    
    -- Check for exact match first
    IF EXISTS (SELECT 1 FROM public.users WHERE phone = clean_phone) THEN
        RETURN TRUE;
    END IF;
    
    -- Check for alternative formats
    IF EXISTS (SELECT 1 FROM public.users WHERE phone = regexp_replace(phone_text, '[^0-9]', '', 'g')) THEN
        RETURN TRUE;
    END IF;
    
    -- Check for phone with spaces or other formatting
    IF EXISTS (SELECT 1 FROM public.users WHERE phone = phone_text) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$;

-- Grant execute permission on the phone check function to anon role
GRANT EXECUTE ON FUNCTION check_phone_exists(TEXT) TO anon;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Cross-device authentication fixes applied successfully!';
    RAISE NOTICE '✅ Added get_user_by_phone function for safer user lookup';
    RAISE NOTICE '✅ Enhanced check_phone_exists function';
    RAISE NOTICE '✅ Ready for cross-device testing!';
END $$;