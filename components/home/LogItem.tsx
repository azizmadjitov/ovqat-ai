import React from 'react';
import { Meal } from '../../types';

// Using absolute paths as per project convention. Assumes these assets exist.
const imgProtein = '/assets/img/protein.png';
const imgCarbs   = '/assets/img/carbs.png';
const imgFat     = '/assets/img/fat.png';

interface MacroInfoProps {
  icon: string;
  value: number;
  altText: string;
}

const MacroInfo: React.FC<MacroInfoProps> = ({ icon, value, altText }) => (
  <div className="flex items-center">
    <img src={icon} alt={altText} className="w-4 h-4" />
    <span className="ml-1 text-body-md text-label-secondary">{value}g</span>
  </div>
);

interface LogItemProps {
    meal: Meal;
    onClick: () => void;
}

export const LogItem: React.FC<LogItemProps> = ({ meal, onClick }) => (
    <button 
        onClick={onClick}
        className="w-full bg-bg-surface rounded-[1.5rem] p-4 flex items-center space-x-4 border border-stroke-non-opaque text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent-green focus-visible:ring-offset-bg-base transition-transform active:scale-[0.98]"
    >
        <img src={meal.imageUrl} alt={meal.name} className="w-20 h-20 rounded-full object-cover flex-shrink-0" />
        
        <div className="flex-1 overflow-hidden">
            <div className="flex justify-between items-baseline">
                <p className="text-body-md text-label-primary truncate pr-2">{meal.name}</p>
                <p className="text-body-md text-label-secondary flex-shrink-0">{meal.time}</p>
            </div>

            <p className="text-title-h4 text-label-primary">{meal.calories} calories</p>
            
            <div className="flex justify-start items-center gap-x-4 mt-[0.875rem]">
                <MacroInfo icon={imgProtein} value={meal.macros.protein} altText="Protein icon" />
                <MacroInfo icon={imgCarbs} value={meal.macros.carbs} altText="Carbs icon" />
                <MacroInfo icon={imgFat} value={meal.macros.fat} altText="Fat icon" />
            </div>
        </div>
    </button>
);