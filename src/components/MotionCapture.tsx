import { useRef, useEffect, useState, useCallback } from 'react'
import { Pose } from '@mediapipe/pose'
import { Camera } from '@mediapipe/camera_utils'
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils'

interface MotionCaptureProps {
  onPoseDetected?: (landmarks: any[]) => void
  onError?: (error: string) => void
  isRecording: boolean
}

interface PoseData {
  timestamp: number
  landmarks: any[]
}

const MotionCaptureComponent: React.FC<MotionCaptureProps> = ({
  onPoseDetected,
  onError,
  isRecording
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const poseRef = useRef<Pose | null>(null)
  const cameraRef = useRef<Camera | null>(null)

  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [recordedData, setRecordedData] = useState<PoseData[]>([])
  const [currentPose, setCurrentPose] = useState<any[]>([])

  // MediaPipe Pose 초기화
  const initializePose = useCallback(async () => {
    setIsLoading(true)

    try {
      const pose = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        }
      })

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      })

      pose.onResults((results) => {
        onResults(results)
      })

      poseRef.current = pose
      await initializeCamera()

    } catch (error) {
      console.error('MediaPipe initialization error:', error)
      onError?.('카메라 초기화에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [onError])

  // 카메라 초기화
  const initializeCamera = useCallback(async () => {
    if (!videoRef.current || !poseRef.current) return

    try {
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (poseRef.current && videoRef.current) {
            await poseRef.current.send({ image: videoRef.current })
          }
        },
        width: 640,
        height: 480
      })

      cameraRef.current = camera
      await camera.start()
      setIsInitialized(true)

    } catch (error) {
      console.error('Camera initialization error:', error)
      onError?.('카메라 접근에 실패했습니다. 카메라 권한을 확인해주세요.')
    }
  }, [onError])

  // MediaPipe 결과 처리
  const onResults = useCallback((results: any) => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 캔버스 클리어
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 비디오 프레임 그리기
    if (results.image) {
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height)
    }

    // 포즈 랜드마크가 감지된 경우
    if (results.poseLandmarks) {
      const landmarks = results.poseLandmarks

      // 포즈 연결선 그리기
      drawConnectors(ctx, landmarks, Pose.POSE_CONNECTIONS, {
        color: '#00FF00',
        lineWidth: 2
      })

      // 랜드마크 점 그리기
      drawLandmarks(ctx, landmarks, {
        color: '#FF0000',
        lineWidth: 1,
        radius: 2
      })

      // 현재 포즈 업데이트
      setCurrentPose(landmarks)

      // 녹화 중이면 데이터 저장
      if (isRecording) {
        const poseData: PoseData = {
          timestamp: Date.now(),
          landmarks: landmarks
        }
        setRecordedData(prev => [...prev, poseData])
      }

      // 콜백 실행
      onPoseDetected?.(landmarks)
    }
  }, [isRecording, onPoseDetected])

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    initializePose()

    return () => {
      // 컴포넌트 언마운트 시 정리
      if (cameraRef.current) {
        cameraRef.current.stop()
      }
      if (poseRef.current) {
        poseRef.current.close()
      }
    }
  }, [initializePose])

  // 녹화 시작/종료 시 데이터 초기화
  useEffect(() => {
    if (isRecording) {
      setRecordedData([])
    }
  }, [isRecording])

  // 녹화된 데이터 가져오기
  const getRecordedData = useCallback(() => {
    return recordedData
  }, [recordedData])

  // 포즈 품질 계산 (신뢰도 기반)
  const getPoseQuality = useCallback(() => {
    if (currentPose.length === 0) return 0

    const totalConfidence = currentPose.reduce((sum, landmark) => {
      return sum + (landmark.visibility || 0)
    }, 0)

    return Math.round((totalConfidence / currentPose.length) * 100)
  }, [currentPose])

  const poseQuality = getPoseQuality()

  return (
    <div className="relative w-full h-full">
      {/* 로딩 상태 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>카메라 초기화 중...</p>
          </div>
        </div>
      )}

      {/* 비디오 및 캔버스 */}
      <div className="relative">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{ display: 'none' }} // 실제 비디오는 숨김
          muted
          playsInline
        />

        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="w-full h-full object-cover rounded-lg"
        />
      </div>

      {/* 포즈 품질 표시 */}
      {isInitialized && currentPose.length > 0 && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
          포즈 품질: {poseQuality}%
        </div>
      )}

      {/* 녹화 상태 표시 */}
      {isRecording && (
        <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm flex items-center">
          <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
          REC ({recordedData.length} frames)
        </div>
      )}

      {/* 상태 정보 */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-xs">
        {!isInitialized ? '카메라 연결 중...' :
         currentPose.length === 0 ? '포즈를 찾는 중...' :
         '포즈 감지됨'}
      </div>

      {/* 가이드라인 */}
      {isInitialized && (
        <div className="absolute inset-0 pointer-events-none">
          {/* 중앙 가이드라인 */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-1 h-16 bg-white bg-opacity-30"></div>
            <div className="w-16 h-1 bg-white bg-opacity-30 absolute top-8 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
          </div>

          {/* 테두리 가이드 */}
          <div className="absolute inset-4 border-2 border-white border-opacity-30 rounded-lg"></div>
        </div>
      )}
    </div>
  )
}

export default MotionCaptureComponent