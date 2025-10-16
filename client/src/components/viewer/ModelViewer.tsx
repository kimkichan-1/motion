import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useGLTF, useFBX, Center } from '@react-three/drei';
import * as THREE from 'three';
import { useModelStore } from '../../store/modelStore';
import { getSkeletonFromModel, detectBoneMapping } from '../../utils/motionRetargeting';
import { applyPoseDirectMapping } from '../../utils/poseMapping';
import type { PoseFrame } from '../../types/index';
import type { MappingConfig } from './BoneMappingControls';

interface ModelProps {
  url: string;
  fileType: 'fbx' | 'glb' | 'gltf';
  poseData?: PoseFrame;
  mappingConfig: MappingConfig;
}

function Model({ url, fileType, poseData, mappingConfig }: ModelProps) {
  const modelRef = useRef<THREE.Group>(null);
  const [skeleton, setSkeleton] = useState<THREE.Skeleton | null>(null);
  const [boneMap, setBoneMap] = useState<Map<string, THREE.Bone> | null>(null);
  const [showBoneAxes, setShowBoneAxes] = useState(false); // Debug mode
  let model: any = null;

  if (fileType === 'fbx') {
    model = useFBX(url);
  } else {
    model = useGLTF(url);
  }

  // Add bone axis helpers for debugging
  useEffect(() => {
    if (!modelRef.current || !skeleton || !showBoneAxes) return;

    const helpers: THREE.AxesHelper[] = [];

    skeleton.bones.forEach(bone => {
      const axesHelper = new THREE.AxesHelper(0.1);
      bone.add(axesHelper);
      helpers.push(axesHelper);
    });

    return () => {
      helpers.forEach(helper => {
        helper.parent?.remove(helper);
      });
    };
  }, [skeleton, showBoneAxes]);

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

    // Detect skeleton and bone mapping
    const detectedSkeleton = getSkeletonFromModel(modelRef.current);
    if (detectedSkeleton) {
      setSkeleton(detectedSkeleton);

      // Print all bone names for debugging
      console.log('===== ALL BONE NAMES IN MODEL =====');
      detectedSkeleton.bones.forEach((bone, index) => {
        console.log(`${index}: ${bone.name}`);
      });
      console.log('===================================');

      const detectedBoneMap = detectBoneMapping(detectedSkeleton);
      setBoneMap(detectedBoneMap);
      console.log('Detected bones:', Array.from(detectedBoneMap.keys()));
      console.log('Total bones in skeleton:', detectedSkeleton.bones.length);
    } else {
      console.warn('No skeleton found in model');
    }
  }, [model]);

  useFrame(() => {
    if (!skeleton || !boneMap || !poseData) return;

    // Apply pose data to skeleton using direct mapping with config
    applyPoseDirectMapping(poseData, skeleton, boneMap, mappingConfig);
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

interface ModelViewerProps {
  poseData?: PoseFrame;
  mappingConfig: MappingConfig;
}

export default function ModelViewer({ poseData, mappingConfig }: ModelViewerProps) {
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
            poseData={poseData}
            mappingConfig={mappingConfig}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
