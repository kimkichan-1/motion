import { useEffect, useRef, useState, useCallback } from 'react';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

export interface PoseLandmarks {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PoseData {
  landmarks: PoseLandmarks[];
  worldLandmarks: PoseLandmarks[];
  timestamp: number;
}

export const useMediaPipePose = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationIdRef = useRef<number | null>(null);

  const [poseData, setPoseData] = useState<PoseData | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const initializeMediaPipe = useCallback(async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      poseLandmarkerRef.current = poseLandmarker;
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize MediaPipe:', error);
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        streamRef.current = stream;
        setIsCapturing(true);
      }
    } catch (error) {
      console.error('Failed to start camera:', error);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  const detectPose = useCallback(() => {
    if (!poseLandmarkerRef.current || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.videoWidth === 0) {
      animationIdRef.current = requestAnimationFrame(detectPose);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const timestamp = performance.now();
    const results = poseLandmarkerRef.current.detectForVideo(video, timestamp);

    if (results.landmarks && results.landmarks[0] && results.worldLandmarks && results.worldLandmarks[0]) {
      const poseData: PoseData = {
        landmarks: results.landmarks[0],
        worldLandmarks: results.worldLandmarks[0],
        timestamp
      };
      setPoseData(poseData);

      const drawingUtils = new DrawingUtils(ctx);
      drawingUtils.drawLandmarks(results.landmarks[0], {
        radius: (data) => DrawingUtils.lerp(data.from!.z, -0.15, 0.1, 5, 1)
      });
      drawingUtils.drawConnectors(results.landmarks[0], PoseLandmarker.POSE_CONNECTIONS);
    }

    animationIdRef.current = requestAnimationFrame(detectPose);
  }, []);

  useEffect(() => {
    initializeMediaPipe();
    return () => {
      stopCamera();
    };
  }, [initializeMediaPipe, stopCamera]);

  useEffect(() => {
    if (isCapturing && isInitialized) {
      detectPose();
    }
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [isCapturing, isInitialized, detectPose]);

  return {
    videoRef,
    canvasRef,
    poseData,
    isInitialized,
    isCapturing,
    startCamera,
    stopCamera
  };
};