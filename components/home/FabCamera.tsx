import React from 'react';
import { CameraSparklesIcon } from '../Icons';

interface FabCameraProps {
    onClick: () => void;
}

export const FabCamera: React.FC<FabCameraProps> = ({ onClick }) => (
    <div className="fab-container animate-[fadeIn_0.3s_ease-out]" style={{ animation: 'fadeIn 0.3s ease-out' }}>
        <button 
            onClick={onClick}
            className="bg-[linear-gradient(135deg,#DFF2FF_29.6%,#FFC3EB_79.85%)] rounded-full p-5 shadow-1 transform active:scale-95 transition-transform duration-150 ease-out focus:outline-none focus:ring-4 focus:ring-[#FFC3EB]/50"
            aria-label="Add new meal">
          <CameraSparklesIcon className="w-8 h-8" />
        </button>
    </div>
);