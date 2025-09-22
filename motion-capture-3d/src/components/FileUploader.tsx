import React, { useState, useRef } from 'react';
import './FileUploader.css';

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const validateFile = (file: File): boolean => {
    const validExtensions = ['.fbx', '.obj', '.gltf', '.glb'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (!validExtensions.includes(fileExtension)) {
      alert('지원되는 파일 형식이 아닙니다. FBX, OBJ, GLTF, GLB 파일만 업로드 가능합니다.');
      return false;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB
      alert('파일 크기가 너무 큽니다. 50MB 이하의 파일만 업로드 가능합니다.');
      return false;
    }

    return true;
  };

  const handleUpload = () => {
    if (selectedFile) {
      onFileUpload(selectedFile);
    }
  };

  const openFileDialog = () => {
    inputRef.current?.click();
  };

  return (
    <div className="file-uploader">
      <h2>3D 모델 파일 업로드</h2>
      <p className="instruction">
        FBX, OBJ, GLTF, GLB 형식의 3D 모델 파일을 업로드하세요.
      </p>

      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".fbx,.obj,.gltf,.glb"
          onChange={handleChange}
          style={{ display: 'none' }}
        />

        <div className="upload-content">
          <div className="upload-icon">📁</div>
          {selectedFile ? (
            <div className="file-info">
              <p className="file-name">{selectedFile.name}</p>
              <p className="file-size">
                크기: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div className="upload-text">
              <p>파일을 드래그 앤 드롭하거나 클릭하여 선택하세요</p>
              <p className="supported-formats">
                지원 형식: FBX, OBJ, GLTF, GLB (최대 50MB)
              </p>
            </div>
          )}
        </div>
      </div>

      {selectedFile && (
        <button className="upload-button" onClick={handleUpload}>
          다음 단계로 진행
        </button>
      )}

      <div className="instructions">
        <h3>📋 사용 방법</h3>
        <ol>
          <li>위의 영역에 3D 모델 파일을 드래그 앤 드롭하거나 클릭하여 선택하세요</li>
          <li>파일이 선택되면 "다음 단계로 진행" 버튼을 클릭하세요</li>
          <li>다음 단계에서 모델의 랜드마크를 설정할 수 있습니다</li>
        </ol>
      </div>
    </div>
  );
};

export default FileUploader;