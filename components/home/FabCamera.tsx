import React from 'react';
import { CameraSparklesIcon } from '../Icons';

interface FabCameraProps {
    onClick: () => void;
}

export const FabCamera: React.FC<FabCameraProps> = ({ onClick }) => (
    <div className="fab-container animate-[fadeIn_0.3s_ease-out]" style={{ animation: 'fadeIn 0.3s ease-out' }}>
        <button 
            onClick={onClick}
            className="rounded-full p-5 shadow-1 transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#FF6921]/50"
            style={{ 
                background: 'linear-gradient(103deg, #DFF2FF -23.02%, #FFC3FC 16.83%, #FF7F6E 61.18%, #FF6921 85.92%)',
                transition: 'transform 150ms ease-out' 
            }}
            aria-label="Add new meal">
          <CameraSparklesIcon className="w-8 h-8 text-[var(--static-white)]" />
        </button>
    </div>
);