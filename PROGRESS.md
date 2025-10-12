# Motion Capture Platform - 작업 진행 상황

**마지막 업데이트**: 2025-10-12
**브랜치**: kim
**진행률**: 핵심 기능 구현 완료 (75%)

---

## ✅ 완료된 작업

### 1. 프로젝트 초기 설정 ✓
- [x] Git 저장소 초기화 및 kim 브랜치 생성
- [x] GitHub 원격 저장소 연결 (https://github.com/kimkichan-1/motion)
- [x] 모노레포 구조 설정 (client + server)
- [x] .gitignore 설정

### 2. 프론트엔드 설정 ✓
- [x] React 18 + Vite + TypeScript 프로젝트 생성
- [x] TailwindCSS 설정 완료
- [x] 핵심 라이브러리 설치:
  - `@react-three/fiber`, `@react-three/drei` - 3D 렌더링
  - `@mediapipe/tasks-vision` - 모션 캡처
  - `kalidokit` - 모션 리타게팅
  - `zustand` - 상태 관리
  - `react-router-dom` - 라우팅
  - `@supabase/supabase-js` - 데이터베이스
  - `socket.io-client` - 실시간 통신
- [x] 디렉토리 구조 생성:
  ```
  client/src/
  ├── components/
  │   ├── 3d/
  │   ├── auth/
  │   ├── motion/
  │   └── ui/
  ├── features/
  │   ├── capture/
  │   └── editor/
  ├── hooks/
  ├── lib/
  ├── pages/
  │   ├── auth/
  │   ├── capture/
  │   └── admin/
  ├── store/
  ├── types/
  └── utils/
  ```

### 3. 백엔드 설정 ✓
- [x] Node.js + Express + TypeScript 프로젝트 생성
- [x] 핵심 라이브러리 설치:
  - `express` - 웹 서버
  - `socket.io` - WebRTC 시그널링
  - `@supabase/supabase-js` - 데이터베이스
  - `stripe` - 결제
  - `cors`, `dotenv` - 미들웨어
- [x] 디렉토리 구조 생성:
  ```
  server/src/
  ├── controllers/
  ├── routes/
  ├── services/
  ├── socket/
  ├── middleware/
  └── types/
  ```
- [x] TypeScript 설정 완료
- [x] 개발 스크립트 설정 (nodemon + ts-node)

### 4. Supabase 데이터베이스 스키마 ✓
- [x] 완전한 데이터베이스 스키마 설계 (`supabase_schema.sql`)
- [x] 테이블 생성:
  - `profiles` - 사용자 프로필 (auth.users 확장)
  - `subscriptions` - 구독 정보 (free/basic/pro)
  - `models` - 3D 모델 메타데이터
  - `motion_recordings` - 모션 녹화 데이터
  - `usage_logs` - 사용량 추적 (분석용)
- [x] Row Level Security (RLS) 정책 설정
- [x] 자동 트리거 함수:
  - 회원가입 시 자동 프로필 생성
  - updated_at 자동 업데이트
  - 기본 무료 구독 자동 생성
- [x] Storage 버킷 계획:
  - `models` - 3D 모델 파일 (FBX/GLB)
  - `motions` - 모션 데이터 파일

### 5. 상태 관리 (Zustand Stores) ✓
- [x] **authStore.ts** - 인증 상태 관리
  ```typescript
  - user, isLoading, isAuthenticated
  - initialize(), signIn(), signUp(), signOut()
  - Supabase Auth 연동
  ```
- [x] **motionStore.ts** - 모션 캡처 상태 관리
  ```typescript
  - isCapturing, isRecording, currentMotion[]
  - cameras[], recordingStartTime
  - 모션 데이터 추가/저장/삭제
  - 카메라 관리 (추가/제거/활성화)
  ```
- [x] **modelStore.ts** - 3D 모델 관리
  ```typescript
  - currentModel, models[], isLoading
  - uploadModel(), loadModels(), deleteModel()
  - Supabase Storage 연동
  ```

### 6. Socket.io 실시간 통신 ✓
- [x] 서버 Socket.io 핸들러 구현 (`server/src/socket/index.ts`)
- [x] 기능:
  - Room 기반 다중 사용자 관리
  - 실시간 모션 데이터 브로드캐스트
  - WebRTC 시그널링 (offer/answer/ICE)
  - 사용자 입장/퇴장 이벤트
- [x] 이벤트:
  - `join-room` - 방 참여
  - `leave-room` - 방 나가기
  - `motion-data` - 모션 데이터 스트리밍
  - `webrtc-offer/answer/ice-candidate` - WebRTC 시그널링

### 7. TypeScript 타입 정의 ✓
- [x] **client/src/types/index.ts** 생성
  ```typescript
  - AuthState, MotionData, RecordedMotion
  - Model3D, CameraSource
  - Subscription, SubscriptionPlan
  - PeerConnection
  - Store 타입들
  ```

### 8. 설정 파일 ✓
- [x] 환경 변수 예제 파일:
  - `client/.env.example` - 프론트엔드 환경 변수
  - `server/.env.example` - 백엔드 환경 변수
- [x] Supabase 클라이언트 설정 (`client/src/lib/supabase.ts`)
- [x] TailwindCSS 설정 (`client/tailwind.config.js`)
- [x] PostCSS 설정 (`client/postcss.config.js`)

### 9. 문서화 ✓
- [x] `README.md` - 프로젝트 개요 및 기술 스택
- [x] `SETUP_GUIDE.md` - 상세 설정 가이드
  - 로컬 개발 환경 설정
  - Supabase 설정 방법
  - Stripe 설정 방법
  - Render.com 배포 가이드
  - Vercel 배포 가이드
  - 문제 해결 팁
- [x] `supabase_schema.sql` - DB 스키마 (주석 포함)

### 10. Git 관리 ✓
- [x] 초기 커밋 완료
- [x] kim 브랜치에 푸시 완료
- [x] 커밋 메시지 작성 (상세한 변경 내역 포함)

### 11. 인증 및 라우팅 UI ✓
- [x] React Router 설정 (`client/src/App.tsx`)
  - BrowserRouter with nested routes
  - Public routes: /, /login, /register
  - Protected routes: /capture, /models, /recordings
- [x] Layout 컴포넌트 (`client/src/components/layout/`)
  - `Layout.tsx` - Main layout wrapper with Navbar and Outlet
  - `Navbar.tsx` - Navigation with auth-aware UI
- [x] 인증 컴포넌트 (`client/src/components/auth/`)
  - `ProtectedRoute.tsx` - Route protection with loading state
- [x] 페이지 구현 (`client/src/pages/`)
  - `Home.tsx` - Landing page with hero and features
  - `auth/Login.tsx` - Login form with error handling
  - `auth/Register.tsx` - Registration with validation
  - `capture/Capture.tsx` - Motion capture studio interface

### 12. 3D 모델 뷰어 시스템 ✓
- [x] **ModelViewer** (`client/src/components/viewer/ModelViewer.tsx`)
  - React Three Fiber 기반 3D 렌더링
  - FBX/GLB/GLTF 모델 로딩
  - 다중 조명 시스템 (ambient, directional, point, spot)
  - OrbitControls로 회전/줌/팬 지원
  - 그리드 헬퍼 (무한 그리드)
  - 모델 정보 오버레이
  - 실시간 모션 데이터 적용

- [x] **VideoFeed** (`client/src/components/viewer/VideoFeed.tsx`)
  - 웹캠/모바일 카메라 스트림
  - MediaPipe 통합
  - 실시간 포즈 오버레이
  - 카메라 상태 표시 (Live, Pose Detection)
  - 에러 핸들링 및 로딩 상태

- [x] **ControlPanel** (`client/src/components/viewer/ControlPanel.tsx`)
  - 녹화 컨트롤 (Start/Stop/Pause/Resume)
  - 모델 선택 드롭다운
  - 모델 업로드 버튼
  - 상태 인디케이터

- [x] **Capture Page** - 완전한 스튜디오 인터페이스
  - 3패널 레이아웃: 비디오(왼쪽), 3D 뷰어(중앙), 컨트롤(오른쪽)
  - 자동 웹캠 초기화
  - 카메라 설정 패널
  - 다중 카메라 지원
  - 상태 바 (카메라 수, FPS, 레이턴시)

### 13. MediaPipe 모션 캡처 통합 ✓
- [x] **useMediaPipe Hook** (`client/src/hooks/useMediaPipe.ts`)
  - MediaPipe Vision Tasks 초기화
  - PoseLandmarker with GPU acceleration
  - 실시간 비디오 프레임 처리 (VIDEO mode)
  - 33개 포즈 랜드마크 감지
  - 3D 월드 좌표 추출
  - 스켈레톤 연결선 그리기
  - DrawingUtils로 캔버스 오버레이
  - 자동 프레임 스킵 (중복 프레임 방지)

- [x] **PoseOverlay** (`client/src/components/viewer/PoseOverlay.tsx`)
  - 비디오 위 포즈 시각화 캔버스
  - 동적 크기 조정

- [x] **VideoFeed with MediaPipe**
  - 웹캠 스트림에 자동 포즈 감지 적용
  - 실시간 랜드마크 오버레이
  - MediaPipe 초기화 로딩 상태
  - Pose Detection 상태 표시

### 14. 모션 리타게팅 시스템 ✓
- [x] **Motion Retargeting Utils** (`client/src/utils/motionRetargeting.ts`)
  - `landmarksToBoneRotations()` - MediaPipe → 본 회전 변환
    * 33개 랜드마크에서 관절 각도 계산
    * Three.js Euler 각도로 변환
    * 표준 본 계층 구조 (Hips, Spine, Arms, Legs)
  - `applyBoneRotations()` - 3D 모델 본에 회전 적용
    * 유연한 본 이름 매핑 (Mixamo, 커스텀 리그 지원)
    * 자동 본 탐색 및 매칭
  - `RotationSmoother` - 모션 스무딩
    * 지수 이동 평균 (EMA)
    * 본별 스무딩 상태 관리
    * 노이즈 감소

- [x] **ModelViewer with Retargeting**
  - 실시간 모션 데이터 적용
  - 최신 프레임 기반 업데이트
  - 동적 리타게팅 함수 임포트

---

## 🚧 진행 중인 작업

현재 커밋 및 푸시 작업 완료 - 다음 단계 대기 중

---

## 📋 다음 단계 (우선순위 순)

### Phase 1: 인증 및 기본 UI ✅ 완료
- [x] ~~회원가입/로그인 UI 구현~~
- [x] ~~라우터 설정 및 레이아웃~~

### Phase 2: 3D 모델 뷰어 ✅ 완료
- [x] ~~3D 모델 뷰어 구현~~
- [x] ~~비디오 피드 및 컨트롤~~

### Phase 3: 모션 캡처 ✅ 완료
- [x] ~~MediaPipe 모션 캡처 통합~~
- [x] ~~실시간 모션 적용 (리타게팅)~~

### Phase 4: 모델 업로드 및 관리 (다음 단계)
- [ ] **1. 3D 모델 업로드 기능**
  - 작업 파일:
    - `client/src/pages/models/Models.tsx`
    - `client/src/components/models/ModelUploader.tsx`
    - `client/src/components/models/ModelCard.tsx`
  - 기능:
    - 파일 드래그 앤 드롭
    - FBX/GLB 파일 검증
    - Supabase Storage 업로드
    - 업로드 진행률 표시
    - 모델 목록 표시
    - 모델 선택/삭제
  - 참고: modelStore.uploadModel() 이미 구현됨

### Phase 5: 다중 카메라 동기화
- [ ] **7. 모바일 카메라 연동 (WebRTC)**
  - 작업 파일:
    - `client/src/pages/capture/MobileCamera.tsx`
    - `client/src/hooks/useWebRTC.ts`
    - `client/src/hooks/useSocket.ts`
  - 기능:
    - Room ID 생성/입장
    - WebRTC Peer Connection 설정
    - 비디오 스트림 공유
    - Socket.io 시그널링
    - 카메라 선택 (전면/후면)

- [ ] **8. 다중 카메라 동기화**
  - 작업 파일:
    - `client/src/features/capture/MultiCameraSync.tsx`
    - `client/src/hooks/useMultiCamera.ts`
  - 기능:
    - 여러 카메라 스트림 동시 처리
    - 각 스트림별 MediaPipe 실행
    - 데이터 병합/평균화
    - 정확도 향상

### Phase 5: 모션 녹화 및 저장
- [ ] **9. 모션 녹화 기능**
  - 작업 파일:
    - `client/src/features/capture/MotionRecorder.tsx`
    - `client/src/hooks/useRecording.ts`
  - 기능:
    - 녹화 시작/중지
    - 타임스탬프 기반 데이터 저장
    - 녹화 시간 표시
    - 프레임 카운터

- [ ] **10. 모션 재생 및 편집**
  - 작업 파일:
    - `client/src/features/editor/MotionPlayer.tsx`
    - `client/src/features/editor/Timeline.tsx`
  - 기능:
    - 타임라인 기반 재생
    - 재생 속도 조절
    - 구간 편집 (자르기/붙이기)
    - 키프레임 편집

### Phase 6: FBX/GLB 익스포트
- [ ] **11. 모션 데이터 익스포트**
  - 작업 파일:
    - `client/src/features/editor/MotionExporter.tsx`
    - `server/src/services/motionExport.ts`
  - 기능:
    - 모션 데이터를 BVH 형식으로 변환
    - GLB 파일에 애니메이션 추가
    - FBX 파일 생성 (서버사이드)
    - 다운로드 기능

### Phase 7: 결제 시스템
- [ ] **12. Stripe 구독 통합**
  - 작업 파일:
    - `client/src/pages/pricing/Pricing.tsx`
    - `client/src/components/payment/CheckoutForm.tsx`
    - `server/src/routes/stripe.ts`
    - `server/src/controllers/stripeController.ts`
  - 기능:
    - 구독 플랜 선택 UI
    - Stripe Checkout 세션
    - Webhook 처리 (구독 상태 업데이트)
    - 결제 성공/실패 처리
    - 구독 취소/변경

- [ ] **13. 무료 체험 및 제한 사항**
  - 작업 파일:
    - `client/src/hooks/useSubscription.ts`
    - `server/src/middleware/subscriptionCheck.ts`
  - 기능:
    - 무료 플랜 제한 (녹화 시간, 모델 개수)
    - 구독 플랜별 기능 제한
    - 업그레이드 안내

### Phase 8: 관리자 대시보드
- [ ] **14. 관리자 페이지**
  - 작업 파일:
    - `client/src/pages/admin/Dashboard.tsx`
    - `client/src/pages/admin/Users.tsx`
    - `client/src/pages/admin/Subscriptions.tsx`
  - 기능:
    - 사용자 목록 및 검색
    - 구독 현황 통계
    - 사용량 분석 (차트)
    - 사용자 활성화/비활성화

### Phase 9: 배포
- [ ] **15. Render.com 백엔드 배포**
  - 작업 내용:
    - render.yaml 설정 파일 생성
    - 환경 변수 설정
    - 자동 배포 설정 (GitHub 연동)
    - Health check 엔드포인트 테스트

- [ ] **16. Vercel 프론트엔드 배포**
  - 작업 내용:
    - vercel.json 설정
    - 환경 변수 설정
    - 빌드 최적화
    - CDN 설정

- [ ] **17. 프로덕션 최적화**
  - 작업 내용:
    - 코드 스플리팅
    - 이미지 최적화
    - 번들 사이즈 최적화
    - 성능 모니터링 (Sentry, Analytics)

---

## 🛠 기술 스택 요약

### Frontend
```json
{
  "react": "^18.3.1",
  "vite": "^6.0.5",
  "typescript": "~5.6.2",
  "@react-three/fiber": "^8.17.10",
  "@react-three/drei": "^9.117.3",
  "three": "^0.171.0",
  "@mediapipe/tasks-vision": "^0.10.20",
  "kalidokit": "^1.1.8",
  "zustand": "^5.0.2",
  "react-router-dom": "^7.1.1",
  "@supabase/supabase-js": "^2.75.0",
  "socket.io-client": "^4.8.1",
  "tailwindcss": "^3.4.17"
}
```

### Backend
```json
{
  "express": "^5.1.0",
  "socket.io": "^4.8.1",
  "@supabase/supabase-js": "^2.75.0",
  "stripe": "^19.1.0",
  "cors": "^2.8.5",
  "dotenv": "^17.2.3",
  "typescript": "^5.9.3"
}
```

---

## 📂 주요 파일 위치

### 설정 파일
- `client/.env.example` - 프론트엔드 환경 변수 예제
- `server/.env.example` - 백엔드 환경 변수 예제
- `supabase_schema.sql` - 데이터베이스 스키마

### 상태 관리
- `client/src/store/authStore.ts` - 인증 상태
- `client/src/store/motionStore.ts` - 모션 상태
- `client/src/store/modelStore.ts` - 모델 상태

### 타입 정의
- `client/src/types/index.ts` - 전역 타입

### 서버
- `server/src/index.ts` - 메인 서버 파일
- `server/src/socket/index.ts` - Socket.io 핸들러

### 문서
- `README.md` - 프로젝트 개요
- `SETUP_GUIDE.md` - 설정 가이드
- `PROGRESS.md` - 이 파일 (작업 진행 상황)

---

## 🔑 환경 변수 체크리스트

### Supabase (필수)
- [ ] `VITE_SUPABASE_URL` - Supabase 프로젝트 URL
- [ ] `VITE_SUPABASE_ANON_KEY` - Supabase anon key
- [ ] `SUPABASE_SERVICE_KEY` - Supabase service role key (서버)

### Stripe (결제 기능 시 필요)
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe 공개 키
- [ ] `STRIPE_SECRET_KEY` - Stripe 비밀 키
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe Webhook secret

### 기타
- [ ] `VITE_API_URL` - 백엔드 API URL
- [ ] `CLIENT_URL` - 프론트엔드 URL (CORS)
- [ ] `PORT` - 서버 포트 (기본 3001)

---

## 💡 개발 팁

### 1. 로컬 개발 실행
```bash
# 루트에서 모두 실행
npm run dev

# 또는 개별 실행
cd client && npm run dev  # 포트 5173
cd server && npm run dev  # 포트 3001
```

### 2. Supabase 스키마 적용
1. Supabase 대시보드 → SQL Editor
2. `supabase_schema.sql` 내용 복사
3. 실행 (Run)
4. Storage에서 `models`, `motions` 버킷 생성

### 3. Git 작업 플로우
```bash
# 현재 브랜치 확인
git branch  # kim 브랜치여야 함

# 변경사항 커밋
git add .
git commit -m "feat: 기능 설명"
git push origin kim

# Pull Request 생성 (main으로)
gh pr create --base main --head kim
```

### 4. TypeScript 타입 체크
```bash
cd client && npx tsc --noEmit
cd server && npx tsc --noEmit
```

### 5. 디버깅
- 프론트엔드: Chrome DevTools + React DevTools
- 백엔드: VS Code 디버거 또는 `console.log`
- Socket.io: Chrome 확장 프로그램 또는 Postman

---

## ⚠️ 주의사항

1. **환경 변수 관리**
   - `.env` 파일은 절대 커밋하지 않기
   - `.env.example`만 커밋
   - Vercel/Render 대시보드에서 환경 변수 설정

2. **Supabase RLS**
   - 모든 테이블에 RLS가 활성화되어 있음
   - 정책이 올바르게 설정되었는지 확인
   - `service_role` 키는 서버에서만 사용

3. **WebRTC**
   - 프로덕션에서는 HTTPS 필수
   - STUN/TURN 서버 설정 필요
   - 방화벽 문제 발생 시 TURN 서버 사용

4. **MediaPipe**
   - 카메라 권한 필요 (HTTPS 환경)
   - 모델 파일이 자동으로 CDN에서 로드됨
   - 성능을 위해 GPU 가속 권장

5. **3D 모델**
   - FBX 파일은 Three.js FBXLoader 필요
   - GLB/GLTF는 기본 지원
   - 대용량 파일은 압축 권장

---

## 📞 다음 작업 시작 방법

다음에 작업을 이어서 할 때:

1. **이 파일(PROGRESS.md) 확인** - 어디까지 했는지 파악
2. **다음 단계 선택** - "📋 다음 단계" 섹션에서 선택
3. **환경 확인** - Git 브랜치, 환경 변수, 서버 실행 상태
4. **작업 시작** - 파일 생성 및 코드 작성
5. **테스트** - 기능 동작 확인
6. **커밋** - Git 커밋 및 푸시
7. **PROGRESS.md 업데이트** - 완료한 작업 체크

---

## 🎯 현재 우선순위

**이미 완료된 핵심 기능:**
- ✅ 인증 시스템 (로그인/회원가입)
- ✅ React Router 및 레이아웃
- ✅ 3D 모델 뷰어 (Three.js + React Three Fiber)
- ✅ MediaPipe 실시간 포즈 감지
- ✅ 모션 리타게팅 시스템
- ✅ 비디오 피드 및 컨트롤

**다음에 할 작업 (추천):**
1. **3D 모델 업로드 및 관리** - Supabase Storage 연동
2. **모션 녹화 및 재생** - 타임라인 기반
3. **WebRTC 다중 카메라** - 모바일 연동
4. **모션 데이터 익스포트** - FBX/GLB 애니메이션
5. **Stripe 결제 통합** - 구독 플랜
6. **관리자 대시보드** - 사용자 관리
7. **배포** - Render.com + Vercel

## 🚀 주요 완성 기능

현재까지 구현된 모션 캡처 플랫폼의 핵심 기능:

1. **실시간 모션 캡처**
   - MediaPipe로 33개 포즈 랜드마크 감지
   - GPU 가속 처리
   - 30+ FPS 실시간 처리
   - 스켈레톤 오버레이 시각화

2. **3D 모델 뷰어**
   - React Three Fiber 기반
   - FBX/GLB/GLTF 지원
   - 인터랙티브 컨트롤
   - 다중 조명 시스템

3. **모션 리타게팅**
   - 2D 랜드마크 → 3D 본 회전 변환
   - 유연한 리그 지원
   - EMA 기반 스무딩
   - 실시간 적용

4. **스튜디오 인터페이스**
   - 3패널 레이아웃
   - 녹화 컨트롤
   - 카메라 관리
   - 상태 모니터링

이제 실제로 웹캠으로 모션을 캡처하고 3D 모델에 실시간으로 적용할 수 있는 기본 플랫폼이 완성되었습니다!

---

**작성일**: 2025-10-12
**작성자**: Claude Code
**GitHub**: https://github.com/kimkichan-1/motion (kim 브랜치)
