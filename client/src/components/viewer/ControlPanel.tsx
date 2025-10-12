import { useState } from 'react';
import { useMotionStore } from '../../store/motionStore';
import { useModelStore } from '../../store/modelStore';

interface ControlPanelProps {
  onStartCapture?: () => void;
  onStopCapture?: () => void;
  onClearMotion?: () => void;
  className?: string;
}

export default function ControlPanel({
  onStartCapture,
  onStopCapture,
  onClearMotion,
  className = ''
}: ControlPanelProps) {
  const {
    isRecording,
    isPaused,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearMotionData
  } = useMotionStore();

  const { currentModel, models } = useModelStore();
  const [showModelSelect, setShowModelSelect] = useState(false);

  const handleStartRecording = () => {
    startRecording();
    if (onStartCapture) onStartCapture();
  };

  const handleStopRecording = () => {
    stopRecording();
    if (onStopCapture) onStopCapture();
  };

  const handleClear = () => {
    clearMotionData();
    if (onClearMotion) onClearMotion();
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Controls</h3>

      {/* Recording Controls */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recording
          </label>
          <div className="flex space-x-2">
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors flex items-center justify-center"
              >
                <span className="w-3 h-3 bg-white rounded-full mr-2"></span>
                Start Recording
              </button>
            ) : (
              <>
                {isPaused ? (
                  <button
                    onClick={resumeRecording}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                  >
                    Resume
                  </button>
                ) : (
                  <button
                    onClick={pauseRecording}
                    className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors"
                  >
                    Pause
                  </button>
                )}
                <button
                  onClick={handleStopRecording}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                >
                  Stop
                </button>
              </>
            )}
          </div>
        </div>

        {/* Clear Motion */}
        <button
          onClick={handleClear}
          className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
          disabled={isRecording}
        >
          Clear Motion Data
        </button>

        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Model
          </label>
          <div className="relative">
            <button
              onClick={() => setShowModelSelect(!showModelSelect)}
              className="w-full bg-gray-50 border border-gray-300 text-gray-700 px-4 py-2 rounded text-left hover:bg-gray-100 transition-colors"
            >
              {currentModel ? currentModel.name : 'No model selected'}
            </button>

            {showModelSelect && models.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      // Model selection will be handled by modelStore
                      setShowModelSelect(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    <p className="font-medium">{model.name}</p>
                    <p className="text-xs text-gray-500">
                      {model.file_type.toUpperCase()} • {(model.file_size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upload Model Button */}
        <button
          className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
          onClick={() => {
            // This will open file picker - to be implemented
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.fbx,.glb,.gltf';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) {
                // Upload will be handled by modelStore
                console.log('File selected:', file.name);
              }
            };
            input.click();
          }}
        >
          Upload New Model
        </button>

        {/* Status Indicators */}
        <div className="pt-4 border-t border-gray-200">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium ${
                isRecording
                  ? isPaused
                    ? 'text-yellow-600'
                    : 'text-red-600'
                  : 'text-gray-600'
              }`}>
                {isRecording
                  ? isPaused
                    ? 'Paused'
                    : 'Recording'
                  : 'Idle'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Model:</span>
              <span className="font-medium text-gray-900">
                {currentModel ? 'Loaded' : 'None'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
