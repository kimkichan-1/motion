import { useState, useEffect, useRef, useCallback } from 'react';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

export const POSE_CONNECTIONS = [
  // 상체 연결
  [11, 12], // 어깨
  [11, 13], [13, 15], // 왼팔
  [12, 14], [14, 16], // 오른팔
  [11, 23], [12, 24], // 몸통
  [23, 24], // 골반
  // 하체 연결
  [23, 25], [25, 27], [27, 29], [29, 31], // 왼다리
  [24, 26], [26, 28], [28, 30], [30, 32], // 오른다리
];

export const usePoseDetection = () => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [poses, setPoses] = useState(null);
  const [error, setError] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseRef = useRef(null);
  const cameraRef = useRef(null);

  const onResults = useCallback((results) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.poseLandmarks) {
      // 포즈 연결선 그리기
      drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
        color: '#00FF00',
        lineWidth: 4
      });

      // 관절점 그리기
      drawLandmarks(ctx, results.poseLandmarks, {
        color: '#FF0000',
        lineWidth: 2,
        radius: 6
      });

      // 3D 모델 업데이트를 위한 포즈 데이터 저장
      setPoses(results.poseLandmarks);
    }

    ctx.restore();
  }, []);

  const startDetection = useCallback(async () => {
    try {
      setError(null);

      if (!poseRef.current) {
        // MediaPipe Pose 초기화
        const pose = new Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        pose.onResults(onResults);
        poseRef.current = pose;
      }

      // 카메라 초기화
      if (videoRef.current && !cameraRef.current) {
        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (poseRef.current) {
              await poseRef.current.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480
        });

        await camera.start();
        cameraRef.current = camera;
      }

      setIsDetecting(true);
    } catch (err) {
      setError(err.message);
      console.error('Pose detection error:', err);
    }
  }, [onResults]);

  const stopDetection = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    setIsDetecting(false);
    setPoses(null);
  }, []);

  useEffect(() => {
    return () => {
      stopDetection();
      if (poseRef.current) {
        poseRef.current.close();
      }
    };
  }, [stopDetection]);

  return {
    videoRef,
    canvasRef,
    poses,
    isDetecting,
    error,
    startDetection,
    stopDetection
  };
};