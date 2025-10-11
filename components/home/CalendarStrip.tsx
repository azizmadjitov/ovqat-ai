import React, { useState } from 'react';
import { CircularProgress } from '../CircularProgress';

type DayData = {
  day: number;
  weekday: string;
  isPast: boolean;
  isFuture: boolean;
  progress: number; // 0 to 1
};

const MOCK_DAYS: DayData[] = [
  { day: 29, weekday: 'mon', isPast: true, isFuture: false, progress: 1.0 },
  { day: 30, weekday: 'tue', isPast: true, isFuture: false, progress: 0.9 },
  { day: 1, weekday: 'wed', isPast: true, isFuture: false, progress: 1.0 },
  { day: 2, weekday: 'thu', isPast: false, isFuture: false, progress: 0.75 }, // Today
  { day: 3, weekday: 'fri', isPast: false, isFuture: true, progress: 0 },
  { day: 4, weekday: 'sat', isPast: false, isFuture: true, progress: 0 },
  { day: 5, weekday: 'sun', isPast: false, isFuture: true, progress: 0 },
];

interface DayItemProps {
  dayData: DayData;
  isSelected: boolean;
  onClick: () => void;
}

const DayItem: React.FC<DayItemProps> = ({ dayData, isSelected, onClick }) => {
  const { day, weekday, isFuture, progress } = dayData;

  const textColor = isSelected ? 'text-label-on-accent' : isFuture ? 'text-label-secondary' : 'text-label-primary';
  const weekdayColor = isFuture ? 'text-label-secondary' : 'text-label-primary';

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 h-full p-1 rounded-lg focus:outline-none focus:ring-2 ring-accent-green ring-offset-1 ring-offset-bg-base"
      aria-label={`Day ${day}, ${weekday}`}
    >
      <div
        className={`w-[1.75rem] h-[1.75rem] flex items-center justify-center rounded-full transition-colors ${
          isSelected ? 'bg-label-primary' : ''
        }`}
      >
        <span className={`text-label-md ${textColor}`}>{day}</span>
      </div>
      <span className={`text-body-sm ${weekdayColor} capitalize`}>{weekday}</span>
      <div className="w-[1.75rem] h-[1.75rem]">
        <CircularProgress size={28} strokeWidth={6} progress={progress} />
      </div>
    </button>
  );
};

export const CalendarStrip: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState(2);

  return (
    <div className="w-full h-full grid grid-cols-7">
      {MOCK_DAYS.map((day) => (
        <DayItem
          key={day.day}
          dayData={day}
          isSelected={day.day === selectedDay}
          onClick={() => setSelectedDay(day.day)}
        />
      ))}
    </div>
  );
};