import React, { useRef, useState, useEffect, useCallback } from 'react';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import ModelViewer from './ModelViewer';
import './MotionCapture.css';

interface MotionCaptureProps {
  file: File;
  landmarkMapping: { [key: string]: string };
  onBack: () => void;
}

const MotionCapture: React.FC<MotionCaptureProps> = ({ file, landmarkMapping, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCapturing, setIsCapturing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [poseData, setPoseData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const initializePoseLandmarker = useCallback(async () => {
    try {
      setIsInitializing(true);
      setError(null);

      // 여러 CDN 시도
      const cdnUrls = [
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
        "https://unpkg.com/@mediapipe/tasks-vision@latest/wasm",
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      ];

      let vision = null;
      let lastError = null;

      for (const url of cdnUrls) {
        try {
          console.log(`MediaPipe WASM 로딩 시도: ${url}`);
          vision = await FilesetResolver.forVisionTasks(url);
          console.log('MediaPipe WASM 로딩 성공');
          break;
        } catch (err) {
          console.warn(`WASM 로딩 실패: ${url}`, err);
          lastError = err;
        }
      }

      if (!vision) {
        throw new Error(`모든 CDN에서 WASM 로딩 실패: ${lastError}`);
      }

      console.log('PoseLandmarker 생성 중...');
      const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "CPU" // GPU 대신 CPU 사용으로 안정성 향상
        },
        runningMode: "VIDEO",
        numPoses: 1
      });

      poseLandmarkerRef.current = poseLandmarker;
      console.log('PoseLandmarker 초기화 완료');
      setIsInitializing(false);
    } catch (err) {
      console.error('PoseLandmarker 초기화 실패:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`포즈 감지 시스템을 초기화할 수 없습니다: ${errorMessage}`);
      setIsInitializing(false);
    }
  }, []);

  const startCamera = async () => {
    try {
      if (!poseLandmarkerRef.current) {
        await initializePoseLandmarker();
      }

      console.log('카메라 스트림 요청 중...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user'
        }
      });

      console.log('카메라 스트림 획득 성공:', stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        // 비디오 자동 재생 설정
        videoRef.current.autoplay = true;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;

        // 비디오 메타데이터 로드 이벤트
        videoRef.current.onloadedmetadata = () => {
          console.log('비디오 메타데이터 로드됨');
          const video = videoRef.current!;
          console.log('비디오 상세 정보:', {
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            readyState: video.readyState,
            currentTime: video.currentTime,
            paused: video.paused
          });

          if (canvasRef.current) {
            // 캔버스 크기를 비디오에 맞게 설정
            canvasRef.current.width = video.videoWidth || 640;
            canvasRef.current.height = video.videoHeight || 480;

            console.log('캔버스 크기 설정:', canvasRef.current.width, 'x', canvasRef.current.height);
          }

          // 비디오 재생 시작
          video.play().then(() => {
            console.log('비디오 재생 시작됨');
            // 상태 업데이트 후 detectPose 시작
            setIsCapturing(true);
          }).catch(playErr => {
            console.error('비디오 재생 실패:', playErr);
          });
        };

        // 비디오가 재생 가능한 상태가 되면 추가 확인
        videoRef.current.oncanplay = () => {
          console.log('비디오 재생 준비 완료');
          const video = videoRef.current!;
          console.log('canplay 이벤트 - 비디오 상태:', {
            readyState: video.readyState,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            currentTime: video.currentTime,
            paused: video.paused
          });
        };

        // 비디오 재생 시작 이벤트
        videoRef.current.onplay = () => {
          console.log('비디오 재생 시작됨');
        };

        // 비디오 로딩 시작
        videoRef.current.load();
      }
    } catch (err) {
      console.error('카메라 시작 실패:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`카메라에 접근할 수 없습니다: ${errorMessage}`);
    }
  };

  const stopCamera = () => {
    setIsCapturing(false);

    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setPoseData(null);
  };

  const detectPose = useCallback(() => {
    console.log('detectPose 호출됨, 조건 체크:', {
      video: !!videoRef.current,
      canvas: !!canvasRef.current,
      poseLandmarker: !!poseLandmarkerRef.current,
      isCapturing,
      videoReadyState: videoRef.current?.readyState,
      videoWidth: videoRef.current?.videoWidth,
      videoHeight: videoRef.current?.videoHeight
    });

    if (!videoRef.current || !canvasRef.current || !poseLandmarkerRef.current) {
      console.log('detectPose 필수 요소 부족, 대기 중...');
      if (isCapturing) {
        animationIdRef.current = requestAnimationFrame(detectPose);
      }
      return;
    }

    if (!isCapturing) {
      console.log('캡처가 비활성화됨, detectPose 중단');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('캔버스 컨텍스트를 가져올 수 없습니다');
      if (isCapturing) {
        animationIdRef.current = requestAnimationFrame(detectPose);
      }
      return;
    }

    // 비디오가 준비되지 않았으면 대기
    if (video.readyState < 2) {
      console.log('비디오가 아직 준비되지 않음, readyState:', video.readyState);
      if (isCapturing) {
        animationIdRef.current = requestAnimationFrame(detectPose);
      }
      return;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('비디오 크기가 0입니다, 대기 중...', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState
      });
      if (isCapturing) {
        animationIdRef.current = requestAnimationFrame(detectPose);
      }
      return;
    }

    try {
      // 첫 번째 프레임에서만 비디오 상태 로그
      if (!(window as any).firstPoseDetect) {
        console.log('포즈 감지 시작, 비디오 상태:', {
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          canvasWidth: canvas.width,
          canvasHeight: canvas.height,
          readyState: video.readyState,
          currentTime: video.currentTime,
          paused: video.paused
        });
        (window as any).firstPoseDetect = true;
      }

      // MediaPipe 포즈 감지
      const results = poseLandmarkerRef.current.detectForVideo(video, performance.now());

      // 캔버스 클리어 - 검은색 배경으로 명시적으로 설정
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 비디오 이미지 그리기 - 명시적으로 로그 추가
      console.log('비디오 프레임 그리기 시도:', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        videoCurrentTime: video.currentTime,
        videoPaused: video.paused
      });

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 비디오가 그려졌는지 확인하기 위해 테스트 픽셀 데이터 확인
      const imageData = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
      console.log('중앙 픽셀 값:', imageData.data);

      // 5초마다 상태 로그
      const now = Date.now();
      if (!(window as any).lastFrameLog || now - (window as any).lastFrameLog > 5000) {
        console.log('비디오 프레임 그리기 완료!', {
          canvasSize: `${canvas.width}x${canvas.height}`,
          videoSize: `${video.videoWidth}x${video.videoHeight}`,
          poseResults: results.landmarks ? `${results.landmarks.length}개 포즈 감지됨` : '포즈 미감지'
        });
        (window as any).lastFrameLog = now;
      }

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        setPoseData({ landmarks });

        // 간단한 랜드마크 그리기 (DrawingUtils 대신)
        ctx.fillStyle = '#FF0000';
        landmarks.forEach((landmark: any, index: number) => {
          const x = landmark.x * canvas.width;
          const y = landmark.y * canvas.height;

          ctx.beginPath();
          ctx.arc(x, y, 8, 0, 2 * Math.PI); // 크기를 키워서 더 잘 보이게
          ctx.fill();

          // 랜드마크 번호 표시
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '14px Arial';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeText(index.toString(), x + 10, y + 5);
          ctx.fillText(index.toString(), x + 10, y + 5);
          ctx.fillStyle = '#FF0000';
        });

        // 주요 연결선 그리기
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 3;

        // 간단한 스켈레톤 연결 (어깨, 팔, 다리 등)
        const connections = [
          [11, 12], // 어깨
          [11, 13], [13, 15], // 왼팔
          [12, 14], [14, 16], // 오른팔
          [11, 23], [12, 24], // 몸통
          [23, 24], // 허리
          [23, 25], [25, 27], // 왼다리
          [24, 26], [26, 28], // 오른다리
        ];

        connections.forEach(([start, end]) => {
          if (landmarks[start] && landmarks[end]) {
            ctx.beginPath();
            ctx.moveTo(landmarks[start].x * canvas.width, landmarks[start].y * canvas.height);
            ctx.lineTo(landmarks[end].x * canvas.width, landmarks[end].y * canvas.height);
            ctx.stroke();
          }
        });

        console.log(`포즈 감지됨: ${landmarks.length}개 랜드마크`);
      }
    } catch (err) {
      console.error('포즈 감지 오류:', err);
    }

    if (isCapturing) {
      animationIdRef.current = requestAnimationFrame(detectPose);
    }
  }, [isCapturing]);

  // isCapturing 상태가 변경될 때 detectPose 재시작
  useEffect(() => {
    if (isCapturing && poseLandmarkerRef.current && videoRef.current && canvasRef.current) {
      console.log('isCapturing이 true로 변경됨, detectPose 시작');
      detectPose();
    }
  }, [isCapturing, detectPose]);

  useEffect(() => {
    initializePoseLandmarker();

    return () => {
      stopCamera();
      if (poseLandmarkerRef.current) {
        poseLandmarkerRef.current.close();
      }
    };
  }, [initializePoseLandmarker]);

  return (
    <div className="motion-capture">
      <div className="capture-header">
        <h2>실시간 모션 캡처</h2>
        <p>MediaPipe 포즈 감지와 3D 모델 애니메이션</p>
        <button onClick={onBack} className="back-button">
          ← 이전 단계로
        </button>
      </div>

      <div className="capture-controls">
        {isInitializing ? (
          <button disabled className="initializing-button">
            🔄 시스템 초기화 중...
          </button>
        ) : !isCapturing ? (
          <button
            onClick={startCamera}
            className="start-button"
            disabled={!!error}
          >
            📹 모션 캡처 시작
          </button>
        ) : (
          <button onClick={stopCamera} className="stop-button">
            ⏹️ 모션 캡처 중지
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
        </div>
      )}

      <div className="capture-content">
        <div className="video-section">
          <h3>카메라 영상 & 포즈 감지</h3>
          <div className="video-container">
            <video
              ref={videoRef}
              className="video-feed"
              autoPlay
              playsInline
              muted
              style={{
                display: isCapturing ? 'block' : 'none',
                width: '100%',
                maxWidth: '320px',
                height: 'auto',
                border: '1px solid #ccc',
                marginBottom: '10px'
              }}
            />
            <canvas
              ref={canvasRef}
              className="landmark-canvas"
              style={{
                display: isCapturing ? 'block' : 'none',
                width: '100%',
                maxWidth: '640px',
                height: 'auto',
                backgroundColor: '#000',
                borderRadius: '8px',
                border: '2px solid #61dafb'
              }}
            />
            {!isCapturing && (
              <div className="video-placeholder">
                <div className="placeholder-content">
                  <div className="placeholder-icon">📷</div>
                  <p>모션 캡처를 시작하면 카메라 영상과 포즈 랜드마크가 표시됩니다</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="model-section">
          <h3>3D 모델 애니메이션</h3>
          <ModelViewer
            file={file}
            poseData={poseData}
            landmarkMapping={landmarkMapping}
          />
        </div>
      </div>

      <div className="status-info">
        <div className="status-item">
          <span className="status-label">MediaPipe 상태:</span>
          <span className={`status-value ${isInitializing ? 'initializing' : poseLandmarkerRef.current ? 'ready' : 'error'}`}>
            {isInitializing ? '초기화 중' : poseLandmarkerRef.current ? '준비완료' : '오류'}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">모션 캡처:</span>
          <span className={`status-value ${isCapturing ? 'active' : 'inactive'}`}>
            {isCapturing ? '활성' : '비활성'}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">포즈 감지:</span>
          <span className={`status-value ${poseData ? 'detecting' : 'waiting'}`}>
            {poseData ? '감지됨' : '대기중'}
          </span>
        </div>
      </div>

      <div className="instructions">
        <h3>📋 사용 방법</h3>
        <ol>
          <li>"모션 캡처 시작" 버튼을 클릭하세요</li>
          <li>카메라 접근 권한을 허용하세요</li>
          <li>카메라 앞에서 포즈를 취하면 3D 모델이 따라합니다</li>
          <li>전신이 카메라에 잘 보이도록 위치를 조정하세요</li>
          <li>충분한 조명 환경에서 사용하면 더 정확합니다</li>
        </ol>
      </div>
    </div>
  );
};

export default MotionCapture;