import { useState, useEffect } from 'react';
import { useModelStore } from '../../store/modelStore';
import { useMotionStore } from '../../store/motionStore';
import { useAuthStore } from '../../store/authStore';
import VideoFeed from '../../components/viewer/VideoFeed';
import ModelViewer from '../../components/viewer/ModelViewer';
import BoneMappingControls, { defaultConfig, type MappingConfig } from '../../components/viewer/BoneMappingControls';
import { calibrateFromTPose, isValidTPose } from '../../utils/calibration';
import { QRCodeSVG } from 'qrcode.react';
import type { PoseFrame } from '../../types/index';

export default function Capture() {
  const { user, signOut } = useAuthStore();
  const { models, currentModel, fetchModels, setCurrentModel, uploadModel } = useModelStore();
  const { isRecording, startRecording, stopRecording } = useMotionStore();
  const [recordingName, setRecordingName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [roomId] = useState(() => Math.random().toString(36).substring(7));
  const [currentPose, setCurrentPose] = useState<PoseFrame | undefined>(undefined);
  const [mappingConfig, setMappingConfig] = useState<MappingConfig>(defaultConfig);
  const [calibrationStatus, setCalibrationStatus] = useState<string>('');

  useEffect(() => {
    fetchModels();
  }, []);

  // Check T-pose validity in real-time
  useEffect(() => {
    if (currentPose) {
      const { valid, message } = isValidTPose(currentPose);
      setCalibrationStatus(message);
    }
  }, [currentPose]);

  const handleCalibrate = () => {
    if (!currentPose) {
      alert('포즈 데이터를 기다리는 중...');
      return;
    }

    const { valid, message } = isValidTPose(currentPose);
    if (!valid) {
      alert(`캘리브레이션 실패: ${message}`);
      return;
    }

    try {
      const newConfig = calibrateFromTPose(currentPose);
      setMappingConfig(newConfig);
      alert('✅ T-pose 캘리브레이션 완료!');
    } catch (error: any) {
      alert(`캘리브레이션 오류: ${error.message}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const name = file.name.replace(/\.[^/.]+$/, '');
      await uploadModel(file, name);
    } catch (error: any) {
      alert('Failed to upload model: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleStartRecording = () => {
    if (!currentModel) {
      alert('Please select a model first');
      return;
    }
    startRecording();
  };

  const handleStopRecording = async () => {
    if (!recordingName.trim()) {
      alert('Please enter a recording name');
      return;
    }
    try {
      await stopRecording(recordingName, currentModel?.id);
      setRecordingName('');
      alert('Recording saved successfully!');
    } catch (error: any) {
      alert('Failed to save recording: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Motion Capture Studio</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowQR(true)}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Mobile Camera
            </button>
            <span className="text-gray-600">{user?.email}</span>
            <button
              onClick={() => signOut()}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Connect Mobile Camera</h2>
              <p className="text-gray-600 mb-6">Scan this QR code with your phone to add a second camera angle</p>

              <div className="bg-white p-4 rounded-lg inline-block">
                <QRCodeSVG
                  value={`${window.location.origin}/mobile/${roomId}`}
                  size={256}
                  level="H"
                />
              </div>

              <p className="text-sm text-gray-500 mt-4">Room ID: {roomId}</p>

              <button
                onClick={() => setShowQR(false)}
                className="mt-6 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Model Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">3D Models</h2>

            <div className="mb-6">
              <label className="block w-full">
                <span className="sr-only">Upload model</span>
                <input
                  type="file"
                  accept=".fbx,.glb,.gltf"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </label>
              {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
            </div>

            <div className="space-y-2">
              {models.length === 0 ? (
                <p className="text-gray-500 text-sm">No models yet. Upload one to get started!</p>
              ) : (
                models.map(model => (
                  <button
                    key={model.id}
                    onClick={() => setCurrentModel(model)}
                    className={`w-full text-left p-3 rounded border-2 transition ${
                      currentModel?.id === model.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{model.name}</div>
                    <div className="text-sm text-gray-500">{model.file_type.toUpperCase()}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Center Panel - Video Feed & 3D View */}
          <div className="lg:col-span-2 space-y-6">
            {/* Camera Feed */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Camera Feed</h2>
              <VideoFeed onPoseData={setCurrentPose} />
            </div>

            {/* 3D Model Viewer */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">3D Model Preview</h2>
              <ModelViewer poseData={currentPose} mappingConfig={mappingConfig} />
            </div>

            {/* T-Pose Calibration */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow p-6 border-2 border-blue-200">
              <h2 className="text-xl font-bold mb-3 text-blue-900">🎯 T-pose 캘리브레이션</h2>
              <p className="text-sm text-gray-700 mb-3">
                T자 포즈를 취하고 캘리브레이션 버튼을 눌러 자동으로 본 매핑을 설정하세요
              </p>

              {/* Status Indicator */}
              <div className={`mb-4 p-3 rounded ${
                calibrationStatus.includes('준비')
                  ? 'bg-green-100 border border-green-300'
                  : 'bg-yellow-100 border border-yellow-300'
              }`}>
                <p className="text-sm font-medium">
                  {calibrationStatus || 'T-pose를 취해주세요...'}
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-white rounded p-3 mb-4">
                <p className="text-xs font-semibold text-gray-700 mb-2">T-pose 자세:</p>
                <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                  <li>똑바로 서세요</li>
                  <li>양팔을 수평으로 쭉 펴세요 (T자)</li>
                  <li>다리는 어깨 너비로 벌리세요</li>
                  <li>전체 몸이 카메라에 보이도록 하세요</li>
                </ol>
              </div>

              {/* Calibrate Button */}
              <button
                onClick={handleCalibrate}
                disabled={!calibrationStatus.includes('준비')}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition ${
                  calibrationStatus.includes('준비')
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {calibrationStatus.includes('준비') ? '✨ 지금 캘리브레이션!' : '⏳ T-pose를 취해주세요'}
              </button>
            </div>

            {/* Manual Bone Mapping Controls */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">수동 본 매핑 조정</h2>
              <p className="text-sm text-gray-600 mb-4">
                T-pose 캘리브레이션이 완벽하지 않다면 수동으로 미세 조정하세요
              </p>
              <BoneMappingControls
                config={mappingConfig}
                onChange={setMappingConfig}
                onReset={() => setMappingConfig(defaultConfig)}
              />
            </div>

            {/* Recording Controls */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Recording Controls</h2>

              {!isRecording ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Recording name"
                    value={recordingName}
                    onChange={(e) => setRecordingName(e.target.value)}
                    className="w-full px-4 py-2 border rounded"
                  />
                  <button
                    onClick={handleStartRecording}
                    disabled={!currentModel}
                    className="w-full bg-red-500 text-white py-3 rounded font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Start Recording
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleStopRecording}
                  className="w-full bg-blue-500 text-white py-3 rounded font-semibold hover:bg-blue-600"
                >
                  Stop Recording
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
