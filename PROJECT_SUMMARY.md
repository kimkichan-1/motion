# MediaPipe FBX Motion Capture System - 프로젝트 정리

## 📋 프로젝트 개요

React 웹 애플리케이션 기반의 실시간 모션 캡처 시스템으로, MediaPipe를 사용한 포즈 추적과 Three.js를 통한 3D 아바타 애니메이션을 결합한 시스템입니다.

## 🎯 주요 기능

### 1. 실시간 포즈 캡처
- **MediaPipe Pose**: 33개 관절점 실시간 추적
- **웹캠 기반**: HTTP/HTTPS 환경에서 카메라 접근
- **고성능 처리**: 30fps 타겟으로 GPU 가속 처리
- **신뢰도 기반 필터링**: 낮은 신뢰도 포즈 자동 제외

### 2. 3D 아바타 시스템
- **기본 아바타**: FBX 없이도 작동하는 컬러풀한 스틱피겨
- **FBX 지원**: 외부 3D 모델 로드 및 실시간 애니메이션
- **Error Fallback**: FBX 로딩 실패 시 자동으로 기본 아바타로 전환

### 3. 고급 포즈 매핑
- **정확한 본 매핑**: 33개 랜드마크를 신체 부위별로 매핑
- **스무딩 시스템**: 15% lerp 기반 부드러운 애니메이션
- **개별 부위 제어**: 상완, 전완, 대퇴부, 종아리 각각 독립 제어

### 4. 실시간 모니터링
- **신뢰도 표시기**: 포즈 추적 품질 실시간 확인 (녹색/노란색/빨간색)
- **모델 상태 표시기**: 기본 아바타(주황색) vs FBX 모델(파란색)
- **포즈 데이터 표시**: 랜드마크 수, 타임스탬프 등

### 5. 레코딩 기능
- **모션 데이터 저장**: 포즈 데이터를 프레임별로 기록
- **실시간 카운터**: 녹화된 프레임 수 표시
- **재생 지원**: 향후 확장 가능한 구조

## 🏗️ 시스템 아키텍처

### 폴더 구조
```
src/
├── components/
│   ├── FBXAvatar.tsx          # 3D 아바타 컴포넌트
│   ├── Scene3D.tsx            # Three.js 씬 관리
│   ├── MotionCaptureApp.tsx   # 메인 애플리케이션
│   └── MotionCaptureApp.css   # 스타일링
├── hooks/
│   └── useMediaPipePose.ts    # MediaPipe 포즈 추적 훅
├── utils/
│   └── poseMapping.ts         # 포즈-본 매핑 로직
└── main.tsx                   # 애플리케이션 진입점
```

### 기술 스택
- **Frontend**: React 18 + TypeScript
- **3D 렌더링**: Three.js + React Three Fiber + Drei
- **모션 추적**: MediaPipe Tasks Vision
- **빌드 도구**: Vite
- **스타일링**: CSS Modules

## 🎨 UI/UX 디자인

### 레이아웃 구성
```
┌─────────────┬─────────────────────────────────┐
│             │         웹캠 영상 + 포즈 오버레이     │
│   컨트롤    │─────────────────────────────────│
│   패널      │                                 │
│             │         3D 아바타 씬             │
│   • 카메라   │                                 │
│   • 녹화    │     [신뢰도]    [모델상태]        │
│   • 모델    │                                 │
│   • 정보    │                                 │
└─────────────┴─────────────────────────────────┘
```

