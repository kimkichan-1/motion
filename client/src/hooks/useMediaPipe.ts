import { useEffect, useRef, useState } from 'react';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
import { MotionData } from '../types';

interface UseMediaPipeOptions {
  onResults?: (results: MotionData) => void;
  enableFaceLandmarks?: boolean;
  enableHandLandmarks?: boolean;
  modelComplexity?: 0 | 1 | 2;
}

export function useMediaPipe(options: UseMediaPipeOptions = {}) {
  const {
    onResults,
    enableFaceLandmarks = false,
    enableHandLandmarks = false,
    modelComplexity = 1
  } = options;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);

  // Initialize MediaPipe
  useEffect(() => {
    const initMediaPipe = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load MediaPipe Vision tasks
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        // Create PoseLandmarker
        const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        poseLandmarkerRef.current = poseLandmarker;
        setIsInitialized(true);
        setIsLoading(false);
      } catch (err: any) {
        console.error('MediaPipe initialization error:', err);
        setError(err.message || 'Failed to initialize MediaPipe');
        setIsLoading(false);
      }
    };

    initMediaPipe();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (poseLandmarkerRef.current) {
        poseLandmarkerRef.current.close();
      }
    };
  }, []);

  // Process video frame
  const processFrame = async (video: HTMLVideoElement, canvas?: HTMLCanvasElement) => {
    if (!poseLandmarkerRef.current || !isInitialized || !video || video.readyState < 2) {
      return;
    }

    const currentTime = video.currentTime;

    // Skip if same frame
    if (currentTime === lastVideoTimeRef.current) {
      return;
    }

    lastVideoTimeRef.current = currentTime;

    try {
      // Detect pose
      const startTimeMs = performance.now();
      const results = poseLandmarkerRef.current.detectForVideo(video, startTimeMs);

      // Draw landmarks on canvas if provided
      if (canvas && results.landmarks && results.landmarks.length > 0) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const drawingUtils = new DrawingUtils(ctx);

          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw pose landmarks
          for (const landmarks of results.landmarks) {
            drawingUtils.drawLandmarks(landmarks, {
              radius: (data) => DrawingUtils.lerp(data.from!.z, -0.15, 0.1, 5, 1)
            });
            drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
              color: '#00FF00',
              lineWidth: 2
            });
          }
        }
      }

      // Convert to MotionData format
      if (results.landmarks && results.landmarks.length > 0) {
        const motionData: MotionData = {
          timestamp: Date.now(),
          landmarks: results.landmarks[0].map((landmark, index) => ({
            x: landmark.x,
            y: landmark.y,
            z: landmark.z,
            visibility: landmark.visibility || 0,
            name: getPoseLandmarkName(index)
          })),
          worldLandmarks: results.worldLandmarks?.[0]?.map((landmark, index) => ({
            x: landmark.x,
            y: landmark.y,
            z: landmark.z,
            visibility: landmark.visibility || 0,
            name: getPoseLandmarkName(index)
          })),
          segmentationMask: undefined // Not using segmentation for now
        };

        if (onResults) {
          onResults(motionData);
        }
      }
    } catch (err: any) {
      console.error('Error processing frame:', err);
    }
  };

  // Start continuous processing
  const startProcessing = (video: HTMLVideoElement, canvas?: HTMLCanvasElement) => {
    if (!isInitialized) {
      console.warn('MediaPipe not initialized yet');
      return;
    }

    const processLoop = async () => {
      await processFrame(video, canvas);
      animationFrameRef.current = requestAnimationFrame(processLoop);
    };

    processLoop();
  };

  // Stop processing
  const stopProcessing = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  return {
    isLoading,
    error,
    isInitialized,
    processFrame,
    startProcessing,
    stopProcessing
  };
}

// Helper function to get landmark names
function getPoseLandmarkName(index: number): string {
  const landmarkNames = [
    'nose', 'left_eye_inner', 'left_eye', 'left_eye_outer',
    'right_eye_inner', 'right_eye', 'right_eye_outer',
    'left_ear', 'right_ear',
    'mouth_left', 'mouth_right',
    'left_shoulder', 'right_shoulder',
    'left_elbow', 'right_elbow',
    'left_wrist', 'right_wrist',
    'left_pinky', 'right_pinky',
    'left_index', 'right_index',
    'left_thumb', 'right_thumb',
    'left_hip', 'right_hip',
    'left_knee', 'right_knee',
    'left_ankle', 'right_ankle',
    'left_heel', 'right_heel',
    'left_foot_index', 'right_foot_index'
  ];

  return landmarkNames[index] || `landmark_${index}`;
}
