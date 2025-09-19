import { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import * as THREE from 'three'

interface ModelViewerProps {
  modelUrl?: string
  modelType?: 'glb' | 'fbx' | 'obj'
  autoRotate?: boolean
  showWireframe?: boolean
  onModelLoad?: (model: any) => void
}

// 3D 모델 컴포넌트
function Model({ url, type, showWireframe, onModelLoad }: {
  url: string
  type: 'glb' | 'fbx' | 'obj'
  showWireframe: boolean
  onModelLoad?: (model: any) => void
}) {
  const meshRef = useRef<THREE.Group>(null)

  let model: any

  try {
    switch (type) {
      case 'glb':
        model = useLoader(GLTFLoader, url)
        break
      case 'fbx':
        model = useLoader(FBXLoader, url)
        break
      case 'obj':
        model = useLoader(OBJLoader, url)
        break
      default:
        model = useLoader(GLTFLoader, url)
    }
  } catch (error) {
    console.error('Model loading error:', error)
    return null
  }

  // 모델이 로드되면 콜백 실행
  if (model && onModelLoad) {
    onModelLoad(model)
  }

  // 모델 회전 애니메이션
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5
    }
  })

  if (!model) return null

  // GLB/GLTF 모델의 경우
  if (model.scene) {
    return (
      <group ref={meshRef}>
        <primitive
          object={model.scene}
          scale={[1, 1, 1]}
        />
      </group>
    )
  }

  // FBX, OBJ 모델의 경우
  return (
    <group ref={meshRef}>
      <primitive
        object={model}
        scale={[0.01, 0.01, 0.01]}
      />
    </group>
  )
}

// 기본 3D 장면 (모델이 없을 때)
function DefaultScene() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5
      meshRef.current.rotation.y += delta * 0.3
    }
  })

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#3b82f6" />
    </mesh>
  )
}

// 로딩 컴포넌트
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <p className="text-gray-600">3D 모델 로딩 중...</p>
      </div>
    </div>
  )
}

const ModelViewer: React.FC<ModelViewerProps> = ({
  modelUrl,
  modelType = 'glb',
  autoRotate = false,
  showWireframe = false,
  onModelLoad
}) => {
  const [error, setError] = useState<string | null>(null)

  const handleError = (error: any) => {
    console.error('3D Viewer Error:', error)
    setError('모델을 불러올 수 없습니다.')
  }

  return (
    <div className="w-full h-full bg-gray-100 rounded-lg overflow-hidden">
      {error ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 btn-secondary text-sm"
            >
              다시 시도
            </button>
          </div>
        </div>
      ) : (
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          onError={handleError}
        >
          {/* 조명 설정 */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, -10, -5]} intensity={0.5} />

          {/* 환경 설정 */}
          <Environment preset="studio" />

          {/* 모델 또는 기본 장면 */}
          <Suspense fallback={null}>
            {modelUrl ? (
              <Model
                url={modelUrl}
                type={modelType}
                showWireframe={showWireframe}
                onModelLoad={onModelLoad}
              />
            ) : (
              <DefaultScene />
            )}
          </Suspense>

          {/* 카메라 컨트롤 */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            autoRotate={autoRotate}
            autoRotateSpeed={2}
          />
        </Canvas>
      )}

      {/* 로딩 오버레이 */}
      {modelUrl && (
        <Suspense fallback={<LoadingFallback />}>
          <div className="hidden">로딩 트리거</div>
        </Suspense>
      )}
    </div>
  )
}

export default ModelViewer