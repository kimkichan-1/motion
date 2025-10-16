# 모션 캡처 프로젝트 개발 기록

## 프로젝트 개요
React + Three.js + MediaPipe를 활용한 실시간 웹 기반 모션 캡처 애플리케이션

## 기술 스택
- **Frontend**: React 18, Vite, TypeScript
- **3D Rendering**: Three.js, React Three Fiber, Drei
- **Pose Detection**: MediaPipe Pose (33-point body landmarks)
- **State Management**: Zustand
- **Backend**: Express, Socket.io
- **Database**: Supabase (PostgreSQL)

---

## 주요 문제 및 해결 과정

### 1. 3D 모델 본 매핑 문제 (핵심 이슈)

#### 문제 상황
- 사용자가 차렷 자세를 하면 모델은 만세 자세
- 팔이 뒤로 꺾인 듯한 비정상적인 동작
- 팔을 벌리면 모델은 팔을 X자로 교차
- 팔을 접으면 주먹이 앞쪽을 향함
- 전반적으로 본 회전이 완전히 뒤틀림

#### 원인 분석
1. **좌표계 불일치**: MediaPipe와 3D 모델의 좌표계가 다름
   - MediaPipe: 왼손 좌표계 (Y축 위쪽)
   - Three.js 모델: 오른손 좌표계 (모델마다 다를 수 있음)

2. **본 방향 문제**: T-pose 기본 방향이 모델마다 다름
   - 어떤 모델: 팔이 아래를 향함 `(0, -1, 0)`
   - 다른 모델: 팔이 옆을 향함 `(-1, 0, 0)`, `(1, 0, 0)`

3. **축 반전 필요**: X, Y, Z 축 중 어떤 축을 반전해야 하는지 모델마다 상이

---

## 해결 방법 진화

### 시도 1: 좌표계 수정 (실패)
**위치**: `client/src/utils/motionRetargeting.ts`

**변경 내용**:
```typescript
// 기존
const y = -(lm[index].y);

// 변경
const y = lm[index].y;

// 기본 방향 변경
const defaultDir = new THREE.Vector3(-1, 0, 0); // 왼팔
const defaultDir = new THREE.Vector3(1, 0, 0);  // 오른팔
```

**결과**: 여전히 팔꿈치가 뒤틀림

---

### 시도 2: 팔꿈치 힌지 조인트 구현 (실패)
**개념**: 상완과 전완을 분리하여 팔꿈치를 힌지 조인트로 처리

**문제점**: 차렷 자세에서 팔꿈치가 머리 위에 위치하고 주먹이 가슴쪽으로 교차

---

### 시도 3: 수동 본 매핑 UI (부분 성공)
**위치**: `client/src/components/viewer/BoneMappingControls.tsx` (새 파일)

#### 구현 내용
사용자가 각 본마다 수동으로 조정할 수 있는 UI 제공:

```typescript
export interface BoneConfig {
  flipX: boolean;      // X축 반전 여부
  flipY: boolean;      // Y축 반전 여부
  flipZ: boolean;      // Z축 반전 여부
  defaultDirX: number; // T-pose 기본 방향 X
  defaultDirY: number; // T-pose 기본 방향 Y
  defaultDirZ: number; // T-pose 기본 방향 Z
}

export interface MappingConfig {
  leftArm: BoneConfig;      // 왼쪽 상완
  leftForeArm: BoneConfig;  // 왼쪽 전완
  rightArm: BoneConfig;     // 오른쪽 상완
  rightForeArm: BoneConfig; // 오른쪽 전완
  leftUpLeg: BoneConfig;    // 왼쪽 대퇴
  leftLeg: BoneConfig;      // 왼쪽 종아리
  rightUpLeg: BoneConfig;   // 오른쪽 대퇴
  rightLeg: BoneConfig;     // 오른쪽 종아리
}
```

**UI 구성**:
- 각 본마다 확장 가능한 아코디언 형식
- X/Y/Z 축 반전 체크박스
- 기본 방향 (T-pose) 숫자 입력 (X, Y, Z)
- 초기화 버튼

