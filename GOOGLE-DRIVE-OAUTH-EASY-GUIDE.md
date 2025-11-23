# 🔐 Google Drive OAuth 2.0 초간편 설정 가이드

## 1단계: 인증 정보 생성 (구글 클라우드 콘솔)

1.  **Google Cloud Console** ([https://console.cloud.google.com](https://console.cloud.google.com)) 접속
2.  **OAuth 동의 화면** 메뉴 이동 (왼쪽 메뉴 > API 및 서비스 > OAuth 동의 화면)
    -   **User Type**: `외부` 선택
    -   **앱 이름/이메일**: 아무거나 입력
    -   **테스트 사용자**: 본인 이메일 추가 (**중요!**)
    -   저장 후 완료
3.  **사용자 인증 정보** 메뉴 이동
    -   **+ 사용자 인증 정보 만들기** > **OAuth 클라이언트 ID** 클릭
    -   **애플리케이션 유형**: `웹 애플리케이션`
    -   **승인된 리디렉션 URI**: `https://developers.google.com/oauthplayground` (**이거 그대로 복사해서 넣으세요!**)
    -   **만들기** 클릭
    -   **클라이언트 ID**와 **클라이언트 보안 비밀(Secret)** 복사해두기

## 2단계: Refresh Token 발급 (OAuth Playground 이용)

1.  **Google OAuth Playground** ([https://developers.google.com/oauthplayground](https://developers.google.com/oauthplayground)) 접속
2.  오른쪽 상단 **톱니바퀴 아이콘(설정)** 클릭
    -   **Use your own OAuth credentials** 체크
    -   1단계에서 복사한 **Client ID**와 **Client Secret** 입력
    -   닫기
3.  왼쪽 **Step 1** 목록에서 **Drive API v3** 찾아서 클릭
    -   `https://www.googleapis.com/auth/drive`
    -   `https://www.googleapis.com/auth/drive.file`
    -   두 개 체크하고 **Authorize APIs** 파란 버튼 클릭
4.  구글 로그인 및 권한 허용 (본인 계정으로)
5.  **Step 2** 화면에서 **Exchange authorization code for tokens** 버튼 클릭
6.  **Refresh Token** 값 복사해두기

## 3단계: Render 환경 변수 입력

Render 대시보드 > Environment 탭에서 아래 변수들 입력:

-   `USE_GOOGLE_DRIVE`: `true`
-   `GOOGLE_CLIENT_ID`: (1단계에서 복사한 값)
-   `GOOGLE_CLIENT_SECRET`: (1단계에서 복사한 값)
-   `GOOGLE_REFRESH_TOKEN`: (2단계에서 복사한 값)
-   `GOOGLE_DRIVE_PARENT_FOLDER_ID`: (구글 드라이브 폴더 ID - URL 뒷부분)

**저장하면 끝!** 이제 본인 구글 드라이브에 파일이 업로드됩니다.

