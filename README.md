# Real-Time Motion Capture Web Platform

실시간 모션 캡처 기능을 가진 풀스택 웹 애플리케이션입니다. MediaPipe를 사용하여 웹캠으로 실시간 모션 캡처를 수행하고, 3D 모델에 적용할 수 있습니다.

## 주요 기능

- ✅ **사용자 인증**: Supabase 기반 회원가입/로그인
- ✅ **3D 모델 업로드**: FBX, GLB, GLTF 파일 지원
- 🚧 **실시간 모션 캡처**: MediaPipe를 사용한 포즈 추적
- 🚧 **멀티 카메라 동기화**: 노트북 + 모바일 카메라 동시 사용
- 🚧 **녹화 및 내보내기**: 모션 데이터를 다양한 형식으로 저장
- 🚧 **구독 결제**: Stripe 통합 (미구현)
- 🚧 **관리자 대시보드**: 사용자 및 시스템 관리 (미구현)

## 기술 스택

### Frontend
- **React 18** + **TypeScript**
- **Vite** - 빌드 도구
- **Three.js** / **React Three Fiber** - 3D 렌더링
- **MediaPipe** - 모션 캡처
- **Zustand** - 상태 관리
- **TailwindCSS** - 스타일링
- **Socket.io Client** - 실시간 통신

### Backend
- **Node.js** + **Express**
- **Socket.io** - WebRTC 시그널링 및 실시간 통신
- **TypeScript**

### Database & Auth
- **Supabase** - PostgreSQL 데이터베이스 및 인증
- **Supabase Storage** - 파일 저장소

### Deployment
- **Render.com** - 백엔드 호스팅
- **Vercel/Netlify** (추천) - 프론트엔드 호스팅

## 프로젝트 구조

```
test1/
├── client/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/    # React 컴포넌트
│   │   │   ├── auth/     # 인증 관련 컴포넌트
│   │   │   ├── layout/   # 레이아웃 컴포넌트
│   │   │   └── viewer/   # 3D 뷰어 컴포넌트
│   │   ├── pages/        # 페이지 컴포넌트
│   │   │   ├── auth/     # 로그인/회원가입
│   │   │   └── capture/  # 캡처 페이지
│   │   ├── store/        # Zustand 스토어
│   │   ├── hooks/        # 커스텀 훅
│   │   ├── lib/          # 라이브러리 설정
│   │   ├── types/        # TypeScript 타입
│   │   └── utils/        # 유틸리티 함수
│   └── package.json
├── server/                # Node.js 백엔드
│   ├── src/
│   │   ├── socket/       # Socket.io 핸들러
│   │   └── index.ts      # 서버 엔트리포인트
│   └── package.json
├── supabase_schema.sql    # 데이터베이스 스키마
└── README.md
```

## 설치 및 실행

### 1. 저장소 클론

```bash
git clone https://github.com/kimkichan-1/motion.git
cd motion
git checkout kim
```

### 2. Supabase 설정

1. [Supabase](https://supabase.com)에 로그인
2. 프로젝트의 SQL 에디터에서 `supabase_schema.sql` 파일의 내용을 실행
3. Storage 버킷이 자동으로 생성되었는지 확인

### 3. 환경 변수 설정

**클라이언트** (`client/.env`):
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SERVER_URL=http://localhost:3001
```

**서버** (`server/.env`):
```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
STRIPE_SECRET_KEY=your_stripe_key (optional)
```

### 4. 의존성 설치 및 실행

**서버 실행:**
```bash
cd server
npm install
npm run dev
```

**클라이언트 실행:**
```bash
cd client
npm install
npm run dev
```

클라이언트는 기본적으로 `http://localhost:5173`에서 실행됩니다.

## 다음 단계 (구현 필요)

### MediaPipe 통합
- [ ] `useMediaPipe` 커스텀 훅 구현
- [ ] 웹캠 피드 캡처 및 MediaPipe Pose 적용
- [ ] 실시간 포즈 데이터 추출

### 3D 모델 뷰어
- [ ] Three.js/React Three Fiber로 3D 뷰어 구현
- [ ] FBX/GLB 모델 로더 구현
- [ ] 모션 리타게팅 (모션 데이터를 모델에 적용)

### 멀티 카메라 동기화
- [ ] 모바일 페이지 구현
- [ ] WebRTC 비디오 스트리밍 구현
- [ ] 여러 카메라의 포즈 데이터 병합

### 모션 녹화 및 내보내기
- [ ] 프레임 단위 포즈 데이터 저장
- [ ] BVH/FBX 형식으로 내보내기 구현
- [ ] 타임라인 UI 구현

### 구독 결제
- [ ] Stripe Checkout 통합
- [ ] 무료/프로/엔터프라이즈 티어 구현
- [ ] 사용량 제한 구현

### 관리자 대시보드
- [ ] 사용자 목록 및 관리
- [ ] 사용량 통계 대시보드
- [ ] 시스템 모니터링

### 배포
- [ ] Render.com에 백엔드 배포
- [ ] 프론트엔드 배포 (Vercel/Netlify)
- [ ] 환경 변수 설정
- [ ] 도메인 연결

## 참고 라이브러리

- [MediaPipe Pose](https://google.github.io/mediapipe/solutions/pose)
- [Three.js](https://threejs.org/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [Supabase Docs](https://supabase.com/docs)
- [Socket.io](https://socket.io/)
- [Zustand](https://zustand-demo.pmnd.rs/)

## 라이선스

MIT

## 기여

이슈와 PR은 언제나 환영합니다!
