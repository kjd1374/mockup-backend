# 📁 Google Drive 파일 저장소 설정 가이드

Render의 파일 시스템 제한을 해결하기 위해 Google Drive를 파일 저장소로 사용하는 방법입니다.

## 🎯 개요

- **로컬 파일 시스템**: Render 재배포 시 파일이 사라짐 ❌
- **Google Drive**: 파일이 영구적으로 저장됨 ✅

## 📋 사전 준비

1. Google 계정 (Gmail 계정)
2. Google Cloud Console 접근 권한

## 🔧 설정 단계

### 1단계: Google Cloud 프로젝트 생성

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com 접속
   - Google 계정으로 로그인

2. **프로젝트 생성**
   - 상단 "프로젝트 선택" 클릭
   - "새 프로젝트" 클릭
   - 프로젝트 이름 입력 (예: `mockup-storage`)
   - "만들기" 클릭
   - 프로젝트 선택

### 2단계: Google Drive API 활성화

1. **API 라이브러리 접속**
   - 왼쪽 메뉴 → "API 및 서비스" → "라이브러리"
   - 또는 직접 접속: https://console.cloud.google.com/apis/library

2. **Google Drive API 활성화**
   - 검색창에 "Google Drive API" 입력
   - "Google Drive API" 선택
   - "사용 설정" 클릭

### 3단계: 서비스 계정 생성

1. **서비스 계정 생성**
   - 왼쪽 메뉴 → "API 및 서비스" → "사용자 인증 정보"
   - 또는 직접 접속: https://console.cloud.google.com/apis/credentials

2. **서비스 계정 만들기**
   - 상단 "사용자 인증 정보 만들기" 클릭
   - "서비스 계정" 선택
   - 서비스 계정 정보 입력:
     - 이름: `mockup-drive-service`
     - 설명: `Mockup 서비스용 Google Drive 접근`
   - "만들고 계속하기" 클릭

3. **역할 부여 (선택사항)**
   - 역할은 선택하지 않아도 됨
   - "계속" 클릭
   - "완료" 클릭

### 4단계: 서비스 계정 키 생성

1. **서비스 계정 클릭**
   - 생성된 서비스 계정 클릭 (이메일 형식)

2. **키 생성**
   - "키" 탭 클릭
   - "키 추가" → "새 키 만들기" 클릭
   - 키 유형: **JSON** 선택
   - "만들기" 클릭
   - JSON 파일이 자동으로 다운로드됨

3. **다운로드된 JSON 파일 확인**
   - 파일 이름: `mockup-storage-xxxxx-xxxxx.json`
   - 파일 내용 예시:
   ```json
   {
     "type": "service_account",
     "project_id": "mockup-storage",
     "private_key_id": "...",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
     "client_email": "mockup-drive-service@mockup-storage.iam.gserviceaccount.com",
     ...
   }
   ```

### 5단계: Google Drive 폴더 공유

1. **Google Drive 접속**
   - https://drive.google.com 접속

2. **폴더 생성 (선택사항)**
   - "새로 만들기" → "폴더" 클릭
   - 폴더 이름: `Mockup Files` (원하는 이름)
   - 폴더 생성

3. **서비스 계정에 공유 권한 부여**
   - 생성한 폴더 우클릭 → "공유" 클릭
   - 서비스 계정 이메일 입력 (4단계에서 확인한 `client_email`)
   - 권한: **편집자** 선택
   - "전송" 클릭

### 6단계: 환경 변수 설정

#### Render 환경 변수 설정

1. **Render 대시보드 접속**
   - https://render.com 접속
   - 서비스 선택

2. **환경 변수 추가**
   - "Environment" 탭 클릭
   - 다음 환경 변수 추가:

   ```
   USE_GOOGLE_DRIVE = true
   GOOGLE_SERVICE_ACCOUNT_KEY = <다운로드한 JSON 파일의 전체 내용>
   GOOGLE_DRIVE_FOLDER_ID = <선택사항: 특정 폴더 ID>
   ```

3. **JSON 파일 내용 복사**
   - 다운로드한 JSON 파일 열기
   - 전체 내용 복사 (한 줄로)
   - `GOOGLE_SERVICE_ACCOUNT_KEY` 값에 붙여넣기

   **주의**: JSON을 한 줄로 만들어야 합니다!
   - 예: `{"type":"service_account","project_id":"...","private_key":"..."}`

#### 로컬 개발용 (.env 파일)

```env
USE_GOOGLE_DRIVE=true
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"mockup-storage",...}
# 또는 파일 경로 사용
GOOGLE_SERVICE_ACCOUNT_PATH=./service-account-key.json
```

## ✅ 설정 확인

1. **서버 재시작**
   - Render에서 서비스 재배포
   - 로그에서 `[Google Drive] 서비스 초기화 완료` 확인

2. **테스트**
   - 기본형 이미지 업로드
   - 파일이 Google Drive에 저장되는지 확인
   - Google Drive에서 파일 확인

## 🔍 문제 해결

### "자격 증명이 설정되지 않았습니다"
- `USE_GOOGLE_DRIVE=true` 확인
- `GOOGLE_SERVICE_ACCOUNT_KEY` 값 확인
- JSON 형식이 올바른지 확인

### "권한이 없습니다"
- 서비스 계정 이메일에 폴더 공유 권한 확인
- Google Drive API가 활성화되었는지 확인

### "파일을 찾을 수 없습니다"
- Google Drive에서 파일이 실제로 업로드되었는지 확인
- 폴더 공유 권한 확인

## 📝 참고사항

- **무료 사용량**: Google Drive 무료 티어는 15GB 제공
- **API 할당량**: Google Drive API는 일일 할당량이 있음 (충분함)
- **보안**: 서비스 계정 키는 절대 공개하지 마세요!

## 🎉 완료!

이제 파일이 Google Drive에 저장되어 Render 재배포 시에도 사라지지 않습니다!