**적용 방법**:
```typescript
// client/src/utils/poseMapping.ts (새 파일)
export function applyPoseDirectMapping(
  poseData: PoseFrame,
  skeleton: THREE.Skeleton,
  boneMap: Map<string, THREE.Bone>,
  config: MappingConfig
): void {
  const vec3 = (index: number, boneConfig: BoneConfig) => {
    const l = lm[index];
    return new THREE.Vector3(
      boneConfig.flipX ? -l.x : l.x,
      boneConfig.flipY ? -l.y : l.y,
      boneConfig.flipZ ? -l.z : l.z
    );
  };

  // 본마다 개별 설정 적용
  applyBone(boneMap.get('leftArm'), MP.LEFT_SHOULDER, MP.LEFT_ELBOW, config.leftArm);
  // ...
}
```

**문제점**: 사용자가 8개 본 × 6개 파라미터 = 48개 값을 수동 조정하기에는 너무 복잡함

**UI 버그 및 수정**:
- **문제**: onClick 이벤트가 작동하지 않음
- **원인**: 중첩 컴포넌트 함수로 인한 React 렌더링 이슈
- **해결**: `.map()` 을 사용한 직접 렌더링으로 완전히 재작성

```typescript
// 수정 전 (작동 안 함)
function BoneControls({ bone }: { bone: BoneName }) {
  return <button onClick={...}>...</button>
}
return bones.map(bone => <BoneControls bone={bone} />);

// 수정 후 (작동함)
return bones.map(({ key, label }) => (
  <div key={key}>
    <button onClick={() => setExpanded(isExpanded ? null : key)}>
      {label}
    </button>
  </div>
));
```

---

### 최종 해결: T-Pose 자동 캘리브레이션 ✅
**위치**: `client/src/utils/calibration.ts` (새 파일)

#### 핵심 아이디어
사용자가 T-pose를 취하면 시스템이 자동으로 최적의 축 반전 조합을 찾아냄

#### 알고리즘

##### 1. T-pose 유효성 검증
```typescript
export function isValidTPose(poseData: PoseFrame): { valid: boolean; message: string } {
  // 1. 필요한 관절이 모두 보이는지 확인 (visibility > 0.5)
  for (const idx of requiredPoints) {
    if (lm[idx].visibility < 0.5) {
      return { valid: false, message: '일부 관절이 보이지 않습니다' };
    }
  }

  // 2. 팔이 수평으로 펴져있는지 확인
  const leftArmY = Math.abs(leftWrist.y - leftShoulder.y);
  const leftArmX = Math.abs(leftWrist.x - leftShoulder.x);

  if (leftArmY > leftArmX * 0.5 || rightArmY > rightArmX * 0.5) {
    return { valid: false, message: '팔을 수평으로 펴세요 (T자)' };
  }

  // 3. 팔이 곧게 펴져있는지 확인 (구부러지지 않음)
  if (leftElbowDist < leftArmLength * 0.3) {
    return { valid: false, message: '팔을 쭉 펴세요' };
  }

  return { valid: true, message: 'T-pose 준비 완료!' };
}
```

##### 2. 본 캘리브레이션 (8가지 조합 테스트)
```typescript
function calibrateBone(
  poseData: PoseFrame,
  startIdx: number,
  endIdx: number,
  expectedDir: THREE.Vector3
): BoneConfig {
  // 2^3 = 8가지 축 반전 조합
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

  let bestConfig: BoneConfig | null = null;
  let bestScore = -Infinity;

  for (const flip of flipCombinations) {
    // 축 반전 적용
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

    // 방향 벡터 계산
    const direction = new THREE.Vector3().subVectors(end, start).normalize();

    // 내적으로 점수 계산 (expectedDir과 얼마나 일치하는지)
    const score = direction.dot(expectedDir);

    // 최고 점수 갱신
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
```

##### 3. 전체 캘리브레이션
```typescript
export function calibrateFromTPose(poseData: PoseFrame): MappingConfig {
  // T-pose 예상 방향
  const expectedDirs = {
    leftArm: new THREE.Vector3(-1, 0, 0),      // 왼쪽
    leftForeArm: new THREE.Vector3(-1, 0, 0),  // 왼쪽
    rightArm: new THREE.Vector3(1, 0, 0),      // 오른쪽
    rightForeArm: new THREE.Vector3(1, 0, 0),  // 오른쪽
    leftUpLeg: new THREE.Vector3(0, -1, 0),    // 아래
    leftLeg: new THREE.Vector3(0, -1, 0),      // 아래
    rightUpLeg: new THREE.Vector3(0, -1, 0),   // 아래
    rightLeg: new THREE.Vector3(0, -1, 0),     // 아래
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

  return config;
}
```

