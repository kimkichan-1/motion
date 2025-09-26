import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BoneMapper } from '../utils/boneMapping';

// 간단한 스틱 피겨 아바타 생성
const Avatar3D = ({ poses, isVisible = true }) => {
  const groupRef = useRef();
  const [boneMapper] = useState(() => new BoneMapper());
  const [jointRefs] = useState(() => ({}));

  // 스틱 피겨의 관절과 본 정의
  const joints = useMemo(() => {
    const jointPositions = {
      // 상체
      leftShoulder: new THREE.Vector3(-0.5, 0, 0),
      rightShoulder: new THREE.Vector3(0.5, 0, 0),
      leftElbow: new THREE.Vector3(-0.8, -0.4, 0),
      rightElbow: new THREE.Vector3(0.8, -0.4, 0),
      leftWrist: new THREE.Vector3(-1.0, -0.8, 0),
      rightWrist: new THREE.Vector3(1.0, -0.8, 0),

      // 하체
      leftHip: new THREE.Vector3(-0.2, -1.0, 0),
      rightHip: new THREE.Vector3(0.2, -1.0, 0),
      leftKnee: new THREE.Vector3(-0.2, -1.5, 0),
      rightKnee: new THREE.Vector3(0.2, -1.5, 0),
      leftAnkle: new THREE.Vector3(-0.2, -2.0, 0),
      rightAnkle: new THREE.Vector3(0.2, -2.0, 0),

      // 머리와 척추
      nose: new THREE.Vector3(0, 0.5, 0),
      neck: new THREE.Vector3(0, 0.2, 0),
      spine: new THREE.Vector3(0, -0.5, 0)
    };

    return jointPositions;
  }, []);


  // 프레임마다 포즈 업데이트
  useFrame(() => {
    if (poses && groupRef.current && isVisible) {
      // BoneMapper를 사용해 포즈를 본 데이터로 변환
      const newBoneData = boneMapper.mapPoseToBones(poses);

      if (newBoneData) {
        // 각 관절의 메쉬 위치 직접 업데이트
        Object.entries(newBoneData).forEach(([jointName, position]) => {
          if (position instanceof THREE.Vector3 && jointRefs[jointName]) {
            jointRefs[jointName].position.copy(position);
          }
        });

        // 계산된 가상 관절들도 업데이트
        if (newBoneData.neck && jointRefs.neck) {
          jointRefs.neck.position.copy(newBoneData.neck);
        }
        if (newBoneData.spine && jointRefs.spine) {
          jointRefs.spine.position.copy(newBoneData.spine);
        }

        // 원래 joints 객체도 업데이트 (선 그리기용)
        Object.entries(newBoneData).forEach(([jointName, position]) => {
          if (position instanceof THREE.Vector3 && joints[jointName]) {
            joints[jointName].copy(position);
          }
        });
        if (newBoneData.neck && joints.neck) {
          joints.neck.copy(newBoneData.neck);
        }
        if (newBoneData.spine && joints.spine) {
          joints.spine.copy(newBoneData.spine);
        }
      }
    }
  });

  if (!isVisible) return null;

  return (
    <group ref={groupRef}>
      {/* 관절점들 */}
      {Object.entries(joints).map(([name, position]) => (
        <mesh
          key={name}
          position={position}
          ref={(ref) => {
            if (ref) jointRefs[name] = ref;
          }}
        >
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color="#ff6b6b" />
        </mesh>
      ))}

      {/* 본 연결선들 */}
      {poses && (
        <>
          {/* 팔 연결 */}
          <BoneLine
            start={joints.leftShoulder}
            end={joints.leftElbow}
            color="#4ecdc4"
          />
          <BoneLine
            start={joints.leftElbow}
            end={joints.leftWrist}
            color="#4ecdc4"
          />
          <BoneLine
            start={joints.rightShoulder}
            end={joints.rightElbow}
            color="#4ecdc4"
          />
          <BoneLine
            start={joints.rightElbow}
            end={joints.rightWrist}
            color="#4ecdc4"
          />

          {/* 어깨와 몸통 */}
          <BoneLine
            start={joints.leftShoulder}
            end={joints.rightShoulder}
            color="#45b7d1"
          />
          <BoneLine
            start={joints.neck}
            end={joints.spine}
            color="#45b7d1"
          />

          {/* 다리 연결 */}
          <BoneLine
            start={joints.leftHip}
            end={joints.leftKnee}
            color="#96ceb4"
          />
          <BoneLine
            start={joints.leftKnee}
            end={joints.leftAnkle}
            color="#96ceb4"
          />
          <BoneLine
            start={joints.rightHip}
            end={joints.rightKnee}
            color="#96ceb4"
          />
          <BoneLine
            start={joints.rightKnee}
            end={joints.rightAnkle}
            color="#96ceb4"
          />

          {/* 골반 */}
          <BoneLine
            start={joints.leftHip}
            end={joints.rightHip}
            color="#45b7d1"
          />

          {/* 머리와 목 */}
          <BoneLine
            start={joints.nose}
            end={joints.neck}
            color="#f7dc6f"
          />
        </>
      )}
    </group>
  );
};

// 본 연결선 컴포넌트
const BoneLine = ({ start, end, color = "#ffffff" }) => {
  const lineRef = useRef();

  useFrame(() => {
    if (lineRef.current && start && end) {
      const points = [start, end];
      lineRef.current.geometry.setFromPoints(points);
    }
  });

  return (
    <line ref={lineRef}>
      <bufferGeometry />
      <lineBasicMaterial color={color} linewidth={3} />
    </line>
  );
};

export default Avatar3D;