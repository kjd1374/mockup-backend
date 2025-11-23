# Render 서비스 수정 가이드

## 문제 해결 방법

### 1. Runtime 수정 (Render 대시보드에서)

1. Render 대시보드 접속
2. `mockup-backend` 서비스 클릭
3. "Settings" 탭 클릭
4. "Runtime" 섹션 찾기
5. 다음 설정 확인/수정:
   - **Runtime**: `Node` 선택
   - **Node Version**: `22` 또는 `20` 선택
   - **Build Command**: `npm install && npm run build:backend`
   - **Start Command**: `npm start`
6. "Save Changes" 클릭

### 2. 서비스 재시작

1. "Manual Deploy" 클릭
2. "Deploy latest commit" 선택
3. 재배포 시작

### 3. Suspended 상태 해결

서비스가 "Suspended" 상태라면:

1. 서비스 상세 페이지에서
2. "Resume" 또는 "Restart" 버튼 클릭
3. 또는 "Manual Deploy" → "Deploy latest commit"

## 확인 사항

배포 완료 후:
- Status가 "Live"인지 확인
- Runtime이 "Node"로 표시되는지 확인
- Health Check: `https://mockup-backend.onrender.com/api/health`

