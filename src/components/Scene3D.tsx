import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid } from '@react-three/drei';
import { Suspense } from 'react';
import { FBXAvatar } from './FBXAvatar';
import { PoseData } from '../hooks/useMediaPipePose';

interface Scene3DProps {
  poseData: PoseData | null;
  modelPath?: string;
}

export const Scene3D: React.FC<Scene3DProps> = ({ poseData, modelPath }) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      shadows
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      <Suspense fallback={<LoadingPlaceholder />}>
        <FBXAvatar poseData={poseData} modelPath={modelPath} />
      </Suspense>

      <Grid
        args={[10, 10]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#ffffff"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#ffffff"
        fadeDistance={25}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={true}
        position={[0, -1, 0]}
      />

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        maxPolarAngle={Math.PI / 2}
        minDistance={2}
        maxDistance={20}
      />

      <Environment preset="studio" />
    </Canvas>
  );
};

const LoadingPlaceholder = () => (
  <mesh>
    <boxGeometry args={[1, 2, 0.5]} />
    <meshStandardMaterial color="#cccccc" />
  </mesh>
);