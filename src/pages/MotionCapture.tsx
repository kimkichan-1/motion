import { useState, useRef } from 'react'

const MotionCapture = () => {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [capturedMotion, setCapturedMotion] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState('')
  const [step, setStep] = useState(1) // 1: 준비, 2: 녹화, 3: 처리, 4: 결과
  const videoRef = useRef<HTMLVideoElement>(null)

  const models = [
    { id: '1', name: '캐릭터_001.glb', thumbnail: '🧍‍♂️' },
    { id: '2', name: '로봇_모델.fbx', thumbnail: '🤖' },
    { id: '3', name: '동물_캐릭터.obj', thumbnail: '🐱' }
  ]

  const startRecording = () => {
    setIsRecording(true)
    setStep(2)
    // 실제 웹캠 접근 로직
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      })
      .catch(err => console.error('카메라 접근 오류:', err))
  }

  const stopRecording = () => {
    setIsRecording(false)
    setStep(3)
    setCapturedMotion('recorded_motion_data')

    // 실제 녹화 중지 로직
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
    }

    // 처리 시뮬레이션
    setTimeout(() => {
      setStep(4)
    }, 3000)
  }

  const resetCapture = () => {
    setStep(1)
    setIsRecording(false)
    setRecordingTime(0)
    setCapturedMotion(null)
    setSelectedModel('')
  }

  const applyMotionToModel = () => {
    if (selectedModel && capturedMotion) {
      alert(`모션이 ${models.find(m => m.id === selectedModel)?.name}에 적용되었습니다!`)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">모션 캡처</h1>
        <p className="text-gray-600">
          카메라로 동작을 촬영하여 3D 모션으로 변환하고 모델에 적용하세요
        </p>
      </div>

      {/* 진행 단계 */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between">
          {[
            { step: 1, title: '준비', icon: '🎯' },
            { step: 2, title: '녹화', icon: '📹' },
            { step: 3, title: '처리', icon: '⚙️' },
            { step: 4, title: '완료', icon: '✅' }
          ].map((item, index) => (
            <div key={item.step} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                step >= item.step
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step > item.step ? '✓' : item.icon}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                step >= item.step ? 'text-primary-600' : 'text-gray-500'
              }`}>
                {item.title}
              </span>
              {index < 3 && (
                <div className={`w-16 h-1 mx-4 rounded-full ${
                  step > item.step ? 'bg-primary-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 왼쪽: 카메라 및 캡처 */}
        <div className="space-y-6">
          {/* 카메라 뷰 */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">카메라</h2>

            <div className="bg-gray-900 rounded-lg overflow-hidden relative">
              {step >= 2 ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full h-64 object-cover"
                />
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-4xl mb-4">📷</div>
                    <p>카메라가 준비되었습니다</p>
                    <p className="text-sm text-gray-300 mt-2">
                      녹화를 시작하려면 아래 버튼을 클릭하세요
                    </p>
                  </div>
                </div>
              )}

              {/* 녹화 시간 표시 */}
              {isRecording && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                  <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                  REC {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                </div>
              )}

              {/* 포즈 가이드라인 */}
              {step >= 2 && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-4 border-2 border-white/30 rounded-lg"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-1 h-16 bg-white/30"></div>
                    <div className="w-16 h-1 bg-white/30 absolute top-8 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                  </div>
                </div>
              )}
            </div>

            {/* 컨트롤 버튼 */}
            <div className="mt-4 flex space-x-4">
              {step === 1 && (
                <button
                  onClick={startRecording}
                  className="btn-primary flex-1"
                  disabled={!selectedModel}
                >
                  📹 녹화 시작
                </button>
              )}

              {step === 2 && (
                <button
                  onClick={stopRecording}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg flex-1"
                >
                  ⏹️ 녹화 중지
                </button>
              )}

              {step >= 3 && (
                <button
                  onClick={resetCapture}
                  className="btn-secondary flex-1"
                >
                  🔄 다시 녹화
                </button>
              )}
            </div>
          </div>

          {/* 녹화 가이드 */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">녹화 가이드</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                충분한 조명이 있는 곳에서 촬영하세요
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                전신이 잘 보이도록 카메라와 거리를 조절하세요
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                명확하고 천천히 동작을 수행하세요
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                배경은 단순하고 깔끔한 곳을 선택하세요
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽: 모델 선택 및 결과 */}
        <div className="space-y-6">
          {/* 모델 선택 */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              적용할 3D 모델 선택
            </h2>

            {models.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {models.map((model) => (
                  <div
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors duration-200 ${
                      selectedModel === model.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="text-2xl mr-3">{model.thumbnail}</div>
                      <div>
                        <h3 className="font-medium text-gray-900">{model.name}</h3>
                        <p className="text-sm text-gray-600">클릭하여 선택</p>
                      </div>
                      {selectedModel === model.id && (
                        <div className="ml-auto text-primary-500">
                          ✓
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📁</div>
                <p className="text-gray-600 mb-4">업로드된 3D 모델이 없습니다</p>
                <button className="btn-primary">
                  모델 업로드하기
                </button>
              </div>
            )}
          </div>

          {/* 처리 상태 */}
          {step === 3 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">모션 처리 중</h2>

              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mr-3"></div>
                  <span className="text-gray-600">AI가 모션을 분석하고 있습니다...</span>
                </div>

                <div className="bg-gray-200 rounded-full h-2">
                  <div className="bg-primary-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>

                <div className="text-sm text-gray-500 space-y-1">
                  <div>✓ 비디오 분석 완료</div>
                  <div>✓ 포즈 추정 완료</div>
                  <div className="text-primary-600">⏳ 3D 모션 변환 중...</div>
                  <div className="text-gray-400">⏳ 모델 적용 대기 중...</div>
                </div>
              </div>
            </div>
          )}

          {/* 결과 */}
          {step === 4 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">모션 적용 결과</h2>

              {/* 3D 뷰어 */}
              <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center mb-4">
                <div className="text-center">
                  <div className="text-6xl mb-2">
                    {models.find(m => m.id === selectedModel)?.thumbnail}
                  </div>
                  <p className="text-gray-600">모션이 적용된 3D 모델</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Three.js 뷰어로 실시간 미리보기
                  </p>
                </div>
              </div>

              {/* 뷰어 컨트롤 */}
              <div className="flex space-x-2 mb-4">
                <button className="btn-secondary text-sm flex-1">
                  ▶️ 재생
                </button>
                <button className="btn-secondary text-sm flex-1">
                  ⏸️ 정지
                </button>
                <button className="btn-secondary text-sm flex-1">
                  🔄 반복
                </button>
              </div>

              {/* 편집 옵션 */}
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    모션 속도
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    defaultValue="1"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    모션 강도
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    defaultValue="1"
                    className="w-full"
                  />
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="space-y-2">
                <button
                  onClick={applyMotionToModel}
                  className="w-full btn-primary"
                >
                  ✅ 모션 적용 완료
                </button>
                <button className="w-full btn-secondary">
                  💾 프로젝트로 저장
                </button>
                <button className="w-full btn-secondary">
                  📥 파일 다운로드
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MotionCapture