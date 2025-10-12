import { MotionData } from '../types';
import * as THREE from 'three';

/**
 * Converts MediaPipe pose landmarks to bone rotations for 3D model
 * This is a simplified version - Kalidokit would provide more sophisticated conversion
 */

export interface BoneRotations {
  Hips: THREE.Euler;
  Spine: THREE.Euler;
  Chest: THREE.Euler;
  Neck: THREE.Euler;
  Head: THREE.Euler;

  LeftShoulder: THREE.Euler;
  LeftArm: THREE.Euler;
  LeftForeArm: THREE.Euler;
  LeftHand: THREE.Euler;

  RightShoulder: THREE.Euler;
  RightArm: THREE.Euler;
  RightForeArm: THREE.Euler;
  RightHand: THREE.Euler;

  LeftUpLeg: THREE.Euler;
  LeftLeg: THREE.Euler;
  LeftFoot: THREE.Euler;

  RightUpLeg: THREE.Euler;
  RightLeg: THREE.Euler;
  RightFoot: THREE.Euler;
}

/**
 * Calculate angle between three points
 */
function calculateAngle(
  pointA: { x: number; y: number; z: number },
  pointB: { x: number; y: number; z: number },
  pointC: { x: number; y: number; z: number }
): number {
  const vectorBA = new THREE.Vector3(
    pointA.x - pointB.x,
    pointA.y - pointB.y,
    pointA.z - pointB.z
  );

  const vectorBC = new THREE.Vector3(
    pointC.x - pointB.x,
    pointC.y - pointB.y,
    pointC.z - pointB.z
  );

  return vectorBA.angleTo(vectorBC);
}

/**
 * Calculate rotation based on two vectors
 */
function calculateRotation(
  from: { x: number; y: number; z: number },
  to: { x: number; y: number; z: number }
): THREE.Euler {
  const direction = new THREE.Vector3(
    to.x - from.x,
    to.y - from.y,
    to.z - from.z
  ).normalize();

  // Convert direction to euler angles
  const euler = new THREE.Euler();
  euler.setFromVector3(new THREE.Vector3(
    Math.atan2(direction.y, direction.x),
    Math.atan2(direction.z, Math.sqrt(direction.x ** 2 + direction.y ** 2)),
    0
  ));

  return euler;
}

/**
 * Convert MediaPipe pose landmarks to bone rotations
 */
export function landmarksToBoneRotations(motionData: MotionData): Partial<BoneRotations> | null {
  if (!motionData.worldLandmarks || motionData.worldLandmarks.length < 33) {
    return null;
  }

  const lm = motionData.worldLandmarks;

  // Landmark indices (MediaPipe Pose)
  const POSE = {
    NOSE: 0,
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
    RIGHT_ANKLE: 28
  };

  const rotations: Partial<BoneRotations> = {};

  try {
    // Spine/Torso
    const hipCenter = {
      x: (lm[POSE.LEFT_HIP].x + lm[POSE.RIGHT_HIP].x) / 2,
      y: (lm[POSE.LEFT_HIP].y + lm[POSE.RIGHT_HIP].y) / 2,
      z: (lm[POSE.LEFT_HIP].z + lm[POSE.RIGHT_HIP].z) / 2
    };

    const shoulderCenter = {
      x: (lm[POSE.LEFT_SHOULDER].x + lm[POSE.RIGHT_SHOULDER].x) / 2,
      y: (lm[POSE.LEFT_SHOULDER].y + lm[POSE.RIGHT_SHOULDER].y) / 2,
      z: (lm[POSE.LEFT_SHOULDER].z + lm[POSE.RIGHT_SHOULDER].z) / 2
    };

    rotations.Hips = calculateRotation(hipCenter, shoulderCenter);
    rotations.Spine = calculateRotation(hipCenter, shoulderCenter);

    // Head/Neck
    rotations.Neck = calculateRotation(shoulderCenter, lm[POSE.NOSE]);
    rotations.Head = calculateRotation(shoulderCenter, lm[POSE.NOSE]);

    // Left Arm
    rotations.LeftShoulder = new THREE.Euler(0, 0, 0);
    rotations.LeftArm = calculateRotation(
      lm[POSE.LEFT_SHOULDER],
      lm[POSE.LEFT_ELBOW]
    );
    rotations.LeftForeArm = calculateRotation(
      lm[POSE.LEFT_ELBOW],
      lm[POSE.LEFT_WRIST]
    );

    // Right Arm
    rotations.RightShoulder = new THREE.Euler(0, 0, 0);
    rotations.RightArm = calculateRotation(
      lm[POSE.RIGHT_SHOULDER],
      lm[POSE.RIGHT_ELBOW]
    );
    rotations.RightForeArm = calculateRotation(
      lm[POSE.RIGHT_ELBOW],
      lm[POSE.RIGHT_WRIST]
    );

    // Left Leg
    rotations.LeftUpLeg = calculateRotation(
      lm[POSE.LEFT_HIP],
      lm[POSE.LEFT_KNEE]
    );
    rotations.LeftLeg = calculateRotation(
      lm[POSE.LEFT_KNEE],
      lm[POSE.LEFT_ANKLE]
    );

    // Right Leg
    rotations.RightUpLeg = calculateRotation(
      lm[POSE.RIGHT_HIP],
      lm[POSE.RIGHT_KNEE]
    );
    rotations.RightLeg = calculateRotation(
      lm[POSE.RIGHT_KNEE],
      lm[POSE.RIGHT_ANKLE]
    );

    return rotations;
  } catch (error) {
    console.error('Error converting landmarks to rotations:', error);
    return null;
  }
}

