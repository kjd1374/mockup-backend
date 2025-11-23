# Railway 배포 가이드

## 🚀 빠른 시작

### 1단계: GitHub에 코드 푸시

```bash
git add .
git commit -m "Railway 배포 준비"
git push origin main
```

### 2단계: Railway 프로젝트 생성

1. https://railway.app 접속
2. "Start a New Project" 클릭
3. "Deploy from GitHub repo" 선택
4. GitHub 계정 연결 및 저장소 선택

### 3단계: PostgreSQL 데이터베이스 추가

1. Railway 대시보드에서 "New" 버튼 클릭
2. "Database" → "Add PostgreSQL" 선택
3. 생성된 데이터베이스의 `DATABASE_URL` 복사

### 4단계: 환경 변수 설정

Railway 프로젝트의 "Variables" 탭에서 다음 환경 변수 추가:

```
GOOGLE_API_KEY=AIzaSyAv5g9VVup8yqQtxA0-VFql1kEiIaBzsIM
MODEL_NAME=gemini-3-pro-image-preview
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://... (PostgreSQL에서 자동 생성됨)
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api
```

**중요**: `NEXT_PUBLIC_API_URL`은 백엔드가 배포된 후 실제 URL로 변경해야 합니다.

### 5단계: 배포 후 데이터베이스 초기화

배포가 완료되면 Railway 콘솔에서 다음 명령어 실행:

```bash
npm run db:push
```

또는 Railway 대시보드의 "Deployments" → "View Logs"에서 확인할 수 있습니다.

### 6단계: 프론트엔드 배포 (Vercel 권장)

프론트엔드는 Vercel에 별도로 배포하는 것이 더 간단합니다:

1. https://vercel.com 접속
2. GitHub로 로그인
3. "Add New Project" 클릭
4. 저장소 선택
5. "Root Directory"를 `frontend`로 설정
6. 환경 변수 추가:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api
   ```
7. "Deploy" 클릭

## 🔄 업데이트 배포

코드를 수정한 후:

```bash
git add .
git commit -m "업데이트 내용"
git push origin main
```

Railway와 Vercel이 자동으로 재배포합니다.

## 📝 주의사항

1. **파일 저장소**: 현재는 Railway의 임시 파일 시스템을 사용합니다. 영구 저장이 필요하면 Railway Volume을 추가하세요.

2. **데이터베이스**: PostgreSQL은 Railway의 무료 티어에서 제공되지만, 일정 기간 비활성 시 삭제될 수 있습니다.

3. **API URL**: 프론트엔드의 `NEXT_PUBLIC_API_URL`이 백엔드 URL과 일치하는지 확인하세요.

## 🐛 문제 해결

### 데이터베이스 연결 오류
- `DATABASE_URL`이 올바른지 확인
- Railway PostgreSQL이 실행 중인지 확인

### 이미지 업로드 실패
- Railway Volume이 마운트되어 있는지 확인
- 파일 권한 확인

### 프론트엔드에서 API 호출 실패
- `NEXT_PUBLIC_API_URL` 환경 변수 확인
- CORS 설정 확인 (백엔드의 `cors()` 미들웨어)

