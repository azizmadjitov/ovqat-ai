# Supabase Security Fixes

This document explains how to apply the security fixes to resolve warnings in the Supabase Security Advisor.

## Issues Fixed

1. **Anonymous Access Policies** - All tables had policies that allowed access to anonymous users
2. **Leaked Password Protection** - This security feature was disabled

## Files Created

1. `fix-security-warnings.sql` - SQL script to fix all security policy issues
2. Updated `src/services/authService.ts` - Modified to use secure phone number checking

## How to Apply the Fixes

### 1. Apply SQL Security Fixes

1. Open your Supabase project dashboard
2. Go to the SQL Editor: https://app.supabase.com/project/{project-id}/sql
3. Copy the contents of `fix-security-warnings.sql`
4. Paste it into the SQL Editor
5. Click "Run"

This will:
- Remove all permissive policies that allowed anonymous access
- Create strict RLS policies that only allow authenticated users to access their own data
- Create a secure function for phone number checking
- Revoke all permissions from anonymous users
- Grant appropriate permissions to authenticated users

### 2. Enable Leaked Password Protection

1. Open your Supabase project dashboard
2. Go to Authentication → Settings
3. Find "Leaked Password Protection" 
4. Toggle it to "Enabled"
5. Click "Save"

This will enable Supabase Auth to check passwords against the HaveIBeenPwned database to prevent the use of compromised passwords.

## Changes Made

### Database Security

- Removed all policies that allowed anonymous access to any tables
- Created strict Row Level Security policies for all tables:
  - `select_own` - Users can only SELECT their own data
  - `insert_own` - Users can only INSERT their own data
  - `update_own` - Users can only UPDATE their own data
  - `delete_own` - Users can only DELETE their own data
- Created a secure function `check_phone_exists()` for phone number verification without exposing user data
- Revoked all permissions from `anon` and `PUBLIC` roles
- Granted appropriate permissions to `authenticated` role

### Application Code

- Modified `authService.createUserByPhone()` to use the secure `check_phone_exists()` function instead of direct table queries
- This maintains the functionality while ensuring security compliance

## Verification

After applying these fixes, the Supabase Security Advisor should show no warnings for:

- Anonymous Access Policies
- Leaked Password Protection (after enabling in dashboard)

## Testing

1. Test user registration with a new phone number
2. Test user login with an existing phone number
3. Verify that users can only access their own data
4. Confirm that anonymous users cannot access any protected data

## Rollback (if needed)

If you need to rollback these changes:

1. Re-run the original schema migration: `supabase/migrations/001_initial_schema.sql`
2. Re-apply the phone number lookup fix: `fix-rls-policy.sql`