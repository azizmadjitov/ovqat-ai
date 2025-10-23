import React from 'react';

interface SvgIconProps {
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  width?: string | number;
  height?: string | number;
}

/**
 * Universal SVG icon component that applies CSS color to SVG icons.
 * Uses mask-image technique to allow color customization via CSS color property.
 * 
 * Usage:
 * <SvgIcon src="/assets/icons/plus.svg" style={{ color: 'var(--label-primary)' }} />
 */
export const SvgIcon: React.FC<SvgIconProps> = ({ 
  src, 
  alt = '', 
  className = '', 
  style = {},
  width = '1.5rem',
  height = '1.5rem'
}) => {
  return (
    <div
      role="img"
      aria-label={alt}
      className={className}
      style={{
        width,
        height,
        backgroundColor: 'currentColor',
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        ...style
      }}
    />
  );
};
