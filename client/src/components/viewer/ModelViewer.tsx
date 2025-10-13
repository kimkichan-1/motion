import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useGLTF, useFBX, Center } from '@react-three/drei';
import * as THREE from 'three';
import { useModelStore } from '../../store/modelStore';

interface ModelProps {
  url: string;
  fileType: 'fbx' | 'glb' | 'gltf';
  poseData?: any;
}

function Model({ url, fileType, poseData }: ModelProps) {
  const modelRef = useRef<THREE.Group>(null);
  let model: any = null;

  if (fileType === 'fbx') {
    model = useFBX(url);
  } else {
    model = useGLTF(url);
  }

  useEffect(() => {
    if (!modelRef.current) return;

    // Auto-scale model to fit in view
    const box = new THREE.Box3().setFromObject(modelRef.current);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2 / maxDim;
    modelRef.current.scale.setScalar(scale);

    // Center the model
    const center = box.getCenter(new THREE.Vector3());
    modelRef.current.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
  }, [model]);

  useFrame(() => {
    if (!modelRef.current || !poseData) return;

    // Apply pose data to model
    // This is a simplified version - actual retargeting would be more complex
    if (poseData.landmarks) {
      // Example: rotate based on pose
      const shoulderLeft = poseData.landmarks[11];
      const shoulderRight = poseData.landmarks[12];

      if (shoulderLeft && shoulderRight) {
        const angle = Math.atan2(
          shoulderRight.y - shoulderLeft.y,
          shoulderRight.x - shoulderLeft.x
        );
        modelRef.current.rotation.z = angle;
      }
    }
  });

  return (
    <primitive
      ref={modelRef}
      object={fileType === 'fbx' ? model : model.scene}
    />
  );
}

function Loader() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="orange" wireframe />
    </mesh>
  );
}

export default function ModelViewer() {
  const { currentModel } = useModelStore();

  if (!currentModel) {
    return (
      <div className="aspect-video bg-gray-800 rounded flex items-center justify-center text-white">
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <p className="text-gray-400">No model selected</p>
          <p className="text-sm text-gray-500 mt-2">Upload a model to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video bg-gray-800 rounded overflow-hidden">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 1.5, 5]} />
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
        />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />

        {/* Grid */}
        <gridHelper args={[10, 10]} />

        {/* 3D Model with Suspense */}
        <Suspense fallback={<Loader />}>
          <Model
            url={currentModel.file_url}
            fileType={currentModel.file_type}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
