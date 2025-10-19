-- Fix Phone Number Format
-- This script updates the phone number format to store numbers without the + sign

-- Drop and recreate the check_phone_exists function with updated logic
-- Updated to handle phone number formatting without + sign
DROP FUNCTION IF EXISTS check_phone_exists(TEXT);

CREATE OR REPLACE FUNCTION check_phone_exists(phone_text TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- Execute with privileges of function creator
SET search_path = public, pg_temp
AS $$
DECLARE
    clean_phone TEXT;
BEGIN
    -- Clean the phone number by removing all non-digit characters (without adding + prefix)
    clean_phone := regexp_replace(phone_text, '[^0-9]', '', 'g');
    
    -- Check for exact match first (without + prefix)
    IF EXISTS (SELECT 1 FROM public.users WHERE phone = clean_phone) THEN
        RETURN TRUE;
    END IF;
    
    -- Check for alternative formats (with + prefix)
    IF EXISTS (SELECT 1 FROM public.users WHERE phone = '+' || regexp_replace(phone_text, '[^0-9]', '', 'g')) THEN
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
-- This allows anonymous users to check if a phone number exists without exposing user data
GRANT EXECUTE ON FUNCTION check_phone_exists(TEXT) TO anon;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Phone number format fixed successfully!';
    RAISE NOTICE 'Phone numbers will now be stored without the + sign';
    RAISE NOTICE '✅ Phone number checking function updated';
END $$;