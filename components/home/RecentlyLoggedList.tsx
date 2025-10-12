import React from 'react';
import { Meal } from '../../types';
import { LogItem } from './LogItem';
import { t } from '../../i18n';

interface RecentlyLoggedListProps {
    meals: Meal[];
    onMealClick: (meal: Meal) => void;
}

export const RecentlyLoggedList: React.FC<RecentlyLoggedListProps> = ({ meals, onMealClick }) => (
    <div className="w-full mt-4 flex-1 pb-24">
        <h2 className="text-title-h3 text-label-primary mb-4">{t('todays_meals')}</h2>
        <div className="space-y-4 overflow-y-auto">
            {meals.length > 0 ? (
                 meals.map(meal => <LogItem key={meal.id} meal={meal} onClick={() => onMealClick(meal)} />)
            ) : (
                <div className="text-center pt-8">
                    <p className="text-body-md text-label-secondary">{t('no_meals_yet')}</p>
                    <p className="text-body-sm text-label-secondary mt-1">{t('add_first_meal_prompt')}</p>
                </div>
            )}
        </div>
    </div>
);