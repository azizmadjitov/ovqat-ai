-- Fix Function Search Path Mutable Warnings
-- This script addresses the security warnings about mutable search paths in functions

-- First, drop the triggers that depend on the function
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_user_goals_updated_at ON user_goals;

-- Now drop and recreate the update_updated_at_column function with secure search_path
DROP FUNCTION IF EXISTS update_updated_at_column();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- Recreate the triggers
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_goals_updated_at
    BEFORE UPDATE ON user_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Drop and recreate the check_phone_exists function with secure search_path
-- Updated to handle phone number formatting inconsistencies
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
-- This allows anonymous users to check if a phone number exists without exposing user data
GRANT EXECUTE ON FUNCTION check_phone_exists(TEXT) TO anon;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Function search path warnings fixed successfully!';
    RAISE NOTICE 'Functions now have secure search_path settings';
    RAISE NOTICE '✅ Security Advisor warnings should now be resolved';
    RAISE NOTICE '✅ Phone number checking now handles multiple formats';
END $$;