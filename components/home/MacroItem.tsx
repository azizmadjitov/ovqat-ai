import React from 'react';
import { CircleRing } from '../CircleRing';

interface MacroItemProps {
  label: string;
  consumed: number;
  goal: number;
  icon: string;
}

export const MacroItem: React.FC<MacroItemProps> = ({ label, consumed, goal, icon }) => {
  const progress = goal > 0 ? Math.max(0, consumed) / goal : 0;
  const left = Math.round(goal - consumed);

  return (
    <div className="flex flex-col items-center text-center gap-y-2">
      <p className="text-title-h3 text-label-primary">{Math.max(0, left)}g</p>
      <p className="text-body-md text-label-primary">{label}</p>
      <div className="mt-2">
        <CircleRing 
          size={64} 
          strokeWidth={8} 
          progress={progress}
        >
          <img src={icon} alt={`${label} icon`} className="w-5 h-5" />
        </CircleRing>
      </div>
    </div>
  );
};