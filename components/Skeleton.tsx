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
    className={`skeleton-shimmer ${borderRadius} ${className}`}
    style={{ width, height }}
  />
);
