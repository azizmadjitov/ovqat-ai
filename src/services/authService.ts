import { supabase } from '../lib/supabase';
import { UserProfile } from '../../types';

// Backend URL - use environment variable or default to localhost
// For Vercel: https://ovqat-ai.vercel.app/api
// For Railway: https://ovqat-ai-production.up.railway.app
// For localhost: http://localhost:3001
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const API_BASE = BACKEND_URL.includes('vercel.app') ? `${BACKEND_URL}/api` : BACKEND_URL;

export const authService = {
  // Authenticate with JWT token from URL parameter
  async authenticateWithToken(token: string): Promise<{ error?: string; user?: UserProfile; userId?: string }> {
    try {
      console.log('🔐 Authenticating with token...');
      
      // Verify token with backend
      const response = await fetch(`${BACKEND_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        console.error('❌ Token verification failed');
        return { error: 'Invalid token' };
      }

      const { valid, userId } = await response.json();

      if (!valid || !userId) {
        return { error: 'Token verification failed' };
      }

      console.log('✅ Token verified, userId:', userId);
      
      // Store user_id in localStorage
      localStorage.setItem('ovqat-user-id', userId);
      console.log('💾 Stored user_id in localStorage');

      // Fetch user data from Supabase
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (!users) {
        return { error: 'User not found' };
      }

      // Fetch profile and goals
      const { data: userProfiles } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId);

      const { data: userGoalsData } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', userId);

      const userProfile = userProfiles && userProfiles.length > 0 ? userProfiles[0] : null;
      const userGoals = userGoalsData && userGoalsData.length > 0 ? userGoalsData[0] : null;

      const userData: UserProfile = {
        id: users.id,
        phone_number: users.phone,
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
        questionnaire_completed: users.onboarding_completed,
        created_at: users.created_at,
        updated_at: userProfile?.updated_at || users.created_at
      };

      console.log('✅ User data loaded:', userData);
      return { user: userData, userId };
    } catch (error: any) {
      console.error('❌ Token auth error:', error);
      return { error: error.message || 'Authentication failed' };
    }
  },

  // Generate a deterministic password from phone number
  // This allows us to recreate the same password on any device
  generatePasswordFromPhone(phoneNumber: string): string {
    // Create a strong password from phone number
    // Format: Ovqat_[last6digits]_[first4digits]
    const digits = phoneNumber.replace(/\D/g, '');
    const last6 = digits.slice(-6);
    const first4 = digits.slice(0, 4);
    return `Ovqat_${last6}_${first4}`;
  },
  // Authenticate user by phone number
  async authenticateByPhone(phoneNumber: string): Promise<{ error?: string; user?: UserProfile; accessToken?: string }> {
    try {
      console.log('=== authenticateByPhone called ===');
      console.log('Phone number:', phoneNumber);
      
      // Use simple anonymous auth with localStorage for cross-device support
      console.log('🔄 Using anonymous auth with localStorage...');
      return await this.authenticateWithAnonymous(phoneNumber);
      
      /* Edge Function alternative (when deployed) - also unified API
      console.log('Attempting to call phone-auth Edge Function...');
      const { data, error } = await supabase.functions.invoke('phone-auth', {
        body: { phone: phoneNumber },
      });

      // If Edge Function fails or doesn't exist, fall back to old method
      if (error) {
        console.warn('⚠️ Edge Function error, falling back to legacy auth:', error);
        console.log('Using legacy authentication method...');
        return await this.legacyCreateUserByPhone(phoneNumber);
      }

      if (!data || !data.access_token) {
        console.warn('⚠️ Invalid response from Edge Function, falling back to legacy auth');
        return await this.legacyCreateUserByPhone(phoneNumber);
      }

      console.log('✅ Authentication successful via Edge Function');

      // Set the session with the received tokens
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      if (sessionError) {
        console.error('Session error:', sessionError);
        return { error: sessionError.message };
      }

      // If user needs onboarding, return minimal data
      if (!data.user.onboarding_completed) {
        const userData: UserProfile = {
          id: data.user.id,
          phone_number: data.user.phone,
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
        
        return { user: userData, accessToken: data.access_token };
      }

      // Fetch complete user profile for existing users
      const { data: userProfiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      const { data: userGoalsData, error: goalsError } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      // Construct complete user profile
      const userData: UserProfile = {
        id: data.user.id,
        phone_number: data.user.phone,
        age: userProfiles?.birth_year ? new Date().getFullYear() - userProfiles.birth_year : 0,
        gender: userProfiles?.gender || 'male',
        weight: userProfiles?.weight_kg || 0,
        height: userProfiles?.height_cm || 0,
        activity_level: userProfiles?.activity_level || 'sedentary',
        goal: (() => {
          switch (userProfiles?.primary_goal) {
            case 'lose': return 'lose_weight';
            case 'gain': return 'gain_weight';
            default: return 'maintain';
          }
        })(),
        goal_calories: userGoalsData?.goal_calories || 0,
        goal_protein: userGoalsData?.goal_protein_g || 0,
        goal_carbs: userGoalsData?.goal_carbs_g || 0,
        goal_fat: userGoalsData?.goal_fat_g || 0,
        language: 'ru',
        questionnaire_completed: data.user.onboarding_completed,
        created_at: userRecord?.created_at || new Date().toISOString(),
        updated_at: userProfiles?.updated_at || userRecord?.created_at || new Date().toISOString()
      };

      console.log('✅ User profile loaded:', userData);
      return { user: userData, accessToken: data.access_token };
      */
    } catch (error: any) {
      console.error('❌ Unexpected error in authenticateByPhone:', error);
      return { error: error.message || 'Failed to authenticate' };
    }
  },

  // Authenticate with anonymous auth + localStorage
  async authenticateWithAnonymous(phoneNumber: string): Promise<{ error?: string; user?: UserProfile; accessToken?: string }> {
    try {
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
      
      console.log('🔍 Checking for existing user...');
      
      // Check if user exists
      const { data: existingUsers } = await supabase
        .from('users')
        .select('*')
        .eq('phone', cleanPhoneNumber)
        .limit(1);
      
      if (existingUsers && existingUsers.length > 0) {
        // Existing user - reuse their ID
        const existingUser = existingUsers[0];
        console.log('✅ Existing user found:', existingUser.id);
        
        // Store user_id in localStorage for RLS queries
        localStorage.setItem('ovqat-user-id', existingUser.id);
        console.log('💾 Stored user_id in localStorage');
        
        // Fetch profile and goals
        const { data: userProfiles } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', existingUser.id);
        
        const { data: userGoalsData } = await supabase
          .from('user_goals')
          .select('*')
          .eq('user_id', existingUser.id);
        
        const userProfile = userProfiles && userProfiles.length > 0 ? userProfiles[0] : null;
        const userGoals = userGoalsData && userGoalsData.length > 0 ? userGoalsData[0] : null;
        
        const userData: UserProfile = {
          id: existingUser.id,
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
          updated_at: userProfile?.updated_at || existingUser.created_at
        };
        
        return { user: userData };
      } else {
        // New user - create anonymous session
        console.log('❌ New user, creating...');
        
        const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
        
        if (authError) {
          console.error('Anonymous auth error:', authError);
          return { error: authError.message };
        }
        
        if (!authData.user) {
          return { error: 'Failed to create authentication session' };
        }
        
        const newUserId = authData.user.id;
        
        // Store user_id in localStorage
        localStorage.setItem('ovqat-user-id', newUserId);
        console.log('💾 Stored new user_id in localStorage:', newUserId);
        
        // Create user in database
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            id: newUserId,
            phone: cleanPhoneNumber,
            onboarding_completed: false,
          })
          .select()
          .single();
        
        if (insertError) {
          console.error('Error creating user:', insertError);
          return { error: 'Failed to create user' };
        }
        
        const userData: UserProfile = {
          id: newUser.id,
          phone_number: newUser.phone,
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
          created_at: newUser.created_at,
          updated_at: newUser.created_at
        };
        
        return { user: userData };
      }
    } catch (error: any) {
      console.error('❌ Anonymous auth error:', error);
      return { error: error.message || 'Authentication failed' };
    }
  },

  // Authenticate with OTP (One-Time Password)
  async authenticateWithOTP(phoneNumber: string): Promise<{ error?: string; user?: UserProfile; accessToken?: string }> {
    try {
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
      const formattedPhone = `+${cleanPhoneNumber}`;
      
      console.log('📱 Sending OTP to:', formattedPhone);
      
      // Step 1: Send OTP
      const { data: signUpData, error: signUpError } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });
      
      if (signUpError) {
        console.error('❌ OTP send error:', signUpError);
        return { error: signUpError.message };
      }
      
      console.log('✅ OTP sent successfully');
      console.log('📌 For testing: Use any 6-digit code (e.g., 123456)');
      
      // For development/testing: auto-verify with a test code
      // In production, user would enter the code they received
      const testOTP = '123456';
      
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: testOTP,
        type: 'sms',
      });
      
      if (verifyError) {
        console.warn('⚠️ OTP verification failed (expected in dev):', verifyError.message);
        // In production, we would wait for user input here
        // For now, create anonymous session as fallback
        const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
        if (anonError) {
          return { error: 'Authentication failed' };
        }
      } else if (verifyData.session) {
        console.log('✅ OTP verified, session created');
      }
      
      // Now fetch or create user
      const { data: existingUsers } = await supabase
        .from('users')
        .select('*')
        .eq('phone', cleanPhoneNumber)
        .limit(1);
      
      if (existingUsers && existingUsers.length > 0) {
        // Existing user
        const existingUser = existingUsers[0];
        console.log('✅ Existing user found:', existingUser.id);
        
        // Fetch profile and goals
        const { data: userProfiles } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', existingUser.id);
        
        const { data: userGoalsData } = await supabase
          .from('user_goals')
          .select('*')
          .eq('user_id', existingUser.id);
        
        const userProfile = userProfiles && userProfiles.length > 0 ? userProfiles[0] : null;
        const userGoals = userGoalsData && userGoalsData.length > 0 ? userGoalsData[0] : null;
        
        const userData: UserProfile = {
          id: existingUser.id,
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
          updated_at: userProfile?.updated_at || existingUser.created_at
        };
        
        return { user: userData };
      } else {
        // New user - create in database
        console.log('❌ New user, creating...');
        
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          return { error: 'Failed to get auth user' };
        }
        
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            phone: cleanPhoneNumber,
            onboarding_completed: false,
          })
          .select()
          .single();
        
        if (insertError) {
          console.error('Error creating user:', insertError);
          return { error: 'Failed to create user' };
        }
        
        const userData: UserProfile = {
          id: newUser.id,
          phone_number: newUser.phone,
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
          created_at: newUser.created_at,
          updated_at: newUser.created_at
        };
        
        return { user: userData };
      }
    } catch (error: any) {
      console.error('❌ OTP auth error:', error);
      return { error: error.message || 'Authentication failed' };
    }
  },

  // Authenticate via Edge Function (cross-device support)
  async authenticateViaEdgeFunction(phoneNumber: string): Promise<{ error?: string; user?: UserProfile; accessToken?: string }> {
    try {
      console.log('📞 Calling phone-auth Edge Function...');
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
      
      const { data, error } = await supabase.functions.invoke('phone-auth', {
        body: { phone: cleanPhoneNumber },
      });

      if (error) {
        console.error('❌ Edge Function error:', error);
        console.warn('⚠️ Falling back to legacy auth...');
        return await this.legacyCreateUserByPhone(phoneNumber);
      }

      if (!data || !data.access_token) {
        console.warn('⚠️ Invalid response from Edge Function');
        return await this.legacyCreateUserByPhone(phoneNumber);
      }

      console.log('✅ Edge Function successful');

      // Set the session with tokens from Edge Function
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        return { error: sessionError.message };
      }

      // Fetch complete user profile
      const { data: userProfiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', data.user.id);

      const { data: userGoalsData, error: goalsError } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', data.user.id);

      const userProfile = userProfiles && userProfiles.length > 0 ? userProfiles[0] : null;
      const userGoals = userGoalsData && userGoalsData.length > 0 ? userGoalsData[0] : null;

      const userData: UserProfile = {
        id: data.user.id,
        phone_number: data.user.phone,
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
        questionnaire_completed: data.user.onboarding_completed,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('✅ User profile loaded:', userData);
      return { user: userData, accessToken: data.access_token };
    } catch (error: any) {
      console.error('❌ Unexpected error in authenticateViaEdgeFunction:', error);
      console.warn('⚠️ Falling back to legacy auth...');
      return await this.legacyCreateUserByPhone(phoneNumber);
    }
  },

  // Legacy authentication method (fallback when Edge Function is not available)
  async legacyCreateUserByPhone(phoneNumber: string): Promise<{ error?: string; user?: UserProfile; accessToken?: string }> {
    try {
      console.log('=== legacyCreateUserByPhone called ===');
      console.log('Phone number:', phoneNumber);
      
      // Clean the phone number for consistent storage and search (without + sign)
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
      console.log('Checking if user exists with clean phone number:', cleanPhoneNumber);
      
      // Check if phone exists using secure function
      console.log('🔍 Checking if phone exists...');
      let phoneExists = false;
      let existingUsers = null;
      
      // Try RPC function first
      const { data: rpcResult, error: checkError } = await supabase
        .rpc('phone_exists', { phone_number: cleanPhoneNumber });

      if (checkError) {
        console.warn('⚠️ RPC function not available, using direct query...');
        // RPC function doesn't exist yet, use direct query
        // This will work after applying fix-rls-for-phone-check.sql
      } else {
        phoneExists = rpcResult;
        console.log('RPC check result:', phoneExists ? '✅ User exists' : '❌ User not found');
      }
      
      // Fetch user data (works for both new check and fallback)
      const { data: users, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', cleanPhoneNumber)
        .limit(1);
      
      if (fetchError) {
        console.error('❌ Failed to query users table:', fetchError);
        console.error('Error details:', fetchError);
        return { error: 'Unable to verify phone number. Please apply fix-rls-for-phone-check.sql migration.' };
      }
      
      existingUsers = users;
      phoneExists = users && users.length > 0;
      console.log('Database query result:', phoneExists ? '✅ User exists' : '❌ User not found');

      // If user exists, we need to properly handle the existing user
      if (phoneExists && existingUsers && existingUsers.length > 0) {
        console.log('✅ Phone number exists, proceeding with authentication');
        
        // Use the existing user data we already fetched
        const existingUser = existingUsers[0];
        console.log('📋 Existing user ID:', existingUser.id);
        console.log('✅ Reusing existing user (same user_id on all devices)');
        
        // Sign in with password (generated from phone number)
        // This allows us to create a session for the existing auth.users record
        const password = this.generatePasswordFromPhone(cleanPhoneNumber);
        const email = `ovqat${cleanPhoneNumber}@app.local`;
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });
        
        if (signInError) {
          console.warn('⚠️ Password sign-in failed, user might not have password set:', signInError.message);
          // Fall back to anonymous for now
          const { data: anonData } = await supabase.auth.signInAnonymously();
          console.log('✅ Using anonymous session as fallback');
        } else if (signInData.session) {
          console.log('✅ Successfully signed in with password for existing user');
        }

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
          id: existingUser.id,
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
        
        // Store the correct user_id in localStorage for RLS queries
        // This ensures we use the same user_id across all devices
        localStorage.setItem('ovqat-user-id', existingUser.id);
        console.log('💾 Stored user_id in localStorage:', existingUser.id);
        
        return { user: userData };
      }

      // New user - create anonymous session first
      console.log('❌ User not found - creating new user');
      
      // Double-check to prevent duplicates (race condition protection)
      console.log('🔒 Double-checking for duplicates...');
      const { data: doubleCheck } = await supabase
        .from('users')
        .select('id')
        .eq('phone', cleanPhoneNumber)
        .limit(1);
      
      if (doubleCheck && doubleCheck.length > 0) {
        console.warn('⚠️ User was created by another request, fetching existing user...');
        // User was created between our first check and now, fetch it
        return await this.legacyCreateUserByPhone(phoneNumber);
      }
      
      console.log('Step 1: Creating user with password-based auth...');
      const password = this.generatePasswordFromPhone(cleanPhoneNumber);
      const email = `ovqat${cleanPhoneNumber}@app.local`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });
      
      if (authError) {
        console.error('Auth signup error:', authError);
        return { error: authError.message };
      }

      if (!authData.user) {
        return { error: 'Failed to create authentication session' };
      }

      console.log('✅ Created auth user with password:', authData.user.id);
      console.log('Step 2: Inserting user into database...');

      // Create user profile in our users table
      const cleanPhoneForInsert = phoneNumber.replace(/\D/g, '');
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
        
        // If duplicate key error, fetch the existing user
        if (createError.code === '23505') {
          console.warn('⚠️ Duplicate phone number detected, fetching existing user...');
          return await this.legacyCreateUserByPhone(phoneNumber);
        }
        
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
      console.error('❌ Unexpected error in legacyCreateUserByPhone:', error);
      return { error: error.message || 'Failed to create user' };
    }
  },

  // Public method - kept for backward compatibility
  async createUserByPhone(phoneNumber: string): Promise<{ error?: string; user?: UserProfile }> {
    const result = await this.authenticateByPhone(phoneNumber);
    return { error: result.error, user: result.user };
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