/**
 * Apply bone rotations to a 3D model
 */
export function applyBoneRotations(
  model: THREE.Object3D,
  rotations: Partial<BoneRotations>
): void {
  // This function finds bones by name and applies rotations
  // Bone names may vary by model (Mixamo, custom rigs, etc.)

  const boneMap: { [key: string]: string[] } = {
    Hips: ['Hips', 'hips', 'pelvis', 'Pelvis'],
    Spine: ['Spine', 'spine', 'spine1', 'Spine1'],
    Chest: ['Chest', 'chest', 'spine2', 'Spine2'],
    Neck: ['Neck', 'neck'],
    Head: ['Head', 'head'],

    LeftShoulder: ['LeftShoulder', 'leftShoulder', 'LeftArm', 'L_shoulder'],
    LeftArm: ['LeftArm', 'leftArm', 'LeftForeArm', 'L_upperarm'],
    LeftForeArm: ['LeftForeArm', 'leftForeArm', 'LeftHand', 'L_forearm'],
    LeftHand: ['LeftHand', 'leftHand', 'L_hand'],

    RightShoulder: ['RightShoulder', 'rightShoulder', 'RightArm', 'R_shoulder'],
    RightArm: ['RightArm', 'rightArm', 'RightForeArm', 'R_upperarm'],
    RightForeArm: ['RightForeArm', 'rightForeArm', 'RightHand', 'R_forearm'],
    RightHand: ['RightHand', 'rightHand', 'R_hand'],

    LeftUpLeg: ['LeftUpLeg', 'leftUpLeg', 'LeftLeg', 'L_thigh'],
    LeftLeg: ['LeftLeg', 'leftLeg', 'LeftFoot', 'L_calf'],
    LeftFoot: ['LeftFoot', 'leftFoot', 'L_foot'],

    RightUpLeg: ['RightUpLeg', 'rightUpLeg', 'RightLeg', 'R_thigh'],
    RightLeg: ['RightLeg', 'rightLeg', 'RightFoot', 'R_calf'],
    RightFoot: ['RightFoot', 'rightFoot', 'R_foot']
  };

  // Find and apply rotations to bones
  Object.entries(rotations).forEach(([boneName, rotation]) => {
    const possibleNames = boneMap[boneName] || [boneName];

    for (const name of possibleNames) {
      const bone = model.getObjectByName(name);
      if (bone && rotation) {
        bone.rotation.copy(rotation);
        break;
      }
    }
  });
}

/**
 * Smooth rotations using exponential moving average
 */
export class RotationSmoother {
  private previousRotations: Map<string, THREE.Euler> = new Map();
  private smoothingFactor: number;

  constructor(smoothingFactor: number = 0.3) {
    this.smoothingFactor = smoothingFactor;
  }

  smooth(rotations: Partial<BoneRotations>): Partial<BoneRotations> {
    const smoothed: Partial<BoneRotations> = {};

    Object.entries(rotations).forEach(([boneName, rotation]) => {
      const key = boneName as keyof BoneRotations;
      const previous = this.previousRotations.get(boneName);

      if (!previous || !rotation) {
        smoothed[key] = rotation;
        if (rotation) {
          this.previousRotations.set(boneName, rotation.clone());
        }
      } else {
        // Exponential moving average
        const smoothedRotation = new THREE.Euler(
          previous.x + (rotation.x - previous.x) * this.smoothingFactor,
          previous.y + (rotation.y - previous.y) * this.smoothingFactor,
          previous.z + (rotation.z - previous.z) * this.smoothingFactor,
          rotation.order
        );

        smoothed[key] = smoothedRotation;
        this.previousRotations.set(boneName, smoothedRotation.clone());
      }
    });

    return smoothed;
  }

  reset(): void {
    this.previousRotations.clear();
  }
}
