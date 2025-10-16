import * as THREE from 'three';
import type { PoseFrame, Landmark } from '../types/index';

/**
 * MediaPipe Pose Landmarks (33 points)
 * 0: nose, 1-2: eyes, 3-4: ears, 5-6: mouth
 * 11-12: shoulders, 13-14: elbows, 15-16: wrists
 * 23-24: hips, 25-26: knees, 27-28: ankles
 */

export const MEDIAPIPE_POSE_LANDMARKS = {
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

// Common bone names in FBX/GLB models
export const COMMON_BONE_NAMES = {
  hips: ['Hips', 'mixamorig:Hips', 'pelvis', 'Pelvis'],
  spine: ['Spine', 'mixamorig:Spine', 'spine1', 'Spine1', 'Abdomen', 'Torso'],
  spine1: ['Spine1', 'mixamorig:Spine1', 'spine2', 'Spine2', 'Torso'],
  spine2: ['Spine2', 'mixamorig:Spine2', 'chest', 'Chest', 'Torso'],
  neck: ['Neck', 'mixamorig:Neck', 'neck1', 'Neck1'],
  head: ['Head', 'mixamorig:Head', 'head1', 'Head1'],

  leftShoulder: ['LeftShoulder', 'mixamorig:LeftShoulder', 'shoulder.L', 'L_Shoulder', 'ShoulderL'],
  leftArm: ['LeftArm', 'mixamorig:LeftArm', 'upperarm.L', 'L_UpperArm', 'UpperArmL'],
  leftForeArm: ['LeftForeArm', 'mixamorig:LeftForeArm', 'lowerarm.L', 'L_Forearm', 'LowerArmL'],
  leftHand: ['LeftHand', 'mixamorig:LeftHand', 'hand.L', 'L_Hand', 'FistL'],

  rightShoulder: ['RightShoulder', 'mixamorig:RightShoulder', 'shoulder.R', 'R_Shoulder', 'ShoulderR'],
  rightArm: ['RightArm', 'mixamorig:RightArm', 'upperarm.R', 'R_UpperArm', 'UpperArmR'],
  rightForeArm: ['RightForeArm', 'mixamorig:RightForeArm', 'lowerarm.R', 'R_Forearm', 'LowerArmR'],
  rightHand: ['RightHand', 'mixamorig:RightHand', 'hand.R', 'R_Hand', 'FistR'],

  leftUpLeg: ['LeftUpLeg', 'mixamorig:LeftUpLeg', 'thigh.L', 'L_Thigh', 'UpperLegL'],
  leftLeg: ['LeftLeg', 'mixamorig:LeftLeg', 'shin.L', 'L_Calf', 'LowerLegL'],
  leftFoot: ['LeftFoot', 'mixamorig:LeftFoot', 'foot.L', 'L_Foot', 'FootL'],

  rightUpLeg: ['RightUpLeg', 'mixamorig:RightUpLeg', 'thigh.R', 'R_Thigh', 'UpperLegR'],
  rightLeg: ['RightLeg', 'mixamorig:RightLeg', 'shin.R', 'R_Calf', 'LowerLegR'],
  rightFoot: ['RightFoot', 'mixamorig:RightFoot', 'foot.R', 'R_Foot', 'FootR']
};

/**
 * Find a bone in the skeleton by checking common name variations
 */
export function findBone(skeleton: THREE.Skeleton, possibleNames: string[]): THREE.Bone | null {
  for (const name of possibleNames) {
    const bone = skeleton.bones.find(b => b.name === name);
    if (bone) return bone;
  }
  return null;
}

/**
 * Calculate rotation between three points (for limbs)
 */
export function calculateRotation(
  point1: Landmark,
  point2: Landmark,
  point3: Landmark
): THREE.Euler {
  const v1 = new THREE.Vector3(point1.x, point1.y, point1.z);
  const v2 = new THREE.Vector3(point2.x, point2.y, point2.z);
  const v3 = new THREE.Vector3(point3.x, point3.y, point3.z);

  // Calculate direction vectors
  const dir1 = new THREE.Vector3().subVectors(v2, v1).normalize();
  const dir2 = new THREE.Vector3().subVectors(v3, v2).normalize();

  // Calculate rotation
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, -1, 0), // Default bone direction
    dir1
  );

  return new THREE.Euler().setFromQuaternion(quaternion);
}

/**
 * Calculate angle between two vectors
 */
export function calculateAngle(p1: Landmark, p2: Landmark, p3: Landmark): number {
  const v1 = new THREE.Vector3(p1.x - p2.x, p1.y - p2.y, p1.z - p2.z);
  const v2 = new THREE.Vector3(p3.x - p2.x, p3.y - p2.y, p3.z - p2.z);

  v1.normalize();
  v2.normalize();

  return Math.acos(v1.dot(v2));
}

/**
 * Auto-detect bone mapping by analyzing skeleton structure
 */
export function detectBoneMapping(skeleton: THREE.Skeleton): Map<string, THREE.Bone> {
  const boneMap = new Map<string, THREE.Bone>();

  for (const [key, possibleNames] of Object.entries(COMMON_BONE_NAMES)) {
    const bone = findBone(skeleton, possibleNames);
    if (bone) {
      boneMap.set(key, bone);
    }
  }

  return boneMap;
}

