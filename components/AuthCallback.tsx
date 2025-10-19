import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { questionnaireService } from '../src/services/questionnaireService';

interface AuthCallbackProps {
  onAuthComplete: (needsOnboarding: boolean) => void;
}

export const AuthCallback: React.FC<AuthCallbackProps> = ({ onAuthComplete }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setError(sessionError.message);
          setLoading(false);
          return;
        }

        if (!data?.session) {
          setError('No session found');
          setLoading(false);
          return;
        }

        const session = data.session;
        const user = session.user;

        if (!user) {
          setError('No user found in session');
          setLoading(false);
          return;
        }

        // Extract user metadata
        const email = user.email || '';
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
        const avatarUrl = user.user_metadata?.picture || user.user_metadata?.avatar || '';
        const provider = user.app_metadata?.provider || '';

        // Upsert user profile
        const { error: upsertError } = await supabase
          .from('user_profiles')
          .upsert({
            id: user.id,
            email: email,
            full_name: fullName,
            avatar_url: avatarUrl,
            provider: provider,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        if (upsertError) {
          setError(upsertError.message);
          setLoading(false);
          return;
        }

        // Check if questionnaire is completed
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('questionnaire_completed')
          .eq('id', user.id)
          .single();

        if (profileError) {
          // If profile not found, create a minimal one
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert({
              id: user.id,
              email: email,
              full_name: fullName,
              avatar_url: avatarUrl,
              provider: provider,
              questionnaire_completed: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (insertError) {
            setError(insertError.message);
            setLoading(false);
            return;
          }

          // New user needs onboarding
          onAuthComplete(true);
        } else {
          // Existing user
          const needsOnboarding = !profileData.questionnaire_completed;
          onAuthComplete(needsOnboarding);
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error('Auth callback error:', err);
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [onAuthComplete]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-base">
        <div className="text-label-primary">Processing authentication...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg-base px-6">
        <div className="text-accent-error text-body-lg mb-4">Authentication Error</div>
        <div className="text-label-primary text-body-md mb-6 text-center">{error}</div>
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-3 bg-primary rounded-[16px] text-white font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-base">
      <div className="text-label-primary">Redirecting...</div>
    </div>
  );
};