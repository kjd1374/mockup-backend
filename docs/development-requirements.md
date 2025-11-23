# 아크릴 응원봉 시안 자동 생성 서비스 - 개발 환경 요구사항

## 📋 프로젝트 개요

아크릴 응원봉의 기본형과 레퍼런스를 등록하고, 로고/이미지/텍스트를 입력받아 AI로 시안을 자동 생성하는 서비스입니다.

## 🛠️ 필요한 개발 환경 및 기술 스택

### 1. **백엔드 서버 (필수)**

#### 1.1 웹 프레임워크
- **Express.js** 또는 **Fastify** (Node.js 기반)
- RESTful API 또는 GraphQL API 제공
- 이미지 업로드 처리 (multipart/form-data)
- API 엔드포인트 관리

#### 1.2 데이터베이스 (필수)
**옵션 1: SQL 데이터베이스 (권장)**
- **PostgreSQL** 또는 **MySQL**
- 기본형, 레퍼런스, 시안 정보 저장
- 관계형 데이터 관리

**옵션 2: NoSQL 데이터베이스**
- **MongoDB** 또는 **Prisma + SQLite** (개발용)
- 유연한 스키마 관리

**데이터베이스 스키마 예시:**
```
- 기본형 (BaseProduct)
  - id, name, description, image_path, created_at
  
- 레퍼런스 (Reference)
  - id, base_product_id, image_path, description, created_at
  
- 시안 (Design)
  - id, base_product_id, logo_path, images[], text, 
    generated_image_path, status, created_at
```

#### 1.3 ORM/데이터베이스 도구
- **Prisma** (TypeScript 친화적, 권장)
- 또는 **TypeORM**, **Sequelize**

#### 1.4 파일 저장소 (필수)
**옵션 1: 로컬 파일 시스템 (개발용)**
- `uploads/` 디렉토리에 이미지 저장
- 간단하지만 확장성 낮음

**옵션 2: 클라우드 스토리지 (프로덕션 권장)**
- **AWS S3**
- **Google Cloud Storage**
- **Cloudinary** (이미지 최적화 포함)
- **Azure Blob Storage**

#### 1.5 이미지 업로드 처리
- **Multer** (Express용)
- 또는 **@fastify/multipart** (Fastify용)
- 파일 크기 제한 설정 (예: 10MB)
- 이미지 형식 검증 (PNG, JPG, WEBP 등)

### 2. **AI 서비스 연동 (이미 구축됨)**

- ✅ Google Gemini API (`gemini-3-pro-image-preview`)
- ✅ 이미지 입력/출력 지원
- ✅ API 키 설정 완료

### 3. **프론트엔드 (선택사항, 권장)**

#### 3.1 웹 인터페이스
- **React** + **TypeScript**
- 또는 **Next.js** (풀스택 프레임워크)
- 또는 **Vue.js**, **Svelte**

#### 3.2 UI 라이브러리
- **Tailwind CSS** (스타일링)
- **shadcn/ui** 또는 **Material-UI** (컴포넌트)

#### 3.3 이미지 업로드 UI
- 드래그 앤 드롭 파일 업로드
- 이미지 미리보기
- 진행률 표시

### 4. **개발 도구**

#### 4.1 패키지 관리
- **npm** 또는 **yarn** 또는 **pnpm**

#### 4.2 환경 변수 관리
- **dotenv** (이미 설치됨)
- `.env` 파일로 API 키, DB 연결 정보 관리

#### 4.3 타입 안정성
- **TypeScript** (이미 설정됨)

#### 4.4 코드 품질
- **ESLint** (코드 린팅)
- **Prettier** (코드 포맷팅)

### 5. **추가 라이브러리**

#### 5.1 이미지 처리
- **sharp** (이미지 리사이징, 최적화)
- 또는 **jimp** (경량 대안)

#### 5.2 유효성 검증
- **Zod** (TypeScript 스키마 검증)
- 또는 **Joi**, **class-validator**

#### 5.3 에러 처리
- **winston** 또는 **pino** (로깅)

### 6. **인프라 (프로덕션)**

#### 6.1 서버
- **Node.js 18+** (LTS 버전)
- **PM2** (프로세스 관리)
- 또는 **Docker** + **Docker Compose**

#### 6.2 배포
- **Vercel**, **Netlify** (서버리스)
- **AWS EC2**, **Google Cloud Run**
- **Heroku**, **Railway**

#### 6.3 모니터링
- **Sentry** (에러 추적)
- **LogRocket** (사용자 세션)

