import React, { useState } from 'react';
import { Meal, DailyGoal } from '../types';
import { Header } from './home/Header';
import { MacroCard } from './home/MacroCard';
import { RecentlyLoggedList } from './home/RecentlyLoggedList';
import { FabCamera } from './home/FabCamera';
import { CalendarStrip } from './home/CalendarStrip';
import { t } from '../i18n';

interface HomeScreenProps {
  meals: Meal[];
  dailyGoal: DailyGoal | null;
  mealsLoading: boolean;
  appReady: boolean; // New prop to indicate app is fully initialized
  onOpenCamera: () => void;
  onMealClick: (meal: Meal) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ meals, dailyGoal, mealsLoading, appReady, onOpenCamera, onMealClick }) => {
  // ============================================================================
  // State & Date Management
  // ============================================================================
  
  // Use local date to avoid timezone issues
  const getTodayDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
  
  const todayDate = getTodayDate();
  const isSelectedDateTodayOrFuture = selectedDate >= todayDate;
  
  // ============================================================================
  // Data Filtering & Calculations
  // ============================================================================
  
  // Filter and sort meals for selected date (newest first)
  const mealsForSelectedDate = meals
    .filter(meal => meal.date === selectedDate)
    .sort((a, b) => b.id.localeCompare(a.id));
  
  // Calculate consumed calories and macros
  const consumedCalories = mealsForSelectedDate.reduce(
    (sum, meal) => sum + meal.calories, 
    0
  );
  
  const consumedMacros = mealsForSelectedDate.reduce(
    (sum, meal) => ({
      protein: sum.protein + meal.macros.protein,
      fat: sum.fat + meal.macros.fat,
      carbs: sum.carbs + meal.macros.carbs,
      fiber: (sum.fiber || 0) + (meal.macros.fiber || 0),
    }), 
    { protein: 0, fat: 0, carbs: 0, fiber: 0 }
  );

  // ============================================================================
  // Loading State
  // ============================================================================
  
  if (!dailyGoal) {
    return (
      <div className="min-h-screen bg-bg-base text-label-primary flex items-center justify-center">
        <div className="text-body-lg">{t('loading')}</div>
      </div>
    );
  }

  // ============================================================================
  // Render
  // ============================================================================
  
  return (
    <div 
      className="min-h-screen bg-bg-base text-label-primary"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      {/* Calendar Strip */}
      <section className="px-4 pt-4">
        <CalendarStrip 
          meals={meals} 
          dailyGoalCalories={dailyGoal.calories}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />
      </section>
      
      {/* Main Content Area */}
      <main className="px-6 pt-4 pb-32">
        {/* Macro Summary Card */}
        <MacroCard
          consumedCalories={consumedCalories}
          goalCalories={dailyGoal.calories}
          consumedMacros={consumedMacros} 
          goalMacros={dailyGoal.macros} 
        />

        {/* Meal History List */}
        <RecentlyLoggedList 
          meals={mealsForSelectedDate}
          mealsLoading={mealsLoading}
          onMealClick={onMealClick} 
        />
      </main>
      
      {/* Floating Action Button (Camera) - only show when app is fully ready */}
      {isSelectedDateTodayOrFuture && appReady && <FabCamera onClick={onOpenCamera} />}
    </div>
  );
};