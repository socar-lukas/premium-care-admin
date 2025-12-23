# 구글 드라이브 연동 설정 가이드

## 필요한 값들

구글 드라이브 API를 사용하려면 다음 4가지 값을 `.env` 파일에 설정해야 합니다:

1. **GOOGLE_CLIENT_ID** - Google Cloud Console에서 발급받은 클라이언트 ID
2. **GOOGLE_CLIENT_SECRET** - Google Cloud Console에서 발급받은 클라이언트 시크릿
3. **GOOGLE_REFRESH_TOKEN** - OAuth 인증을 통해 얻은 리프레시 토큰
4. **GOOGLE_DRIVE_FOLDER_ID** (선택사항) - 저장할 폴더의 ID

## 단계별 설정 방법

### 1단계: Google Cloud Console에서 프로젝트 생성 및 API 활성화

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 상단 프로젝트 선택 드롭다운에서 **"새 프로젝트"** 클릭
3. 프로젝트 이름 입력 (예: "Premium Care Admin") 후 **"만들기"** 클릭
4. 프로젝트가 생성되면 해당 프로젝트 선택

### 2단계: Google Drive API 활성화

1. 왼쪽 메뉴에서 **"API 및 서비스"** > **"라이브러리"** 클릭
2. 검색창에 **"Google Drive API"** 입력
3. **"Google Drive API"** 클릭 후 **"사용 설정"** 클릭

### 3단계: OAuth 동의 화면 설정

1. 왼쪽 메뉴에서 **"API 및 서비스"** > **"OAuth 동의 화면"** 클릭
2. 사용자 유형 선택: **"외부"** 선택 후 **"만들기"** 클릭
3. 앱 정보 입력:
   - 앱 이름: "Premium Care Admin" (또는 원하는 이름)
   - 사용자 지원 이메일: 본인 이메일 선택
   - 앱 로고: 선택사항
   - 개발자 연락처 정보: 본인 이메일 입력
4. **"저장 후 계속"** 클릭
5. 범위(Scopes) 설정:
   - **"범위 추가"** 클릭
   - `https://www.googleapis.com/auth/drive.file` 선택
   - **"업데이트"** 클릭
   - **"저장 후 계속"** 클릭
6. 테스트 사용자 추가:
   - **"사용자 추가"** 클릭
   - 본인 구글 이메일 주소 입력
   - **"추가"** 클릭
   - **"저장 후 계속"** 클릭
7. 요약 화면에서 **"대시보드로 돌아가기"** 클릭

### 4단계: OAuth 클라이언트 ID 생성

1. 왼쪽 메뉴에서 **"API 및 서비스"** > **"사용자 인증 정보"** 클릭
2. 상단 **"+ 사용자 인증 정보 만들기"** 클릭
3. **"OAuth 클라이언트 ID"** 선택
4. 애플리케이션 유형: **"웹 애플리케이션"** 선택
5. 이름: "Premium Care Admin Web Client" (또는 원하는 이름)
6. 승인된 리디렉션 URI:
   - **"+ URI 추가"** 클릭
   - `http://localhost:3000/api/auth/google/callback` 입력
   - **"만들기"** 클릭
7. **클라이언트 ID**와 **클라이언트 보안 비밀번호**가 표시됩니다
   - ⚠️ **이 화면을 닫기 전에 복사해두세요!**

### 5단계: .env 파일에 클라이언트 ID와 시크릿 추가

`.env` 파일에 다음 값들을 추가합니다:

```env
GOOGLE_CLIENT_ID="여기에_클라이언트_ID_붙여넣기"
GOOGLE_CLIENT_SECRET="여기에_클라이언트_보안_비밀번호_붙여넣기"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
```

### 6단계: Refresh Token 획득

Refresh Token을 얻는 가장 쉬운 방법은 Google OAuth 2.0 Playground를 사용하는 것입니다:

#### 방법 1: OAuth 2.0 Playground 사용 (권장)

