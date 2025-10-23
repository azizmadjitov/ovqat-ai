import React, { useState, useEffect } from 'react';
import { QuestionnaireData } from '../types';
import { Button } from './Button';
import { t } from '../i18n';
import { questionnaireService } from '../src/services/questionnaireService';
import { supabase } from '../src/lib/supabase';

interface QuestionnaireScreenProps {
  phoneNumber: string;
  onComplete: () => void;
}

export const QuestionnaireScreen: React.FC<QuestionnaireScreenProps> = ({
  phoneNumber,
  onComplete,
}) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<QuestionnaireData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const totalSteps = 8;

  // Initialize user on mount
  useEffect(() => {
    const initUser = async () => {
      try {
        // Get userId from localStorage (set by authService)
        const storedUserId = localStorage.getItem('ovqat-user-id');
        if (storedUserId) {
          setUserId(storedUserId);
          // Clean the phone number by removing all non-digit characters and adding the + prefix
          const cleanPhoneNumber = '+' + phoneNumber.replace(/\D/g, '');
          // Upsert user in database
          await questionnaireService.upsertUser(cleanPhoneNumber, storedUserId);
        } else {
          console.log('No userId found in localStorage');
        }
      } catch (error) {
        console.error('Error initializing user:', error);
      }
    };
    initUser();
  }, [phoneNumber]);

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Submit form
      await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    console.log('handleSubmit called, current userId:', userId);
    
    // Get userId from localStorage or state
    let currentUserId = userId || localStorage.getItem('ovqat-user-id');
    
    if (!currentUserId) {
      setError('User ID not found. Please restart the app.');
      return;
    }
    
    console.log('Proceeding with questionnaire submission for user:', currentUserId);
    console.log('Form data:', formData);

    setLoading(true);
    setError(null);

    try {
      const result = await questionnaireService.saveQuestionnaireData(
        currentUserId,
        formData as QuestionnaireData
      );

      setLoading(false);

      if (result.success) {
        console.log('✅ Questionnaire saved successfully');
        onComplete();
      } else {
        setError(result.error || 'Failed to save questionnaire data');
      }
    } catch (error) {
      console.error('Unexpected error saving questionnaire:', error);
      setLoading(false);
      setError('Failed to save questionnaire: ' + (error as Error).message);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const isStepValid = (): boolean => {
    switch (step) {
      case 1:
        return !!formData.gender;
      case 2:
        return !!formData.birth_year && formData.birth_year >= 1924 && formData.birth_year <= 2014;
      case 3:
        return !!formData.workout_freq;
      case 4:
        return !!formData.weight && formData.weight >= 30 && formData.weight <= 300;
      case 5:
        return !!formData.height && formData.height >= 120 && formData.height <= 220;
      case 6:
        return !!formData.primary_goal;
      case 7:
        return !!formData.activity_level;
      case 8:
        return !!formData.diet_type;
      default:
        return false;
    }
  };

  const getStepTitle = (): string => {
    switch (step) {
      case 1:
        return t('q_gender_title');
      case 2:
        return t('q_birth_year_title');
      case 3:
        return t('q_workout_title');
      case 4:
        return t('q_weight_title');
      case 5:
        return t('q_height_title');
      case 6:
        return t('q_goal_title');
      case 7:
        return t('q_activity_title');
      case 8:
        return t('q_diet_title');
      default:
        return '';
    }
  };

  const renderStep = () => {
    switch (step) {
      // Step 1: Gender
      case 1:
        return (
          <div className="space-y-4">
            <button
              onClick={() => setFormData({ ...formData, gender: 'male' })}
              className="w-full min-h-[72px] text-label-lg rounded-[24px] transition-all duration-150 text-label-primary flex items-center gap-3 active:scale-[0.98]"
              style={
                formData.gender === 'male'
                  ? {
                      backgroundColor: 'rgba(62, 211, 79, 0.20)',
                      border: '2px solid var(--colors-green)',
                      padding: '0 1rem',
                    }
                  : {
                      backgroundColor: 'var(--bg-elevation)',
                      border: '1px solid var(--stroke-non-opaque)',
                      padding: '0 calc(1rem + 1px)',
                    }
              }
            >
              <img src="assets/img/male.png" alt="Male" className="w-[40px] h-[40px]" />
              {t('q_gender_male')}
            </button>
            <button
              onClick={() => setFormData({ ...formData, gender: 'female' })}
              className="w-full min-h-[72px] text-label-lg rounded-[24px] transition-all duration-150 text-label-primary flex items-center gap-3 active:scale-[0.98]"
              style={
                formData.gender === 'female'
                  ? {
                      backgroundColor: 'rgba(62, 211, 79, 0.20)',
                      border: '2px solid var(--colors-green)',
                      padding: '0 1rem',
                    }
                  : {
                      backgroundColor: 'var(--bg-elevation)',
                      border: '1px solid var(--stroke-non-opaque)',
                      padding: '0 calc(1rem + 1px)',
                    }
              }
            >
              <img src="assets/img/female.png" alt="Female" className="w-[40px] h-[40px]" />
              {t('q_gender_female')}
            </button>
          </div>
        );

      // Step 2: Birth year
      case 2:
        return (
          <input
            id="birth_year"
            type="number"
            value={formData.birth_year || ''}
            onChange={(e) =>
              setFormData({ ...formData, birth_year: parseInt(e.target.value) || 0 })
            }
            placeholder="1990"
            min="1924"
            max="2014"
            className="w-full h-[56px] px-4 text-body-lg text-label-primary rounded-[16px] focus:outline-none"
            style={{ backgroundColor: 'rgba(180, 184, 204, 0.14)' }}
            autoFocus
          />
        );

      // Step 3: Workout frequency
      case 3:
        return (
          <div className="space-y-4">
            {[
              { value: 'rarely', label: t('q_workout_rarely'), caption: t('q_workout_rarely_desc'), icon: 'football-ball.png' },
              { value: 'regularly', label: t('q_workout_regularly'), caption: t('q_workout_regularly_desc'), icon: 'fitness.png' },
              { value: 'very_active', label: t('q_workout_very_active'), caption: t('q_workout_very_active_desc'), icon: 'sport-bag.png' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  setFormData({
                    ...formData,
                    workout_freq: option.value as QuestionnaireData['workout_freq'],
                  })
                }
                className="w-full min-h-[72px] rounded-[24px] transition-all duration-150 flex items-center gap-3 active:scale-[0.98]"
                style={
                  formData.workout_freq === option.value
                    ? {
                        backgroundColor: 'rgba(62, 211, 79, 0.20)',
                        border: '2px solid var(--colors-green)',
                        padding: '0 1rem',
                      }
                    : {
                        backgroundColor: 'var(--bg-elevation)',
                        border: '1px solid var(--stroke-non-opaque)',
                        padding: '0 calc(1rem + 1px)',
                      }
                }
              >
                <img src={`assets/img/${option.icon}`} alt={option.label} className="w-[40px] h-[40px]" />
                <div className="flex flex-col text-left" style={{ gap: '2px' }}>
                  <span className="text-label-lg text-label-primary">{option.label}</span>
                  <span className="text-body-sm text-label-secondary">{option.caption}</span>
                </div>
              </button>
            ))}
          </div>
        );

      // Step 4: Weight
      case 4:
        return (
          <div>
            <input
              id="weight"
              type="number"
              value={formData.weight || ''}
              onChange={(e) =>
                setFormData({ ...formData, weight: parseInt(e.target.value) || 0 })
              }
              placeholder="70"
              min="30"
              max="300"
              className="w-full h-[56px] px-4 text-body-lg text-label-primary rounded-[16px] focus:outline-none"
              style={{ backgroundColor: 'rgba(180, 184, 204, 0.14)' }}
              autoFocus
            />
            <div className="text-body-lg text-label-secondary mt-4 text-center">
              kg
            </div>
          </div>
        );

      // Step 5: Height
      case 5:
        return (
          <div>
            <input
              id="height"
              type="number"
              value={formData.height || ''}
              onChange={(e) =>
                setFormData({ ...formData, height: parseInt(e.target.value) || 0 })
              }
              placeholder="170"
              min="120"
              max="220"
              className="w-full h-[56px] px-4 text-body-lg text-label-primary rounded-[16px] focus:outline-none"
              style={{ backgroundColor: 'rgba(180, 184, 204, 0.14)' }}
              autoFocus
            />
            <div className="text-body-lg text-label-secondary mt-4 text-center">
              cm
            </div>
          </div>
        );

      // Step 6: Primary goal
      case 6:
        return (
          <div className="space-y-4">
            {[
              { value: 'lose', label: t('q_goal_lose'), icon: 'weights.png' },
              { value: 'maintain', label: t('q_goal_maintain'), icon: 'fitness-1.png' },
              { value: 'gain', label: t('q_goal_gain'), icon: 'body.png' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  setFormData({
                    ...formData,
                    primary_goal: option.value as QuestionnaireData['primary_goal'],
                  })
                }
                className="w-full min-h-[72px] text-label-lg rounded-[24px] transition-all duration-150 text-label-primary flex items-center gap-3 active:scale-[0.98]"
                style={
                  formData.primary_goal === option.value
                    ? {
                        backgroundColor: 'rgba(62, 211, 79, 0.20)',
                        border: '2px solid var(--colors-green)',
                        padding: '0 1rem',
                      }
                    : {
                        backgroundColor: 'var(--bg-elevation)',
                        border: '1px solid var(--stroke-non-opaque)',
                        padding: '0 calc(1rem + 1px)',
                      }
                }
              >
                <img src={`assets/img/${option.icon}`} alt={option.label} className="w-[40px] h-[40px]" />
                {option.label}
              </button>
            ))}
          </div>
        );

      // Step 7: Activity level
      case 7:
        return (
          <div className="space-y-4">
            {[
              { value: 'sedentary', label: t('q_activity_sedentary'), caption: t('q_activity_sedentary_desc'), icon: 'level-1.png' },
              { value: 'light', label: t('q_activity_light'), caption: t('q_activity_light_desc'), icon: 'level-2.png' },
              { value: 'moderate', label: t('q_activity_moderate'), caption: t('q_activity_moderate_desc'), icon: 'level-3.png' },
              { value: 'very_active', label: t('q_activity_very_active'), caption: t('q_activity_very_active_desc'), icon: 'level-4.png' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  setFormData({
                    ...formData,
                    activity_level: option.value as QuestionnaireData['activity_level'],
                  })
                }
                className="w-full min-h-[72px] rounded-[24px] transition-all duration-150 flex items-center gap-3 active:scale-[0.98]"
                style={
                  formData.activity_level === option.value
                    ? {
                        backgroundColor: 'rgba(62, 211, 79, 0.20)',
                        border: '2px solid var(--colors-green)',
                        padding: '0 1rem',
                      }
                    : {
                        backgroundColor: 'var(--bg-elevation)',
                        border: '1px solid var(--stroke-non-opaque)',
                        padding: '0 calc(1rem + 1px)',
                      }
                }
              >
                <img src={`assets/img/${option.icon}`} alt={option.label} className="w-[40px] h-[40px]" />
                <div className="flex flex-col text-left" style={{ gap: '2px' }}>
                  <span className="text-label-lg text-label-primary">{option.label}</span>
                  <span className="text-body-sm text-label-secondary">{option.caption}</span>
                </div>
              </button>
            ))}
          </div>
        );

      // Step 8: Diet type
      case 8:
        return (
          <div className="space-y-4">
            {[
              { value: 'balanced', label: t('q_diet_balanced'), icon: 'balance.png' },
              { value: 'pescetarian', label: t('q_diet_pescetarian'), icon: 'fish.png' },
              { value: 'vegetarian', label: t('q_diet_vegetarian'), icon: 'apple.png' },
              { value: 'vegan', label: t('q_diet_vegan'), icon: 'fiber.png' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  setFormData({
                    ...formData,
                    diet_type: option.value as QuestionnaireData['diet_type'],
                  })
                }
                className="w-full min-h-[72px] text-label-lg rounded-[24px] transition-all duration-150 text-label-primary flex items-center gap-3 active:scale-[0.98]"
                style={
                  formData.diet_type === option.value
                    ? {
                        backgroundColor: 'rgba(62, 211, 79, 0.20)',
                        border: '2px solid var(--colors-green)',
                        padding: '0 1rem',
                      }
                    : {
                        backgroundColor: 'var(--bg-elevation)',
                        border: '1px solid var(--stroke-non-opaque)',
                        padding: '0 calc(1rem + 1px)',
                      }
                }
              >
                <img src={`assets/img/${option.icon}`} alt={option.label} className="w-[40px] h-[40px]" />
                {option.label}
              </button>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      className="flex flex-col min-h-[100svh] min-h-[100dvh] min-h-screen bg-bg-base text-label-primary"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      {/* Fixed Header */}
      <div className="flex-shrink-0 px-6 pt-4 pb-2">
        {/* Progress bar */}
        <div className="mb-4 flex justify-center">
          <div 
            className="h-[12px] w-[120px] rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--bg-fill)' }}
          >
            <div
              className="h-full transition-all duration-300 rounded-r-full"
              style={{ 
                width: `${(step / totalSteps) * 100}%`,
                backgroundColor: 'var(--colors-orange)'
              }}
            />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-title-h3 text-label-primary text-center">{getStepTitle()}</h2>
      </div>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto px-6">
        <div className="flex flex-col items-center py-3">
          <div className="w-full max-w-sm">
            {renderStep()}
          </div>
        </div>
      </main>

      {/* Fixed Footer */}
      <div className="flex-shrink-0 px-6 py-3 flex justify-center">
        {error && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-accent-error text-body-sm">
            {error}
          </div>
        )}
        <Button onClick={handleNext} disabled={!isStepValid() || loading} loading={loading}>
          {step === totalSteps ? t('complete') : t('continue')}
        </Button>
      </div>
    </div>
  );
};