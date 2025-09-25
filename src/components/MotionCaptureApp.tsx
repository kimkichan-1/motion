import React, { useState, useEffect } from 'react';
import { Scene3D } from './Scene3D';
import { useMediaPipePose } from '../hooks/useMediaPipePose';
import './MotionCaptureApp.css';

export const MotionCaptureApp: React.FC = () => {
  const {
    videoRef,
    canvasRef,
    poseData,
    isInitialized,
    isCapturing,
    startCamera,
    stopCamera
  } = useMediaPipePose();

  const [modelPath, setModelPath] = useState<string | undefined>(undefined);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedFrames, setRecordedFrames] = useState<any[]>([]);

  useEffect(() => {
    if (isInitialized && !isCapturing) {
      startCamera();
    }
  }, [isInitialized, isCapturing, startCamera]);

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordedFrames([]);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    console.log('Recorded frames:', recordedFrames.length);
  };

  const handleModelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setModelPath(url);
    }
  };

  useEffect(() => {
    if (isRecording && poseData) {
      setRecordedFrames(prev => [...prev, {
        ...poseData,
        timestamp: Date.now()
      }]);
    }
  }, [isRecording, poseData]);

  return (
    <div className="motion-capture-app">
      <div className="controls-panel">
        <div className="control-group">
          <h3>Camera Controls</h3>
          <button
            onClick={isCapturing ? stopCamera : startCamera}
            disabled={!isInitialized}
            className={`btn ${isCapturing ? 'btn-danger' : 'btn-success'}`}
          >
            {isCapturing ? 'Stop Camera' : 'Start Camera'}
          </button>
          <div className="status">
            Status: {!isInitialized ? 'Initializing...' : isCapturing ? 'Capturing' : 'Stopped'}
          </div>
        </div>

        <div className="control-group">
          <h3>Recording</h3>
          <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={!isCapturing}
            className={`btn ${isRecording ? 'btn-danger' : 'btn-primary'}`}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
          <div className="status">
            Frames: {recordedFrames.length}
          </div>
        </div>

        <div className="control-group">
          <h3>FBX Model</h3>
          <input
            type="file"
            accept=".fbx"
            onChange={handleModelUpload}
            className="file-input"
          />
          <div className="model-info">
            Current: {modelPath ? modelPath.split('/').pop() : 'Default Avatar'}
          </div>
        </div>

        <div className="control-group">
          <h3>Pose Data</h3>
          <div className="pose-info">
            {poseData && (
              <>
                <div>Landmarks: {poseData.landmarks.length}</div>
                <div>Timestamp: {poseData.timestamp.toFixed(0)}ms</div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="video-section">
          <div className="video-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="webcam-video"
            />
            <canvas
              ref={canvasRef}
              className="pose-canvas"
            />
          </div>
        </div>

        <div className="scene-section">
          <Scene3D poseData={poseData} modelPath={modelPath} />
        </div>
      </div>
    </div>
  );
};