1. [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/) 접속
2. 오른쪽 상단의 **설정 아이콘(⚙️)** 클릭
3. **"Use your own OAuth credentials"** 체크박스 선택
4. **OAuth Client ID**와 **OAuth Client secret**에 앞서 복사한 값 입력
5. 왼쪽에서 **"Drive API v3"** 확장
6. `https://www.googleapis.com/auth/drive.file` 체크박스 선택
7. **"Authorize APIs"** 버튼 클릭
8. 구글 계정 선택 및 권한 승인
9. **"Exchange authorization code for tokens"** 버튼 클릭
10. **"Refresh token"** 값을 복사합니다
11. `.env` 파일에 추가:
    ```env
    GOOGLE_REFRESH_TOKEN="여기에_리프레시_토큰_붙여넣기"
    ```

#### 방법 2: 직접 OAuth 플로우 구현 (고급)

더 안전한 방법이지만 코드 작성이 필요합니다. 필요하면 별도로 안내하겠습니다.

### 7단계: 저장 폴더 설정 (선택사항)

#### 옵션 A: 특정 폴더에 저장

1. 구글 드라이브에서 저장할 폴더 생성 (예: "PremiumCare")
2. 폴더를 열고 URL 확인:
   - URL 예: `https://drive.google.com/drive/folders/1ABC123xyz...`
   - `folders/` 뒤의 값이 폴더 ID입니다
3. `.env` 파일에 추가:
   ```env
   GOOGLE_DRIVE_FOLDER_ID="1ABC123xyz..."
   ```

#### 옵션 B: 자동으로 상위 폴더 생성 (기본값)

`.env` 파일에 다음을 추가 (또는 기본값 사용):
```env
GOOGLE_DRIVE_TOP_FOLDER_NAME="PremiumCare"
```

이렇게 하면 구글 드라이브 루트에 "PremiumCare" 폴더가 자동 생성되고, 그 안에 차량번호별 폴더가 생성됩니다.

## 최종 .env 파일 예시

```env
# Database
DATABASE_URL="file:./dev.db"

# Google Drive API
GOOGLE_CLIENT_ID="123456789-abcdefghijklmnop.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abcdefghijklmnopqrstuvwxyz"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
GOOGLE_REFRESH_TOKEN="1//0abcdefghijklmnopqrstuvwxyz-abcdefghijklmnop"

# 구글 드라이브 폴더 설정 (선택사항)
GOOGLE_DRIVE_FOLDER_ID=""  # 특정 폴더 ID 또는 비워두기
GOOGLE_DRIVE_TOP_FOLDER_NAME="PremiumCare"  # 상위 폴더 이름

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 확인 방법

1. `.env` 파일에 모든 값이 제대로 입력되었는지 확인
2. 개발 서버 재시작: `npm run dev`
3. 차량 등록 후 점검 기록에 사진 업로드 시도
4. 구글 드라이브에서 해당 폴더에 사진이 저장되었는지 확인

## 문제 해결

### "Google Drive credentials not configured" 경고
- `.env` 파일에 `GOOGLE_CLIENT_ID`와 `GOOGLE_CLIENT_SECRET`이 제대로 설정되었는지 확인
- 서버를 재시작했는지 확인

### "Invalid grant" 오류
- `GOOGLE_REFRESH_TOKEN`이 만료되었거나 잘못되었을 수 있습니다
- OAuth 2.0 Playground에서 새로 토큰을 발급받으세요

### "Access denied" 오류
- OAuth 동의 화면에서 테스트 사용자로 본인 이메일을 추가했는지 확인
- Google Cloud Console에서 API가 활성화되었는지 확인

## 보안 주의사항

⚠️ **중요**: `.env` 파일은 절대 Git에 커밋하지 마세요!
- `.gitignore`에 이미 포함되어 있지만 확인하세요
- 프로덕션 환경에서는 환경 변수를 안전하게 관리하세요