---

## UI 통합

### Capture 페이지 수정
**위치**: `client/src/pages/capture/Capture.tsx`

#### 추가된 State
```typescript
const [currentPose, setCurrentPose] = useState<PoseFrame | undefined>(undefined);
const [mappingConfig, setMappingConfig] = useState<MappingConfig>(defaultConfig);
const [calibrationStatus, setCalibrationStatus] = useState<string>('');
```

#### 실시간 T-pose 검증
```typescript
useEffect(() => {
  if (currentPose) {
    const { valid, message } = isValidTPose(currentPose);
    setCalibrationStatus(message);
  }
}, [currentPose]);
```

#### 캘리브레이션 핸들러
```typescript
const handleCalibrate = () => {
  if (!currentPose) {
    alert('포즈 데이터를 기다리는 중...');
    return;
  }

  const { valid, message } = isValidTPose(currentPose);
  if (!valid) {
    alert(`캘리브레이션 실패: ${message}`);
    return;
  }

  try {
    const newConfig = calibrateFromTPose(currentPose);
    setMappingConfig(newConfig);
    alert('✅ T-pose 캘리브레이션 완료!');
  } catch (error: any) {
    alert(`캘리브레이션 오류: ${error.message}`);
  }
};
```

#### UI 섹션 (라인 207-247)
```tsx
<div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow p-6 border-2 border-blue-200">
  <h2 className="text-xl font-bold mb-3 text-blue-900">🎯 T-pose 캘리브레이션</h2>
  <p className="text-sm text-gray-700 mb-3">
    T자 포즈를 취하고 캘리브레이션 버튼을 눌러 자동으로 본 매핑을 설정하세요
  </p>

  {/* 상태 표시기 */}
  <div className={`mb-4 p-3 rounded ${
    calibrationStatus.includes('준비')
      ? 'bg-green-100 border border-green-300'
      : 'bg-yellow-100 border border-yellow-300'
  }`}>
    <p className="text-sm font-medium">
      {calibrationStatus || 'T-pose를 취해주세요...'}
    </p>
  </div>

  {/* 안내 지침 */}
  <div className="bg-white rounded p-3 mb-4">
    <p className="text-xs font-semibold text-gray-700 mb-2">T-pose 자세:</p>
    <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
      <li>똑바로 서세요</li>
      <li>양팔을 수평으로 쭉 펴세요 (T자)</li>
      <li>다리는 어깨 너비로 벌리세요</li>
      <li>전체 몸이 카메라에 보이도록 하세요</li>
    </ol>
  </div>

  {/* 캘리브레이션 버튼 */}
  <button
    onClick={handleCalibrate}
    disabled={!calibrationStatus.includes('준비')}
    className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition ${
      calibrationStatus.includes('준비')
        ? 'bg-blue-600 hover:bg-blue-700'
        : 'bg-gray-400 cursor-not-allowed'
    }`}
  >
    {calibrationStatus.includes('준비') ? '✨ 지금 캘리브레이션!' : '⏳ T-pose를 취해주세요'}
  </button>
</div>
```

---

## 파일 구조

```
client/src/
├── components/
│   └── viewer/
│       ├── BoneMappingControls.tsx  # 수동 본 매핑 조정 UI
│       ├── ModelViewer.tsx          # 3D 모델 렌더링
│       └── VideoFeed.tsx            # MediaPipe 카메라 피드
├── pages/
│   └── capture/
│       └── Capture.tsx              # 메인 캡처 페이지
├── utils/
│   ├── calibration.ts               # T-pose 자동 캘리브레이션 (NEW)
│   ├── poseMapping.ts               # 설정 가능한 포즈 적용 (NEW)
│   └── motionRetargeting.ts         # 본 감지 및 기존 로직
└── types/
    └── index.ts                      # 타입 정의
```

---

## 사용 방법

### 1. T-Pose 자동 캘리브레이션 (권장)

1. 앱 실행: `http://localhost:5174`
2. 3D 모델 업로드 및 선택
3. **T-pose 캘리브레이션** 섹션으로 스크롤 (파란색/보라색 박스)
4. T-pose 자세 취하기:
   - 똑바로 서기
   - 양팔을 수평으로 쭉 펴기 (T자)
   - 다리는 어깨 너비로 벌리기
   - 전체 몸이 카메라에 보이도록 하기
