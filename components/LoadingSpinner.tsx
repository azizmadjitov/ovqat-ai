import React, { useState, useEffect } from 'react';
import { t } from '../i18n';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  const [displayText, setDisplayText] = useState('');
  const [textIndex, setTextIndex] = useState(0);

  const loadingMessages = [
    t('analyzing_food'),
    t('analyzing_ingredients'),
    t('calculating_calories'),
    t('determining_macros'),
    t('assessing_health'),
    t('preparing_results'),
  ];

  // Rotate through messages
  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2500); // Change message every 2.5 seconds

    return () => clearInterval(interval);
  }, [loadingMessages]);

  // Set text immediately without typing effect
  useEffect(() => {
    setDisplayText(loadingMessages[textIndex]);
  }, [textIndex, loadingMessages]);

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      {/* Rolling Rock Spinner */}
      <span className="loader"></span>

      {/* Dynamic Text */}
      <div className="text-center">
        <p className="text-label-primary text-body-lg min-h-[1.5rem] transition-opacity duration-200" style={{ opacity: displayText ? 1 : 0 }}>
          {displayText}
        </p>
        {message && <p className="text-label-secondary text-body-sm mt-2">{message}</p>}
      </div>

      {/* Styles */}
      <style>{`
        .loader {
          position: relative;
          font-size: 16px;
          width: 5.5em;
          height: 5.5em;
        }
        .loader:before {
          content: '';
          position: absolute;
          transform: translate(-50%, -50%) rotate(45deg);
          height: 100%;
          width: 4px;
          background: var(--label-primary);
          left: 50%;
          top: 50%;
        }
        .loader:after {
          content: '';
          position: absolute;
          left: 0.2em;
          bottom: 0.18em;
          width: 1em;
          height: 1em;
          background: linear-gradient(135deg, #DFF2FF 29.6%, #FFC3EB 79.85%);
          border-radius: 15%;
          animation: rollingRock 2.5s cubic-bezier(.79, 0, .47, .97) infinite;
        }
        @keyframes rollingRock {
          0% { transform: translate(0, -1em) rotate(-45deg); }
          5% { transform: translate(0, -1em) rotate(-50deg); }
          20% { transform: translate(1em, -2em) rotate(47deg); }
          25% { transform: translate(1em, -2em) rotate(45deg); }
          30% { transform: translate(1em, -2em) rotate(40deg); }
          45% { transform: translate(2em, -3em) rotate(137deg); }
          50% { transform: translate(2em, -3em) rotate(135deg); }
          55% { transform: translate(2em, -3em) rotate(130deg); }
          70% { transform: translate(3em, -4em) rotate(217deg); }
          75% { transform: translate(3em, -4em) rotate(220deg); }
          100% { transform: translate(0, -1em) rotate(-225deg); }
        }
      `}</style>
    </div>
  );
}
