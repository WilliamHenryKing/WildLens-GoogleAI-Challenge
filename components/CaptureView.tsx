
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Icon } from './Icon';

interface CaptureViewProps {
  onFileUpload: (file: File) => void;
  error: string | null;
}

export const CaptureView: React.FC<CaptureViewProps> = ({ onFileUpload, error }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  }, [onFileUpload]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const closeCamera = useCallback(() => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setIsCameraOpen(false);
    setIsRecording(false);
    mediaRecorderRef.current = null;
    recordedChunks.current = [];
  }, [stream]);

  const openCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera access is not supported by your browser.");
        return;
    }
    setCameraError(null);
    try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: true
        });
        setStream(mediaStream);
        setIsCameraOpen(true);
    } catch (err) {
        console.error("Camera access error:", err);
        let message = "An unknown error occurred while accessing the camera.";
        if (err instanceof Error) {
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                message = "Camera permission denied. Please enable it in your browser settings.";
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                message = "No camera found on this device.";
            } else {
                message = "Could not access the camera. Please ensure it's not in use by another app.";
            }
        }
        setCameraError(message);
    }
  };

  useEffect(() => {
    if (isCameraOpen && videoRef.current && stream) {
        videoRef.current.srcObject = stream;
    }
    return () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };
  }, [isCameraOpen, stream]);

  const capturePhoto = () => {
    if (videoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(blob => {
                if (blob) {
                    const file = new File([blob], `sighting-${Date.now()}.png`, { type: 'image/png' });
                    onFileUpload(file);
                    closeCamera();
                }
            }, 'image/png');
        }
    }
  };

  const startRecording = () => {
    if (stream) {
        recordedChunks.current = [];
        const options = { mimeType: 'video/webm; codecs=vp8' };
        try {
            mediaRecorderRef.current = new MediaRecorder(stream, options);
        } catch (e) {
            mediaRecorderRef.current = new MediaRecorder(stream);
        }

        mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.current.push(event.data);
            }
        };
        mediaRecorderRef.current.onstop = () => {
            const mimeType = mediaRecorderRef.current?.mimeType || 'video/webm';
            const fileExtension = mimeType.split('/')[1]?.split(';')[0] || 'webm';
            const blob = new Blob(recordedChunks.current, { type: mimeType });
            const file = new File([blob], `sighting-${Date.now()}.${fileExtension}`, { type: mimeType });
            onFileUpload(file);
            closeCamera();
        };
        mediaRecorderRef.current.start();
        setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
    }
  };

  if (isCameraOpen) {
    return (
      <div className="w-full max-w-2xl text-center">
        <div className="bg-black rounded-2xl shadow-warm-lg p-2 sm:p-4 relative aspect-[4/3] w-full overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-xl"></video>
          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full z-10">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              REC
            </div>
          )}
           <button onClick={closeCamera} aria-label="Close camera" className="absolute top-2 right-2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors z-10">
              <Icon name="close" className="h-6 w-6"/>
          </button>
        </div>
        {cameraError && (
             <div className="mt-4 bg-danger-surface border border-danger text-danger px-4 py-3 rounded-2xl relative" role="alert">
                <strong className="font-bold">Camera Error! </strong>
                <span className="block sm:inline">{cameraError}</span>
            </div>
        )}
        <div className="mt-6 flex justify-center items-center gap-4">
            <button 
                onClick={capturePhoto} 
                disabled={isRecording} 
                className="p-4 rounded-full bg-surface text-ink font-semibold hover:bg-dune transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                aria-label="Capture Photo"
            >
              <Icon name="camera" className="w-6 h-6" />
            </button>
            <button 
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-4 rounded-full font-semibold transition-colors flex items-center justify-center ${
                    isRecording 
                    ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse' 
                    : 'bg-surface text-ink hover:bg-dune'
                }`}
                aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
            >
              <Icon name={isRecording ? 'stop' : 'video'} className="w-6 h-6" />
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl text-center">
      <div className="bg-surface rounded-3xl shadow-warm-lg p-8 sm:p-12 transition-all">
        <div className="space-y-4">
            <Icon name="logo" className="w-20 h-20 mx-auto text-primary" />
            <h2 className="text-4xl font-bold font-headline text-ink">Your AI Field Biologist</h2>
            <p className="text-muted max-w-md mx-auto text-lg">
                Submit a photo, video, or sound of wildlife. Gem, your AI guide, will create a detailed Sighting Report.
            </p>
        </div>
        
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          className={`mt-8 p-8 border-2 border-dashed rounded-2xl transition-all duration-300 ${isDragging ? 'border-secondary bg-bg' : 'border-outline/50 bg-bg'}`}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept="image/*,video/*,audio/*"
            onChange={handleFileChange}
          />
          <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-4 text-muted">
            <Icon name="upload" className="w-10 h-10" />
            <span className="font-semibold text-ink">Drag & drop or click to upload</span>
            <span className="text-sm">Submit a Sighting Report</span>
          </label>
        </div>

        <div className="my-6 flex items-center text-muted/50" aria-hidden="true">
            <div className="flex-grow border-t border-outline/30"></div>
            <span className="flex-shrink mx-4 text-sm font-medium">OR</span>
            <div className="flex-grow border-t border-outline/30"></div>
        </div>

        <button 
            onClick={openCamera} 
            className="w-full py-4 px-4 rounded-2xl bg-primary text-white font-semibold hover:bg-primary-pressed transition-colors flex items-center justify-center gap-3 text-lg transform active:scale-[0.98]"
        >
            <Icon name="camera" className="w-6 h-6" />
            Use Your Camera
        </button>
        
        {error && (
            <div className="mt-6 bg-danger-surface border border-danger/50 text-danger px-4 py-3 rounded-2xl relative" role="alert">
                <strong className="font-bold">Analysis Failed! </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        )}
        {cameraError && (
            <div className="mt-6 bg-danger-surface border border-danger/50 text-danger px-4 py-3 rounded-2xl relative" role="alert">
                <strong className="font-bold">Camera Error! </strong>
                <span className="block sm:inline">{cameraError}</span>
            </div>
        )}
      </div>
    </div>
  );
};