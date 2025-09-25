import * as THREE from 'three';
import { PoseData, PoseLandmarks } from '../hooks/useMediaPipePose';

export interface BoneMapping {
  boneName: string;
  parentJoint: number;
  childJoint: number;
  alternativeNames?: string[];
  axis?: 'x' | 'y' | 'z';
  inverse?: boolean;
}

export const POSE_BONE_MAPPINGS: BoneMapping[] = [
  // Spine and core
  { boneName: 'spine', parentJoint: 23, childJoint: 11, alternativeNames: ['Spine', 'spine1', 'Spine1'] },
  { boneName: 'spine1', parentJoint: 11, childJoint: 0, alternativeNames: ['Spine1', 'spine2', 'Spine2'] },
  { boneName: 'neck', parentJoint: 11, childJoint: 0, alternativeNames: ['Neck', 'neck1', 'Head'] },

  // Left arm
  { boneName: 'left_shoulder', parentJoint: 11, childJoint: 13, alternativeNames: ['LeftShoulder', 'L_Shoulder', 'leftShoulder'] },
  { boneName: 'left_arm', parentJoint: 13, childJoint: 15, alternativeNames: ['LeftArm', 'L_Arm', 'leftArm', 'LeftForeArm'] },
  { boneName: 'left_forearm', parentJoint: 15, childJoint: 19, alternativeNames: ['LeftForeArm', 'L_ForeArm', 'leftForeArm'] },

  // Right arm
  { boneName: 'right_shoulder', parentJoint: 12, childJoint: 14, alternativeNames: ['RightShoulder', 'R_Shoulder', 'rightShoulder'] },
  { boneName: 'right_arm', parentJoint: 14, childJoint: 16, alternativeNames: ['RightArm', 'R_Arm', 'rightArm', 'RightForeArm'] },
  { boneName: 'right_forearm', parentJoint: 16, childJoint: 20, alternativeNames: ['RightForeArm', 'R_ForeArm', 'rightForeArm'] },

  // Left leg
  { boneName: 'left_thigh', parentJoint: 23, childJoint: 25, alternativeNames: ['LeftThigh', 'L_Thigh', 'leftThigh', 'LeftUpLeg'] },
  { boneName: 'left_shin', parentJoint: 25, childJoint: 27, alternativeNames: ['LeftShin', 'L_Shin', 'leftShin', 'LeftLeg'] },
  { boneName: 'left_foot', parentJoint: 27, childJoint: 31, alternativeNames: ['LeftFoot', 'L_Foot', 'leftFoot'] },

  // Right leg
  { boneName: 'right_thigh', parentJoint: 24, childJoint: 26, alternativeNames: ['RightThigh', 'R_Thigh', 'rightThigh', 'RightUpLeg'] },
  { boneName: 'right_shin', parentJoint: 26, childJoint: 28, alternativeNames: ['RightShin', 'R_Shin', 'rightShin', 'RightLeg'] },
  { boneName: 'right_foot', parentJoint: 28, childJoint: 32, alternativeNames: ['RightFoot', 'R_Foot', 'rightFoot'] }
];

export class PoseBoneMapper {
  private bones: { [key: string]: THREE.Bone } = {};
  private smoothingBuffer: { [key: string]: THREE.Quaternion[] } = {};
  private readonly bufferSize = 5;

  setBones(bones: { [key: string]: THREE.Bone }) {
    this.bones = bones;
    this.initializeSmoothingBuffer();
  }

  private initializeSmoothingBuffer() {
    Object.keys(this.bones).forEach(boneName => {
      this.smoothingBuffer[boneName] = [];
    });
  }

  private findBone(mapping: BoneMapping): THREE.Bone | null {
    const names = [mapping.boneName, ...(mapping.alternativeNames || [])];

    for (const name of names) {
      const variations = [
        name,
        name.toLowerCase(),
        name.toUpperCase(),
        name.replace(/_/g, ''),
        name.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()
      ];

      for (const variation of variations) {
        if (this.bones[variation]) {
          return this.bones[variation];
        }
      }
    }

    return null;
  }

  private calculateBoneRotation(
    parentLandmark: PoseLandmarks,
    childLandmark: PoseLandmarks,
    referenceBone?: THREE.Bone
  ): THREE.Quaternion {
    const direction = new THREE.Vector3(
      childLandmark.x - parentLandmark.x,
      -(childLandmark.y - parentLandmark.y), // Flip Y axis
      childLandmark.z - parentLandmark.z
    ).normalize();

    const defaultForward = new THREE.Vector3(0, 1, 0);

    if (referenceBone && referenceBone.parent) {
      referenceBone.parent.getWorldDirection(defaultForward);
    }

    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(defaultForward, direction);

    return quaternion;
  }

  private smoothRotation(boneName: string, rotation: THREE.Quaternion): THREE.Quaternion {
    if (!this.smoothingBuffer[boneName]) {
      this.smoothingBuffer[boneName] = [];
    }

    const buffer = this.smoothingBuffer[boneName];
    buffer.push(rotation.clone());

    if (buffer.length > this.bufferSize) {
      buffer.shift();
    }

    const smoothed = new THREE.Quaternion();
    let weight = 0;

    buffer.forEach((quat, index) => {
      const w = (index + 1) / buffer.length;
      smoothed.slerp(quat, w / (weight + w));
      weight += w;
    });

    return smoothed;
  }

  applyPoseToSkeleton(poseData: PoseData) {
    const landmarks = poseData.worldLandmarks;

    if (!landmarks || landmarks.length < 33) {
      console.warn('Insufficient pose landmarks');
      return;
    }

    // Calculate virtual joints for better mapping
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    const shoulderCenter = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
      z: (leftShoulder.z + rightShoulder.z) / 2
    };

    const hipCenter = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
      z: (leftHip.z + rightHip.z) / 2
    };

    // Add virtual joints to landmarks array
    const extendedLandmarks = [...landmarks];
    extendedLandmarks[33] = shoulderCenter; // Shoulder center
    extendedLandmarks[34] = hipCenter;      // Hip center

    POSE_BONE_MAPPINGS.forEach(mapping => {
      const bone = this.findBone(mapping);
      if (!bone) return;

      const parentLandmark = extendedLandmarks[mapping.parentJoint];
      const childLandmark = extendedLandmarks[mapping.childJoint];

      if (!parentLandmark || !childLandmark) return;

      // Check landmark visibility
      if (parentLandmark.visibility && parentLandmark.visibility < 0.5) return;
      if (childLandmark.visibility && childLandmark.visibility < 0.5) return;

      const rotation = this.calculateBoneRotation(parentLandmark, childLandmark, bone);
      const smoothedRotation = this.smoothRotation(bone.name, rotation);

      // Apply rotation with lerp for smoother animation
      bone.quaternion.slerp(smoothedRotation, 0.15);
    });
  }

  // Additional helper methods
  resetPose() {
    Object.values(this.bones).forEach(bone => {
      bone.quaternion.set(0, 0, 0, 1);
    });
    this.smoothingBuffer = {};
    this.initializeSmoothingBuffer();
  }

  getPoseConfidence(poseData: PoseData): number {
    const landmarks = poseData.worldLandmarks;
    if (!landmarks) return 0;

    const visibilitySum = landmarks.reduce((sum, landmark) => {
      return sum + (landmark.visibility || 1);
    }, 0);

    return visibilitySum / landmarks.length;
  }
}

export const poseBoneMapper = new PoseBoneMapper();