## 📦 최소 필수 패키지 목록

```json
{
  "dependencies": {
    "@google/generative-ai": "^0.21.0",
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1",
    "prisma": "^5.7.0",
    "@prisma/client": "^5.7.0",
    "dotenv": "^16.4.5",
    "zod": "^3.22.4",
    "sharp": "^0.33.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.11.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

## 🏗️ 권장 프로젝트 구조

```
mockup/
├── prisma/
│   └── schema.prisma          # 데이터베이스 스키마
├── src/
│   ├── config/
│   │   └── config.ts          # 설정 파일
│   ├── controllers/           # API 컨트롤러
│   │   ├── base-product.controller.ts
│   │   ├── reference.controller.ts
│   │   └── design.controller.ts
│   ├── services/              # 비즈니스 로직
│   │   ├── gemini-service.ts
│   │   ├── base-product.service.ts
│   │   ├── reference.service.ts
│   │   └── design.service.ts
│   ├── models/                # 데이터 모델
│   │   └── (Prisma가 자동 생성)
│   ├── routes/                # API 라우트
│   │   ├── base-product.routes.ts
│   │   ├── reference.routes.ts
│   │   └── design.routes.ts
│   ├── middleware/            # 미들웨어
│   │   ├── upload.middleware.ts
│   │   └── validation.middleware.ts
│   ├── utils/                 # 유틸리티
│   │   └── file-utils.ts
│   └── index.ts               # 서버 진입점
├── uploads/                   # 업로드된 파일 저장소
│   ├── base-products/
│   ├── references/
│   ├── logos/
│   └── generated/
├── config/
│   └── model-info.json
├── package.json
├── tsconfig.json
└── .env
```

## 🔄 주요 기능 흐름

### 1. 기본형 등록
```
사용자 → API 요청 (이미지 + 설명) 
     → 파일 저장 (uploads/base-products/)
     → DB 저장
     → 응답
```

### 2. 레퍼런스 등록
```
사용자 → API 요청 (기본형 ID + 이미지 + 설명)
     → 파일 저장 (uploads/references/)
     → DB 저장
     → 응답
```

### 3. 시안 생성
```
사용자 → API 요청 (기본형 ID + 로고 + 이미지 + 텍스트)
     → 기본형 정보 조회 (DB)
     → 레퍼런스 이미지 조회 (DB)
     → 모든 이미지 + 프롬프트 → Gemini API
     → 생성된 이미지 저장 (uploads/generated/)
     → DB 저장
     → 응답
```

## 🚀 개발 단계별 우선순위

### Phase 1: 기본 인프라 (필수)
1. ✅ TypeScript 프로젝트 설정
2. ✅ Gemini API 연동
3. ⬜ Express 서버 설정
4. ⬜ 데이터베이스 설정 (Prisma + SQLite/PostgreSQL)
5. ⬜ 파일 업로드 기능

### Phase 2: 핵심 기능
1. ⬜ 기본형 등록 API
2. ⬜ 레퍼런스 등록 API
3. ⬜ 시안 생성 API (AI 연동)

### Phase 3: 개선
1. ⬜ 이미지 최적화
2. ⬜ 에러 처리 및 로깅
3. ⬜ API 문서화 (Swagger)

### Phase 4: 프론트엔드 (선택)
1. ⬜ 관리자 대시보드
2. ⬜ 시안 생성 UI

## 💡 개발 환경 선택 가이드

### 소규모 프로젝트 (개인/스타트업)
- **데이터베이스**: SQLite (개발) → PostgreSQL (프로덕션)
- **파일 저장**: 로컬 파일 시스템 → Cloudinary
- **배포**: Vercel 또는 Railway

### 중규모 프로젝트
- **데이터베이스**: PostgreSQL
- **파일 저장**: AWS S3 또는 Google Cloud Storage
- **배포**: AWS EC2 또는 Google Cloud Run

### 대규모 프로젝트
- **데이터베이스**: PostgreSQL (읽기 복제본)
- **파일 저장**: AWS S3 + CloudFront (CDN)
- **배포**: Kubernetes 또는 AWS ECS

## ⚠️ 주의사항

1. **이미지 크기 제한**: Gemini API 토큰 한도 고려 (65,536 입력 토큰)
2. **파일 보안**: 업로드 파일 검증 필수 (파일 타입, 크기)
3. **API 키 보안**: 환경 변수로 관리, Git에 커밋 금지
4. **비용 관리**: Gemini API 사용량 모니터링
5. **데이터 백업**: 정기적인 데이터베이스 백업

