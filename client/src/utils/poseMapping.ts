import * as THREE from 'three';
import type { PoseFrame } from '../types/index';
import type { MappingConfig, BoneConfig } from '../components/viewer/BoneMappingControls';

// MediaPipe landmark indices
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
 * Apply pose using configurable bone mapping
 */
export function applyPoseDirectMapping(
  poseData: PoseFrame,
  skeleton: THREE.Skeleton,
  boneMap: Map<string, THREE.Bone>,
  config: MappingConfig
): void {
  if (!poseData.worldLandmarks || poseData.worldLandmarks.length === 0) {
    return;
  }

  const lm = poseData.worldLandmarks;
  const smoothing = 0.5;

  try {
    // Helper function to create Vector3 from landmark with config
    const vec3 = (index: number, boneConfig: BoneConfig) => {
      const l = lm[index];
      return new THREE.Vector3(
        boneConfig.flipX ? -l.x : l.x,
        boneConfig.flipY ? -l.y : l.y,
        boneConfig.flipZ ? -l.z : l.z
      );
    };

    // Helper to apply bone rotation with config
    const applyBone = (
      bone: THREE.Bone | undefined,
      startIdx: number,
      endIdx: number,
      boneConfig: BoneConfig,
      minVisibility: number = 0.5
    ) => {
      if (!bone || lm[startIdx].visibility < minVisibility || lm[endIdx].visibility < minVisibility) {
        return;
      }

      const start = vec3(startIdx, boneConfig);
      const end = vec3(endIdx, boneConfig);
      const direction = new THREE.Vector3().subVectors(end, start).normalize();

      const defaultDir = new THREE.Vector3(
        boneConfig.defaultDirX,
        boneConfig.defaultDirY,
        boneConfig.defaultDirZ
      ).normalize();

      const quat = new THREE.Quaternion().setFromUnitVectors(defaultDir, direction);
      bone.quaternion.slerp(quat, smoothing);
    };

    // Apply all bones using config
    applyBone(boneMap.get('leftArm'), MP.LEFT_SHOULDER, MP.LEFT_ELBOW, config.leftArm);
    applyBone(boneMap.get('leftForeArm'), MP.LEFT_ELBOW, MP.LEFT_WRIST, config.leftForeArm);
    applyBone(boneMap.get('rightArm'), MP.RIGHT_SHOULDER, MP.RIGHT_ELBOW, config.rightArm);
    applyBone(boneMap.get('rightForeArm'), MP.RIGHT_ELBOW, MP.RIGHT_WRIST, config.rightForeArm);
    applyBone(boneMap.get('leftUpLeg'), MP.LEFT_HIP, MP.LEFT_KNEE, config.leftUpLeg);
    applyBone(boneMap.get('leftLeg'), MP.LEFT_KNEE, MP.LEFT_ANKLE, config.leftLeg);
    applyBone(boneMap.get('rightUpLeg'), MP.RIGHT_HIP, MP.RIGHT_KNEE, config.rightUpLeg);
    applyBone(boneMap.get('rightLeg'), MP.RIGHT_KNEE, MP.RIGHT_ANKLE, config.rightLeg);

  } catch (error) {
    console.error('Error applying pose:', error);
  }
}
