import React from 'react';

interface CircularProgressProps {
  size: number; // in pixels
  strokeWidth: number; // in pixels
  progress: number; // 0 to 1
  bgColorClass?: string;
  fgColorClass?: string;
  children?: React.ReactNode;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  size,
  strokeWidth,
  progress,
  bgColorClass = "stroke-[var(--bg-fill)]",
  fgColorClass = "stroke-accent-green",
  children,
}) => {
  const viewBox = `0 0 ${size} ${size}`;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const offset = circumference - clampedProgress * circumference;

  return (
    <div className="relative" style={{ width: `${size}px`, height: `${size}px` }}>
      <svg width={size} height={size} viewBox={viewBox} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          className={bgColorClass}
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {clampedProgress > 0.01 && (
            <circle
                className={fgColorClass}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                fill="transparent"
                r={radius}
                cx={size / 2}
                cy={size / 2}
                style={{
                  transition: 'stroke-dashoffset 600ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
            />
        )}
      </svg>
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
};
