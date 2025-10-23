import React, { useState } from 'react';
import { t } from '../i18n';
import { authService } from '../src/services/authService';
import { questionnaireService } from '../src/services/questionnaireService';
import { supabase } from '../src/lib/supabase';
import { UserProfile } from '../types';
import { Button } from './Button';

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile | null, phoneNumber: string, needsOnboarding: boolean) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('🇺🇿 +998 ');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate phone number (basic validation)
  // Validate phone number (Uzbek format: +998 YY XXX XX XX)
  const isValidPhone = (phone: string): boolean => {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    // Should have exactly 12 digits (998 + 9 digits)
    return digitsOnly.length === 12 && digitsOnly.startsWith('998');
  };

  // Validate OTP code
  const isValidOTP = (code: string): boolean => {
    return /^\d{6}$/.test(code);
  };

  // Handle phone number submission - create user directly without OTP
  const handlePhoneSubmit = async () => {
    setError(null);

    if (!isValidPhone(phoneNumber)) {
      setError(t('invalid_phone'));
      return;
    }

    // Clean the phone number by removing all non-digit characters (without + prefix)
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
    console.log('Submitting phone number:', cleanPhoneNumber);

    setLoading(true);

    // Create or get user with clean phone number
    const { error, user } = await authService.createUserByPhone(cleanPhoneNumber);
    
    if (error) {
      setLoading(false);
      setError(error);
      return;
    }

    // Check if user needs to complete onboarding
    // Use the questionnaire_completed flag from the user profile
    const needsOnboarding = user ? !user.questionnaire_completed : true;
    
    setLoading(false);
    onLoginSuccess(user || null, cleanPhoneNumber, needsOnboarding);
  };

  // Format phone number as user types
  const handlePhoneChange = (value: string) => {
    // Ensure the prefix is always present
    const prefix = '🇺🇿 +998 ';
    
    // If user tries to delete the prefix, restore it
    if (!value.startsWith(prefix)) {
      setPhoneNumber(prefix);
      return;
    }
    
    // Only allow digits after the prefix
    const afterPrefix = value.slice(prefix.length);
    const digitsOnly = afterPrefix.replace(/\D/g, '');
    
    // Format: +998 YY XXX XX XX
    let formatted = prefix;
    
    if (digitsOnly.length > 0) {
      formatted += digitsOnly.slice(0, 2); // YY
      if (digitsOnly.length > 2) {
        formatted += ' ' + digitsOnly.slice(2, 5); // XXX
      }
      if (digitsOnly.length > 5) {
        formatted += ' ' + digitsOnly.slice(5, 7); // XX
      }
      if (digitsOnly.length > 7) {
        formatted += ' ' + digitsOnly.slice(7, 9); // XX
      }
    }
    
    setPhoneNumber(formatted);
    setError(null);
  };

  // Handle click/focus to position cursor after prefix
  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const prefix = '🇺🇿 +998 ';
    const cursorPosition = input.selectionStart || 0;
    
    // If cursor is before the end of prefix, move it after
    if (cursorPosition < prefix.length) {
      setTimeout(() => {
        input.setSelectionRange(prefix.length, prefix.length);
      }, 0);
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const prefix = '🇺🇿 +998 ';
    
    // Position cursor at the end of prefix
    setTimeout(() => {
      input.setSelectionRange(prefix.length, prefix.length);
    }, 0);
  };

  return (
    <div 
      className="flex flex-col min-h-[100svh] min-h-[100dvh] min-h-screen px-6 bg-bg-base text-label-primary"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      {/* Header - Hidden, using native navbar instead */}

      {/* Main Content - scrollable area */}
      <main className="flex-1 overflow-auto flex flex-col items-center">
        <div className="w-full max-w-sm flex-1 flex flex-col">
          {/* Phone Number Input */}
          <div className="flex flex-col flex-1">
            <div className="flex-1 flex items-center">
              <div className="space-y-6 w-full">
                <div>
                  <label htmlFor="phone" className="block text-title-h3 text-label-primary mb-4">
                    {t('phone_number')}
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onClick={handleInputClick}
                    onFocus={handleInputFocus}
                    placeholder={t('phone_placeholder')}
                    className="w-full h-[56px] px-4 text-body-lg text-label-primary rounded-[16px] focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-fill)' }}
                    disabled={loading}
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="text-accent-error text-body-sm text-center">
                    {error}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Button - stays at bottom */}
            <div className="flex justify-center pb-6 pt-4">
              <Button
                onClick={handlePhoneSubmit}
                disabled={loading || !isValidPhone(phoneNumber)}
                loading={loading}
              >
                {loading ? t('sending') : t('continue')}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};