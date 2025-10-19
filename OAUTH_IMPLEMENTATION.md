# OAuth Implementation Guide

This document outlines the changes made to implement Google/Apple Sign-In in the Ovqat AI application.

## Changes Made

### 1. Database Schema Updates

Created migration file: `supabase/migrations/005_oauth_support.sql`

Changes include:
- Added OAuth-related fields to `user_profiles` table:
  - `email` (TEXT)
  - `full_name` (TEXT)
  - `avatar_url` (TEXT)
  - `provider` (TEXT) with check constraint for 'google' or 'apple'
  - `questionnaire_completed` (BOOLEAN) with default FALSE
- Made `phone` column in `users` table optional (DROP NOT NULL)
- Updated RLS policies for both tables
- Created `upsert_user_profile` function for handling OAuth user profiles

### 2. Frontend Changes

#### App.tsx
- Added `AuthCallback` screen to the [Screen](file:///Users/azizmadjitov/qoder/ovqat-ai/types.ts#L1-L8) enum
- Replaced [LoginScreen](file:///Users/azizmadjitov/qoder/ovqat-ai/components/LoginScreen.tsx#L12-L74) with [AuthScreen](file:///Users/azizmadjitov/qoder/ovqat-ai/components/AuthScreen.tsx#L10-L113) for authentication
- Added route handling for `/auth/callback` path
- Updated authentication flow to work with OAuth providers

#### Components
- Created [AuthScreen.tsx](file:///Users/azizmadjitov/qoder/ovqat-ai/components/AuthScreen.tsx) with Google and Apple sign-in buttons
- Created [AuthCallback.tsx](file:///Users/azizmadjitov/qoder/ovqat-ai/components/AuthCallback.tsx) to handle OAuth provider redirects
- Removed dependency on react-router-dom (using state-based routing instead)

#### Internationalization
- Updated [i18n.ts](file:///Users/azizmadjitov/qoder/ovqat-ai/i18n.ts) with new translation keys for OAuth flow

### 3. Documentation Updates

- Updated README.md with new authentication flow documentation
- Added this implementation guide

## How to Apply Database Changes

Since the Supabase CLI is not installed locally, you'll need to apply the database migration manually:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/005_oauth_support.sql`
4. Paste and run the SQL in the editor

## Supabase Configuration

### Enable OAuth Providers

In Supabase Dashboard → Authentication → Providers:

1. **Google**:
   - Enable the provider
   - Add Client ID and Secret from Google Cloud Console
   - Add redirect URLs:
     - `http://localhost:3000/auth/callback` (for development)
     - `https://<your-vercel-domain>/auth/callback` (for production)

2. **Apple**:
   - Enable the provider
   - Add Service ID, Team ID, Key ID, and Private Key from Apple Developer Console
   - Add redirect URLs:
     - `http://localhost:3000/auth/callback` (for development)
     - `https://<your-vercel-domain>/auth/callback` (for production)

### URL Configuration

In Supabase Dashboard → Authentication → URL Configuration:

Add these redirect URLs:
- `http://localhost:3000/auth/callback`
- `https://<your-vercel-domain>/auth/callback`

Also add these URLs in each provider's console as authorized redirect URIs.

## Testing the Implementation

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open the app in your browser (http://localhost:3000)

3. You should see the new AuthScreen with Google and Apple sign-in buttons

4. Test both authentication flows:
   - Click "Continue with Google" and complete the Google sign-in flow
   - Click "Continue with Apple" and complete the Apple sign-in flow (requires Apple Developer account)

5. After successful authentication, you should be redirected to the callback handler and then to either:
   - QuestionnaireScreen (for new users)
   - HomeScreen (for returning users who have completed the questionnaire)

## Environment Variables

Ensure these environment variables are set in your `.env` file:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

No additional secrets are required client-side for OAuth; provider keys live in Supabase.

## RLS Policies

The migration includes updated RLS policies that ensure:
- Users can only view their own data
- Users can only insert/update their own data
- All database operations are scoped to `auth.uid()`
- No anonymous access is permitted

## UX/UI Notes

- The AuthScreen uses the existing design tokens for consistent styling
- Buttons use the app's gradient or solid primary styles
- Auth screens are full-bleed and scroll-free on common devices
- Safe-area paddings are properly implemented for mobile devices