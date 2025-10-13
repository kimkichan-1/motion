import { useEffect, useRef, useState, useCallback } from 'react';
import type { PoseFrame } from '../types/index';

interface UseMediaPipeOptions {
  onPoseDetected?: (poseData: PoseFrame) => void;
  videoElement?: HTMLVideoElement | null;
}

export function useMediaPipe({ onPoseDetected, videoElement }: UseMediaPipeOptions = {}) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const poseDetectorRef = useRef<any>(null);
  const animationFrameRef = useRef<number>();
  const cameraRef = useRef<any>(null);
  const onPoseDetectedRef = useRef(onPoseDetected);
  const isInitializedRef = useRef(false);

  // Update callback ref without triggering re-initialization
  useEffect(() => {
    onPoseDetectedRef.current = onPoseDetected;
  }, [onPoseDetected]);

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitializedRef.current) return;

    let mounted = true;
    isInitializedRef.current = true;

    async function initializeMediaPipe() {
      try {
        // Import MediaPipe dynamically
        const { Pose, POSE_CONNECTIONS } = await import('@mediapipe/pose');
        const { Camera } = await import('@mediapipe/camera_utils');

        if (!mounted) return;

        // Create pose detector
        const pose = new Pose({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
          }
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        pose.onResults((results) => {
          if (!mounted || !results.poseLandmarks) return;

          const poseData: PoseFrame = {
            timestamp: Date.now(),
            landmarks: results.poseLandmarks.map(lm => ({
              x: lm.x,
              y: lm.y,
              z: lm.z,
              visibility: lm.visibility
            })),
            worldLandmarks: results.poseWorldLandmarks?.map(lm => ({
              x: lm.x,
              y: lm.y,
              z: lm.z,
              visibility: lm.visibility
            })) || []
          };

          onPoseDetectedRef.current?.(poseData);
        });

        poseDetectorRef.current = pose;
        setIsLoading(false);
        setIsTracking(true);

        // Start camera if video element is provided
        if (videoElement) {
          const camera = new Camera(videoElement, {
            onFrame: async () => {
              if (mounted && poseDetectorRef.current) {
                await poseDetectorRef.current.send({ image: videoElement });
              }
            },
            width: 640,
            height: 480
          });
          cameraRef.current = camera;
          camera.start();
        }

      } catch (err: any) {
        console.error('MediaPipe initialization error:', err);
        if (mounted) {
          setError(err.message || 'Failed to initialize MediaPipe');
          setIsLoading(false);
        }
      }
    }

    initializeMediaPipe();

    return () => {
      mounted = false;
      isInitializedRef.current = false;

      // Stop camera first
      if (cameraRef.current) {
        try {
          cameraRef.current.stop();
        } catch (e) {
          console.warn('Error stopping camera:', e);
        }
        cameraRef.current = null;
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Close pose detector
      if (poseDetectorRef.current) {
        try {
          poseDetectorRef.current.close();
        } catch (e) {
          console.warn('Error closing pose detector:', e);
        }
        poseDetectorRef.current = null;
      }
    };
  }, [videoElement]);

  const processFrame = async (videoEl: HTMLVideoElement) => {
    if (!poseDetectorRef.current || !isTracking) return;

    try {
      await poseDetectorRef.current.send({ image: videoEl });
    } catch (err) {
      console.error('Frame processing error:', err);
    }
  };

  return {
    isLoading,
    error,
    isTracking,
    processFrame
  };
}
