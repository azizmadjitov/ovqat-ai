import React from 'react';

interface PlusIconProps {
  className?: string;
  style?: React.CSSProperties;
}

export const PlusIcon: React.FC<PlusIconProps> = ({ className = '', style }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={style}
  >
    <path
      d="M12 5V19M5 12H19"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
