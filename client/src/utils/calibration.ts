import * as THREE from 'three';
import type { PoseFrame } from '../types/index';
import type { MappingConfig, BoneConfig } from '../components/viewer/BoneMappingControls';

const MP = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
};

/**
 * Calculate the best axis flip configuration by trying all combinations
 */
function findBestAxisFlip(dir: THREE.Vector3): { flipX: boolean; flipY: boolean; flipZ: boolean } {
  const combinations = [
    { flipX: false, flipY: false, flipZ: false },
    { flipX: true, flipY: false, flipZ: false },
    { flipX: false, flipY: true, flipZ: false },
    { flipX: false, flipY: false, flipZ: true },
    { flipX: true, flipY: true, flipZ: false },
    { flipX: true, flipY: false, flipZ: true },
    { flipX: false, flipY: true, flipZ: true },
    { flipX: true, flipY: true, flipZ: true },
  ];

  // For T-pose, we expect:
  // - Left arm points left (negative X)
  // - Right arm points right (positive X)
  // - Legs point down (negative Y)

  return combinations[0]; // Will be calculated properly
}

/**
 * Calibrate bone config from T-pose
 */
function calibrateBone(
  poseData: PoseFrame,
  startIdx: number,
  endIdx: number,
  expectedDir: THREE.Vector3
): BoneConfig {
  const lm = poseData.worldLandmarks;

  // Try all 8 combinations of axis flips
  let bestConfig: BoneConfig | null = null;
  let bestScore = -Infinity;

  const flipCombinations = [
    { flipX: false, flipY: false, flipZ: false },
    { flipX: true, flipY: false, flipZ: false },
    { flipX: false, flipY: true, flipZ: false },
    { flipX: false, flipY: false, flipZ: true },
    { flipX: true, flipY: true, flipZ: false },
    { flipX: true, flipY: false, flipZ: true },
    { flipX: false, flipY: true, flipZ: true },
    { flipX: true, flipY: true, flipZ: true },
  ];

  for (const flip of flipCombinations) {
    // Apply flips to landmarks
    const start = new THREE.Vector3(
      flip.flipX ? -lm[startIdx].x : lm[startIdx].x,
      flip.flipY ? -lm[startIdx].y : lm[startIdx].y,
      flip.flipZ ? -lm[startIdx].z : lm[startIdx].z
    );

    const end = new THREE.Vector3(
      flip.flipX ? -lm[endIdx].x : lm[endIdx].x,
      flip.flipY ? -lm[endIdx].y : lm[endIdx].y,
      flip.flipZ ? -lm[endIdx].z : lm[endIdx].z
    );

    const direction = new THREE.Vector3().subVectors(end, start).normalize();

    // Calculate how well this direction matches expected direction
    const score = direction.dot(expectedDir);

    if (score > bestScore) {
      bestScore = score;
      bestConfig = {
        ...flip,
        defaultDirX: expectedDir.x,
        defaultDirY: expectedDir.y,
        defaultDirZ: expectedDir.z,
      };
    }
  }

  return bestConfig!;
}

/**
 * Perform T-pose calibration
 * User should be in T-pose (arms extended horizontally, legs together)
 */
