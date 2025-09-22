import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import './LandmarkMapper.css';

interface LandmarkMapperProps {
  file: File;
  onMappingComplete: (mapping: any) => void;
  onBack: () => void;
}

// MediaPipe Pose 랜드마크 정의
const POSE_LANDMARKS = {
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

const LANDMARK_NAMES = Object.keys(POSE_LANDMARKS);

const LandmarkMapper: React.FC<LandmarkMapperProps> = ({ file, onMappingComplete, onBack }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const landmarkSpheres = useRef<THREE.Mesh[]>([]);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  const [selectedLandmark, setSelectedLandmark] = useState<number>(0);
  const [landmarkPositions, setLandmarkPositions] = useState<{[key: number]: THREE.Vector3}>({});
  const [landmarkSizes, setLandmarkSizes] = useState<{[key: number]: number}>({});
  const [isDragging, setIsDragging] = useState(false);
  const [draggedLandmark, setDraggedLandmark] = useState<number | null>(null);

  // MediaPipe 포즈 랜드마크 이름들

  useEffect(() => {
    initScene();
    loadModel();
    initializeAllLandmarks();

    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initScene = () => {
    if (!mountRef.current) return;

    // 기존 정리
    cleanup();

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x404040);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 2, 8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // 강한 조명 설정
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const frontLight = new THREE.DirectionalLight(0xffffff, 0.8);
    frontLight.position.set(0, 0, 10);
    scene.add(frontLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
    backLight.position.set(0, 0, -10);
    scene.add(backLight);

    // 헤미스피어 라이트 추가
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    scene.add(hemisphereLight);

    // 그리드 헬퍼
    const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0x444444);
    scene.add(gridHelper);

    // 기본 테스트 큐브 (디버그용)
    const testGeometry = new THREE.BoxGeometry(1, 1, 1);
    const testMaterial = new THREE.MeshLambertMaterial({
      color: 0x00ff00,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });
    const testCube = new THREE.Mesh(testGeometry, testMaterial);
    testCube.position.set(3, 1, 0);
    scene.add(testCube);

    console.log('Scene initialized with', scene.children.length, 'children');

    setupControls();
    animate();
  };

  const setupControls = () => {
    if (!rendererRef.current) return;

    const canvas = rendererRef.current.domElement;

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel);
  };

  const onMouseDown = (event: MouseEvent) => {
    if (!mountRef.current || !cameraRef.current || !sceneRef.current) return;

    const rect = mountRef.current.getBoundingClientRect();
    mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(mouse.current, cameraRef.current);

    // 랜드마크 구체와의 교차점 확인 (안전하게 처리)
    const validSpheres = landmarkSpheres.current.filter(sphere => sphere && sphere.visible !== undefined);
    const intersects = raycaster.current.intersectObjects(validSpheres);

    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object as THREE.Mesh;
      const landmarkIndex = landmarkSpheres.current.indexOf(intersectedObject);

      if (landmarkIndex !== -1) {
        setIsDragging(true);
        setDraggedLandmark(landmarkIndex);
        setSelectedLandmark(landmarkIndex);
      }
    }
  };

  const onMouseMove = (event: MouseEvent) => {
    if (!isDragging || draggedLandmark === null || !mountRef.current || !cameraRef.current) return;

    const rect = mountRef.current.getBoundingClientRect();
    mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(mouse.current, cameraRef.current);

    // 모델과의 교차점을 찾아서 랜드마크 위치 업데이트 (안전하게 처리)
    if (modelRef.current && modelRef.current.visible !== undefined) {
      try {
        const intersects = raycaster.current.intersectObject(modelRef.current, true);
        if (intersects.length > 0) {
          const newPosition = intersects[0].point;
          updateLandmarkPosition(draggedLandmark, newPosition);
        }
      } catch (error) {
        console.warn('Raycaster intersection failed:', error);
      }
    }
  };

  const onMouseUp = () => {
    setIsDragging(false);
    setDraggedLandmark(null);
  };

  const onWheel = (event: WheelEvent) => {
    if (!cameraRef.current) return;

    const zoomSpeed = 0.1;
    cameraRef.current.position.z += event.deltaY * zoomSpeed * 0.01;
    cameraRef.current.position.z = Math.max(1, Math.min(10, cameraRef.current.position.z));
  };

  const loadModel = async () => {
    if (!sceneRef.current) {
      console.error('Scene not initialized');
      return;
    }

    try {
      console.log('Loading FBX model...');
      const loader = new FBXLoader();
      const arrayBuffer = await file.arrayBuffer();
      const model = loader.parse(arrayBuffer, '');

      console.log('Model loaded:', model);
      console.log('Model children count:', model.children.length);

      // 모델 크기 정규화
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 4 / maxDim; // 더 큰 크기로 설정

      console.log('Model original size:', size);
      console.log('Model scale factor:', scale);

      model.scale.setScalar(scale);
      model.position.sub(center.multiplyScalar(scale));
      model.position.y = 0; // Y 위치를 0으로 설정

      console.log('Model final position:', model.position);

      // FBX 모델의 모든 머티리얼을 안전하게 처리
      let meshCount = 0;
      model.traverse((child) => {
        console.log('Traversing child:', child.type, child.name);

        if (child instanceof THREE.Mesh) {
          meshCount++;
          console.log(`Processing mesh ${meshCount}:`, child.name || 'unnamed');
          console.log('Mesh geometry:', child.geometry);
          console.log('Mesh material:', child.material);

          // 지오메트리 체크
          if (!child.geometry || !child.geometry.attributes.position) {
            console.warn('Invalid geometry for mesh:', child.name);
            return;
          }

          // 새로운 머티리얼 적용 (wireframe과 solid 둘 다 시도)
          const solidMaterial = new THREE.MeshLambertMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            transparent: false,
            opacity: 1.0
          });

          const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            wireframe: true,
            transparent: true,
            opacity: 0.8
          });

          // 메시 복제해서 wireframe과 solid 모두 추가
          child.material = solidMaterial;

          // wireframe 버전 추가
          const wireframeClone = new THREE.Mesh(child.geometry, wireframeMaterial);
          wireframeClone.position.copy(child.position);
          wireframeClone.rotation.copy(child.rotation);
          wireframeClone.scale.copy(child.scale);
          model.add(wireframeClone);

          // 메시 설정
          child.castShadow = true;
          child.receiveShadow = true;
          child.frustumCulled = false;
          child.visible = true;

          console.log('Mesh processed successfully:', child.name);
        }
      });

      console.log(`Total meshes processed: ${meshCount}`);

      modelRef.current = model;
      sceneRef.current.add(model);

      console.log('Model added to scene');
      console.log('Scene children count:', sceneRef.current.children.length);

      // 기본 랜드마크 위치 설정
      initializeDefaultLandmarks();

    } catch (error) {
      console.error('모델 로딩 실패:', error);
      alert('모델을 로드할 수 없습니다. 파일 형식을 확인해주세요.');
    }
  };

  const initializeDefaultLandmarks = () => {
    console.log('Initializing default landmarks...');

    // 기본 랜드마크 위치 (모델의 예상 위치, 더 크게 조정)
    const defaultPositions = {
      [POSE_LANDMARKS.NOSE]: new THREE.Vector3(0, 1.6, 0.4),
      [POSE_LANDMARKS.LEFT_SHOULDER]: new THREE.Vector3(-0.6, 1.0, 0),
      [POSE_LANDMARKS.RIGHT_SHOULDER]: new THREE.Vector3(0.6, 1.0, 0),
      [POSE_LANDMARKS.LEFT_ELBOW]: new THREE.Vector3(-1.0, 0.2, 0),
      [POSE_LANDMARKS.RIGHT_ELBOW]: new THREE.Vector3(1.0, 0.2, 0),
      [POSE_LANDMARKS.LEFT_WRIST]: new THREE.Vector3(-1.4, -0.4, 0),
      [POSE_LANDMARKS.RIGHT_WRIST]: new THREE.Vector3(1.4, -0.4, 0),
      [POSE_LANDMARKS.LEFT_HIP]: new THREE.Vector3(-0.4, -0.2, 0),
      [POSE_LANDMARKS.RIGHT_HIP]: new THREE.Vector3(0.4, -0.2, 0),
      [POSE_LANDMARKS.LEFT_KNEE]: new THREE.Vector3(-0.4, -1.2, 0),
      [POSE_LANDMARKS.RIGHT_KNEE]: new THREE.Vector3(0.4, -1.2, 0),
      [POSE_LANDMARKS.LEFT_ANKLE]: new THREE.Vector3(-0.4, -2.0, 0),
      [POSE_LANDMARKS.RIGHT_ANKLE]: new THREE.Vector3(0.4, -2.0, 0),
    };

    let landmarkCount = 0;
    Object.entries(defaultPositions).forEach(([index, position]) => {
      const landmarkIndex = parseInt(index);
      createLandmarkSphere(landmarkIndex, position);
      setLandmarkPositions(prev => ({ ...prev, [landmarkIndex]: position }));
      landmarkCount++;
    });

    console.log(`Created ${landmarkCount} default landmarks`);
  };

  const initializeAllLandmarks = () => {
    if (!sceneRef.current) return;

    const defaultPositions: {[key: number]: THREE.Vector3} = {};
    const defaultSizes: {[key: number]: number} = {};

    // 모든 33개 랜드마크를 기본 위치에 생성
    for (let i = 0; i < 33; i++) {
      // 기본 위치를 사람 형태로 배치
      let position: THREE.Vector3;
      let size = 0.05; // 기본 크기

      if (i <= 10) {
        // 머리/얼굴 부분 (0-10)
        const angle = (i / 10) * Math.PI - Math.PI/2;
        position = new THREE.Vector3(Math.sin(angle) * 0.3, 1.7 + Math.cos(angle) * 0.2, 0);
        size = 0.03;
      } else if (i <= 16) {
        // 상체 (11-16)
        const armIndex = i - 11;
        const side = armIndex % 2 === 0 ? -1 : 1;
        const segment = Math.floor(armIndex / 2);
        position = new THREE.Vector3(side * (0.4 + segment * 0.3), 1.3 - segment * 0.3, 0);
        size = 0.04;
      } else if (i <= 22) {
        // 손가락 (17-22)
        const handIndex = i - 17;
        const side = handIndex < 3 ? -1 : 1;
        const finger = handIndex % 3;
        position = new THREE.Vector3(side * (0.8 + finger * 0.05), 0.5 - finger * 0.05, 0);
        size = 0.02;
      } else {
        // 하체 (23-32)
        const legIndex = i - 23;
        const side = legIndex % 2 === 0 ? -1 : 1;
        const segment = Math.floor(legIndex / 2);
        position = new THREE.Vector3(side * 0.2, 0.8 - segment * 0.5, 0);
        size = 0.04;
      }

      defaultPositions[i] = position;
      defaultSizes[i] = size;
    }

    setLandmarkPositions(defaultPositions);
    setLandmarkSizes(defaultSizes);

    // 모든 랜드마크 구체 생성
    Object.entries(defaultPositions).forEach(([index, position]) => {
      const landmarkIndex = parseInt(index);
      createLandmarkSphere(landmarkIndex, position, defaultSizes[landmarkIndex]);
    });

    console.log(`Created 33 landmark spheres`);
  };

  const createLandmarkSphere = (index: number, position: THREE.Vector3, size: number = 0.05) => {
    if (!sceneRef.current) return;

    // 기존 구체가 있으면 제거
    if (landmarkSpheres.current[index]) {
      sceneRef.current.remove(landmarkSpheres.current[index]);
    }

    const geometry = new THREE.SphereGeometry(size, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: index === selectedLandmark ? 0xff6b6b : 0x61dafb,
      transparent: true,
      opacity: 0.9
    });

    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(position);
    sphere.visible = true;
    sphere.frustumCulled = false;
    sphere.userData = { landmarkIndex: index }; // 랜드마크 인덱스 저장

    // 외곽선 추가 (더 잘 보이게)
    const edgeGeometry = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    sphere.add(edges);

    landmarkSpheres.current[index] = sphere;
    sceneRef.current.add(sphere);
  };

  const updateLandmarkPosition = (index: number, position: THREE.Vector3) => {
    if (landmarkSpheres.current[index]) {
      landmarkSpheres.current[index].position.copy(position);
      setLandmarkPositions(prev => ({ ...prev, [index]: position.clone() }));
    }
  };

  const updateLandmarkSize = (index: number, size: number) => {
    const newSize = Math.max(0.01, Math.min(0.2, size)); // 0.01과 0.2 사이로 제한

    setLandmarkSizes(prev => ({ ...prev, [index]: newSize }));

    // 현재 위치를 유지하면서 새로운 크기로 구체 재생성
    if (landmarkPositions[index]) {
      createLandmarkSphere(index, landmarkPositions[index], newSize);
    }
  };

  const handleLandmarkSelect = (index: number) => {
    setSelectedLandmark(index);

    // 모든 랜드마크 색상 리셋
    landmarkSpheres.current.forEach((sphere, i) => {
      if (sphere) {
        (sphere.material as THREE.MeshBasicMaterial).color.setHex(0x61dafb);
      }
    });

    // 선택된 랜드마크 강조
    if (landmarkSpheres.current[index]) {
      (landmarkSpheres.current[index].material as THREE.MeshBasicMaterial).color.setHex(0xff6b6b);
    }
  };


  const completeMappingg = () => {
    const mappingData = {
      landmarkPositions: landmarkPositions,
      modelFile: file
    };
    onMappingComplete(mappingData);
  };

  const animationId = useRef<number | undefined>(undefined);

  const animate = () => {
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      try {
        // 주기적으로 디버그 정보 출력 (1초마다)
        if (Date.now() % 1000 < 16) {
          console.log('Rendering - Scene children:', sceneRef.current.children.length);
          console.log('Camera position:', cameraRef.current.position);
        }

        rendererRef.current.render(sceneRef.current, cameraRef.current);
      } catch (error) {
        console.warn('Render error:', error);
        return;
      }
    } else {
      console.warn('Missing renderer, scene, or camera:', {
        renderer: !!rendererRef.current,
        scene: !!sceneRef.current,
        camera: !!cameraRef.current
      });
    }
    animationId.current = requestAnimationFrame(animate);
  };

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
  };

  return (
    <div className="landmark-mapper">
      <div className="mapper-header">
        <h2>랜드마크 매핑</h2>
        <p>3D 모델에 MediaPipe 포즈 랜드마크를 설정하세요</p>
        <button onClick={onBack} className="back-button">
          ← 이전 단계로
        </button>
      </div>

      <div className="mapper-content">
        <div className="viewport-container">
          <div ref={mountRef} className="viewport" />
        </div>

        <div className="controls-panel">
          <div className="landmark-selector">
            <h3>랜드마크 선택</h3>
            <select
              value={selectedLandmark}
              onChange={(e) => handleLandmarkSelect(parseInt(e.target.value))}
            >
              {LANDMARK_NAMES.map((name, index) => (
                <option key={index} value={index}>
                  {index}: {name.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="landmark-controls">
            <h3>크기 조정</h3>
            <div className="size-control">
              <label>크기: {(landmarkSizes[selectedLandmark] || 0.05).toFixed(3)}</label>
              <input
                type="range"
                min="0.01"
                max="0.2"
                step="0.005"
                value={landmarkSizes[selectedLandmark] || 0.05}
                onChange={(e) => updateLandmarkSize(selectedLandmark, parseFloat(e.target.value))}
              />
            </div>
          </div>

          <div className="landmark-info">
            <h3>설정된 랜드마크</h3>
            <div className="landmark-list">
              {Object.keys(landmarkPositions).map(index => (
                <div key={index} className="landmark-item">
                  {LANDMARK_NAMES[parseInt(index)]?.replace(/_/g, ' ') || `Landmark ${index}`}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={completeMappingg}
            className="complete-button"
          >
            매핑 완료 (33개 랜드마크)
          </button>
        </div>
      </div>

      <div className="instructions">
        <h3>📋 사용 방법</h3>
        <ol>
          <li>모든 33개 랜드마크가 자동으로 생성됩니다</li>
          <li>드롭다운에서 조정할 랜드마크를 선택하세요</li>
          <li>파란색 구체를 클릭하고 드래그하여 모델의 해당 부위로 이동시키세요</li>
          <li>크기 슬라이더를 사용하여 랜드마크의 크기를 조정하세요</li>
          <li>마우스 휠로 확대/축소가 가능합니다</li>
          <li>모든 조정이 완료되면 "매핑 완료"를 클릭하세요</li>
        </ol>
      </div>
    </div>
  );
};

export default LandmarkMapper;