import { supabase } from '../lib/supabase';
import { QuestionnaireData, DBUser, DBUserProfile, DBUserGoals } from '../../types';
import { calculateUserGoals } from '../utils/calculations';

export const questionnaireService = {
  // Create or get user by phone
  async upsertUser(phone: string): Promise<{ user: DBUser | null; error?: string }> {
    try {
      // Clean the phone number by removing all non-digit characters (without + prefix)
      const cleanPhone = phone.replace(/\D/g, '');
      
      // Try to get the authenticated user
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      
      // If there's an auth error, try to refresh the session
      if (authError) {
        console.log('Auth error, trying to refresh session:', authError);
        // Try to refresh the session
        const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('Failed to refresh session:', refreshError);
          return { user: null, error: 'Authentication session expired. Please restart the app.' };
        }
        
        // Try to get user again after refresh
        const { data: refreshedAuthUser, error: refreshedAuthError } = await supabase.auth.getUser();
        if (refreshedAuthError || !refreshedAuthUser?.user) {
          return { user: null, error: 'Not authenticated' };
        }
        
        // Check if user already exists and get their onboarding status
        const { data: existingUsers } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('id', refreshedAuthUser.user.id);
        
        const existingUser = existingUsers && existingUsers.length > 0 ? existingUsers[0] : null;
        
        // Use the refreshed user data
        const { data: userData, error: upsertError } = await supabase
          .from('users')
          .upsert({
            id: refreshedAuthUser.user.id,
            phone: cleanPhone,
            onboarding_completed: existingUser?.onboarding_completed || false,
          }, {
            onConflict: 'id',
          })
          .select();

        if (upsertError) return { user: null, error: upsertError.message };
        
        // Handle case where we might have multiple or no results
        if (!userData || userData.length === 0) {
          return { user: null, error: 'Failed to create or update user' };
        }
        
        return { user: userData[0] };
      }
      
      if (!authUser?.user) {
        return { user: null, error: 'Not authenticated' };
      }

      // First, check if a user with this phone number already exists
      const { data: existingUsers, error: searchError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', cleanPhone);

      if (searchError && searchError.code !== 'PGRST116') {
        console.error('Search error:', searchError);
        return { user: null, error: searchError.message };
      }

      // If user with this phone already exists and it's not the current user, return error
      if (existingUsers && existingUsers.length > 0) {
        const existingUser = existingUsers[0];
        if (existingUser.id !== authUser.user.id) {
          console.log('User with this phone already exists:', existingUser);
          return { user: null, error: 'An account with this phone number already exists. Please sign in with that account.' };
        }
        // If it's the same user, just return the existing user data
        return { user: existingUser };
      }

      // Check if user already exists and get their onboarding status
      const { data: userRecords } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', authUser.user.id);
      
      const userRecord = userRecords && userRecords.length > 0 ? userRecords[0] : null;
      
      const { data: upsertData, error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: authUser.user.id,
          phone: cleanPhone,
          onboarding_completed: userRecord?.onboarding_completed || false,
        }, {
          onConflict: 'id',
        })
        .select();

      if (upsertError) return { user: null, error: upsertError.message };
      
      // Handle case where we might have multiple or no results
      if (!upsertData || upsertData.length === 0) {
        return { user: null, error: 'Failed to create or update user' };
      }
      
      return { user: upsertData[0] };
    } catch (error) {
      console.error('Error in upsertUser:', error);
      return { user: null, error: 'Failed to create user: ' + (error as Error).message };
    }
  },

  // Save complete questionnaire data
  async saveQuestionnaireData(
    userId: string,
    data: QuestionnaireData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Calculate user goals
      const calculations = calculateUserGoals({
        gender: data.gender,
        birth_year: data.birth_year,
        weight_kg: data.weight,
        height_cm: data.height,
        activity_level: data.activity_level,
        primary_goal: data.primary_goal,
      });

      // Start transaction-like operations
      // 1. Save user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          gender: data.gender,
          birth_year: data.birth_year,
          weight_kg: data.weight,
          height_cm: data.height,
          workout_freq: data.workout_freq,
          activity_level: data.activity_level,
          primary_goal: data.primary_goal,
          diet_type: data.diet_type,
          bmi: calculations.bmi,
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error('Profile save error:', profileError);
        return { success: false, error: profileError.message };
      }

      // 2. Save user goals
      const { error: goalsError } = await supabase
        .from('user_goals')
        .upsert({
          user_id: userId,
          goal_calories: calculations.goal_calories,
          goal_protein_g: calculations.goal_protein_g,
          goal_fat_g: calculations.goal_fat_g,
          goal_carbs_g: calculations.goal_carbs_g,
          bmr: calculations.bmr,
          tdee: calculations.tdee,
          updated_at: new Date().toISOString(),
        });

      if (goalsError) {
        console.error('Goals save error:', goalsError);
        return { success: false, error: goalsError.message };
      }

      // 3. Mark onboarding as completed
      const { error: userError } = await supabase
        .from('users')
        .update({ onboarding_completed: true })
        .eq('id', userId);

      if (userError) {
        console.error('User update error:', userError);
        return { success: false, error: userError.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Questionnaire save error:', error);
      return { success: false, error: 'Failed to save questionnaire data' };
    }
  },

  // Check if user has completed onboarding
  async checkOnboardingStatus(userId: string): Promise<{ completed: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', userId);

      if (error) return { completed: false, error: error.message };
      
      // Handle case where we might have multiple or no results
      if (!data || data.length === 0) {
        return { completed: false, error: 'User not found' };
      }
      
      if (data.length > 1) {
        console.warn('Multiple users found with the same ID:', userId);
      }
      
      // Use the first result
      return { completed: data[0]?.onboarding_completed || false };
    } catch (error) {
      return { completed: false, error: 'Failed to check onboarding status' };
    }
  },

  // Get user goals
  async getUserGoals(userId: string): Promise<{ goals: DBUserGoals | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', userId);

      if (error) return { goals: null, error: error.message };
      
      // Handle case where we might have multiple or no results
      if (!data || data.length === 0) {
        return { goals: null, error: 'User goals not found' };
      }
      
      if (data.length > 1) {
        console.warn('Multiple user goals found with the same user ID:', userId);
      }
      
      // Use the first result
      return { goals: data[0] };
    } catch (error) {
      return { goals: null, error: 'Failed to get user goals' };
    }
  },
};