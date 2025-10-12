import React from 'react';
import { CircularProgress } from '../CircularProgress';
import { t } from '../../i18n';

const caloriesIcon = '/assets/img/calories.png';

interface CaloriesCardProps {
  caloriesLeft: number;
  caloriesGoal: number;
}

export const CaloriesCard: React.FC<CaloriesCardProps> = ({ caloriesLeft, caloriesGoal }) => {
  const consumedCalories = caloriesGoal > 0 ? caloriesGoal - caloriesLeft : 0;
  const progress = caloriesGoal > 0 ? consumedCalories / caloriesGoal : 0;

  return (
    <div className="w-full bg-bg-surface rounded-2xl p-4 flex justify-between items-center shadow-1">
      <div>
        <p className="text-[56px] font-black leading-none tracking-tighter text-label-primary">{Math.round(Math.max(0, caloriesLeft))}</p>
        <p className="text-body-lg text-label-secondary mt-1">{t('calories_left')}</p>
      </div>
      <CircularProgress size={64} strokeWidth={8} progress={progress}>
        <img src={caloriesIcon} alt="Calories icon" className="w-5 h-5" />
      </CircularProgress>
    </div>
  );
};