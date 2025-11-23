# 🔧 Google Drive 에러 수정 가이드

## ❌ 발생한 에러

```
Service Accounts do not have storage quota. 
Leverage shared drives or use OAuth delegation instead.
```

**원인**: 서비스 계정은 Google Drive에 저장 공간이 없어서 개인 드라이브에 직접 파일을 저장할 수 없습니다.

## ✅ 해결 방법

### 방법 1: 사용자가 공유한 폴더 사용 (권장)

1. **Google Drive에서 폴더 생성**
   - https://drive.google.com 접속
   - "새로 만들기" → "폴더" 클릭
   - 폴더 이름: `Mockup Storage` (원하는 이름)
   - 폴더 생성

2. **서비스 계정에 공유 권한 부여**
   - 생성한 폴더 우클릭 → "공유" 클릭
   - 서비스 계정 이메일 입력 (JSON 파일의 `client_email` 값)
   - 권한: **편집자** 선택
   - "전송" 클릭

3. **폴더 ID 확인**
   - Google Drive에서 폴더 열기
   - URL에서 폴더 ID 확인
   - 예: `https://drive.google.com/drive/folders/1ABC123xyz...`
   - 폴더 ID: `1ABC123xyz...` (URL의 마지막 부분)

4. **Render 환경 변수 추가**
   - Render 대시보드 → 서비스 → Environment 탭
   - 환경 변수 추가:
     ```
     GOOGLE_DRIVE_PARENT_FOLDER_ID = <폴더 ID>
     ```
   - 예: `GOOGLE_DRIVE_PARENT_FOLDER_ID = 1ABC123xyz...`

5. **서버 재배포**
   - 환경 변수 저장 후 자동 재배포
   - 또는 수동으로 "Manual Deploy" 클릭

### 방법 2: Shared Drive 사용 (Google Workspace 필요)

Google Workspace 계정이 있는 경우:
1. Shared Drive 생성
2. 서비스 계정을 Shared Drive에 추가
3. `GOOGLE_DRIVE_PARENT_FOLDER_ID`에 Shared Drive 폴더 ID 설정

## 📝 환경 변수 정리

필수 환경 변수:
```
USE_GOOGLE_DRIVE = true
GOOGLE_SERVICE_ACCOUNT_KEY = <JSON 파일 전체 내용>
GOOGLE_DRIVE_PARENT_FOLDER_ID = <공유한 폴더 ID>
```

## ✅ 확인 방법

1. **로그 확인**
   - Render 로그에서 다음 메시지 확인:
     - `[Google Drive] 초기화 시작...`
     - `[Google Drive] 자격 증명 확인 완료`
     - `[Google Drive] 서비스 계정 인증 완료`
     - `[Google Drive] 서비스 초기화 완료`

2. **파일 업로드 테스트**
   - 기본형 이미지 업로드
   - Google Drive의 공유 폴더에서 파일 확인

## 🔍 문제 해결

### "서비스 계정은 저장 공간이 없습니다" 에러
- `GOOGLE_DRIVE_PARENT_FOLDER_ID` 환경 변수 확인
- 폴더가 서비스 계정과 공유되었는지 확인
- 폴더 ID가 올바른지 확인

### "권한이 없습니다" 에러
- 서비스 계정 이메일에 폴더 공유 권한 확인
- 권한이 "편집자"인지 확인

### 로그에 Google Drive 관련 내용이 없음
- `USE_GOOGLE_DRIVE=true` 확인
- `GOOGLE_SERVICE_ACCOUNT_KEY` 값 확인
- 서버 재배포 확인

