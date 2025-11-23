# 🔐 Google Drive OAuth 2.0 설정 가이드

서비스 계정은 저장 공간이 없어 공유된 폴더에도 파일을 업로드할 수 없습니다.  
**해결책: OAuth 2.0을 사용하여 사용자의 드라이브에 직접 업로드**

## 🎯 왜 OAuth 2.0이 필요한가?

- ❌ **서비스 계정**: 저장 공간이 없어 공유된 폴더에도 업로드 불가
- ✅ **OAuth 2.0**: 사용자의 드라이브에 직접 업로드 가능 (사용자의 저장 공간 사용)

## 📋 설정 단계

### 1단계: OAuth 2.0 클라이언트 ID 생성

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com 접속
   - 프로젝트 선택 (기존 프로젝트 사용 가능)

2. **OAuth 동의 화면 설정**
   - 왼쪽 메뉴 → "API 및 서비스" → "OAuth 동의 화면"
   - 사용자 유형: **외부** 선택
   - 앱 정보 입력:
     - 앱 이름: `Mockup Service`
     - 사용자 지원 이메일: 본인 이메일
     - 개발자 연락처 정보: 본인 이메일
   - "저장 후 계속" 클릭

3. **범위 추가**
   - "범위 추가 또는 삭제" 클릭
   - 다음 범위 추가:
     - `https://www.googleapis.com/auth/drive.file`
     - `https://www.googleapis.com/auth/drive`
   - "업데이트" 클릭
   - "저장 후 계속" 클릭

4. **테스트 사용자 추가**
   - "테스트 사용자" 섹션에서 "사용자 추가" 클릭
   - 본인 이메일 주소 추가
   - "저장 후 계속" 클릭

5. **요약 확인**
   - 설정 확인 후 "대시보드로 돌아가기" 클릭

### 2단계: OAuth 2.0 클라이언트 ID 및 Secret 생성

1. **사용자 인증 정보 페이지 접속**
   - 왼쪽 메뉴 → "API 및 서비스" → "사용자 인증 정보"
   - 또는 직접: https://console.cloud.google.com/apis/credentials

2. **OAuth 클라이언트 ID 만들기**
   - 상단 "사용자 인증 정보 만들기" 클릭
   - "OAuth 클라이언트 ID" 선택
   - 애플리케이션 유형: **웹 애플리케이션** 선택
   - 이름: `Mockup Drive Client`
   - 승인된 리디렉션 URI 추가:
     ```
     http://localhost:3001/api/auth/google/callback
     ```
   - "만들기" 클릭

3. **클라이언트 ID 및 Secret 복사**
   - 클라이언트 ID 복사
   - 클라이언트 보안 비밀번호 복사
   - **중요**: 이 정보를 안전하게 보관하세요!

### 3단계: Refresh Token 생성

1. **인증 URL 생성**
   - 다음 URL을 브라우저에서 열기 (CLIENT_ID를 실제 값으로 변경):
   ```
   https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:3001/api/auth/google/callback&response_type=code&scope=https://www.googleapis.com/auth/drive.file%20https://www.googleapis.com/auth/drive&access_type=offline&prompt=consent
   ```

2. **권한 승인**
   - Google 계정으로 로그인
   - 앱 권한 승인
   - 리디렉션 후 URL에서 `code` 파라미터 복사

3. **Refresh Token 가져오기**
   - 다음 명령어 실행 (터미널 또는 Postman):
   ```bash
   curl -X POST https://oauth2.googleapis.com/token \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "code=YOUR_CODE" \
     -d "redirect_uri=http://localhost:3001/api/auth/google/callback" \
     -d "grant_type=authorization_code"
   ```
   - 응답에서 `refresh_token` 값 복사

### 4단계: Render 환경 변수 설정

1. **Render 대시보드 접속**
   - https://render.com 접속
   - 서비스 선택

2. **환경 변수 추가/수정**
   - "Environment" 탭 클릭
   - 다음 환경 변수 설정:

   ```
   USE_GOOGLE_DRIVE = true
   GOOGLE_CLIENT_ID = <OAuth 클라이언트 ID>
   GOOGLE_CLIENT_SECRET = <OAuth 클라이언트 Secret>
   GOOGLE_REFRESH_TOKEN = <Refresh Token>
   ```

3. **기존 서비스 계정 변수 제거 (선택사항)**
   - `GOOGLE_SERVICE_ACCOUNT_KEY` 제거 (OAuth 사용 시 불필요)

4. **저장 후 재배포**

## ✅ 확인 방법

1. **로그 확인**
   - Render 로그에서 `[Google Drive] 서비스 초기화 완료` 확인
   - OAuth 2.0 사용 시 다른 메시지 표시

2. **파일 업로드 테스트**
   - 기본형 이미지 업로드
   - Google Drive에서 파일 확인 (본인의 드라이브에 저장됨)

## 🔍 문제 해결

### "invalid_grant" 에러
- Refresh Token이 만료되었거나 잘못됨
- 해결: 새로 Refresh Token 생성

### "access_denied" 에러
- OAuth 동의 화면에서 테스트 사용자가 추가되지 않음
- 해결: 테스트 사용자에 본인 이메일 추가

### "redirect_uri_mismatch" 에러
- 리디렉션 URI가 일치하지 않음
- 해결: Google Cloud Console에서 리디렉션 URI 확인

## 📝 참고사항

- OAuth 2.0을 사용하면 파일이 **사용자의 드라이브**에 저장됩니다
- 사용자의 Google Drive 저장 공간을 사용합니다
- 서비스 계정과 달리 저장 공간 제한이 없습니다

