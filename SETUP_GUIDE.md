# Motion Capture Platform - Setup Guide

이 가이드는 프로젝트를 로컬 환경에서 실행하고 배포하는 방법을 안내합니다.

## 📋 사전 요구사항

- Node.js 18 이상
- npm 또는 yarn
- Git
- Supabase 계정
- Stripe 계정 (결제 기능용)
- Render.com 계정 (배포용)

## 🚀 로컬 개발 환경 설정

### 1. 저장소 클론

```bash
git clone https://github.com/kimkichan-1/motion.git
cd motion
git checkout kim
```

### 2. 의존성 설치

```bash
# 루트 디렉토리에서
npm install

# 클라이언트 의존성
cd client
npm install

# 서버 의존성
cd ../server
npm install
```

### 3. Supabase 설정

#### 3.1 Supabase 프로젝트 생성
1. [Supabase](https://supabase.com)에 로그인
2. "New Project" 클릭
3. 프로젝트 이름, 데이터베이스 비밀번호 설정
4. 리전 선택 후 프로젝트 생성

#### 3.2 데이터베이스 스키마 적용
1. Supabase 대시보드 → SQL Editor
2. `supabase_schema.sql` 파일 내용 복사
3. SQL Editor에 붙여넣고 실행
4. 모든 테이블과 함수가 생성되었는지 확인

#### 3.3 Storage 버킷 생성
1. Supabase 대시보드 → Storage
2. 두 개의 버킷 생성:
   - `models` (private) - 3D 모델 파일용
   - `motions` (private) - 모션 데이터 파일용

#### 3.4 Storage 정책 설정
각 버킷에 다음 정책 추가:

**models 버킷:**
```sql
-- SELECT policy
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
USING (bucket_id = 'models' AND auth.uid() = owner);

-- INSERT policy
CREATE POLICY "Users can upload files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'models' AND auth.uid() = owner);

-- DELETE policy
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (bucket_id = 'models' AND auth.uid() = owner);
```

**motions 버킷도 동일하게 설정**

#### 3.5 환경 변수 가져오기
1. Supabase 대시보드 → Settings → API
2. Project URL과 anon public key 복사

### 4. Stripe 설정

1. [Stripe Dashboard](https://dashboard.stripe.com)에 로그인
2. Developers → API keys에서 키 복사
3. Products 메뉴에서 구독 상품 생성:
   - **Basic Plan**: 월 $9.99
   - **Pro Plan**: 월 $29.99
4. 각 상품의 Price ID 복사

### 5. 환경 변수 설정

#### 클라이언트 (.env)
```bash
cd client
cp .env.example .env
```

`.env` 파일 편집:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:3001
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

#### 서버 (.env)
```bash
cd server
cp .env.example .env
```

`.env` 파일 편집:
```env
PORT=3001
NODE_ENV=development

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

CLIENT_URL=http://localhost:5173
STUN_SERVER=stun:stun.l.google.com:19302
```

### 6. 개발 서버 실행

#### 방법 1: 동시 실행 (추천)
```bash
# 루트 디렉토리에서
npm run dev
```

#### 방법 2: 개별 실행
```bash
# 터미널 1 - 클라이언트
cd client
npm run dev

# 터미널 2 - 서버
cd server
npm run dev
```

브라우저에서 http://localhost:5173 접속

## 🌐 배포하기

### Render.com (백엔드)

#### 1. Render.com 설정
1. [Render.com](https://render.com) 로그인
2. "New +" → "Web Service" 클릭
3. GitHub 저장소 연결
4. 다음 설정 입력:
   - **Name**: motion-capture-api
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

#### 2. 환경 변수 설정
Render 대시보드에서 환경 변수 추가:
```
PORT=3001
NODE_ENV=production
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-service-key
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-webhook-secret
CLIENT_URL=https://your-frontend-url.vercel.app
```

#### 3. 배포
- 자동 배포: kim 브랜치에 푸시하면 자동 배포
- 수동 배포: Render 대시보드에서 "Manual Deploy" 클릭

### Vercel (프론트엔드)

#### 1. Vercel 프로젝트 생성
```bash
cd client
npm install -g vercel
vercel
```

#### 2. 환경 변수 설정
Vercel 대시보드 → Settings → Environment Variables:
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=https://your-render-url.onrender.com
VITE_STRIPE_PUBLISHABLE_KEY=your-publishable-key
```

#### 3. 배포
```bash
vercel --prod
```

### Stripe Webhook 설정

1. Stripe Dashboard → Developers → Webhooks
2. "Add endpoint" 클릭
3. Endpoint URL: `https://your-render-url.onrender.com/webhooks/stripe`
4. 이벤트 선택:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Webhook signing secret 복사하여 환경 변수에 추가

## 🔧 추가 설정

### MediaPipe 모델 파일
MediaPipe는 자동으로 필요한 모델을 CDN에서 로드합니다. 별도 설정이 필요하지 않습니다.

### CORS 설정
프로덕션 환경에서는 서버의 CORS 설정을 프론트엔드 도메인으로 업데이트하세요:

```typescript
// server/src/index.ts
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
```

## 📱 모바일 연동 테스트

1. 데스크톱에서 애플리케이션 실행
2. 모바일 기기가 같은 WiFi 네트워크에 연결되어 있는지 확인
3. 모바일 브라우저에서 Room ID 입력
4. 카메라 권한 허용
5. 다중 카메라 동기화 테스트

## 🐛 문제 해결

### 포트 충돌
```bash
# 3001 포트가 사용 중인 경우
lsof -ti:3001 | xargs kill -9
```

### Supabase 연결 오류
- API URL과 키가 올바른지 확인
- Row Level Security 정책이 올바르게 설정되었는지 확인

### WebRTC 연결 실패
- 방화벽 설정 확인
- STUN/TURN 서버 설정 확인
- HTTPS 사용 확인 (프로덕션)

### MediaPipe 로딩 실패
- 브라우저가 최신 버전인지 확인
- HTTPS 사용 확인 (카메라 접근 필요)
- CORS 헤더 확인

## 📚 다음 단계

이제 기본 설정이 완료되었습니다. 다음 단계로:

1. **회원가입/로그인 UI 구현** - 인증 페이지 생성
2. **3D 모델 뷰어 구현** - Three.js 컴포넌트 개발
3. **모션 캡처 통합** - MediaPipe 연동
4. **실시간 모션 적용** - Kalidokit으로 리타게팅
5. **모바일 연동** - WebRTC 시그널링 구현
6. **결제 시스템** - Stripe 체크아웃 통합
7. **관리자 대시보드** - 사용자 관리 기능

자세한 구현 가이드는 각 기능별 문서를 참고하세요.

## 💡 유용한 명령어

```bash
# 전체 프로젝트 빌드
npm run build

# 클라이언트만 빌드
cd client && npm run build

# 서버만 빌드
cd server && npm run build

# 타입 체크
cd client && npx tsc --noEmit
cd server && npx tsc --noEmit

# 린트
cd client && npm run lint
```

## 📞 지원

문제가 발생하면 GitHub Issues에 등록해주세요:
https://github.com/kimkichan-1/motion/issues
