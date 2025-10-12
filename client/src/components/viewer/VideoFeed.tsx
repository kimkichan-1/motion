import { useRef, useEffect, useState } from 'react';
import { CameraSource } from '../../types';
import PoseOverlay from './PoseOverlay';
import { useMediaPipe } from '../../hooks/useMediaPipe';
import { useMotionStore } from '../../store/motionStore';

interface VideoFeedProps {
  source: CameraSource;
  onVideoReady?: (video: HTMLVideoElement) => void;
  className?: string;
  mirrored?: boolean;
  enablePoseDetection?: boolean;
}

export default function VideoFeed({
  source,
  onVideoReady,
  className = '',
  mirrored = true,
  enablePoseDetection = true
}: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [dimensions, setDimensions] = useState({ width: 640, height: 480 });

  const { addMotionData } = useMotionStore();

  // Initialize MediaPipe
  const {
    isInitialized: mediaPipeReady,
    startProcessing,
    stopProcessing,
    error: mediaPipeError
  } = useMediaPipe({
    onResults: (motionData) => {
      addMotionData(motionData);
    }
  });

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

              // Get video dimensions
              const { videoWidth, videoHeight } = videoRef.current;
              setDimensions({ width: videoWidth, height: videoHeight });

              setIsLoading(false);

              // Notify parent component
              if (onVideoReady) {
                onVideoReady(videoRef.current);
              }

              // Start MediaPipe processing if enabled
              if (enablePoseDetection && mediaPipeReady) {
                startProcessing(videoRef.current, overlayCanvasRef.current || undefined);
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
      stopProcessing();
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [source, onVideoReady]);

  // Start/stop MediaPipe when ready state changes
  useEffect(() => {
    if (mediaPipeReady && videoRef.current && !isLoading && enablePoseDetection) {
      startProcessing(videoRef.current, overlayCanvasRef.current || undefined);
    }

    return () => {
      stopProcessing();
    };
  }, [mediaPipeReady, isLoading, enablePoseDetection]);

  return (
    <div ref={containerRef} className={`relative bg-black ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-20">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4 mx-auto"></div>
            <p>Loading camera...</p>
            {enablePoseDetection && !mediaPipeReady && (
              <p className="text-xs text-gray-400 mt-2">Initializing pose detection...</p>
            )}
          </div>
        </div>
      )}

      {(error || mediaPipeError) && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-75 z-20">
          <div className="text-white text-center p-4">
            <p className="font-semibold mb-2">Error</p>
            <p className="text-sm">{error || mediaPipeError}</p>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        className={`w-full h-full object-cover ${mirrored ? 'scale-x-[-1]' : ''}`}
        playsInline
        muted
      />

      {/* Pose overlay canvas */}
      {enablePoseDetection && (
        <canvas
          ref={overlayCanvasRef}
          className={`absolute top-0 left-0 w-full h-full pointer-events-none ${mirrored ? 'scale-x-[-1]' : ''}`}
          style={{ zIndex: 10 }}
        />
      )}

      {/* Source indicator */}
      <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
        {source.type === 'webcam' ? '💻 Webcam' : '📱 Mobile'}
        {source.label && ` - ${source.label}`}
      </div>

      {/* Active indicator */}
      {stream && (
        <div className="absolute top-2 right-2 z-10">
          <div className="flex items-center space-x-2 bg-green-600 bg-opacity-75 text-white px-2 py-1 rounded text-xs">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>Live</span>
          </div>
        </div>
      )}

      {/* Pose detection indicator */}
      {enablePoseDetection && mediaPipeReady && (
        <div className="absolute bottom-2 right-2 z-10">
          <div className="flex items-center space-x-2 bg-blue-600 bg-opacity-75 text-white px-2 py-1 rounded text-xs">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span>Pose Detection</span>
          </div>
        </div>
      )}
    </div>
  );
}
