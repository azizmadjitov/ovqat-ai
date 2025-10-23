import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  loading = false,
  type = 'button',
  className = '',
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        w-auto h-[56px] px-8
        text-label-lg
        rounded-full
        transition-all duration-200 ease-out
        ${
          isDisabled
            ? 'bg-stroke-non-opaque text-label-secondary cursor-not-allowed'
            : 'bg-label-primary cursor-pointer hover:opacity-90 active:opacity-80'
        }
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      style={{
        backgroundColor: isDisabled ? 'rgba(180, 184, 204, 0.28)' : undefined,
        // In active (enabled) state, text color should be label/opposite for proper contrast in both themes
        color: isDisabled ? undefined : 'var(--label-opposite)'
      }}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <span className="animate-pulse">{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
