import React from 'react';
import { Meal, DailyGoal } from '../types';
import { t } from '../i18n';
import { Header } from './home/Header';
import { MacroCard } from './home/MacroCard';
import { RecentlyLoggedList } from './home/RecentlyLoggedList';
import { FabCamera } from './home/FabCamera';

interface HomeScreenProps {
  meals: Meal[];
  dailyGoal: DailyGoal;
  onOpenCamera: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ meals, dailyGoal, onOpenCamera }) => {
    const consumedCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
    const consumedMacros = meals.reduce((sum, meal) => ({
        protein: sum.protein + meal.macros.protein,
        fat: sum.fat + meal.macros.fat,
        carbs: sum.carbs + meal.macros.carbs,
    }), { protein: 0, fat: 0, carbs: 0 });

    const caloriesLeft = dailyGoal.calories - consumedCalories;

  return (
    <div className="min-h-screen bg-bg-base text-label-primary flex flex-col">
      <Header />
      
      <main className="flex-1 flex flex-col items-center px-6 pt-8">
        <div className="flex flex-col items-center text-center">
          <span className="text-title-h1 text-label-primary">{caloriesLeft}</span>
          <span className="text-body-md text-label-secondary tracking-widest">{t('kcal_left')}</span>
        </div>
        
        <MacroCard consumedMacros={consumedMacros} goalMacros={dailyGoal.macros} />

        <RecentlyLoggedList meals={meals} />
      </main>
      
      <FabCamera onClick={onOpenCamera} />
    </div>
  );
};