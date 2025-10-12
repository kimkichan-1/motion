import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, useGLTF, useFBX } from '@react-three/drei';
import { useModelStore } from '../../store/modelStore';
import { useMotionStore } from '../../store/motionStore';
import * as THREE from 'three';

interface Model3DProps {
  modelUrl: string;
  modelType: 'fbx' | 'glb' | 'gltf';
}

function Model3D({ modelUrl, modelType }: Model3DProps) {
  const meshRef = useRef<THREE.Group>(null);
  const { currentMotionData } = useMotionStore();

  // Load model based on type
  let model;
  try {
    if (modelType === 'fbx') {
      model = useFBX(modelUrl);
    } else {
      model = useGLTF(modelUrl);
    }
  } catch (error) {
    console.error('Error loading model:', error);
    return null;
  }

  // Apply motion data to model
  useFrame(() => {
    if (meshRef.current && currentMotionData.length > 0) {
      const latestMotion = currentMotionData[currentMotionData.length - 1];

      // Apply transformations based on motion data
      // This will be enhanced when we integrate Kalidokit
      if (latestMotion.landmarks) {
        // For now, just rotate the model based on pose
        // Full implementation will use Kalidokit to convert landmarks to bone rotations
        meshRef.current.rotation.y += 0.001;
      }
    }
  });

  return (
    <primitive
      ref={meshRef}
      object={model.scene || model}
      scale={1}
      position={[0, 0, 0]}
    />
  );
}

interface ModelViewerProps {
  className?: string;
  showGrid?: boolean;
  showControls?: boolean;
}

export default function ModelViewer({
  className = '',
  showGrid = true,
  showControls = true
}: ModelViewerProps) {
  const { currentModel } = useModelStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Setup canvas and renderer settings
    if (canvasRef.current) {
      const gl = canvasRef.current.getContext('webgl2');
      if (gl) {
        gl.enable(gl.DEPTH_TEST);
      }
    }
  }, []);

  return (
    <div className={`w-full h-full bg-gray-900 ${className}`}>
      <Canvas
        ref={canvasRef}
        shadows
        gl={{
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true
        }}
        dpr={[1, 2]}
      >
        {/* Camera */}
        <PerspectiveCamera
          makeDefault
          position={[0, 1.5, 3]}
          fov={50}
        />

        {/* Lights */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-5, 5, -5]} intensity={0.5} />
        <spotLight
          position={[0, 5, 0]}
          angle={0.3}
          penumbra={1}
          intensity={0.5}
          castShadow
        />

        {/* Grid */}
        {showGrid && (
          <Grid
            args={[10, 10]}
            cellSize={0.5}
            cellThickness={0.5}
            cellColor="#6b7280"
            sectionSize={1}
            sectionThickness={1}
            sectionColor="#374151"
            fadeDistance={25}
            fadeStrength={1}
            followCamera={false}
            infiniteGrid={true}
          />
        )}

        {/* 3D Model */}
        {currentModel && (
          <Model3D
            modelUrl={currentModel.file_url}
            modelType={currentModel.file_type as 'fbx' | 'glb' | 'gltf'}
          />
        )}

        {/* Placeholder when no model */}
        {!currentModel && (
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#4f46e5" />
          </mesh>
        )}

        {/* Controls */}
        {showControls && (
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={1}
            maxDistance={10}
            target={[0, 1, 0]}
          />
        )}
      </Canvas>

      {/* Info Overlay */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded">
        <p className="text-sm">
          {currentModel ? currentModel.name : 'No model loaded'}
        </p>
        {currentModel && (
          <p className="text-xs text-gray-300 mt-1">
            {currentModel.file_type.toUpperCase()} • {(currentModel.file_size / 1024 / 1024).toFixed(2)} MB
          </p>
        )}
      </div>

      {/* Controls Info */}
      {showControls && (
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded text-xs">
          <p>Left Click: Rotate</p>
          <p>Right Click: Pan</p>
          <p>Scroll: Zoom</p>
        </div>
      )}
    </div>
  );
}
