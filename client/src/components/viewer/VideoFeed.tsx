import { useRef, useEffect, useState } from 'react';
import { CameraSource } from '../../types';

interface VideoFeedProps {
  source: CameraSource;
  onVideoReady?: (video: HTMLVideoElement) => void;
  className?: string;
  mirrored?: boolean;
}

export default function VideoFeed({
  source,
  onVideoReady,
  className = '',
  mirrored = true
}: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const setupCamera = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Determine constraints based on source type
        const constraints: MediaStreamConstraints = {
          video: source.type === 'webcam'
            ? {
                deviceId: source.deviceId ? { exact: source.deviceId } : undefined,
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: source.deviceId ? undefined : 'user'
              }
            : true,
          audio: false
        };

        // Get user media
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);

        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
          setStream(currentStream);

          // Wait for video to be ready
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play();
              setIsLoading(false);

              // Notify parent component
              if (onVideoReady) {
                onVideoReady(videoRef.current);
              }
            }
          };
        }
      } catch (err: any) {
        console.error('Error accessing camera:', err);
        setError(err.message || 'Failed to access camera');
        setIsLoading(false);
      }
    };

    setupCamera();

    // Cleanup
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [source, onVideoReady]);

  return (
    <div className={`relative bg-black ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4 mx-auto"></div>
            <p>Loading camera...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-75">
          <div className="text-white text-center p-4">
            <p className="font-semibold mb-2">Camera Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        className={`w-full h-full object-cover ${mirrored ? 'scale-x-[-1]' : ''}`}
        playsInline
        muted
      />

      {/* Source indicator */}
      <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
        {source.type === 'webcam' ? '💻 Webcam' : '📱 Mobile'}
        {source.label && ` - ${source.label}`}
      </div>

      {/* Active indicator */}
      {stream && (
        <div className="absolute top-2 right-2">
          <div className="flex items-center space-x-2 bg-green-600 bg-opacity-75 text-white px-2 py-1 rounded text-xs">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>Live</span>
          </div>
        </div>
      )}
    </div>
  );
}
