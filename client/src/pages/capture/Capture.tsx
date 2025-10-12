import { useState, useEffect } from 'react';
import { useMotionStore } from '../../store/motionStore';
import ModelViewer from '../../components/viewer/ModelViewer';
import VideoFeed from '../../components/viewer/VideoFeed';
import ControlPanel from '../../components/viewer/ControlPanel';
import { CameraSource } from '../../types';

export default function Capture() {
  const { cameras, addCamera } = useMotionStore();
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [showCameraSettings, setShowCameraSettings] = useState(false);

  // Initialize webcam on mount
  useEffect(() => {
    const initCamera = async () => {
      try {
        // Get available cameras
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');

        // Add default webcam if not already added
        if (cameras.length === 0 && videoDevices.length > 0) {
          const defaultCamera: CameraSource = {
            id: 'webcam-default',
            type: 'webcam',
            deviceId: videoDevices[0].deviceId,
            label: videoDevices[0].label || 'Default Webcam',
            isActive: true
          };
          addCamera(defaultCamera);
        }
      } catch (error) {
        console.error('Error initializing camera:', error);
      }
    };

    initCamera();
  }, []);

  const handleVideoReady = (video: HTMLVideoElement) => {
    setVideoElement(video);
    console.log('Video ready for motion capture');
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Motion Capture Studio</h1>
            <p className="text-sm text-gray-600 mt-1">
              Capture your movements in real-time and apply them to 3D models
            </p>
          </div>
          <button
            onClick={() => setShowCameraSettings(!showCameraSettings)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Camera Settings
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-6 overflow-hidden">
        {/* Left Panel - Video Feeds */}
        <div className="w-1/3 flex flex-col gap-4">
          {/* Primary Camera Feed */}
          <div className="flex-1 bg-gray-900 rounded-lg overflow-hidden relative">
            <h3 className="absolute top-4 left-4 z-10 text-white font-semibold bg-black bg-opacity-50 px-3 py-1 rounded">
              Camera Feed
            </h3>
            {cameras.length > 0 ? (
              <VideoFeed
                source={cameras[0]}
                onVideoReady={handleVideoReady}
                mirrored={true}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                <div className="text-center">
                  <p className="text-lg mb-2">No camera detected</p>
                  <p className="text-sm text-gray-400">Please check your camera permissions</p>
                </div>
              </div>
            )}
          </div>

          {/* Additional Camera (if multiple cameras) */}
          {cameras.length > 1 && (
            <div className="h-48 bg-gray-900 rounded-lg overflow-hidden">
              <VideoFeed
                source={cameras[1]}
                mirrored={false}
              />
            </div>
          )}

          {/* Camera Settings Panel */}
          {showCameraSettings && (
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h4 className="font-semibold mb-3">Camera Settings</h4>
              <div className="space-y-2 text-sm">
                <button
                  className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded"
                  onClick={async () => {
                    // Add mobile camera via QR code - to be implemented
                    alert('Mobile camera pairing coming soon');
                  }}
                >
                  + Add Mobile Camera
                </button>
                <button
                  className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded"
                  onClick={async () => {
                    // Switch camera - to be implemented
                    alert('Switch camera coming soon');
                  }}
                >
                  Switch Camera
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Center Panel - 3D Viewer */}
        <div className="flex-1 bg-gray-900 rounded-lg overflow-hidden relative">
          <h3 className="absolute top-4 left-4 z-10 text-white font-semibold bg-black bg-opacity-50 px-3 py-1 rounded">
            3D Model Viewer
          </h3>
          <ModelViewer
            showGrid={true}
            showControls={true}
          />
        </div>

        {/* Right Panel - Controls */}
        <div className="w-80">
          <ControlPanel />
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 text-white px-6 py-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${cameras.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{cameras.length} Camera{cameras.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">FPS:</span>
              <span>0</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">Latency:</span>
              <span>0ms</span>
            </div>
          </div>
          <div className="text-gray-400">
            Ready to capture
          </div>
        </div>
      </div>
    </div>
  );
}
