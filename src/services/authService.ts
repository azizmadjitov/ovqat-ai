import { supabase } from '../lib/supabase';
import { UserProfile } from '../../types';

export const authService = {
  // Create or get user by phone number (without OTP)
  async createUserByPhone(phoneNumber: string): Promise<{ error?: string; user?: UserProfile }> {
    try {
      console.log('=== createUserByPhone called ===');
      console.log('Phone number:', phoneNumber);
      
      // First, check if user already exists by phone number
      // Clean the phone number for consistent storage and search
      const cleanPhoneNumber = '+' + phoneNumber.replace(/\D/g, '');
      console.log('Checking if user exists with clean phone number:', cleanPhoneNumber);
      const { data: existingUsers, error: searchError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', cleanPhoneNumber);

      console.log('Search result:', { existingUsers, searchError });

      if (searchError && searchError.code !== 'PGRST116') {
        console.error('Search error:', searchError);
        return { error: searchError.message };
      }

      // If user exists, just return them - DON'T create new session or insert
      if (existingUsers && existingUsers.length > 0) {
        const existingUser = existingUsers[0];
        console.log('✅ Found existing user:', existingUser);
        console.log('✅ Returning existing user without creating new records');
        return { user: existingUser };
      }

      // New user - create anonymous session first
      console.log('❌ User not found - creating new user');
      console.log('Step 1: Creating anonymous session...');
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
      
      if (authError) {
        console.error('Anonymous auth error:', authError);
        return { error: authError.message };
      }

      if (!authData.user) {
        return { error: 'Failed to create authentication session' };
      }

      console.log('✅ Created anonymous auth user:', authData.user.id);
      console.log('Step 2: Inserting user into database...');

      // Create user profile in our users table
      const cleanPhoneForInsert = '+' + phoneNumber.replace(/\D/g, '');
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          phone: cleanPhoneForInsert,
          onboarding_completed: false,
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Profile creation error:', createError);
        console.error('Error details:', JSON.stringify(createError, null, 2));
        return { error: createError.message };
      }

      console.log('✅ Created user profile:', newProfile);
      return { user: newProfile };
    } catch (error: any) {
      console.error('❌ Unexpected error in createUserByPhone:', error);
      return { error: error.message || 'Failed to create user' };
    }
  },

  // Send OTP to phone number (kept for future use)
  async sendOTP(phoneNumber: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
      });
      
      if (error) return { error: error.message };
      return {};
    } catch (error) {
      return { error: 'Failed to send OTP' };
    }
  },

  // Verify OTP (kept for future use)
  async verifyOTP(phoneNumber: string, token: string): Promise<{ error?: string; user?: UserProfile }> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token,
        type: 'sms',
      });

      if (error) return { error: error.message };
      if (!data.user) return { error: 'No user found' };

      // Check if user profile exists
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        return { error: profileError.message };
      }

      return { user: profile || null };
    } catch (error) {
      return { error: 'Failed to verify OTP' };
    }
  },

  // Get current user
  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      return profile;
    } catch (error) {
      return null;
    }
  },

  // Sign out
  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  },
};
