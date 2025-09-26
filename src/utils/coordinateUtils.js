import * as THREE from 'three';

// MediaPipe 좌표를 3D 월드 좌표로 변환
export const convertMediaPipeToWorld = (landmark, scale = 4) => {
  return new THREE.Vector3(
    (landmark.x - 0.5) * scale,     // X: 중심을 0으로, -2 to 2 범위
    -(landmark.y - 0.5) * scale,    // Y: 뒤집기 (MediaPipe는 위가 0)
    (landmark.z || 0) * scale * 0.5 // Z: 깊이 정보 (제한적)
  );
};

// 두 점 사이의 벡터 계산
export const calculateDirection = (from, to) => {
  return new THREE.Vector3().subVectors(to, from).normalize();
};

// 두 벡터 사이의 회전 쿼터니언 계산
export const calculateRotationBetweenVectors = (from, to) => {
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(from.normalize(), to.normalize());
  return quaternion;
};

// 관절 각도 계산 (3점을 이용한 각도)
export const calculateJointAngle = (point1, joint, point2) => {
  const vector1 = new THREE.Vector3().subVectors(point1, joint).normalize();
  const vector2 = new THREE.Vector3().subVectors(point2, joint).normalize();

  const dotProduct = vector1.dot(vector2);
  const angle = Math.acos(Math.max(-1, Math.min(1, dotProduct)));

  return angle;
};

// 본의 회전 계산 (부모-자식 관계)
export const calculateBoneRotation = (parentPos, childPos, referenceDirection = new THREE.Vector3(0, 1, 0)) => {
  const currentDirection = calculateDirection(parentPos, childPos);
  return calculateRotationBetweenVectors(referenceDirection, currentDirection);
};

// 스무딩 필터 (이전 값과 현재 값을 보간)
export const smoothValue = (currentValue, previousValue, smoothingFactor = 0.8) => {
  if (!previousValue) return currentValue;

  return previousValue.clone().lerp(currentValue, 1 - smoothingFactor);
};

// 포즈의 신뢰도 검사
export const isPoseReliable = (landmarks, minConfidence = 0.5) => {
  if (!landmarks || landmarks.length === 0) return false;

  const keyJoints = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26]; // 주요 관절들
  let reliableJoints = 0;

  keyJoints.forEach(index => {
    if (landmarks[index] && landmarks[index].visibility > minConfidence) {
      reliableJoints++;
    }
  });

  return reliableJoints >= keyJoints.length * 0.7; // 70% 이상의 관절이 신뢰할만한 경우
};

// 포즈 데이터 정규화
export const normalizePoseData = (landmarks) => {
  if (!landmarks || landmarks.length === 0) return null;

  // 어깨 중점을 기준으로 정규화
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];

  if (!leftShoulder || !rightShoulder) return landmarks;

  const shoulderCenter = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
    z: (leftShoulder.z + rightShoulder.z) / 2
  };

  // 어깨 너비로 스케일 정규화
  const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
  const scale = shoulderWidth > 0 ? 1 / shoulderWidth : 1;

  return landmarks.map(landmark => {
    if (!landmark) return landmark;

    return {
      ...landmark,
      x: (landmark.x - shoulderCenter.x) * scale,
      y: (landmark.y - shoulderCenter.y) * scale,
      z: (landmark.z - shoulderCenter.z) * scale
    };
  });
};

// MediaPipe 랜드마크 인덱스 상수
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32
};