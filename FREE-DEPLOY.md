# 🆓 완전 무료 배포 가이드

GitHub와 Google Drive만 사용하여 완전 무료로 배포하는 방법입니다.

## 🎯 배포 구조

- **프론트엔드**: Vercel (무료, Next.js 최적화)
- **백엔드**: Render (무료 티어)
- **데이터베이스**: Render PostgreSQL (무료 티어)
- **파일 저장**: Render의 파일 시스템 (또는 Google Drive API 연동 가능)

## 📋 1단계: Render에 백엔드 배포

### 1.1 Render 계정 생성
1. https://render.com 접속
2. GitHub로 로그인
3. 무료 계정 생성

### 1.2 PostgreSQL 데이터베이스 생성
1. Render 대시보드에서 "New +" 클릭
2. "PostgreSQL" 선택
3. 설정:
   - Name: `mockup-db`
   - Database: `mockup`
   - User: `mockup_user`
   - Region: 가장 가까운 지역 선택
   - Plan: **Free** 선택
4. "Create Database" 클릭
5. 생성 후 "Connections" 탭에서 `Internal Database URL` 복사

### 1.3 백엔드 서비스 생성
1. Render 대시보드에서 "New +" 클릭
2. "Web Service" 선택
3. GitHub 저장소 연결
4. 설정:
   - Name: `mockup-backend`
   - Region: 데이터베이스와 같은 지역
   - Branch: `main`
   - Root Directory: `.` (루트)
   - Runtime: `Node`
   - Build Command: `npm install && npm run build:backend`
   - Start Command: `npm start`
   - Plan: **Free** 선택

### 1.4 환경 변수 설정
Render 대시보드의 "Environment" 섹션에서 추가:

```
NODE_ENV=production
PORT=3001
GOOGLE_API_KEY=AIzaSyAv5g9VVup8yqQtxA0-VFql1kEiIaBzsIM
MODEL_NAME=gemini-3-pro-image-preview
DATABASE_URL=<PostgreSQL에서 복사한 Internal Database URL>
```

### 1.5 배포 및 데이터베이스 초기화
1. "Create Web Service" 클릭하여 배포 시작
2. 배포 완료 후 "Shell" 탭에서 다음 명령어 실행:
   ```bash
   npm run db:push
   ```

## 📋 2단계: Vercel에 프론트엔드 배포

### 2.1 Vercel 프로젝트 생성
1. https://vercel.com 접속
2. GitHub로 로그인
3. "Add New Project" 클릭
4. 저장소 선택
5. 설정:
   - Framework Preset: **Next.js**
   - Root Directory: `frontend`
   - Build Command: `npm run build` (자동 감지됨)
   - Output Directory: `.next` (자동 감지됨)
   - Install Command: `npm install` (자동 감지됨)

### 2.2 환경 변수 설정
Vercel 프로젝트의 "Settings" → "Environment Variables"에서 추가:

```
NEXT_PUBLIC_API_URL=https://mockup-backend.onrender.com/api
```

(실제 Render 백엔드 URL로 변경)

### 2.3 배포
"Deploy" 클릭하여 배포 시작

## 🔄 업데이트 방법

코드를 수정한 후:

```bash
git add .
git commit -m "업데이트 내용"
git push origin main
```

Render와 Vercel이 자동으로 재배포합니다.

## ⚠️ 무료 티어 제한사항

### Render (백엔드)
- **15분간 비활성 시 자동 sleep**: 첫 요청 시 깨어나는데 약 30초 소요
- **월 750시간 무료**: 충분히 사용 가능
- **PostgreSQL**: 90일 비활성 시 삭제 가능 (정기적으로 접속하면 문제 없음)

### Vercel (프론트엔드)
- **무제한 배포**: 제한 없음
- **빠른 속도**: CDN 사용
- **자동 HTTPS**: SSL 인증서 자동 제공

## 💡 Render Sleep 문제 해결

Render의 무료 티어는 15분 비활성 시 sleep됩니다. 이를 방지하려면:

### 방법 1: Uptime Robot (무료)
1. https://uptimerobot.com 접속
2. 무료 계정 생성
3. "Add New Monitor" 클릭
4. 설정:
   - Monitor Type: **HTTP(s)**
   - Friendly Name: `Mockup Backend`
   - URL: `https://mockup-backend.onrender.com/api/health`
   - Monitoring Interval: **5 minutes**
5. "Create Monitor" 클릭

이렇게 하면 5분마다 헬스 체크 요청이 가서 서버가 sleep되지 않습니다.

### 방법 2: Cron Job (Render 내장)
Render의 "Cron Jobs" 기능 사용 (유료 플랜 필요)

## 📁 파일 저장소 옵션

### 옵션 1: Render 파일 시스템 (기본)
- 현재 설정으로 작동
- 서버 재시작 시 파일 유지됨
- 하지만 서버 재배포 시 파일 삭제될 수 있음

### 옵션 2: Google Drive API (선택사항)
Google Drive를 파일 저장소로 사용하려면 추가 개발 필요:
- Google Drive API 키 발급
- 파일 업로드/다운로드 로직 추가
- 더 복잡하지만 영구 저장 가능

## 🐛 문제 해결

### Render 서버가 느림
- 첫 요청 시 sleep에서 깨어나는데 시간 소요
- Uptime Robot으로 해결 가능

### 데이터베이스 연결 오류
- `DATABASE_URL`이 올바른지 확인
- Render PostgreSQL의 `Internal Database URL` 사용 (외부 URL 아님)

### 프론트엔드에서 API 호출 실패
- `NEXT_PUBLIC_API_URL` 확인
- CORS 설정 확인 (백엔드의 `cors()` 미들웨어)

## 🎉 완료!

이제 완전 무료로 어디서나 접근 가능한 서비스를 사용할 수 있습니다!

- 프론트엔드: `https://your-project.vercel.app`
- 백엔드: `https://mockup-backend.onrender.com`

