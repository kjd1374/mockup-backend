# 온라인 배포 가이드

이 프로젝트를 Railway를 사용하여 온라인에 배포하는 방법입니다.

## 🚀 Railway 배포 (권장)

Railway는 무료 티어를 제공하며, GitHub 연동으로 자동 배포가 가능합니다.

### 1. Railway 계정 생성 및 프로젝트 생성

1. https://railway.app 접속
2. GitHub로 로그인
3. "New Project" 클릭
4. "Deploy from GitHub repo" 선택
5. 이 저장소 선택

### 2. 환경 변수 설정

Railway 대시보드에서 다음 환경 변수를 설정하세요:

```
GOOGLE_API_KEY=AIzaSyAv5g9VVup8yqQtxA0-VFql1kEiIaBzsIM
MODEL_NAME=gemini-3-pro-image-preview
PORT=3001
DATABASE_URL=postgresql://... (Railway가 자동 생성)
NODE_ENV=production
```

### 3. PostgreSQL 데이터베이스 추가

1. Railway 대시보드에서 "New" → "Database" → "PostgreSQL" 선택
2. 생성된 데이터베이스의 `DATABASE_URL`을 환경 변수에 추가

### 4. Prisma 스키마 업데이트

PostgreSQL을 사용하도록 `prisma/schema.prisma`를 업데이트해야 합니다:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 5. 배포 후 초기화

배포 후 Railway 콘솔에서 다음 명령어 실행:

```bash
npm run db:generate
npm run db:push
```

## 📝 배포 전 체크리스트

- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] `uploads/` 디렉토리가 `.gitignore`에 포함되어 있는지 확인
- [ ] 환경 변수가 Railway에 설정되어 있는지 확인
- [ ] PostgreSQL 데이터베이스가 생성되었는지 확인
- [ ] Prisma 스키마가 PostgreSQL을 사용하도록 업데이트

## 🔧 로컬에서 PostgreSQL 테스트

배포 전 로컬에서 PostgreSQL로 테스트하려면:

1. PostgreSQL 설치 및 실행
2. `.env` 파일에 `DATABASE_URL` 추가:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/mockup"
   ```
3. `prisma/schema.prisma`에서 `provider = "postgresql"`로 변경
4. `npm run db:push` 실행

## 📦 파일 저장소

현재는 로컬 파일 시스템을 사용하지만, 프로덕션에서는 다음을 고려하세요:

- **Railway Volume**: Railway의 영구 볼륨 사용
- **AWS S3**: 더 안정적인 파일 저장
- **Google Cloud Storage**: Google 서비스와 통합

## 🌐 도메인 설정

Railway는 기본적으로 무료 도메인을 제공합니다:
- `your-project.railway.app`

커스텀 도메인도 설정할 수 있습니다.

