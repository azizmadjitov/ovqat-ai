import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CameraIcon, CloseIcon } from './Icons';

interface CameraScreenProps {
  onPhotoTaken: (imageDataUrl: string) => void;
  onCancel: () => void;
}

export const CameraScreen: React.FC<CameraScreenProps> = ({ onPhotoTaken, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera: ", err);
      setError("Could not access the camera. Please check permissions.");
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg');
        onPhotoTaken(dataUrl);
        stream?.getTracks().forEach(track => track.stop());
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover"
      />
      {error && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent-error/80 text-white p-4 rounded-md">{error}</div>}
      
      <button onClick={onCancel} className="absolute top-6 right-6 text-white bg-overlay-dark rounded-full p-2">
        <CloseIcon className="w-6 h-6" />
      </button>

      <div className="absolute bottom-8 flex items-center justify-center">
        <button
          onClick={handleCapture}
          className="w-20 h-20 rounded-full border-4 border-white bg-white/30 flex items-center justify-center"
          aria-label="Take picture"
        >
          {/* Camera icon removed as requested */}
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};