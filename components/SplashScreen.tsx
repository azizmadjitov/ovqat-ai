import React from 'react';

export const SplashScreen: React.FC = () => {
  return (
    <div 
      className="flex flex-col items-center justify-center min-h-screen bg-bg-base"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      {/* Logo or App Name */}
      <div className="mb-8">
        <h1 className="text-title-h1 text-label-primary font-bold">Ovqat AI</h1>
      </div>

      {/* Loading Spinner */}
      <div className="relative w-16 h-16">
        <div 
          className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin"
          style={{ 
            borderColor: 'var(--colors-green)',
            borderTopColor: 'transparent'
          }}
        />
      </div>

      {/* Loading Text */}
      <p className="mt-6 text-body-lg text-label-secondary">
        Загрузка...
      </p>
    </div>
  );
};
