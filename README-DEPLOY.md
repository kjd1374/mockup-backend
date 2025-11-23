# 🌐 온라인 배포 가이드

이 프로젝트를 온라인에서 어디서나 접근 가능하게 만드는 방법입니다.

## 📋 배포 옵션

### 옵션 1: Railway (전체 스택) - **권장** ⭐

**장점:**
- 무료 티어 제공
- GitHub 자동 배포
- PostgreSQL 데이터베이스 포함
- 설정이 간단

**단점:**
- 무료 티어는 일정 기간 비활성 시 일시 중지됨

### 옵션 2: Vercel (프론트엔드) + Railway (백엔드)

**장점:**
- Vercel은 Next.js에 최적화
- 더 빠른 프론트엔드 배포
- 각각 독립적으로 스케일링 가능

**단점:**
- 두 서비스를 관리해야 함

## 🚀 Railway 배포 (전체 스택)

### 1. GitHub에 코드 푸시

```bash
# 변경사항 커밋
git add .
git commit -m "배포 준비 완료"
git push origin main
```

### 2. Railway 프로젝트 생성

1. https://railway.app 접속
2. "Start a New Project" 클릭
3. "Deploy from GitHub repo" 선택
4. GitHub 계정 연결
5. 이 저장소 선택

### 3. PostgreSQL 데이터베이스 추가

1. Railway 대시보드에서 "New" 버튼 클릭
2. "Database" → "Add PostgreSQL" 선택
3. 생성 완료 후 `DATABASE_URL` 복사

### 4. 환경 변수 설정

Railway 프로젝트의 "Variables" 탭에서 다음 추가:

```
GOOGLE_API_KEY=AIzaSyAv5g9VVup8yqQtxA0-VFql1kEiIaBzsIM
MODEL_NAME=gemini-3-pro-image-preview
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://... (PostgreSQL에서 자동 생성)
```

### 5. 배포 대기

Railway가 자동으로:
- 코드 빌드
- 의존성 설치
- Prisma 클라이언트 생성
- 서버 시작

### 6. 데이터베이스 초기화

배포 완료 후 Railway 콘솔에서:

```bash
npm run db:push
```

또는 Railway 대시보드의 "Deployments" → "View Logs"에서 확인

### 7. 도메인 확인

Railway가 자동으로 생성한 URL 확인:
- 예: `https://your-project.railway.app`

## 🎨 프론트엔드 배포 (Vercel)

### 1. Vercel 프로젝트 생성

1. https://vercel.com 접속
2. GitHub로 로그인
3. "Add New Project" 클릭
4. 저장소 선택
5. **중요**: "Root Directory"를 `frontend`로 설정
6. 환경 변수 추가:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api
   ```
   (Railway에서 받은 백엔드 URL 사용)
7. "Deploy" 클릭

### 2. 배포 완료

Vercel이 자동으로:
- Next.js 빌드
- 정적 파일 생성
- 배포 완료

### 3. 접속

Vercel이 생성한 URL로 접속:
- 예: `https://your-project.vercel.app`

## 🔄 업데이트 방법

코드를 수정한 후:

```bash
git add .
git commit -m "업데이트 내용"
git push origin main
```

Railway와 Vercel이 자동으로 재배포합니다.

## 📝 로컬 개발 환경 유지

로컬에서 SQLite를 계속 사용하려면:

```bash
# SQLite 스키마로 전환
cp prisma/schema.sqlite.prisma prisma/schema.prisma
# SQLite URL 설정
echo 'DATABASE_URL="file:./dev.db"' > .env.local
npm run db:push
```

## ⚠️ 주의사항

1. **파일 저장소**: Railway의 임시 파일 시스템을 사용합니다. 영구 저장이 필요하면 Railway Volume을 추가하세요.

2. **데이터베이스**: PostgreSQL은 무료 티어에서 제공되지만, 일정 기간 비활성 시 삭제될 수 있습니다.

3. **API URL**: 프론트엔드의 `NEXT_PUBLIC_API_URL`이 백엔드 URL과 일치하는지 확인하세요.

4. **환경 변수**: `.env` 파일은 Git에 커밋하지 마세요. Railway와 Vercel의 환경 변수 설정을 사용하세요.

## 🐛 문제 해결

### 데이터베이스 연결 오류
- `DATABASE_URL` 환경 변수 확인
- Railway PostgreSQL이 실행 중인지 확인

### 이미지 업로드 실패
- Railway Volume 추가 고려
- 파일 권한 확인

### 프론트엔드에서 API 호출 실패
- `NEXT_PUBLIC_API_URL` 환경 변수 확인
- CORS 설정 확인 (백엔드의 `cors()` 미들웨어)

## 💡 추가 팁

- **커스텀 도메인**: Railway와 Vercel 모두 커스텀 도메인 설정 가능
- **모니터링**: Railway 대시보드에서 로그 확인 가능
- **백업**: 정기적으로 데이터베이스 백업 권장

