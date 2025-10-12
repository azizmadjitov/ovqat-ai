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
  dailyGoal: DailyGoal;
  onOpenCamera: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ meals, dailyGoal, onOpenCamera }) => {
    // Get today's date in YYYY-MM-DD format
    const getTodayDate = () => new Date().toISOString().split('T')[0];
    
    const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
    
    // Filter meals for the selected date
    const mealsForSelectedDate = meals.filter(meal => meal.date === selectedDate);
    
    const consumedCalories = mealsForSelectedDate.reduce((sum, meal) => sum + meal.calories, 0);
    const consumedMacros = mealsForSelectedDate.reduce((sum, meal) => ({
        protein: sum.protein + meal.macros.protein,
        fat: sum.fat + meal.macros.fat,
        carbs: sum.carbs + meal.macros.carbs,
        // Fiber is not displayed in the main UI, but we'll calculate it for completeness
        fiber: (sum.fiber || 0) + (meal.macros.fiber || 0),
    }), { protein: 0, fat: 0, carbs: 0, fiber: 0 });

  return (
    <div className="min-h-screen bg-bg-base text-label-primary flex flex-col">
      <Header />
      <div className="calendar px-4">
          <CalendarStrip 
            meals={meals} 
            dailyGoalCalories={dailyGoal.calories}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
      </div>
      
      <main className="flex-1 flex flex-col items-center px-6 pt-4">
        <MacroCard
          consumedCalories={consumedCalories}
          goalCalories={dailyGoal.calories}
          consumedMacros={consumedMacros} 
          goalMacros={dailyGoal.macros} 
        />

        <RecentlyLoggedList meals={mealsForSelectedDate} />
      </main>
      
      <FabCamera onClick={onOpenCamera} />
    </div>
  );
};