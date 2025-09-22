import React, { useState } from 'react';
import './App.css';
import FileUploader from './components/FileUploader';
import LandmarkMapper from './components/LandmarkMapper';
import MotionCapture from './components/MotionCapture';

type AppStep = 'upload' | 'mapping' | 'capture';

interface LandmarkMapping {
  [key: string]: string;
}

function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [landmarkMapping, setLandmarkMapping] = useState<LandmarkMapping>({});

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setCurrentStep('mapping');
  };

  const handleMappingComplete = (mapping: LandmarkMapping) => {
    setLandmarkMapping(mapping);
    setCurrentStep('capture');
  };

  const handleBackToUpload = () => {
    setCurrentStep('upload');
    setUploadedFile(null);
    setLandmarkMapping({});
  };

  const handleBackToMapping = () => {
    setCurrentStep('mapping');
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      <div className={`step ${currentStep === 'upload' ? 'active' : (currentStep === 'mapping' || currentStep === 'capture') ? 'completed' : ''}`}>
        <div className="step-number">1</div>
        <div className="step-title">파일 업로드</div>
      </div>
      <div className={`step ${currentStep === 'mapping' ? 'active' : currentStep === 'capture' ? 'completed' : ''}`}>
        <div className="step-number">2</div>
        <div className="step-title">랜드마크 매핑</div>
      </div>
      <div className={`step ${currentStep === 'capture' ? 'active' : ''}`}>
        <div className="step-number">3</div>
        <div className="step-title">모션 캡처</div>
      </div>
    </div>
  );

  return (
    <div className="App">
      <header className="App-header">
        <h1>3D 모션 캡처 애플리케이션</h1>
        <p>FBX/GLB 모델 업로드 → 랜드마크 매핑 → 실시간 모션 캡처</p>
        {renderStepIndicator()}
      </header>

      <main className="App-main">
        {currentStep === 'upload' && (
          <FileUploader onFileUpload={handleFileUpload} />
        )}

        {currentStep === 'mapping' && uploadedFile && (
          <LandmarkMapper
            file={uploadedFile}
            onMappingComplete={handleMappingComplete}
            onBack={handleBackToUpload}
          />
        )}

        {currentStep === 'capture' && uploadedFile && (
          <MotionCapture
            file={uploadedFile}
            landmarkMapping={landmarkMapping}
            onBack={handleBackToMapping}
          />
        )}
      </main>
    </div>
  );
}

export default App;
