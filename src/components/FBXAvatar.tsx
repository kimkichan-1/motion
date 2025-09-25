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

    // Create position-based 3D visualization instead of fake bones
    const skeletonGroup = new THREE.Group();
    const jointSpheres: { [key: string]: THREE.Mesh } = {};
    const boneLines: THREE.Line[] = [];

    // MediaPipe pose connections for skeleton visualization
    const poseConnections = [
      // Face
      [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
      // Torso
      [9, 10], [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21],
      [12, 14], [14, 16], [16, 18], [16, 20], [16, 22],
      [11, 23], [12, 24], [23, 24],
      // Left leg
      [23, 25], [25, 27], [27, 29], [29, 31],
      // Right leg
      [24, 26], [26, 28], [28, 30], [30, 32]
    ];

    // Create joint spheres for all 33 landmarks
    for (let i = 0; i < 33; i++) {
      const geometry = new THREE.SphereGeometry(0.03, 8, 8);
      const material = new THREE.MeshStandardMaterial({
        color: i === 23 || i === 24 ? '#ff0000' : '#00ff00' // Hip joints in red, others in green
      });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.name = `joint_${i}`;
      skeletonGroup.add(sphere);
      jointSpheres[i] = sphere;
    }

    // Create bone lines
    poseConnections.forEach(([start, end]) => {
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0)
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
      const line = new THREE.Line(geometry, material);
      line.userData = { startJoint: start, endJoint: end };
      skeletonGroup.add(line);
      boneLines.push(line);
    });

    // Add hip center reference point
    const hipCenterGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const hipCenterMaterial = new THREE.MeshStandardMaterial({ color: '#ffff00' });
    const hipCenter = new THREE.Mesh(hipCenterGeometry, hipCenterMaterial);
    hipCenter.name = 'hip_center';
    skeletonGroup.add(hipCenter);

    defaultAvatar.add(skeletonGroup);
    groupRef.current.clear();
    groupRef.current.add(defaultAvatar);
    modelRef.current = defaultAvatar;

    // Store references for pose application
    (defaultAvatar as any).jointSpheres = jointSpheres;
    (defaultAvatar as any).boneLines = boneLines;
    (defaultAvatar as any).hipCenter = hipCenter;

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

    const jointSpheres = (avatar as any).jointSpheres;
    const boneLines = (avatar as any).boneLines;
    const hipCenter = (avatar as any).hipCenter;

    if (!jointSpheres || !boneLines || !hipCenter) return;

    // Calculate hip center as reference point (pelvis center)
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const hipCenterPos = new THREE.Vector3(
      (leftHip.x + rightHip.x) / 2,
      -(leftHip.y + rightHip.y) / 2,  // Flip Y axis for Three.js
      (leftHip.z + rightHip.z) / 2
    );

    // Scale factor to make the skeleton more visible (adjust as needed)
    const scaleFactor = 5;

    // Update hip center position
    hipCenter.position.copy(hipCenterPos.multiplyScalar(scaleFactor));

    // Apply smoothing factor
    const smoothFactor = 0.15;

    // Update all joint positions relative to hip center
    landmarks.forEach((landmark, index) => {
      if (jointSpheres[index] && landmark.visibility && landmark.visibility > 0.5) {
        // Convert MediaPipe coordinates to Three.js coordinates (hip-centered)
        const targetPosition = new THREE.Vector3(
          landmark.x - hipCenterPos.x / scaleFactor,
          -(landmark.y - hipCenterPos.y / scaleFactor),  // Flip Y axis
          landmark.z - hipCenterPos.z / scaleFactor
        ).multiplyScalar(scaleFactor);

        // Apply smoothing to joint positions
        jointSpheres[index].position.lerp(targetPosition, smoothFactor);

        // Color coding based on joint confidence
        const material = jointSpheres[index].material as THREE.MeshStandardMaterial;
        if (landmark.visibility > 0.8) {
          material.color.setHex(0x00ff00); // Green for high confidence
        } else if (landmark.visibility > 0.6) {
          material.color.setHex(0xffff00); // Yellow for medium confidence
        } else {
          material.color.setHex(0xff0000); // Red for low confidence
        }
      }
    });

    // Update bone line positions
    boneLines.forEach(line => {
      const startJoint = line.userData.startJoint;
      const endJoint = line.userData.endJoint;

      if (jointSpheres[startJoint] && jointSpheres[endJoint]) {
        const startPos = jointSpheres[startJoint].position;
        const endPos = jointSpheres[endJoint].position;

        const positions = line.geometry.attributes.position;
        positions.array[0] = startPos.x;
        positions.array[1] = startPos.y;
        positions.array[2] = startPos.z;
        positions.array[3] = endPos.x;
        positions.array[4] = endPos.y;
        positions.array[5] = endPos.z;
        positions.needsUpdate = true;

        // Color bone lines based on both joints' confidence
        const startLandmark = landmarks[startJoint];
        const endLandmark = landmarks[endJoint];
        const avgConfidence = (startLandmark.visibility + endLandmark.visibility) / 2;

        const material = line.material as THREE.LineBasicMaterial;
        if (avgConfidence > 0.7) {
          material.color.setHex(0x0000ff); // Blue for high confidence connections
        } else if (avgConfidence > 0.5) {
          material.color.setHex(0x00ffff); // Cyan for medium confidence
        } else {
          material.color.setHex(0x666666); // Gray for low confidence
        }
      }
    });
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