import React from 'react';
import { t } from '../../i18n';
import { FlameIcon } from '../Icons';

const StreakBadge: React.FC = () => (
  // Outer container for gradient border, sized by content + padding
  <div className="p-[0.125rem] rounded-full bg-gradient-to-br from-[#DFF2FF] via-[#FFC3FC] to-[#FF6921]">
    {/* Inner container sets the height and holds content */}
    <div className="h-[2rem] w-full bg-bg-base rounded-full flex items-center justify-center pl-[0.375rem] pr-[0.625rem] gap-x-[0.375rem]">
      <FlameIcon className="w-[1.25rem] h-[1.25rem] text-label-primary" />
      <span className="text-label-sm text-label-primary whitespace-nowrap">
        1 day streak
      </span>
    </div>
  </div>
);


export const Header: React.FC = () => (
  <header className="h-[3rem] px-4 flex items-center justify-between">
    <h1 className="text-title-h2 text-label-primary flex items-center">{t('app_name')}</h1>
    <StreakBadge />
  </header>
);