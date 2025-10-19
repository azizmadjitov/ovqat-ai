-- Run this SQL in your Supabase SQL editor to fix the phone number checking function

-- Fix phone number checking function to handle formatting inconsistencies
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

-- Verify the function works
-- SELECT check_phone_exists('+998997961877'); -- Should return true if phone exists