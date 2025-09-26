import React, { useState, useEffect } from 'react';
import { usePoseDetection } from './hooks/usePoseDetection';
import Scene3D from './components/Scene3D';
import './App.css';

function App() {
  const {
    videoRef,
    canvasRef,
    poses,
    isDetecting,
    error,
    startDetection,
    stopDetection
  } = usePoseDetection();

  const [showVideo, setShowVideo] = useState(true);
  const [showStats, setShowStats] = useState(false);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (isDetecting) {
        stopDetection();
      }
    };
  }, [isDetecting, stopDetection]);

  const handleToggleDetection = async () => {
    if (isDetecting) {
      stopDetection();
    } else {
      await startDetection();
    }
  };

  return (
    <div className="app">
      {/* 3D 씬 배경 */}
      <div className="scene-container">
        <Scene3D poses={poses} />
      </div>

      {/* 비디오 오버레이 */}
      {showVideo && (
        <div className="video-container">
          <video
            ref={videoRef}
            className="video"
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            className="canvas-overlay"
            width="640"
            height="480"
          />
        </div>
      )}

      {/* 상태 정보 */}
      {showStats && poses && (
        <div className="stats-panel">
          <h3>포즈 통계</h3>
          <p>감지된 관절: {poses.length}개</p>
          <p>상태: {isDetecting ? '감지 중' : '정지됨'}</p>
          {error && <p className="error">오류: {error}</p>}
        </div>
      )}

      {/* 컨트롤 패널 */}
      <div className="controls">
        <button
          className="control-button"
          onClick={handleToggleDetection}
          disabled={!!error}
        >
          {isDetecting ? '정지' : '시작'}
        </button>

        <button
          className="control-button"
          onClick={() => setShowVideo(!showVideo)}
        >
          {showVideo ? '비디오 숨기기' : '비디오 보기'}
        </button>

        <button
          className="control-button"
          onClick={() => setShowStats(!showStats)}
        >
          {showStats ? '통계 숨기기' : '통계 보기'}
        </button>

        {poses && (
          <div className="pose-indicator">
            <div className={`indicator ${poses ? 'active' : ''}`}>
              {poses ? '포즈 감지됨' : '포즈 없음'}
            </div>
          </div>
        )}
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div className="error-overlay">
          <div className="error-message">
            <h3>오류 발생</h3>
            <p>{error}</p>
            <button
              className="control-button"
              onClick={() => window.location.reload()}
            >
              새로고침
            </button>
          </div>
        </div>
      )}

      {/* 사용 안내 */}
      {!isDetecting && !error && (
        <div className="instructions">
          <h2>실시간 모션 캡처</h2>
          <p>카메라를 통해 실시간으로 포즈를 감지하고 3D 모델로 표시합니다.</p>
          <ul>
            <li>마우스로 3D 뷰를 회전/확대/축소할 수 있습니다</li>
            <li>전신이 잘 보이는 위치에서 촬영하세요</li>
            <li>밝은 조명에서 더 정확하게 감지됩니다</li>
          </ul>
          <button
            className="start-button"
            onClick={handleToggleDetection}
          >
            시작하기
          </button>
        </div>
      )}
    </div>
  );
}

export default App;