import React, { useState } from 'react';
import { t } from '../i18n';
import { supabase } from '../src/lib/supabase';
import { Button } from './Button';

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback'
        }
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to sign in with Google');
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: window.location.origin + '/auth/callback'
        }
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to sign in with Apple');
      setLoading(false);
    }
  };

  return (
    <div 
      className="flex flex-col min-h-[100svh] min-h-[100dvh] min-h-screen px-6 bg-bg-base text-label-primary"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      {/* Header */}
      <header className="h-[3rem] flex items-center justify-center flex-shrink-0">
        <h1 className="text-title-h2 text-label-primary">{t('app_name')}</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col items-center justify-center">
        <div className="w-full max-w-sm flex flex-col items-center">
          <div className="text-center mb-8">
            <h2 className="text-title-h3 text-label-primary mb-4">
              {t('welcome')}
            </h2>
            <p className="text-body-md text-label-secondary">
              {t('sign_in_to_continue')}
            </p>
          </div>

          <div className="w-full space-y-4">
            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              loading={loading}
              variant="primary"
              className="w-full flex items-center justify-center"
            >
              <span>{t('continue_with_google')}</span>
            </Button>

            <Button
              onClick={handleAppleSignIn}
              disabled={loading}
              loading={loading}
              variant="secondary"
              className="w-full flex items-center justify-center"
            >
              <span>{t('continue_with_apple')}</span>
            </Button>
          </div>

          {error && (
            <div className="mt-6 text-accent-error text-body-sm text-center">
              {error}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};