# Phone Number Format Fixes

## Issue
Phone numbers were being stored in the database with the "+" sign prefix, but in some cases, the phone number field was appearing empty. Additionally, the requirement was to store phone numbers without the "+" sign in the format `998997961877`.

## Changes Made

### 1. Updated AuthService (`src/services/authService.ts`)
- Modified `createUserByPhone` function to store phone numbers without the "+" sign
- Updated phone number cleaning logic to remove all non-digit characters without adding the "+" prefix
- Updated the phone number formats checked when looking up existing users

### 2. Updated LoginScreen (`components/LoginScreen.tsx`)
- Changed phone number submission to pass cleaned phone number without "+" sign
- Updated logging to reflect the new format

### 3. Updated QuestionnaireService (`src/services/questionnaireService.ts`)
- Modified `upsertUser` function to clean phone numbers before storing
- Ensured consistent phone number format across all database operations

### 4. Updated Database Function (`supabase/migrations/003_fix_function_search_path.sql`)
- Modified `check_phone_exists` function to prioritize checking for phone numbers without the "+" sign
- Updated the function to check multiple formats for backward compatibility

### 5. Added New Migration (`supabase/migrations/004_fix_phone_number_format.sql`)
- Created a new migration file to update the `check_phone_exists` function in the database
- Ensured the function properly handles phone numbers without the "+" sign

### 6. Updated README
- Documented the phone number format changes in the "Recent Fixes" section
- Updated the Supabase setup instructions to include the new migration file

## Testing
To test these changes:
1. Try registering a new user - phone number should be stored without "+" sign
2. Try logging in with an existing phone number - should work correctly
3. Verify that phone numbers appear correctly in the database

## Backward Compatibility
The changes maintain backward compatibility by:
- The `check_phone_exists` function still checks for multiple phone number formats
- Existing users with phone numbers stored with "+" sign can still log in
- New users will have their phone numbers stored without the "+" sign

## Database Schema
No changes were made to the database schema. The `phone` column in the `users` table continues to store phone numbers as TEXT, but now without the "+" prefix.