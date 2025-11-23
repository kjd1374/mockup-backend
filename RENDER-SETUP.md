# 🆓 Render 무료 배포 가이드 (단계별)

## 📝 사전 준비

1. GitHub에 코드가 푸시되어 있어야 합니다
2. Render 계정이 필요합니다 (GitHub로 가입)

## 🗄️ 1단계: PostgreSQL 데이터베이스 생성

### 1.1 Render 대시보드 접속
- https://render.com 접속
- GitHub로 로그인

### 1.2 데이터베이스 생성
1. 우측 상단 "New +" 버튼 클릭
2. "PostgreSQL" 선택
3. 다음 정보 입력:
   ```
   Name: mockup-db
   Database: mockup
   User: mockup_user
   Region: Singapore (또는 가장 가까운 지역)
   PostgreSQL Version: 16 (최신)
   Plan: Free
   ```
4. "Create Database" 클릭
5. 생성 완료까지 1-2분 대기

### 1.3 데이터베이스 URL 복사
1. 생성된 데이터베이스 클릭
2. "Connections" 탭 클릭
3. **"Internal Database URL"** 복사 (중요!)
   - 형식: `postgresql://mockup_user:password@dpg-xxxxx-a.singapore-postgres.render.com/mockup`
   - 이 URL을 나중에 환경 변수에 사용합니다

## 🖥️ 2단계: 백엔드 웹 서비스 생성

### 2.1 웹 서비스 생성 시작
1. Render 대시보드에서 "New +" 클릭
2. "Web Service" 선택
3. "Connect GitHub" 클릭 (처음이면)
4. 저장소 선택 및 권한 부여

### 2.2 저장소 선택
- 저장소 목록에서 이 프로젝트 선택
- "Connect" 클릭

### 2.3 서비스 설정
다음 정보 입력:

```
Name: mockup-backend
Region: Singapore (데이터베이스와 같은 지역)
Branch: main
Root Directory: . (비워두기)
Runtime: Node
Build Command: npm install && npm run build:backend
Start Command: npm start
Plan: Free
```

### 2.4 환경 변수 설정
"Environment Variables" 섹션에서 다음 추가:

```
NODE_ENV = production
PORT = 3001
GOOGLE_API_KEY = AIzaSyAv5g9VVup8yqQtxA0-VFql1kEiIaBzsIM
MODEL_NAME = gemini-3-pro-image-preview
DATABASE_URL = <1.3에서 복사한 Internal Database URL>
```

### 2.5 배포 시작
1. "Create Web Service" 클릭
2. 배포 시작 (5-10분 소요)
3. 배포 완료 후 URL 확인:
   - 예: `https://mockup-backend.onrender.com`

### 2.6 데이터베이스 초기화
배포 완료 후:

1. Render 대시보드에서 생성된 서비스 클릭
2. "Shell" 탭 클릭
3. 다음 명령어 실행:
   ```bash
   npm run db:push
   ```
4. 성공 메시지 확인

## 🎨 3단계: Vercel에 프론트엔드 배포

### 3.1 Vercel 계정 생성
1. https://vercel.com 접속
2. GitHub로 로그인

### 3.2 프로젝트 생성
1. "Add New Project" 클릭
2. 저장소 선택
3. **중요 설정**:
   ```
   Framework Preset: Next.js
   Root Directory: frontend
   Build Command: (자동 감지됨)
   Output Directory: (자동 감지됨)
   Install Command: (자동 감지됨)
   ```

### 3.3 환경 변수 설정
"Environment Variables" 섹션에서 추가:

```
NEXT_PUBLIC_API_URL = https://mockup-backend.onrender.com/api
```
(실제 Render 백엔드 URL로 변경)

### 3.4 배포
1. "Deploy" 클릭
2. 배포 완료 (2-3분 소요)
3. 배포된 URL 확인:
   - 예: `https://your-project.vercel.app`

## 🔄 4단계: 서버 Sleep 방지 설정

Render 무료 티어는 15분 비활성 시 sleep됩니다. 이를 방지하려면:

### 방법 1: Uptime Robot (추천)

1. https://uptimerobot.com 접속
2. 무료 계정 생성
3. "Add New Monitor" 클릭
4. 설정:
   ```
   Monitor Type: HTTP(s)
   Friendly Name: Mockup Backend Keep-Alive
   URL: https://mockup-backend.onrender.com/api/health
   Monitoring Interval: 5 minutes
   ```
5. "Create Monitor" 클릭

이제 5분마다 자동으로 서버에 요청이 가서 sleep되지 않습니다.

### 방법 2: GitHub Actions (대안)

`.github/workflows/keep-alive.yml` 파일이 이미 생성되어 있습니다.

1. GitHub 저장소의 "Settings" → "Secrets and variables" → "Actions" 이동
2. "New repository secret" 클릭
3. 추가:
   ```
   Name: RENDER_BACKEND_URL
   Value: https://mockup-backend.onrender.com
   ```
4. GitHub Actions가 자동으로 10분마다 실행됩니다

## ✅ 완료 확인

1. 프론트엔드 URL 접속: `https://your-project.vercel.app`
2. 백엔드 Health Check: `https://mockup-backend.onrender.com/api/health`
3. 정상 작동 확인

## 🔄 업데이트 방법

코드를 수정한 후:

```bash
git add .
git commit -m "업데이트 내용"
git push origin main
```

Render와 Vercel이 자동으로 재배포합니다.

## 🐛 문제 해결

### 서버가 느림
- 첫 요청 시 sleep에서 깨어나는데 30초-1분 소요
- Uptime Robot 설정으로 해결

### 데이터베이스 연결 오류
- `DATABASE_URL`이 `Internal Database URL`인지 확인
- Render PostgreSQL이 실행 중인지 확인

### 프론트엔드에서 API 호출 실패
- `NEXT_PUBLIC_API_URL`이 올바른지 확인
- CORS 에러인 경우 백엔드의 `cors()` 미들웨어 확인

## 💰 비용

**완전 무료!**
- Render: 무료 티어 (월 750시간)
- Vercel: 무료 티어 (무제한)
- PostgreSQL: 무료 티어
- Uptime Robot: 무료 티어 (50개 모니터)

