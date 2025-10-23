import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CameraIcon, CloseIcon } from './Icons';

interface CameraScreenProps {
  onPhotoTaken: (imageDataUrl: string, imageFile?: File) => void;
  onCancel: () => void;
}

export const CameraScreen: React.FC<CameraScreenProps> = ({ onPhotoTaken, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraDenied, setCameraDenied] = useState(false);
  const [showPermissionScreen, setShowPermissionScreen] = useState(false);

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
      setCameraDenied(true);
      setShowPermissionScreen(true);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File input changed, files:", event.target.files);
    const file = event.target.files?.[0];
    if (file) {
      console.log("Processing file:", file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          console.log("File read successfully, data URL length:", dataUrl.length);
          // Pass both data URL and File object
          onPhotoTaken(dataUrl, file);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
            const dataUrl = canvas.toDataURL('image/jpeg');
            onPhotoTaken(dataUrl, file);
            stream?.getTracks().forEach(track => track.stop());
          }
        }, 'image/jpeg', 0.85);
      }
    }
  };

  const triggerFileUpload = () => {
    console.log("Upload button clicked, triggering file input click");
    console.log("File input ref exists:", !!fileInputRef.current);
    if (fileInputRef.current) {
      // Reset the value to ensure onChange fires even if same file is selected
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    } else {
      console.error("File input ref is null");
      // Fallback: create a new input element
      console.log("Creating fallback input element");
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        console.log("Fallback input changed");
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
          console.log("Processing file with fallback:", file.name);
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            if (dataUrl) {
              console.log("File read successfully with fallback, data URL length:", dataUrl.length);
              // Pass both data URL and File object
              onPhotoTaken(dataUrl, file);
            }
          };
          reader.readAsDataURL(file);
        }
      };

      input.click();
    }
  };

  // Show permission screen when camera is denied
  if (showPermissionScreen) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 p-6">
        <button onClick={onCancel} className="absolute top-6 right-6 text-white bg-overlay-dark rounded-full p-2">
          <CloseIcon className="w-6 h-6" />
        </button>
        
        <div className="text-white text-center mb-8 max-w-md">
          <h2 className="text-2xl font-bold mb-4">Camera Access Needed</h2>
          <p className="text-lg mb-6">To take photos of your meals, we need access to your camera.</p>
          <p className="text-lg mb-6">If you prefer, you can upload a photo from your library instead.</p>
        </div>
        
        <div className="flex flex-col space-y-4 w-full max-w-xs">
          <button
            onClick={triggerFileUpload}
            className="px-6 py-4 rounded-full font-bold text-lg"
            style={{ backgroundColor: 'var(--static-white)', color: 'var(--static-black)' }}
          >
            Upload from Library
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-4 bg-gray-700 text-white rounded-full font-bold text-lg"
          >
            Cancel
          </button>
        </div>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </div>
    );
  }

  // Normal camera operation
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover"
      />
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      <button onClick={onCancel} className="absolute top-6 right-6 text-white bg-overlay-dark rounded-full p-2">
        <CloseIcon className="w-6 h-6" />
      </button>

      <div className="absolute bottom-8 flex items-center justify-center">
        <button
          onClick={handleCapture}
          className="w-20 h-20 rounded-full border-4 flex items-center justify-center"
          style={{ borderColor: 'var(--static-white)', backgroundColor: 'rgba(255,255,255,0.3)' }}
          aria-label="Take picture"
        >
          {/* Camera icon removed as requested */}
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};