import React from 'react';

interface CircleRingProps {
  size: number; // in pixels
  strokeWidth: number; // in pixels
  progress: number; // 0 to 1
  bgColorClass?: string;
  fgColorClass?: string;
  children?: React.ReactNode;
}

export const CircleRing: React.FC<CircleRingProps> = ({
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
      <svg width={size} height={size} viewBox={viewBox} className="-rotate-90">
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
            />
        )}
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
};