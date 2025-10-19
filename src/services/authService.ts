import { supabase } from '../lib/supabase';
import { UserProfile } from '../../types';

export const authService = {
  // Create or get user by phone number (without OTP)
  async createUserByPhone(phoneNumber: string): Promise<{ error?: string; user?: UserProfile }> {
    try {
      console.log('=== createUserByPhone called ===');
      console.log('Phone number:', phoneNumber);
      
      // First, check if user already exists by phone number using the secure function
      // Clean the phone number for consistent storage and search (without + sign)
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
      console.log('Checking if user exists with clean phone number:', cleanPhoneNumber);
      
      // Use the secure function to check if phone exists
      const { data: phoneExists, error: checkError } = await supabase
        .rpc('check_phone_exists', { phone_text: cleanPhoneNumber });

      if (checkError) {
        console.error('Phone check error:', checkError);
        return { error: checkError.message };
      }

      // If user exists, we need to properly handle the existing user
      // Note: Current function returns boolean, not table with user_id
      if (phoneExists) {
        console.log('✅ Phone number exists, proceeding with authentication');
        
        // Create anonymous session
        const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
        
        if (authError) {
          console.error('Anonymous auth error:', authError);
          return { error: authError.message };
        }

        if (!authData.user) {
          return { error: 'Failed to create authentication session' };
        }

        console.log('✅ Created anonymous auth user:', authData.user.id);
        
        // Fetch the existing user data from the database
        // Try different phone number formats to ensure we find the user
        const phoneFormats = [
          cleanPhoneNumber,
          '+' + cleanPhoneNumber,
          phoneNumber.trim()
        ];
        
        let existingUser = null;
        let fetchError = null;
        
        for (const phoneFormat of phoneFormats) {
          console.log('Trying to fetch user with phone format:', phoneFormat);
          const { data: existingUsers, error: error } = await supabase
            .from('users')
            .select('*')
            .eq('phone', phoneFormat);
            
          if (error) {
            fetchError = error;
            continue;
          }
          
          if (existingUsers && existingUsers.length > 0) {
            existingUser = existingUsers[0];
            console.log('✅ Found user with format:', phoneFormat);
            break;
          }
        }
        
        if (!existingUser) {
          console.error('Failed to fetch existing user with any format:', fetchError);
          return { error: fetchError?.message || 'User not found' };
        }

        console.log('Found existing user:', existingUser);

        // Fetch additional user data from user_profiles and user_goals tables
        const { data: userProfiles, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', existingUser.id);

        const { data: userGoalsData, error: goalsError } = await supabase
          .from('user_goals')
          .select('*')
          .eq('user_id', existingUser.id);

        // Handle profile data
        const userProfile = userProfiles && userProfiles.length > 0 ? userProfiles[0] : null;
        
        // Handle goals data
        const userGoals = userGoalsData && userGoalsData.length > 0 ? userGoalsData[0] : null;

        // Construct a complete UserProfile object
        const userData: UserProfile = {
          id: existingUser.id, // Use existing user ID, not the new anonymous session ID
          phone_number: existingUser.phone,
          age: userProfile?.birth_year ? new Date().getFullYear() - userProfile.birth_year : 0,
          gender: userProfile?.gender || 'male',
          weight: userProfile?.weight_kg || 0,
          height: userProfile?.height_cm || 0,
          activity_level: userProfile?.activity_level || 'sedentary',
          goal: (() => {
            switch (userProfile?.primary_goal) {
              case 'lose': return 'lose_weight';
              case 'gain': return 'gain_weight';
              default: return 'maintain';
            }
          })(),
          goal_calories: userGoals?.goal_calories || 0,
          goal_protein: userGoals?.goal_protein_g || 0,
          goal_carbs: userGoals?.goal_carbs_g || 0,
          goal_fat: userGoals?.goal_fat_g || 0,
          language: 'ru',
          questionnaire_completed: existingUser.onboarding_completed,
          created_at: existingUser.created_at,
          updated_at: userProfile?.updated_at || existingUser.updated_at || existingUser.created_at
        };
        
        console.log('✅ Constructed user data:', userData);
        return { user: userData };
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
      const cleanPhoneForInsert = phoneNumber.replace(/\D/g, ''); // Store without + sign
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
      
      if (!newProfile) {
        return { error: 'Failed to create user profile' };
      }

      console.log('✅ Created user profile:', newProfile);
      
      // Return minimal user data for new users
      const userData: UserProfile = {
        id: authData.user.id,
        phone_number: cleanPhoneForInsert,
        age: 0,
        gender: 'male',
        weight: 0,
        height: 0,
        activity_level: 'sedentary',
        goal: 'maintain',
        goal_calories: 0,
        goal_protein: 0,
        goal_carbs: 0,
        goal_fat: 0,
        language: 'ru',
        questionnaire_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return { user: userData };
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
      const { data: profiles, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        return { error: profileError.message };
      }

      return { user: profiles || null };
    } catch (error) {
      return { error: 'Failed to verify OTP' };
    }
  },

  // Get current user
  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profiles, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Get current user error:', error);
        return null;
      }

      return profiles;
    } catch (error) {
      console.error('Get current user exception:', error);
      return null;
    }
  },

  // Sign out
  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  },
};