export function calibrateFromTPose(poseData: PoseFrame): MappingConfig {
  if (!poseData.worldLandmarks || poseData.worldLandmarks.length === 0) {
    throw new Error('No pose data available for calibration');
  }

  console.log('🎯 Starting T-pose calibration...');

  // Expected directions in T-pose:
  const expectedDirs = {
    leftArm: new THREE.Vector3(-1, 0, 0),      // Left
    leftForeArm: new THREE.Vector3(-1, 0, 0),  // Left
    rightArm: new THREE.Vector3(1, 0, 0),      // Right
    rightForeArm: new THREE.Vector3(1, 0, 0),  // Right
    leftUpLeg: new THREE.Vector3(0, -1, 0),    // Down
    leftLeg: new THREE.Vector3(0, -1, 0),      // Down
    rightUpLeg: new THREE.Vector3(0, -1, 0),   // Down
    rightLeg: new THREE.Vector3(0, -1, 0),     // Down
  };

  const config: MappingConfig = {
    leftArm: calibrateBone(poseData, MP.LEFT_SHOULDER, MP.LEFT_ELBOW, expectedDirs.leftArm),
    leftForeArm: calibrateBone(poseData, MP.LEFT_ELBOW, MP.LEFT_WRIST, expectedDirs.leftForeArm),
    rightArm: calibrateBone(poseData, MP.RIGHT_SHOULDER, MP.RIGHT_ELBOW, expectedDirs.rightArm),
    rightForeArm: calibrateBone(poseData, MP.RIGHT_ELBOW, MP.RIGHT_WRIST, expectedDirs.rightForeArm),
    leftUpLeg: calibrateBone(poseData, MP.LEFT_HIP, MP.LEFT_KNEE, expectedDirs.leftUpLeg),
    leftLeg: calibrateBone(poseData, MP.LEFT_KNEE, MP.LEFT_ANKLE, expectedDirs.leftLeg),
    rightUpLeg: calibrateBone(poseData, MP.RIGHT_HIP, MP.RIGHT_KNEE, expectedDirs.rightUpLeg),
    rightLeg: calibrateBone(poseData, MP.RIGHT_KNEE, MP.RIGHT_ANKLE, expectedDirs.rightLeg),
  };

  console.log('✅ T-pose calibration complete!', config);

  return config;
}

/**
 * Check if current pose is a valid T-pose
 */
export function isValidTPose(poseData: PoseFrame): { valid: boolean; message: string } {
  if (!poseData.worldLandmarks || poseData.worldLandmarks.length === 0) {
    return { valid: false, message: '포즈 데이터가 없습니다' };
  }

  const lm = poseData.worldLandmarks;

  // Check visibility
  const requiredPoints = [
    MP.LEFT_SHOULDER, MP.RIGHT_SHOULDER,
    MP.LEFT_ELBOW, MP.RIGHT_ELBOW,
    MP.LEFT_WRIST, MP.RIGHT_WRIST,
    MP.LEFT_HIP, MP.RIGHT_HIP,
  ];

  for (const idx of requiredPoints) {
    if (lm[idx].visibility < 0.5) {
      return { valid: false, message: '일부 관절이 보이지 않습니다' };
    }
  }

  // Check if arms are extended horizontally
  const leftShoulder = lm[MP.LEFT_SHOULDER];
  const leftElbow = lm[MP.LEFT_ELBOW];
  const leftWrist = lm[MP.LEFT_WRIST];

  const rightShoulder = lm[MP.RIGHT_SHOULDER];
  const rightElbow = lm[MP.RIGHT_ELBOW];
  const rightWrist = lm[MP.RIGHT_WRIST];

  // Calculate arm angles (should be close to horizontal)
  const leftArmY = Math.abs(leftWrist.y - leftShoulder.y);
  const rightArmY = Math.abs(rightWrist.y - rightShoulder.y);

  const leftArmX = Math.abs(leftWrist.x - leftShoulder.x);
  const rightArmX = Math.abs(rightWrist.x - rightShoulder.x);

  // Arms should be more horizontal than vertical
  if (leftArmY > leftArmX * 0.5 || rightArmY > rightArmX * 0.5) {
    return { valid: false, message: '팔을 수평으로 펴세요 (T자)' };
  }

  // Check if arms are extended (not bent)
  const leftArmLength = Math.sqrt(
    Math.pow(leftWrist.x - leftShoulder.x, 2) +
    Math.pow(leftWrist.y - leftShoulder.y, 2) +
    Math.pow(leftWrist.z - leftShoulder.z, 2)
  );

  const leftElbowDist = Math.sqrt(
    Math.pow(leftElbow.x - leftShoulder.x, 2) +
    Math.pow(leftElbow.y - leftShoulder.y, 2) +
    Math.pow(leftElbow.z - leftShoulder.z, 2)
  );

  // Elbow should be roughly halfway
  if (leftElbowDist < leftArmLength * 0.3) {
    return { valid: false, message: '팔을 쭉 펴세요' };
  }

  return { valid: true, message: 'T-pose 준비 완료!' };
}
