# Fix for Duplicate Users Issue

This document explains how to fix the issue where duplicate users are being created when the same phone number is entered multiple times.

## Problem Summary

The issue occurs because:
1. Phone number formatting inconsistencies between what's stored in the database and what's being checked
2. The `check_phone_exists` function wasn't handling multiple phone number formats properly
3. Duplicate users were being created due to these inconsistencies

## Solution

We've implemented two fixes:

### 1. Enhanced Phone Number Checking Function

The `check_phone_exists` function has been updated to handle multiple phone number formats:
- Exact match with + prefix
- Match without + prefix
- Match with original formatting

### 2. Improved Authentication Service

The authentication service now tries multiple phone number formats when fetching existing users to ensure proper identification.

## How to Apply the Fixes

### Step 1: Update the Database Function

1. Go to your Supabase dashboard: https://app.supabase.com/project/djnbuvumslqlpvdyjnrt/sql/new
2. Copy the contents of [apply-phone-fix.sql](file:///Users/azizmadjitov/qoder/ovqat-ai/apply-phone-fix.sql)
3. Paste it into the SQL editor
4. Click "Run" to execute

### Step 2: Clean Up Existing Duplicate Users (Optional)

If you have duplicate users in your database:

1. Go to your Supabase dashboard SQL editor
2. Copy the contents of [cleanup-duplicate-users.sql](file:///Users/azizmadjitov/qoder/ovqat-ai/cleanup-duplicate-users.sql)
3. Paste it into the SQL editor
4. Click "Run" to execute

This will keep the most recent user for each phone number and remove duplicates.

### Step 3: Update Your Code

Make sure you're using the updated [authService.ts](file:///Users/azizmadjitov/qoder/ovqat-ai/src/services/authService.ts) file which is already included in this repository.

## Verification

After applying the fixes:

1. Try logging in with your phone number
2. You should no longer see "User not found" errors
3. No new duplicate users should be created

## Additional Notes

- The fix maintains backward compatibility with existing users
- Phone numbers are now consistently stored with the + prefix
- The authentication flow has been made more robust to handle formatting variations