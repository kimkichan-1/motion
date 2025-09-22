import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

interface ModelViewerProps {
  file?: File;
  onModelLoad?: (model: THREE.Object3D) => void;
  poseData?: any;
  landmarkMapping?: { [key: string]: string };
  className?: string;
}

const ModelViewer: React.FC<ModelViewerProps> = ({
  file,
  onModelLoad,
  poseData,
  landmarkMapping,
  className
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const bonesRef = useRef<{ [key: string]: THREE.Bone }>({});
  const animationId = useRef<number | undefined>(undefined);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initScene = useCallback(() => {
    if (!mountRef.current) return;

    cleanup();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2a2a2a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.5, 3);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(-5, 5, 5);
    scene.add(pointLight);

    const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
    scene.add(gridHelper);

    mountRef.current.appendChild(renderer.domElement);

    const animateLoop = () => {
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        const clock = new THREE.Clock();
        const delta = clock.getDelta();

        if (mixerRef.current) {
          mixerRef.current.update(delta);
        }

        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      animationId.current = requestAnimationFrame(animateLoop);
    };
    animateLoop();
  }, []);

  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const loadModel = useCallback(async (modelFile: File) => {
    if (!sceneRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const extension = getFileExtension(modelFile.name);
      const url = URL.createObjectURL(modelFile);
      let model: THREE.Object3D;

      if (extension === 'fbx') {
        const loader = new FBXLoader();
        model = await new Promise<THREE.Object3D>((resolve, reject) => {
          loader.load(url, resolve, undefined, reject);
        });
      } else if (extension === 'gltf' || extension === 'glb') {
        const loader = new GLTFLoader();
        const gltf = await new Promise<any>((resolve, reject) => {
          loader.load(url, resolve, undefined, reject);
        });
        model = gltf.scene;

        if (gltf.animations && gltf.animations.length > 0) {
          mixerRef.current = new THREE.AnimationMixer(model);
          const action = mixerRef.current.clipAction(gltf.animations[0]);
          action.play();
        }
      } else if (extension === 'obj') {
        const loader = new OBJLoader();
        model = await new Promise<THREE.Object3D>((resolve, reject) => {
          loader.load(url, resolve, undefined, reject);
        });
      } else {
        throw new Error('지원되지 않는 파일 형식입니다.');
      }

      URL.revokeObjectURL(url);

      if (modelRef.current) {
        sceneRef.current.remove(modelRef.current);
      }

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2 / maxDim;
      model.scale.multiplyScalar(scale);

      model.position.sub(center.multiplyScalar(scale));
      model.position.y = 0;

      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
        if (child instanceof THREE.Bone) {
          bonesRef.current[child.name] = child;
        }
      });

      sceneRef.current.add(model);
      modelRef.current = model;

      if (onModelLoad) {
        onModelLoad(model);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('모델 로딩 실패:', err);
      setError('모델을 로드할 수 없습니다. 파일 형식을 확인해주세요.');
      setIsLoading(false);
    }
  }, [onModelLoad]);

  const applyPoseToModel = useCallback((landmarks: any[]) => {
    if (!modelRef.current || !landmarkMapping || landmarks.length === 0) return;

    Object.entries(landmarkMapping).forEach(([landmarkIndex, boneName]) => {
      const landmark = landmarks[parseInt(landmarkIndex)];
      const bone = bonesRef.current[boneName];

      if (landmark && bone && landmark.visibility > 0.5) {
        const targetPosition = new THREE.Vector3(
          landmark.x * 2 - 1,
          -(landmark.y * 2 - 1),
          landmark.z || 0
        );

        bone.lookAt(targetPosition);
      }
    });
  }, [landmarkMapping]);


  const cleanup = () => {
    if (animationId.current) {
      cancelAnimationFrame(animationId.current);
    }
    if (mountRef.current && rendererRef.current?.domElement) {
      try {
        mountRef.current.removeChild(rendererRef.current.domElement);
      } catch (error) {
        console.warn('Cleanup error:', error);
      }
    }
    rendererRef.current?.dispose();
    if (mixerRef.current) {
      mixerRef.current.stopAllAction();
    }
  };

  useEffect(() => {
    if (poseData && poseData.landmarks) {
      applyPoseToModel(poseData.landmarks);
    }
  }, [poseData, applyPoseToModel]);

  useEffect(() => {
    initScene();

    const handleResize = () => {
      if (mountRef.current && cameraRef.current && rendererRef.current) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;

        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(width, height);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cleanup();
    };
  }, [initScene]);

  useEffect(() => {
    if (file) {
      loadModel(file);
    }
  }, [file, loadModel]);

  return (
    <div style={{ width: '100%', height: '400px', position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
      <div ref={mountRef} className={className} style={{ width: '100%', height: '100%' }} />

      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div>모델 로딩 중...</div>
          <div style={{ marginTop: '10px', fontSize: '0.8em' }}>잠시만 기다려주세요</div>
        </div>
      )}

      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255,0,0,0.9)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div>❌ {error}</div>
        </div>
      )}
    </div>
  );
};

export default ModelViewer;