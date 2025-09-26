import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import Avatar3D from './Avatar3D';

const Scene3D = ({ poses }) => {
  return (
    <Canvas
      camera={{
        position: [0, 0, 5],
        fov: 75,
        near: 0.1,
        far: 1000
      }}
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(to bottom, #1a1a2e, #16213e)'
      }}
    >
      <Suspense fallback={null}>
        {/* 조명 설정 */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, -10, -10]} intensity={0.3} />

        {/* 바닥 그리드 */}
        <Grid
          args={[10, 10]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#444"
          sectionSize={1}
          sectionThickness={1}
          sectionColor="#666"
          fadeDistance={10}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid={true}
        />

        {/* 3D 아바타 */}
        <Avatar3D poses={poses} />

        {/* 카메라 컨트롤 */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI}
          minDistance={2}
          maxDistance={20}
        />

        {/* 성능 모니터 주석 처리 - 호환성 이슈로 인해 제거 */}
        {/* <Stats /> */}
      </Suspense>
    </Canvas>
  );
};

export default Scene3D;