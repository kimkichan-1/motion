import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { PoseData } from '../hooks/useMediaPipePose';

interface BoxSkeletonProps {
  poseData: PoseData | null;
  visible?: boolean;
}

// 관절 연결 정보 (부모-자식 관계)
const BONE_CONNECTIONS = [
  // 몸통
  { name: 'spine', from: 24, to: 12, color: '#ff6b6b', size: 0.03 }, // 우측힙 -> 우측어깨
  { name: 'spine2', from: 23, to: 11, color: '#ff6b6b', size: 0.03 }, // 좌측힙 -> 좌측어깨
  { name: 'hip_line', from: 23, to: 24, color: '#4ecdc4', size: 0.025 }, // 힙 라인
  { name: 'shoulder_line', from: 11, to: 12, color: '#4ecdc4', size: 0.025 }, // 어깨 라인

  // 목과 머리
  { name: 'neck', from: 11, to: 0, color: '#ffe66d', size: 0.02 }, // 좌측어깨 -> 코
  { name: 'neck2', from: 12, to: 0, color: '#ffe66d', size: 0.02 }, // 우측어깨 -> 코

  // 왼쪽 팔
  { name: 'left_upper_arm', from: 11, to: 13, color: '#ff8b94', size: 0.025 }, // 좌측어깨 -> 좌측팔꿈치
  { name: 'left_forearm', from: 13, to: 15, color: '#ff8b94', size: 0.02 }, // 좌측팔꿈치 -> 좌측손목
  { name: 'left_hand', from: 15, to: 19, color: '#ff8b94', size: 0.015 }, // 좌측손목 -> 좌측검지

  // 오른쪽 팔
  { name: 'right_upper_arm', from: 12, to: 14, color: '#95e1d3', size: 0.025 }, // 우측어깨 -> 우측팔꿈치
  { name: 'right_forearm', from: 14, to: 16, color: '#95e1d3', size: 0.02 }, // 우측팔꿈치 -> 우측손목
  { name: 'right_hand', from: 16, to: 20, color: '#95e1d3', size: 0.015 }, // 우측손목 -> 우측검지

  // 왼쪽 다리
  { name: 'left_thigh', from: 23, to: 25, color: '#a8e6cf', size: 0.03 }, // 좌측힙 -> 좌측무릎
  { name: 'left_shin', from: 25, to: 27, color: '#a8e6cf', size: 0.025 }, // 좌측무릎 -> 좌측발목
  { name: 'left_foot', from: 27, to: 31, color: '#a8e6cf', size: 0.02 }, // 좌측발목 -> 좌측발가락

  // 오른쪽 다리
  { name: 'right_thigh', from: 24, to: 26, color: '#dda0dd', size: 0.03 }, // 우측힙 -> 우측무릎
  { name: 'right_shin', from: 26, to: 28, color: '#dda0dd', size: 0.025 }, // 우측무릎 -> 우측발목
  { name: 'right_foot', from: 28, to: 32, color: '#dda0dd', size: 0.02 }, // 우측발목 -> 우측발가락
];

// 관절 표시용 구체
const JOINT_SPHERES = [
  { index: 0, color: '#ffffff', size: 0.02, name: 'nose' },
  { index: 11, color: '#ff6b6b', size: 0.025, name: 'left_shoulder' },
  { index: 12, color: '#ff6b6b', size: 0.025, name: 'right_shoulder' },
  { index: 13, color: '#ff8b94', size: 0.02, name: 'left_elbow' },
  { index: 14, color: '#95e1d3', size: 0.02, name: 'right_elbow' },
  { index: 15, color: '#ff8b94', size: 0.02, name: 'left_wrist' },
  { index: 16, color: '#95e1d3', size: 0.02, name: 'right_wrist' },
  { index: 23, color: '#4ecdc4', size: 0.03, name: 'left_hip' },
  { index: 24, color: '#4ecdc4', size: 0.03, name: 'right_hip' },
  { index: 25, color: '#a8e6cf', size: 0.025, name: 'left_knee' },
  { index: 26, color: '#dda0dd', size: 0.025, name: 'right_knee' },
  { index: 27, color: '#a8e6cf', size: 0.02, name: 'left_ankle' },
  { index: 28, color: '#dda0dd', size: 0.02, name: 'right_ankle' },
];

