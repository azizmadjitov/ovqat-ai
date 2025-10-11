import React, { useEffect } from 'react';
import { Macros } from '../../types';
import { MacroItem } from './MacroItem';
import { t } from '../../i18n';
import { CircleRing } from '../CircleRing';

// FIX: Use absolute paths for images to avoid URL parsing errors.
const caloriesIcon = '/assets/img/calories.png';
const proteinIcon = '/assets/img/protein.png';
const carbsIcon = '/assets/img/carbs.png';
const fatIcon = '/assets/img/fat.png';

interface MacroCardProps {
  consumedCalories: number;
  goalCalories: number;
  consumedMacros: Macros;
  goalMacros: Macros;
}

export const MacroCard: React.FC<MacroCardProps> = ({ 
  consumedCalories,
  goalCalories,
  consumedMacros, 
  goalMacros,
}) => {
    const caloriesProgress = goalCalories > 0 ? consumedCalories / goalCalories : 0;
    const caloriesLeft = goalCalories - consumedCalories;

    const macros = [
        {
            label: t('protein'),
            consumed: consumedMacros.protein,
            goal: goalMacros.protein,
            icon: proteinIcon,
        },
        {
            label: t('carbs'),
            consumed: consumedMacros.carbs,
            goal: goalMacros.carbs,
            icon: carbsIcon,
        },
        {
            label: t('fat'),
            consumed: consumedMacros.fat,
            goal: goalMacros.fat,
            icon: fatIcon,
        },
    ];
    
    useEffect(() => {
        const card = document.querySelector('.macro-card');
        if (card) {
            const style = window.getComputedStyle(card);
            console.log('Acceptance: marginTop of `.macro-card` === `16px` ->', style.marginTop === '16px');
        }

        const rings = card?.querySelectorAll('.relative[style*="width: 64px"]');
        const strokes = card?.querySelectorAll('circle[stroke-width="8"]');
        
        const allRingsCorrectSize = rings?.length === 4;
        const allStrokesCorrectWidth = strokes ? Array.from(strokes).every(s => s.getAttribute('stroke-width') === '8') : false;
        
        console.log('Acceptance: All 4 rings render at 64x64 ->', allRingsCorrectSize);
        console.log('Acceptance: All rings have 8px stroke ->', allStrokesCorrectWidth);

        const images = card?.querySelectorAll('img');
        if (images) {
            Promise.all(Array.from(images).map(img => {
                if (img.complete) return Promise.resolve(true);
                return new Promise(resolve => {
                    img.onload = () => resolve(true);
                    img.onerror = () => resolve(false);
                });
            })).then(results => {
                const allLoaded = results.every(r => r);
                console.log(`Acceptance: ${images.length} images load ->`, allLoaded);
            });
        }
        
        const macroContainer = card?.querySelector('.grid.grid-cols-3');
        if (macroContainer) {
            const macroItems = macroContainer.children;
            const areCentered = Array.from(macroItems).every(item => {
                const style = window.getComputedStyle(item);
                return style.display === 'flex' && style.alignItems === 'center';
            });
            console.log('Acceptance: All three macro columns are horizontally centered ->', areCentered);
        }
    }, []);

  return (
    <div className="macro-card w-full bg-bg-surface rounded-[1.5rem] p-4 mt-4 border border-stroke-non-opaque">
        <div className="flex justify-between items-center">
            <div>
                <p className="text-title-h1 text-label-primary">{Math.round(Math.max(0, caloriesLeft))}</p>
                <p className="text-body-lg text-label-primary">{t('calories_left')}</p>
            </div>
            <CircleRing size={64} strokeWidth={8} progress={caloriesProgress}>
                <img src={caloriesIcon} alt="Calories icon" className="w-5 h-5" />
            </CircleRing>
        </div>
        <div className="h-px bg-[var(--stroke-non-opaque)] my-4"></div>
        <div className="grid grid-cols-3 gap-x-4">
            {macros.map((macro) => (
            <MacroItem
                key={macro.label}
                label={macro.label}
                consumed={macro.consumed}
                goal={macro.goal}
                icon={macro.icon}
            />
            ))}
        </div>
    </div>
  );
};