import * as THREE from 'three';
import {
  POSE_LANDMARKS,
  convertMediaPipeToWorld,
  calculateBoneRotation,
  calculateJointAngle,
  smoothValue,
  isPoseReliable
} from './coordinateUtils';

// MediaPipe 랜드마크와 3D 모델 본 매핑
export const BONE_MAPPING = {
  // 상체
  leftShoulder: POSE_LANDMARKS.LEFT_SHOULDER,
  rightShoulder: POSE_LANDMARKS.RIGHT_SHOULDER,
  leftElbow: POSE_LANDMARKS.LEFT_ELBOW,
  rightElbow: POSE_LANDMARKS.RIGHT_ELBOW,
  leftWrist: POSE_LANDMARKS.LEFT_WRIST,
  rightWrist: POSE_LANDMARKS.RIGHT_WRIST,

  // 하체
  leftHip: POSE_LANDMARKS.LEFT_HIP,
  rightHip: POSE_LANDMARKS.RIGHT_HIP,
  leftKnee: POSE_LANDMARKS.LEFT_KNEE,
  rightKnee: POSE_LANDMARKS.RIGHT_KNEE,
  leftAnkle: POSE_LANDMARKS.LEFT_ANKLE,
  rightAnkle: POSE_LANDMARKS.RIGHT_ANKLE,

  // 기타
  nose: POSE_LANDMARKS.NOSE
};

// 본 체인 정의 (부모-자식 관계)
export const BONE_CHAINS = {
  leftArm: [
    { parent: 'leftShoulder', child: 'leftElbow' },
    { parent: 'leftElbow', child: 'leftWrist' }
  ],
  rightArm: [
    { parent: 'rightShoulder', child: 'rightElbow' },
    { parent: 'rightElbow', child: 'rightWrist' }
  ],
  leftLeg: [
    { parent: 'leftHip', child: 'leftKnee' },
    { parent: 'leftKnee', child: 'leftAnkle' }
  ],
  rightLeg: [
    { parent: 'rightHip', child: 'rightKnee' },
    { parent: 'rightKnee', child: 'rightAnkle' }
  ],
  spine: [
    { parent: 'neck', child: 'spine' },
    { parent: 'spine', child: 'hip' }
  ]
};

// 본 매퍼 클래스
export class BoneMapper {
  constructor() {
    this.previousPositions = {};
    this.smoothingFactor = 0.7;
    this.initialized = false;
  }

  // MediaPipe 포즈를 3D 본 데이터로 변환
  mapPoseToBones(landmarks) {
    if (!landmarks || !isPoseReliable(landmarks)) {
      return null;
    }

    const boneData = {};

    // 기본 관절 위치 변환
    Object.entries(BONE_MAPPING).forEach(([boneName, landmarkIndex]) => {
      const landmark = landmarks[landmarkIndex];
      if (landmark) {
        const worldPos = convertMediaPipeToWorld(landmark);

        // 스무딩 적용
        if (this.previousPositions[boneName]) {
          boneData[boneName] = smoothValue(
            worldPos,
            this.previousPositions[boneName],
            this.smoothingFactor
          );
        } else {
          boneData[boneName] = worldPos;
        }

        this.previousPositions[boneName] = boneData[boneName].clone();
      }
    });

    // 계산된 관절 위치 (목, 척추, 골반 중심)
    this.calculateVirtualJoints(boneData);

    // 본 회전 계산
    this.calculateBoneRotations(boneData);

    return boneData;
  }

  // 가상 관절 위치 계산
  calculateVirtualJoints(boneData) {
    // 목 위치 (양 어깨의 중점 위쪽)
    if (boneData.leftShoulder && boneData.rightShoulder) {
      boneData.neck = boneData.leftShoulder.clone()
        .add(boneData.rightShoulder)
        .multiplyScalar(0.5);
      boneData.neck.y += 0.3; // 목 높이 조정
    }

    // 척추 위치 (어깨와 골반 중점의 중간)
    if (boneData.leftShoulder && boneData.rightShoulder &&
        boneData.leftHip && boneData.rightHip) {

      const shoulderCenter = boneData.leftShoulder.clone()
        .add(boneData.rightShoulder)
        .multiplyScalar(0.5);

      const hipCenter = boneData.leftHip.clone()
        .add(boneData.rightHip)
        .multiplyScalar(0.5);

      boneData.spine = shoulderCenter.clone()
        .add(hipCenter)
        .multiplyScalar(0.5);
    }

    // 골반 중심 위치
    if (boneData.leftHip && boneData.rightHip) {
      boneData.hip = boneData.leftHip.clone()
        .add(boneData.rightHip)
        .multiplyScalar(0.5);
    }
  }

