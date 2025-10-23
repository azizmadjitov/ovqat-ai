import React from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  borderRadius?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  width = '100%', 
  height = '1rem',
  className = '',
  borderRadius = 'rounded'
}) => (
  <div 
    className={`bg-gradient-to-r from-bg-fill via-bg-elevation to-bg-fill animate-pulse ${borderRadius} ${className}`}
    style={{ 
      width, 
      height,
      backgroundSize: '200% 100%',
      animation: 'shimmer 2s infinite'
    }}
  />
);