export const BoxSkeleton: React.FC<BoxSkeletonProps> = ({ poseData, visible = true }) => {
  const groupRef = useRef<THREE.Group>(null);
  const bonesRef = useRef<{ [key: string]: THREE.Mesh }>({});
  const jointsRef = useRef<{ [key: string]: THREE.Mesh }>({});

  // 골반 중심점 계산
  const getHipCenter = (landmarks: any[]) => {
    if (!landmarks || landmarks.length < 25) return new THREE.Vector3(0, 0, 0);

    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    return new THREE.Vector3(
      (leftHip.x + rightHip.x) / 2,
      -(leftHip.y + rightHip.y) / 2, // Y축 반전
      (leftHip.z + rightHip.z) / 2
    );
  };

  // 사각기둥 생성 (두 점을 연결하는)
  const createBone = (from: THREE.Vector3, to: THREE.Vector3, size: number, color: string) => {
    const direction = new THREE.Vector3().subVectors(to, from);
    const length = direction.length();

    const geometry = new THREE.BoxGeometry(size, length, size);
    const material = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);

    // 위치와 회전 설정
    mesh.position.copy(from.clone().add(direction.multiplyScalar(0.5)));
    mesh.lookAt(to);
    mesh.rotateX(Math.PI / 2); // 기본 방향 조정

    return mesh;
  };

  // 관절 구체 생성
  const createJoint = (position: THREE.Vector3, size: number, color: string) => {
    const geometry = new THREE.SphereGeometry(size, 8, 6);
    const material = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    return mesh;
  };

  // 스켈레톤 업데이트
  useFrame(() => {
    if (!poseData || !groupRef.current) return;

    const landmarks = poseData.worldLandmarks;
    if (!landmarks || landmarks.length < 33) return;

    // 골반 중심점
    const hipCenter = getHipCenter(landmarks);

    // 기존 메시들 제거
    Object.values(bonesRef.current).forEach(bone => {
      groupRef.current?.remove(bone);
    });
    Object.values(jointsRef.current).forEach(joint => {
      groupRef.current?.remove(joint);
    });

    bonesRef.current = {};
    jointsRef.current = {};

    // 신뢰도 체크
    const isValidLandmark = (index: number) => {
      return landmarks[index] && (landmarks[index].visibility || 1) > 0.5;
    };

    // 본 생성
    BONE_CONNECTIONS.forEach(connection => {
      if (!isValidLandmark(connection.from) || !isValidLandmark(connection.to)) return;

      const fromLandmark = landmarks[connection.from];
      const toLandmark = landmarks[connection.to];

      // 골반 중심 기준 상대 위치로 변환
      const from = new THREE.Vector3(
        fromLandmark.x - hipCenter.x,
        -(fromLandmark.y - hipCenter.y),
        fromLandmark.z - hipCenter.z
      ).multiplyScalar(2); // 스케일 조정

      const to = new THREE.Vector3(
        toLandmark.x - hipCenter.x,
        -(toLandmark.y - hipCenter.y),
        toLandmark.z - hipCenter.z
      ).multiplyScalar(2); // 스케일 조정

      const bone = createBone(from, to, connection.size, connection.color);
      bonesRef.current[connection.name] = bone;
      groupRef.current?.add(bone);
    });

    // 관절 생성
    JOINT_SPHERES.forEach(joint => {
      if (!isValidLandmark(joint.index)) return;

      const landmark = landmarks[joint.index];
      const position = new THREE.Vector3(
        landmark.x - hipCenter.x,
        -(landmark.y - hipCenter.y),
        landmark.z - hipCenter.z
      ).multiplyScalar(2); // 스케일 조정

      const jointMesh = createJoint(position, joint.size, joint.color);
      jointsRef.current[joint.name] = jointMesh;
      groupRef.current?.add(jointMesh);
    });
  });

  if (!visible) return null;

  return (
    <group ref={groupRef}>
      {/* 기본 조명 */}
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} />
    </group>
  );
};