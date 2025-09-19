# 3D Motion Platform

웹 기반 3D 모션 캡처 및 적용 플랫폼입니다. 카메라나 웹캠으로 모션을 캡처하여 3D 모델에 적용할 수 있는 혁신적인 서비스입니다.

## 🎯 주요 기능

- **3D 모델 관리**: GLB, FBX, OBJ 등 다양한 3D 모델 형식 지원
- **모션 라이브러리**: 키워드 검색 및 카테고리별 모션 탐색
- **스마트 모션 캡처**: 웹캠/폰 카메라로 실시간 모션 캡처
- **AI 모션 분석**: MediaPipe/TensorFlow.js 기반 포즈 추정
- **실시간 3D 뷰어**: Three.js 기반 3D 모델 미리보기
- **모션 편집 도구**: 실시간 파라미터 조정 및 커스터마이징

## 🛠 기술 스택

### 프론트엔드
- **React 18** - UI 프레임워크
- **TypeScript** - 타입 안전성
- **Vite** - 빠른 번들링
- **Tailwind CSS** - 유틸리티 CSS 프레임워크
- **Three.js & React-Three-Fiber** - 3D 렌더링
- **React Router** - 클라이언트 사이드 라우팅

### 예정된 기술 스택
- **백엔드**: Spring Boot (Java)
- **데이터베이스**: MySQL
- **3D 처리**: Assimp-Java
- **모션 캡처**: MediaPipe Pose / TensorFlow.js
- **클라우드**: AWS/GCP
- **스토리지**: AWS S3

## 🚀 시작하기

### 필수 요구사항
- Node.js 18 이상
- npm 또는 yarn

### 설치 및 실행

1. **의존성 설치**
   ```bash
   npm install
   ```

2. **개발 서버 시작**
   ```bash
   npm run dev
   ```

3. **브라우저에서 확인**
   ```
   http://localhost:5173
   ```

### 사용 가능한 스크립트

```bash
npm run dev      # 개발 서버 시작
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
npm run lint     # ESLint 검사
```

## 📁 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── Layout.tsx      # 레이아웃 컴포넌트
│   └── Navbar.tsx      # 네비게이션 바
├── pages/              # 페이지 컴포넌트
│   ├── HomePage.tsx    # 메인 페이지
│   ├── ModelManagement.tsx  # 3D 모델 관리
│   ├── MotionLibrary.tsx    # 모션 라이브러리
│   ├── MotionCapture.tsx    # 모션 캡처
│   ├── Dashboard.tsx   # 사용자 대시보드
│   ├── Login.tsx       # 로그인
│   └── Register.tsx    # 회원가입
├── App.tsx             # 루트 컴포넌트
├── main.tsx           # 앱 진입점
└── index.css          # 전역 스타일
```

## 🎨 주요 페이지

### 1. 메인 페이지 (/)
- 서비스 소개 및 주요 기능 안내
- 단계별 워크플로우 설명
- 빠른 시작 가이드

### 2. 3D 모델 관리 (/models)
- 드래그 앤 드롭 파일 업로드
- 모델 목록 및 상태 관리
- 3D 뷰어 미리보기

### 3. 모션 라이브러리 (/motions)
- 키워드 검색 및 카테고리 필터링
- 모션 미리보기 및 상세 정보
- 즐겨찾기 및 다운로드

### 4. 모션 캡처 (/capture)
- 웹캠 실시간 캡처
- 단계별 진행 상황 표시
- AI 기반 모션 분석 및 적용

### 5. 대시보드 (/dashboard)
- 프로젝트 현황 및 통계
- 최근 활동 기록
- 빠른 작업 시작

## 🔧 개발 중인 기능

- [ ] Three.js 3D 뷰어 구현
- [ ] MediaPipe 포즈 추정 연동
- [ ] 백엔드 API 연동
- [ ] 실시간 모션 스트리밍
- [ ] 파일 업로드/다운로드
- [ ] 사용자 인증 시스템

## 📱 반응형 디자인

모든 페이지는 다양한 디바이스에서 최적화되어 있습니다:
- 📱 모바일 (320px+)
- 📟 태블릿 (768px+)
- 💻 데스크톱 (1024px+)

## 🎯 향후 계획

1. **Phase 1**: 기본 UI/UX 완성 ✅
2. **Phase 2**: 3D 뷰어 구현
3. **Phase 3**: 모션 캡처 기능
4. **Phase 4**: 백엔드 연동
5. **Phase 5**: AI 모션 분석

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 👥 팀

- **프론트엔드 개발**: React, 3D 뷰어 연동
- **백엔드 개발**: Spring Boot, 데이터베이스 관리
- **UI/UX 디자인**: 사용자 경험 최적화

## 🤝 기여하기

1. 이 저장소를 Fork 하세요
2. 새로운 브랜치를 생성하세요 (`git checkout -b feature/AmazingFeature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 Push 하세요 (`git push origin feature/AmazingFeature`)
5. Pull Request를 열어주세요

---

🎪 **3D Motion Platform** - 모션 캡처의 새로운 차원을 경험해보세요!