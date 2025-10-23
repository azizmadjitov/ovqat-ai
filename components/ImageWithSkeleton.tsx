import React, { useEffect, useState } from 'react';
import { Skeleton } from './Skeleton';

interface Props {
  src: string;
  alt: string;
  className?: string;
  width: number;
  height: number;
  rounded?: 'none' | 'rounded' | 'rounded-full' | string;
}

export const ImageWithSkeleton: React.FC<Props> = ({
  src,
  alt,
  className = '',
  width,
  height,
  rounded = 'rounded'
}) => {
  const [loaded, setLoaded] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

  // Guarantee skeleton is visible for at least 200ms to avoid instant flash
  useEffect(() => {
    if (loaded) {
      const timer = setTimeout(() => setShowSkeleton(false), 200);
      return () => clearTimeout(timer);
    }
  }, [loaded]);

  return (
    <div className={`relative inline-block ${className}`} style={{ width, height }}>
      {showSkeleton && (
        <Skeleton width={`${width}px`} height={`${height}px`} borderRadius={typeof rounded === 'string' ? rounded : 'rounded'} />
      )}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`object-cover ${rounded} ${loaded ? 'opacity-100' : 'opacity-0 absolute top-0 left-0'} transition-opacity duration-300`}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
};
