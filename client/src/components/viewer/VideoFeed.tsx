import { useEffect, useRef, useState } from 'react';
import { useMediaPipe } from '../../hooks/useMediaPipe';
import { useMotionStore } from '../../store/motionStore';

interface VideoFeedProps {
  onPoseData?: (data: any) => void;
}

export default function VideoFeed({ onPoseData }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const { addFrame, isRecording } = useMotionStore();

  // Start webcam
  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
            facingMode: 'user'
          },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          setStream(mediaStream);
        }
      } catch (err: any) {
        console.error('Camera access error:', err);
        setCameraError('Failed to access camera. Please grant camera permissions.');
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // MediaPipe pose tracking
  const { isLoading, error: mediapipeError } = useMediaPipe({
    videoElement: videoRef.current,
    onPoseDetected: (poseData) => {
      // Draw pose on canvas
      drawPose(poseData);

      // Add to recording if recording
      if (isRecording) {
        addFrame(poseData);
      }

      // Callback for parent component
      onPoseData?.(poseData);
    }
  });

  const drawPose = (poseData: any) => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw landmarks
    if (poseData.landmarks && poseData.landmarks.length > 0) {
      ctx.fillStyle = '#00ff00';

      poseData.landmarks.forEach((landmark: any) => {
        const x = landmark.x * canvas.width;
        const y = landmark.y * canvas.height;

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
      });

      // Draw connections
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;

      // MediaPipe pose connections
      const connections = [
        [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // Arms
        [11, 23], [12, 24], [23, 24], // Torso
        [23, 25], [25, 27], [24, 26], [26, 28], // Legs
        [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8] // Face
      ];

      connections.forEach(([start, end]) => {
        if (poseData.landmarks[start] && poseData.landmarks[end]) {
          const startX = poseData.landmarks[start].x * canvas.width;
          const startY = poseData.landmarks[start].y * canvas.height;
          const endX = poseData.landmarks[end].x * canvas.width;
          const endY = poseData.landmarks[end].y * canvas.height;

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      });
    }
  };

  const error = cameraError || mediapipeError;

  return (
    <div className="relative aspect-video bg-gray-900 rounded overflow-hidden">
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/50 text-white p-4 text-center z-10">
          <div>
            <p className="font-semibold mb-2">Camera Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading MediaPipe...</p>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {isRecording && (
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
          REC
        </div>
      )}
    </div>
  );
}
