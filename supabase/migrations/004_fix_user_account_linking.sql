-- Fix User Account Linking
-- This script addresses the issue where users logging in with existing phone numbers 
-- were creating new accounts instead of linking to existing ones

-- Drop and recreate the check_phone_exists function with improved logic
DROP FUNCTION IF EXISTS check_phone_exists(TEXT);

CREATE OR REPLACE FUNCTION check_phone_exists(phone_text TEXT)
RETURNS TABLE(exists BOOLEAN, user_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    clean_phone TEXT;
    found_user_id UUID;
BEGIN
    -- Clean the phone number by removing all non-digit characters
    clean_phone := regexp_replace(phone_text, '[^0-9]', '', 'g');
    
    -- Check for exact match first (without + prefix)
    SELECT u.id INTO found_user_id 
    FROM public.users u 
    WHERE u.phone = clean_phone 
    LIMIT 1;
    
    IF found_user_id IS NOT NULL THEN
        RETURN QUERY SELECT TRUE, found_user_id;
        RETURN;
    END IF;
    
    -- Check for alternative formats (with + prefix)
    SELECT u.id INTO found_user_id 
    FROM public.users u 
    WHERE u.phone = '+' || regexp_replace(phone_text, '[^0-9]', '', 'g')
    LIMIT 1;
    
    IF found_user_id IS NOT NULL THEN
        RETURN QUERY SELECT TRUE, found_user_id;
        RETURN;
    END IF;
    
    -- Check for phone with spaces or other formatting
    SELECT u.id INTO found_user_id 
    FROM public.users u 
    WHERE u.phone = phone_text
    LIMIT 1;
    
    IF found_user_id IS NOT NULL THEN
        RETURN QUERY SELECT TRUE, found_user_id;
        RETURN;
    END IF;
    
    RETURN QUERY SELECT FALSE, NULL::UUID;
END;
$$;

-- Grant execute permission on the phone check function to anon role
GRANT EXECUTE ON FUNCTION check_phone_exists(TEXT) TO anon;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ User account linking function updated successfully!';
    RAISE NOTICE 'Function now returns both existence status and user ID for proper account linking';
END $$;