5. 상태 표시기가 초록색으로 변하고 "T-pose 준비 완료!" 메시지 확인
6. **"✨ 지금 캘리브레이션!"** 버튼 클릭
7. 시스템이 자동으로 최적의 본 매핑 설정 완료

### 2. 수동 미세 조정 (선택 사항)

자동 캘리브레이션 후에도 완벽하지 않다면:

1. **수동 본 매핑 조정** 섹션 사용
2. 각 본 이름 클릭하여 확장
3. X/Y/Z 축 반전 체크박스 조정
4. 기본 방향 (T-pose) 값 조정
5. 실시간으로 모델 움직임 확인하며 미세 조정

---

## 주요 개념 정리

### MediaPipe 랜드마크 인덱스
```typescript
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
```

### 쿼터니언 회전
```typescript
const defaultDir = new THREE.Vector3(defaultDirX, defaultDirY, defaultDirZ).normalize();
const quat = new THREE.Quaternion().setFromUnitVectors(defaultDir, direction);
bone.quaternion.slerp(quat, smoothing); // smoothing = 0.5
```

### 본 이름 감지
```typescript
export const COMMON_BONE_NAMES = {
  leftArm: ['LeftArm', 'mixamorig:LeftArm', 'upperarm.L', 'L_UpperArm', 'UpperArmL'],
  leftForeArm: ['LeftForeArm', 'mixamorig:LeftForeArm', 'lowerarm.L', 'L_Forearm', 'LowerArmL'],
  // ...
};
```

---

## 디버깅 팁

### 1. 본 이름 확인
콘솔에서 모델의 모든 본 이름 출력됨:
```
===== ALL BONE NAMES IN MODEL =====
0: Hips
1: Spine
2: UpperArmL
3: LowerArmL
...
===================================
```

### 2. 감지된 본 확인
```
Detected bones: ["leftArm", "leftForeArm", "rightArm", ...]
Total bones in skeleton: 65
```

### 3. 캘리브레이션 결과 확인
```
🎯 Starting T-pose calibration...
✅ T-pose calibration complete! {leftArm: {...}, rightArm: {...}}
```

---

## 향후 개선 사항

### 1. 추가 캘리브레이션 모드
- **A-pose**: 팔을 45도 아래로
- **거울 모드**: 좌우 반전 옵션
- **프리셋**: 일반적인 모델 타입별 사전 설정 (Mixamo, VRoid 등)

### 2. 캘리브레이션 저장/불러오기
- 모델별 캘리브레이션 설정 저장
- 로컬 스토리지 또는 데이터베이스에 저장
- 같은 모델 재사용 시 자동 적용

### 3. 시각적 피드백 개선
- 3D 뷰어에 스켈레톤 오버레이 표시
- 본 방향 화살표 표시
- T-pose 정렬 가이드 (실루엣 오버레이)

### 4. 다중 사용자 캘리브레이션
- 키가 다른 사용자 프로필 저장
- 체형에 따른 자동 스케일링

---

## 트러블슈팅

### Q: 캘리브레이션 버튼이 활성화되지 않아요
**A**: 다음을 확인하세요:
- 카메라가 켜져 있는지
- 전체 몸이 카메라에 보이는지
- 팔이 정말 수평인지 (약간 위나 아래가 아닌)
- 팔이 쭉 펴져있는지 (팔꿈치가 구부러지지 않음)

### Q: 캘리브레이션 후에도 움직임이 이상해요
**A**:
1. 수동 본 매핑 조정 사용
2. 특정 본의 축 반전 조정
3. 기본 방향 값 미세 조정
4. 콘솔에서 본 이름이 올바르게 감지되었는지 확인

### Q: 일부 본만 이상하게 움직여요
**A**:
- 해당 본만 수동으로 조정
- 상완/전완, 대퇴/종아리는 개별적으로 설정 가능

---

## 개발 서버 실행

```bash
# 클라이언트
cd client
npm run dev
# http://localhost:5174

# 서버 (Socket.io - 다중 카메라용)
cd server
npm run dev
# http://localhost:3000
```

---

## Git 브랜치
- **현재 브랜치**: `kim`
- **메인 브랜치**: `main`

작업 후 푸시:
```bash
git add .
git commit -m "본 매핑 및 T-pose 캘리브레이션 구현"
git push origin kim
```

---

## 마지막 업데이트
2025-10-13

## 작성자
Claude Code + 개발자
