import { useState, useEffect } from 'react';
import { useModelStore } from '../../store/modelStore';
import { useMotionStore } from '../../store/motionStore';
import { useAuthStore } from '../../store/authStore';

export default function Capture() {
  const { user, signOut } = useAuthStore();
  const { models, currentModel, fetchModels, setCurrentModel, uploadModel } = useModelStore();
  const { isRecording, startRecording, stopRecording } = useMotionStore();
  const [recordingName, setRecordingName] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchModels();
  }, []);

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
              <div className="aspect-video bg-gray-900 rounded flex items-center justify-center text-white">
                <p>Camera feed will appear here (MediaPipe integration needed)</p>
              </div>
            </div>

            {/* 3D Model Viewer */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">3D Model Preview</h2>
              <div className="aspect-video bg-gray-800 rounded flex items-center justify-center text-white">
                {currentModel ? (
                  <p>3D viewer for {currentModel.name} (Three.js integration needed)</p>
                ) : (
                  <p>Select a model to preview</p>
                )}
              </div>
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