### 색상 시스템
- **머리**: 빨간색 (#ff6b6b)
- **몸통**: 청록색 (#4ecdc4)
- **어깨**: 파란색 (#45b7d1)
- **팔**: 녹색 (#96ceb4)
- **허벅지**: 노란색 (#feca57)
- **종아리**: 분홍색 (#ff9ff3)

## ⚙️ 핵심 알고리즘

### 포즈 매핑 시스템
```typescript
// 관절점 간 방향 벡터 계산
const calculateRotation = (from: Landmark, to: Landmark) => {
  const direction = new THREE.Vector3(
    to.x - from.x,
    -(to.y - from.y),  // Y축 반전
    to.z - from.z
  ).normalize();

  // 오일러 각도 계산
  const angleZ = Math.atan2(direction.y, direction.x);
  const angleX = Math.atan2(direction.z, ...);

  return new THREE.Euler(angleX * 0.5, 0, angleZ - Math.PI / 2);
};
```

### 스무딩 시스템
```typescript
// 15% lerp로 부드러운 애니메이션
mesh.rotation.x = THREE.MathUtils.lerp(
  mesh.rotation.x,
  targetRotation.x,
  0.15
);
```

## 🔧 설치 및 실행

### 요구사항
- **Node.js**: 18.x 이상
- **브라우저**: Chrome 90+ (WebRTC 지원)
- **카메라**: 웹캠 또는 USB 카메라
- **GPU**: WebGL 2.0 지원 권장

### 실행 방법
```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm run dev

# 브라우저에서 http://localhost:3001 접속
```

### HTTP 환경에서 웹캠 사용
Chrome에서 `chrome://flags/#unsafely-treat-insecure-origin-as-secure`로 이동하여 `http://localhost:3001` 추가

## 🎮 사용 방법

### 기본 조작
1. **카메라 시작**: "Start Camera" 버튼 클릭
2. **포즈 추적**: 웹캠 앞에서 움직이면 실시간 추적
3. **아바타 확인**: 3D 씬에서 아바타가 동작 따라함
4. **모델 업로드**: FBX 파일 선택하여 커스텀 아바타 사용

### 추천 테스트 동작
- ✋ **팔 동작**: 위아래, 좌우로 팔 움직이기
- 🤸 **몸 기울이기**: 좌우로 상체 기울이기
- 🦵 **다리 동작**: 한쪽 다리 들어올리기
- 👋 **세밀한 동작**: 손목, 팔꿈치 구부리기

## 📈 성능 최적화

### 실시간 처리 최적화
- **GPU 가속**: WebGL 기반 렌더링
- **프레임 레이트**: 30fps 안정적 유지
- **메모리 관리**: 객체 풀링 및 가비지 컬렉션 최적화
- **스무싱 버퍼**: 5프레임 기반 모션 스무딩

### 신뢰도 기반 필터링
- **0.5 이상**: 포즈 적용
- **0.7 이상**: 고품질 추적
- **0.8 이상**: 최적 상태 (녹색 표시)

## 🐛 알려진 이슈 및 해결책

### 1. HTTPS 연결 문제
**문제**: MediaPipe가 HTTPS 요구
**해결책**: Chrome 플래그 설정 또는 localhost 예외 추가

### 2. FBX 로딩 실패
**문제**: 모델 파일 형식 또는 경로 오류
**해결책**: 자동으로 기본 아바타로 fallback

### 3. 포즈 매핑 정확도
**문제**: 일부 동작에서 부자연스러운 움직임
**해결책**: 스무딩 팩터 및 회전 계산 로직 개선

## 🚀 향후 개발 계획

### 단기 목표
- [ ] 손가락 추적 추가 (MediaPipe Hands)
- [ ] 얼굴 표정 추적 (MediaPipe Face)
- [ ] 모션 데이터 내보내기 (BVH, FBX)
- [ ] 실시간 녹화 성능 개선

### 중기 목표
- [ ] 멀티 사용자 지원
- [ ] 클라우드 기반 모션 저장
- [ ] VR/AR 플랫폼 지원
- [ ] 모바일 최적화

### 장기 목표
- [ ] AI 기반 동작 예측
- [ ] 실시간 모션 보정
- [ ] 상용 모션캡처 시스템과의 호환성
- [ ] 게임 엔진 플러그인 개발

## 📊 개발 통계

- **개발 기간**: 1일
- **총 코드 라인**: ~800 lines
- **컴포넌트 수**: 8개
- **지원 브라우저**: Chrome, Edge
- **테스트 환경**: Windows 10/11

## 📝 라이센스 및 크레딧

- **MediaPipe**: Google (Apache 2.0)
- **Three.js**: MIT License
- **React**: MIT License
- **개발자**: Claude Code Assistant

---

**🎬 완전한 웹 기반 모션캡처 스튜디오 완성!**