/**
 * Smoothly interpolate quaternion
 */
function slerpQuaternion(current: THREE.Quaternion, target: THREE.Quaternion, alpha: number): THREE.Quaternion {
  return current.clone().slerp(target, alpha);
}

/**
 * Apply MediaPipe pose data to 3D skeleton
 */
export function applyPoseToSkeleton(
  poseData: PoseFrame,
  skeleton: THREE.Skeleton,
  boneMap: Map<string, THREE.Bone>
): void {
  if (!poseData.worldLandmarks || poseData.worldLandmarks.length === 0) {
    return;
  }

  const landmarks = poseData.worldLandmarks;
  const L = MEDIAPIPE_POSE_LANDMARKS;
  const smoothing = 0.3; // Smoothing factor (0 = no smoothing, 1 = instant)

  try {
    // Apply spine/torso rotation (keep minimal for stability)
    const leftShoulder = landmarks[L.LEFT_SHOULDER];
    const rightShoulder = landmarks[L.RIGHT_SHOULDER];
    const leftHip = landmarks[L.LEFT_HIP];
    const rightHip = landmarks[L.RIGHT_HIP];

    if (leftShoulder && rightShoulder && leftHip && rightHip) {
      const spineBone = boneMap.get('spine');
      if (spineBone) {
        // Calculate shoulder tilt only (not full spine direction)
        const shoulderVec = new THREE.Vector3(
          rightShoulder.x - leftShoulder.x,
          rightShoulder.y - leftShoulder.y,
          rightShoulder.z - leftShoulder.z
        ).normalize();

        const tiltAngle = Math.atan2(shoulderVec.y, shoulderVec.x);
        const targetQuat = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 0, 1),
          -tiltAngle * 0.3 // Reduce tilt effect
        );

        spineBone.quaternion.slerp(targetQuat, smoothing);
      }
    }

    // Apply left arm rotations
    const leftShoulderLm = landmarks[L.LEFT_SHOULDER];
    const leftElbow = landmarks[L.LEFT_ELBOW];
    const leftWrist = landmarks[L.LEFT_WRIST];

    if (leftShoulderLm && leftElbow && leftWrist && leftElbow.visibility > 0.5) {
      // Upper arm (shoulder to elbow)
      const leftArmBone = boneMap.get('leftArm');
      if (leftArmBone && leftShoulderLm.visibility > 0.5) {
        // Direction from shoulder to elbow
        const elbowDir = new THREE.Vector3(
          leftElbow.x - leftShoulderLm.x,
          -(leftElbow.y - leftShoulderLm.y), // Flip Y (MediaPipe Y is inverted)
          leftElbow.z - leftShoulderLm.z
        ).normalize();

        // T-pose: left arm points to the left (-X)
        const tPoseDir = new THREE.Vector3(-1, 0, 0);
        const targetQuat = new THREE.Quaternion().setFromUnitVectors(tPoseDir, elbowDir);
        leftArmBone.quaternion.slerp(targetQuat, smoothing);
      }

      // Forearm (elbow to wrist) - relative to upper arm
      const leftForeArmBone = boneMap.get('leftForeArm');
      if (leftForeArmBone && leftWrist.visibility > 0.5) {
        // Calculate elbow bend angle
        const upperArm = new THREE.Vector3(
          leftElbow.x - leftShoulderLm.x,
          -(leftElbow.y - leftShoulderLm.y),
          leftElbow.z - leftShoulderLm.z
        ).normalize();

        const foreArm = new THREE.Vector3(
          leftWrist.x - leftElbow.x,
          -(leftWrist.y - leftElbow.y),
          leftWrist.z - leftElbow.z
        ).normalize();

        // Calculate angle between upper arm and forearm
        const angle = Math.acos(Math.max(-1, Math.min(1, upperArm.dot(foreArm))));

        // Apply rotation only around the hinge axis (should be Z for elbow)
        // Elbow can only bend in one direction
        const bendAngle = Math.PI - angle; // Straightened = 0, bent = positive
        const targetQuat = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 0, 1), // Z-axis rotation for elbow hinge
          bendAngle
        );

        leftForeArmBone.quaternion.slerp(targetQuat, smoothing);
      }
    }

    // Apply right arm rotations
    const rightShoulderLm = landmarks[L.RIGHT_SHOULDER];
    const rightElbow = landmarks[L.RIGHT_ELBOW];
    const rightWrist = landmarks[L.RIGHT_WRIST];

    if (rightShoulderLm && rightElbow && rightWrist && rightElbow.visibility > 0.5) {
      // Upper arm (shoulder to elbow)
      const rightArmBone = boneMap.get('rightArm');
      if (rightArmBone && rightShoulderLm.visibility > 0.5) {
        // Direction from shoulder to elbow
        const elbowDir = new THREE.Vector3(
          rightElbow.x - rightShoulderLm.x,
          -(rightElbow.y - rightShoulderLm.y), // Flip Y
          rightElbow.z - rightShoulderLm.z
        ).normalize();

        // T-pose: right arm points to the right (+X)
        const tPoseDir = new THREE.Vector3(1, 0, 0);
        const targetQuat = new THREE.Quaternion().setFromUnitVectors(tPoseDir, elbowDir);
        rightArmBone.quaternion.slerp(targetQuat, smoothing);
      }

      // Forearm (elbow to wrist) - relative to upper arm
      const rightForeArmBone = boneMap.get('rightForeArm');
      if (rightForeArmBone && rightWrist.visibility > 0.5) {
        // Calculate elbow bend angle
        const upperArm = new THREE.Vector3(
          rightElbow.x - rightShoulderLm.x,
          -(rightElbow.y - rightShoulderLm.y),
          rightElbow.z - rightShoulderLm.z
        ).normalize();

        const foreArm = new THREE.Vector3(
          rightWrist.x - rightElbow.x,
          -(rightWrist.y - rightElbow.y),
          rightWrist.z - rightElbow.z
        ).normalize();

        // Calculate angle between upper arm and forearm
        const angle = Math.acos(Math.max(-1, Math.min(1, upperArm.dot(foreArm))));

        // Apply rotation only around the hinge axis
        const bendAngle = Math.PI - angle;
        const targetQuat = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 0, 1), // Z-axis rotation for elbow hinge
          -bendAngle // Negative for right arm
        );

        rightForeArmBone.quaternion.slerp(targetQuat, smoothing);
      }
    }

    // Apply left leg rotations
    const leftHipLm = landmarks[L.LEFT_HIP];
    const leftKnee = landmarks[L.LEFT_KNEE];
    const leftAnkle = landmarks[L.LEFT_ANKLE];

    if (leftHipLm && leftKnee && leftAnkle && leftKnee.visibility > 0.5) {
      // Upper leg
      const leftUpLegBone = boneMap.get('leftUpLeg');
      if (leftUpLegBone && leftHipLm.visibility > 0.5) {
        const dir = new THREE.Vector3(
          -(leftKnee.x - leftHipLm.x),
          leftKnee.y - leftHipLm.y,
          -(leftKnee.z - leftHipLm.z)
        ).normalize();

        // Legs point downward in T-pose
        const defaultDir = new THREE.Vector3(0, -1, 0);
        const targetQuat = new THREE.Quaternion().setFromUnitVectors(defaultDir, dir);
        leftUpLegBone.quaternion.slerp(targetQuat, smoothing);
      }

      // Lower leg
      const leftLegBone = boneMap.get('leftLeg');
      if (leftLegBone && leftAnkle.visibility > 0.5) {
        const dir = new THREE.Vector3(
          -(leftAnkle.x - leftKnee.x),
          leftAnkle.y - leftKnee.y,
          -(leftAnkle.z - leftKnee.z)
        ).normalize();

        const defaultDir = new THREE.Vector3(0, -1, 0);
        const targetQuat = new THREE.Quaternion().setFromUnitVectors(defaultDir, dir);
        leftLegBone.quaternion.slerp(targetQuat, smoothing);
      }
    }

    // Apply right leg rotations
    const rightHipLm = landmarks[L.RIGHT_HIP];
    const rightKnee = landmarks[L.RIGHT_KNEE];
    const rightAnkle = landmarks[L.RIGHT_ANKLE];

    if (rightHipLm && rightKnee && rightAnkle && rightKnee.visibility > 0.5) {
      // Upper leg
      const rightUpLegBone = boneMap.get('rightUpLeg');
      if (rightUpLegBone && rightHipLm.visibility > 0.5) {
        const dir = new THREE.Vector3(
          -(rightKnee.x - rightHipLm.x),
          rightKnee.y - rightHipLm.y,
          -(rightKnee.z - rightHipLm.z)
        ).normalize();

        const defaultDir = new THREE.Vector3(0, -1, 0);
        const targetQuat = new THREE.Quaternion().setFromUnitVectors(defaultDir, dir);
        rightUpLegBone.quaternion.slerp(targetQuat, smoothing);
      }

      // Lower leg
      const rightLegBone = boneMap.get('rightLeg');
      if (rightLegBone && rightAnkle.visibility > 0.5) {
        const dir = new THREE.Vector3(
          -(rightAnkle.x - rightKnee.x),
          rightAnkle.y - rightKnee.y,
          -(rightAnkle.z - rightKnee.z)
        ).normalize();

        const defaultDir = new THREE.Vector3(0, -1, 0);
        const targetQuat = new THREE.Quaternion().setFromUnitVectors(defaultDir, dir);
        rightLegBone.quaternion.slerp(targetQuat, smoothing);
      }
    }

  } catch (error) {
    console.error('Error applying pose to skeleton:', error);
  }
}

/**
 * Get skeleton from a 3D model (FBX or GLTF)
 */
export function getSkeletonFromModel(model: THREE.Object3D): THREE.Skeleton | null {
  let skeleton: THREE.Skeleton | null = null;

  model.traverse((child) => {
    if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
      skeleton = (child as THREE.SkinnedMesh).skeleton;
    }
  });

  return skeleton;
}
