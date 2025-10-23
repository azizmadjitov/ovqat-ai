import React from 'react';
import { CircularProgress } from '../CircularProgress';
import { Meal } from '../../types';
import { t } from '../../i18n';

type DayData = {
  date: string; // YYYY-MM-DD format
  day: number;
  weekday: string;
  isPast: boolean;
  isFuture: boolean;
  isToday: boolean;
  progress: number; // 0 to 1
};

// Helper function to generate week days centered on today
const generateWeekDays = (meals: Meal[], dailyGoalCalories: number): DayData[] => {
  const today = new Date();
  const days: DayData[] = [];
  
  // Start from 3 days ago to show a centered week view
  for (let i = -3; i <= 3; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const dayOfMonth = date.getDate();
    const weekdayKeys = ['day_sun', 'day_mon', 'day_tue', 'day_wed', 'day_thu', 'day_fri', 'day_sat'];
    const weekday = t(weekdayKeys[date.getDay()] as any);
    
    // Calculate progress based on meals for this date
    const dayMeals = meals.filter(meal => meal.date === dateStr);
    const consumedCalories = dayMeals.reduce((sum, meal) => sum + meal.calories, 0);
    const progress = dailyGoalCalories > 0 ? Math.min(1, consumedCalories / dailyGoalCalories) : 0;
    
    const isPast = i < 0;
    const isFuture = i > 0;
    const isToday = i === 0;
    
    days.push({
      date: dateStr,
      day: dayOfMonth,
      weekday,
      isPast,
      isFuture,
      isToday,
      progress,
    });
  }
  
  return days;
};

interface DayItemProps {
  dayData: DayData;
  isSelected: boolean;
  onClick: () => void;
}

const DayItem: React.FC<DayItemProps> = ({ dayData, isSelected, onClick }) => {
  const { day, weekday, isFuture, progress, isToday } = dayData;

  const textColor = isSelected ? 'text-label-opposite' : isFuture ? 'text-label-secondary' : 'text-label-primary';
  const weekdayColor = isFuture ? 'text-label-secondary' : 'text-label-primary';

  return (
    <button
      onClick={onClick}
      disabled={isFuture}
      className={`flex flex-col items-center justify-center gap-1 h-full p-1 rounded-lg focus:outline-none focus:ring-2 ring-accent-green ring-offset-1 ring-offset-bg-base ${
        isFuture ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
      }`}
      aria-label={`Day ${day}, ${weekday}${isToday ? ' (today)' : ''}${isFuture ? ' (future)' : ''}`}
    >
      <div
        className={`w-[1.75rem] h-[1.75rem] flex items-center justify-center rounded-full transition-colors ${
          isSelected ? 'bg-label-primary' : ''
        }`}
      >
        <span 
          className="text-label-md"
          style={{
            color: isSelected ? 'var(--label-opposite)' : undefined
          }}
        >
          {day}
        </span>
      </div>
      <span className={`text-body-sm ${weekdayColor}`}>{weekday}</span>
      <div className="w-[1.75rem] h-[1.75rem]">
        <CircularProgress size={28} strokeWidth={6} progress={progress} />
      </div>
    </button>
  );
};

interface CalendarStripProps {
  meals: Meal[];
  dailyGoalCalories: number;
  selectedDate: string; // YYYY-MM-DD format
  onDateSelect: (date: string) => void;
}

export const CalendarStrip: React.FC<CalendarStripProps> = ({ 
  meals, 
  dailyGoalCalories, 
  selectedDate, 
  onDateSelect 
}) => {
  const days = generateWeekDays(meals, dailyGoalCalories);

  return (
    <div className="w-full h-full grid grid-cols-7">
      {days.map((day) => (
        <DayItem
          key={day.date}
          dayData={day}
          isSelected={day.date === selectedDate}
          onClick={() => onDateSelect(day.date)}
        />
      ))}
    </div>
  );
};