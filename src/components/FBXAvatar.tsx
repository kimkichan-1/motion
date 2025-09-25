import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import * as THREE from 'three';
import { PoseData } from '../hooks/useMediaPipePose';
import { poseBoneMapper } from '../utils/poseMapping';

interface FBXAvatarProps {
  poseData: PoseData | null;
  modelPath?: string;
}

export const FBXAvatar: React.FC<FBXAvatarProps> = ({ poseData, modelPath }) => {
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [hasModel, setHasModel] = useState(false);

  useEffect(() => {
    if (!modelPath) {
      createDefaultAvatar();
      return;
    }

    const loader = new FBXLoader();
    loader.load(
      modelPath,
      (fbx) => {
        loadFBXModel(fbx);
      },
      undefined,
      (error) => {
        console.warn('FBX load failed, using default avatar:', error);
        createDefaultAvatar();
      }
    );
  }, [modelPath]);

  const createDefaultAvatar = () => {
    if (!groupRef.current) return;

    const defaultAvatar = new THREE.Group();
    const meshes: { [key: string]: THREE.Mesh } = {};

    // Create basic stick figure with proper bone mapping names
    const bodyParts = [
      { name: 'head', position: [0, 1.7, 0], size: [0.2, 0.2, 0.2], color: '#ff6b6b' },
      { name: 'spine', position: [0, 1, 0], size: [0.3, 0.6, 0.15], color: '#4ecdc4' },
      { name: 'left_shoulder', position: [-0.5, 1.3, 0], size: [0.4, 0.1, 0.1], color: '#45b7d1' },
      { name: 'right_shoulder', position: [0.5, 1.3, 0], size: [0.4, 0.1, 0.1], color: '#45b7d1' },
      { name: 'left_arm', position: [-0.8, 1.1, 0], size: [0.3, 0.1, 0.1], color: '#96ceb4' },
      { name: 'right_arm', position: [0.8, 1.1, 0], size: [0.3, 0.1, 0.1], color: '#96ceb4' },
      { name: 'left_thigh', position: [-0.15, 0.4, 0], size: [0.12, 0.5, 0.12], color: '#feca57' },
      { name: 'right_thigh', position: [0.15, 0.4, 0], size: [0.12, 0.5, 0.12], color: '#feca57' },
      { name: 'left_shin', position: [-0.15, -0.2, 0], size: [0.1, 0.4, 0.1], color: '#ff9ff3' },
      { name: 'right_shin', position: [0.15, -0.2, 0], size: [0.1, 0.4, 0.1], color: '#ff9ff3' }
    ];

    bodyParts.forEach(part => {
      const geometry = new THREE.BoxGeometry(...part.size);
      const material = new THREE.MeshStandardMaterial({ color: part.color });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...part.position);
      mesh.name = part.name;
      mesh.userData.originalPosition = new THREE.Vector3(...part.position);
      mesh.userData.originalRotation = new THREE.Euler(0, 0, 0);
      defaultAvatar.add(mesh);
      meshes[part.name] = mesh;
    });

    groupRef.current.clear();
    groupRef.current.add(defaultAvatar);
    modelRef.current = defaultAvatar;

    // Store meshes for direct manipulation
    (defaultAvatar as any).meshes = meshes;

    setIsLoaded(true);
    setHasModel(false);
  };

  const loadFBXModel = (fbx: THREE.Group) => {
    if (!groupRef.current) return;

    const clone = fbx.clone();
    const bones: { [key: string]: THREE.Bone } = {};

    clone.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh) {
        child.frustumCulled = false;
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.skeleton) {
          child.skeleton.bones.forEach((bone) => {
            bones[bone.name.toLowerCase()] = bone;
            bones[bone.name] = bone;
          });
        }
      }

      if (child instanceof THREE.Bone) {
        bones[child.name.toLowerCase()] = child;
        bones[child.name] = child;
      }
    });

    clone.scale.setScalar(0.01);
    clone.position.set(0, -1, 0);

    groupRef.current.clear();
    groupRef.current.add(clone);
    modelRef.current = clone;
    poseBoneMapper.setBones(bones);

    if (clone.animations && clone.animations.length > 0) {
      mixerRef.current = new THREE.AnimationMixer(clone);
      clone.animations.forEach((clip, index) => {
        const action = mixerRef.current!.clipAction(clip);
        action.weight = index === 0 ? 0.1 : 0;
        action.play();
      });
    }

    setIsLoaded(true);
    setHasModel(true);
  };

  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });

  useEffect(() => {
    if (poseData && isLoaded && modelRef.current) {
      const poseConfidence = poseBoneMapper.getPoseConfidence(poseData);
      setConfidence(poseConfidence);

      if (poseConfidence > 0.5) {
        if (hasModel) {
          // Use bone mapper for FBX models
          poseBoneMapper.applyPoseToSkeleton(poseData);
        } else {
          // Direct mesh manipulation for default avatar
          applyPoseToDefaultAvatar(poseData, modelRef.current);
        }
      }
    }
  }, [poseData, isLoaded, hasModel]);

  const applyPoseToDefaultAvatar = (poseData: PoseData, avatar: THREE.Object3D) => {
    const landmarks = poseData.worldLandmarks;
    if (!landmarks || landmarks.length < 33) return;

    const meshes = (avatar as any).meshes;
    if (!meshes) return;

    // Get key landmarks
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftElbow = landmarks[13];
    const rightElbow = landmarks[14];
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];

    // Helper function to calculate rotation between two points
    const calculateRotation = (from: any, to: any) => {
      const direction = new THREE.Vector3(
        to.x - from.x,
        -(to.y - from.y),  // Flip Y axis
        to.z - from.z
      ).normalize();

      // Calculate euler angles
      const euler = new THREE.Euler();

      // Calculate rotation around Z axis (for arm/leg swing)
      const angleZ = Math.atan2(direction.y, direction.x);

      // Calculate rotation around X axis (for forward/backward movement)
      const angleX = Math.atan2(direction.z, Math.sqrt(direction.x * direction.x + direction.y * direction.y));

      euler.set(angleX * 0.5, 0, angleZ - Math.PI / 2);
      return euler;
    };

    // Apply rotations with smoothing
    const smoothFactor = 0.15;

    // Left arm (shoulder to elbow)
    if (meshes['left_shoulder'] && leftShoulder && leftElbow) {
      const targetRotation = calculateRotation(leftShoulder, leftElbow);
      meshes['left_shoulder'].rotation.x = THREE.MathUtils.lerp(
        meshes['left_shoulder'].rotation.x,
        targetRotation.x,
        smoothFactor
      );
      meshes['left_shoulder'].rotation.z = THREE.MathUtils.lerp(
        meshes['left_shoulder'].rotation.z,
        targetRotation.z,
        smoothFactor
      );
    }

    // Right arm (shoulder to elbow)
    if (meshes['right_shoulder'] && rightShoulder && rightElbow) {
      const targetRotation = calculateRotation(rightShoulder, rightElbow);
      meshes['right_shoulder'].rotation.x = THREE.MathUtils.lerp(
        meshes['right_shoulder'].rotation.x,
        targetRotation.x,
        smoothFactor
      );
      meshes['right_shoulder'].rotation.z = THREE.MathUtils.lerp(
        meshes['right_shoulder'].rotation.z,
        targetRotation.z,
        smoothFactor
      );
    }

    // Left forearm (elbow to wrist)
    if (meshes['left_arm'] && leftElbow && leftWrist) {
      const targetRotation = calculateRotation(leftElbow, leftWrist);
      meshes['left_arm'].rotation.x = THREE.MathUtils.lerp(
        meshes['left_arm'].rotation.x,
        targetRotation.x,
        smoothFactor
      );
      meshes['left_arm'].rotation.z = THREE.MathUtils.lerp(
        meshes['left_arm'].rotation.z,
        targetRotation.z,
        smoothFactor
      );
    }

    // Right forearm (elbow to wrist)
    if (meshes['right_arm'] && rightElbow && rightWrist) {
      const targetRotation = calculateRotation(rightElbow, rightWrist);
      meshes['right_arm'].rotation.x = THREE.MathUtils.lerp(
        meshes['right_arm'].rotation.x,
        targetRotation.x,
        smoothFactor
      );
      meshes['right_arm'].rotation.z = THREE.MathUtils.lerp(
        meshes['right_arm'].rotation.z,
        targetRotation.z,
        smoothFactor
      );
    }

    // Left thigh (hip to knee)
    if (meshes['left_thigh'] && leftHip && leftKnee) {
      const targetRotation = calculateRotation(leftHip, leftKnee);
      meshes['left_thigh'].rotation.x = THREE.MathUtils.lerp(
        meshes['left_thigh'].rotation.x,
        targetRotation.x,
        smoothFactor
      );
      meshes['left_thigh'].rotation.z = THREE.MathUtils.lerp(
        meshes['left_thigh'].rotation.z,
        targetRotation.z + Math.PI,
        smoothFactor
      );
    }

    // Right thigh (hip to knee)
    if (meshes['right_thigh'] && rightHip && rightKnee) {
      const targetRotation = calculateRotation(rightHip, rightKnee);
      meshes['right_thigh'].rotation.x = THREE.MathUtils.lerp(
        meshes['right_thigh'].rotation.x,
        targetRotation.x,
        smoothFactor
      );
      meshes['right_thigh'].rotation.z = THREE.MathUtils.lerp(
        meshes['right_thigh'].rotation.z,
        targetRotation.z + Math.PI,
        smoothFactor
      );
    }

    // Left shin (knee to ankle)
    if (meshes['left_shin'] && leftKnee && leftAnkle) {
      const targetRotation = calculateRotation(leftKnee, leftAnkle);
      meshes['left_shin'].rotation.x = THREE.MathUtils.lerp(
        meshes['left_shin'].rotation.x,
        targetRotation.x,
        smoothFactor
      );
      meshes['left_shin'].rotation.z = THREE.MathUtils.lerp(
        meshes['left_shin'].rotation.z,
        targetRotation.z + Math.PI,
        smoothFactor
      );
    }

    // Right shin (knee to ankle)
    if (meshes['right_shin'] && rightKnee && rightAnkle) {
      const targetRotation = calculateRotation(rightKnee, rightAnkle);
      meshes['right_shin'].rotation.x = THREE.MathUtils.lerp(
        meshes['right_shin'].rotation.x,
        targetRotation.x,
        smoothFactor
      );
      meshes['right_shin'].rotation.z = THREE.MathUtils.lerp(
        meshes['right_shin'].rotation.z,
        targetRotation.z + Math.PI,
        smoothFactor
      );
    }

    // Spine rotation based on shoulder tilt
    if (meshes['spine'] && leftShoulder && rightShoulder) {
      const shoulderTilt = Math.atan2(
        rightShoulder.y - leftShoulder.y,
        rightShoulder.x - leftShoulder.x
      );
      meshes['spine'].rotation.z = THREE.MathUtils.lerp(
        meshes['spine'].rotation.z,
        shoulderTilt * 0.3,
        smoothFactor
      );
    }

    // Head rotation (subtle following)
    if (meshes['head']) {
      const nose = landmarks[0];
      if (nose) {
        meshes['head'].rotation.y = THREE.MathUtils.lerp(
          meshes['head'].rotation.y,
          (nose.x - 0.5) * 0.5,
          smoothFactor
        );
      }
    }
  };

  return (
    <group ref={groupRef}>
      <PoseConfidenceIndicator confidence={confidence} />
      <ModelStatusIndicator hasModel={hasModel} />
    </group>
  );
};

const PoseConfidenceIndicator: React.FC<{ confidence: number }> = ({ confidence }) => {
  const color = confidence > 0.8 ? 'green' : confidence > 0.6 ? 'yellow' : 'red';

  return (
    <mesh position={[-2, 1.5, 0]}>
      <sphereGeometry args={[0.1, 8, 6]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
};

const ModelStatusIndicator: React.FC<{ hasModel: boolean }> = ({ hasModel }) => {
  return (
    <mesh position={[2, 1.5, 0]}>
      <boxGeometry args={[0.2, 0.1, 0.1]} />
      <meshBasicMaterial color={hasModel ? 'blue' : 'orange'} />
    </mesh>
  );
};