# Motion Capture Web Platform

실시간 모션 캡처 및 3D 모델 애니메이션 웹 플랫폼

## 주요 기능

1. **3D 모델 업로드 및 실시간 모션 캡처**
   - FBX/GLB 파일 업로드
   - 웹캠을 통한 실시간 모션 캡처
   - MediaPipe + Kalidokit을 통한 고정밀 모션 트래킹

2. **모션 녹화 및 저장**
   - 모션 데이터 녹화
   - FBX/GLB 파일에 애니메이션 추가
   - 모션 데이터 내보내기

3. **다중 카메라 동기화**
   - 노트북 웹캠 (정면)
   - 모바일 카메라 연동 (후면)
   - WebRTC 기반 실시간 동기화

4. **구독 기반 서비스**
   - 회원가입/로그인 (Supabase Auth)
   - Stripe 결제 통합
   - 무료 체험 기능

5. **관리자 대시보드**
   - 회원 관리
   - 구독 현황 모니터링
   - 시스템 관리

## 기술 스택

### Frontend
- React 18 + Vite + TypeScript
- React Three Fiber + @react-three/drei
- MediaPipe Tasks Vision
- Kalidokit (모션 리타게팅)
- Zustand (상태 관리)
- TailwindCSS + shadcn/ui
- Socket.io-client

### Backend
- Node.js + Express + TypeScript
- Socket.io (WebRTC 시그널링)
- Supabase Client
- Stripe SDK
- @gltf-transform/core

### Infrastructure
- Supabase (PostgreSQL + Auth + Storage)
- Render.com (백엔드)
- Vercel (프론트엔드)

## 프로젝트 구조

```
motion-capture/
├── client/              # React 프론트엔드
│   ├── src/
│   │   ├── components/  # React 컴포넌트
│   │   ├── features/    # 기능별 모듈
│   │   ├── hooks/       # 커스텀 훅
│   │   ├── lib/         # 유틸리티
│   │   ├── pages/       # 페이지 컴포넌트
│   │   └── store/       # Zustand 스토어
│   └── package.json
├── server/              # Node.js 백엔드
│   ├── src/
│   │   ├── controllers/ # 컨트롤러
│   │   ├── routes/      # API 라우트
│   │   ├── services/    # 비즈니스 로직
│   │   ├── socket/      # Socket.io 핸들러
│   │   └── types/       # TypeScript 타입
│   └── package.json
├── shared/              # 공유 타입 및 유틸리티
└── README.md
```

## 개발 시작하기

### 필수 요구사항
- Node.js 18+
- npm 또는 yarn
- Supabase 계정
- Stripe 계정

### 설치 및 실행

1. 의존성 설치
```bash
# 클라이언트
cd client
npm install

# 서버
cd server
npm install
```

2. 환경 변수 설정
```bash
# client/.env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3001

# server/.env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
STRIPE_SECRET_KEY=your_stripe_secret_key
PORT=3001
```

3. 개발 서버 실행
```bash
# 클라이언트 (port 5173)
cd client
npm run dev

# 서버 (port 3001)
cd server
npm run dev
```

## 배포

### 프론트엔드 (Vercel)
```bash
cd client
vercel
```

### 백엔드 (Render.com)
- GitHub 연동 후 자동 배포

## 라이선스
MIT