  // 본 회전 계산
  calculateBoneRotations(boneData) {
    boneData.rotations = {};

    // 각 본 체인에 대해 회전 계산
    Object.entries(BONE_CHAINS).forEach(([chainName, bones]) => {
      bones.forEach(({ parent, child }) => {
        if (boneData[parent] && boneData[child]) {
          const rotation = calculateBoneRotation(
            boneData[parent],
            boneData[child]
          );

          boneData.rotations[`${parent}-${child}`] = rotation;
        }
      });
    });

    // 특별한 회전 계산 (몸통 회전 등)
    this.calculateSpecialRotations(boneData);
  }

  // 특별한 회전 계산 (몸통, 어깨 등)
  calculateSpecialRotations(boneData) {
    if (!boneData.rotations) boneData.rotations = {};

    // 어깨 회전 (어깨선의 기울기)
    if (boneData.leftShoulder && boneData.rightShoulder) {
      const shoulderDirection = new THREE.Vector3()
        .subVectors(boneData.rightShoulder, boneData.leftShoulder)
        .normalize();

      // const horizontalRef = new THREE.Vector3(1, 0, 0);
      boneData.rotations.shoulders = calculateBoneRotation(
        new THREE.Vector3(0, 0, 0),
        shoulderDirection
      );
    }

    // 골반 회전
    if (boneData.leftHip && boneData.rightHip) {
      const hipDirection = new THREE.Vector3()
        .subVectors(boneData.rightHip, boneData.leftHip)
        .normalize();

      boneData.rotations.hips = calculateBoneRotation(
        new THREE.Vector3(0, 0, 0),
        hipDirection
      );
    }

    // 몸통 회전 (척추)
    if (boneData.neck && boneData.hip) {
      const spineDirection = new THREE.Vector3()
        .subVectors(boneData.neck, boneData.hip)
        .normalize();

      // const verticalRef = new THREE.Vector3(0, 1, 0);
      boneData.rotations.spine = calculateBoneRotation(
        new THREE.Vector3(0, 0, 0),
        spineDirection
      );
    }
  }

  // 관절 각도 분석
  analyzeJointAngles(boneData) {
    const angles = {};

    // 팔꿈치 각도
    if (boneData.leftShoulder && boneData.leftElbow && boneData.leftWrist) {
      angles.leftElbow = calculateJointAngle(
        boneData.leftShoulder,
        boneData.leftElbow,
        boneData.leftWrist
      );
    }

    if (boneData.rightShoulder && boneData.rightElbow && boneData.rightWrist) {
      angles.rightElbow = calculateJointAngle(
        boneData.rightShoulder,
        boneData.rightElbow,
        boneData.rightWrist
      );
    }

    // 무릎 각도
    if (boneData.leftHip && boneData.leftKnee && boneData.leftAnkle) {
      angles.leftKnee = calculateJointAngle(
        boneData.leftHip,
        boneData.leftKnee,
        boneData.leftAnkle
      );
    }

    if (boneData.rightHip && boneData.rightKnee && boneData.rightAnkle) {
      angles.rightKnee = calculateJointAngle(
        boneData.rightHip,
        boneData.rightKnee,
        boneData.rightAnkle
      );
    }

    return angles;
  }

  // 포즈 안정성 검사
  isPoseStable(boneData) {
    if (!this.previousPositions || Object.keys(this.previousPositions).length === 0) {
      return false;
    }

    const threshold = 0.1; // 위치 변화 임계값
    let stableJoints = 0;
    let totalJoints = 0;

    Object.entries(boneData).forEach(([boneName, position]) => {
      if (position instanceof THREE.Vector3 && this.previousPositions[boneName]) {
        const distance = position.distanceTo(this.previousPositions[boneName]);
        if (distance < threshold) {
          stableJoints++;
        }
        totalJoints++;
      }
    });

    return totalJoints > 0 ? (stableJoints / totalJoints) > 0.8 : false;
  }

  // 매퍼 리셋
  reset() {
    this.previousPositions = {};
    this.initialized = false;
  }
}