import React, { useState, useEffect } from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  const [displayText, setDisplayText] = useState('');
  const [textIndex, setTextIndex] = useState(0);

  const loadingMessages = [
    'Определяю еду...',
    'Анализирую ингредиенты...',
    'Высчитываю калории...',
    'Определяю макросы...',
    'Оцениваю здоровье...',
    'Готовлю результаты...',
  ];

  // Rotate through messages
  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000); // Change message every 2 seconds

    return () => clearInterval(interval);
  }, []);

  // Typing effect for current message
  useEffect(() => {
    const currentMessage = loadingMessages[textIndex];
    let charIndex = 0;

    const typingInterval = setInterval(() => {
      if (charIndex <= currentMessage.length) {
        setDisplayText(currentMessage.slice(0, charIndex));
        charIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 50); // Typing speed

    return () => clearInterval(typingInterval);
  }, [textIndex]);

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      {/* Circular Spinner */}
      <div className="relative w-16 h-16">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-[var(--bg-fill)]"></div>

        {/* Animated gradient ring */}
        <div
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--colors-orange)] border-r-[var(--colors-blue)]"
          style={{
            animation: 'spin 2s linear infinite',
          }}
        ></div>

        {/* Inner rotating dot */}
        <div
          className="absolute inset-2 rounded-full border-2 border-transparent border-b-[var(--colors-green)]"
          style={{
            animation: 'spin 3s linear infinite reverse',
          }}
        ></div>

        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-[var(--colors-orange)] rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Dynamic Text */}
      <div className="text-center">
        <p className="text-label-primary text-body-lg min-h-[1.5rem]">
          {displayText}
          <span className="animate-pulse">|</span>
        </p>
        {message && <p className="text-label-secondary text-body-sm mt-2">{message}</p>}
      </div>

      {/* Styles */}
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};
