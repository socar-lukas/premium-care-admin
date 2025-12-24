# Google Drive 대안 및 개인 계정 설정 방법

## 상황 설명

회사 Google 계정의 Client ID와 Secret을 사용할 수 없는 경우, 다음 옵션이 있습니다:

## 옵션 1: 개인 Google 계정으로 새로 설정 (권장)

### 장점
- ✅ 완전 무료
- ✅ 기존 코드 그대로 사용 가능
- ✅ 빠른 설정 (30분 이내)

### 단점
- ⚠️ 개인 계정 필요

### 설정 방법

1. **개인 Google 계정으로 Google Cloud Console 접속**
   - https://console.cloud.google.com
   - 개인 Gmail 계정으로 로그인

2. **새 프로젝트 생성**
   - 프로젝트 이름: "Premium Care Admin Personal" (또는 원하는 이름)
   - 만들기 클릭

3. **Google Drive API 활성화**
   - "API 및 서비스" > "라이브러리"
   - "Google Drive API" 검색 후 사용 설정

4. **OAuth 동의 화면 설정**
   - "API 및 서비스" > "OAuth 동의 화면"
   - 외부 선택
   - 앱 이름 입력
   - 범위: `https://www.googleapis.com/auth/drive.file` 추가
   - 테스트 사용자: 본인 이메일 추가

5. **OAuth 클라이언트 ID 생성**
   - "API 및 서비스" > "사용자 인증 정보"
   - "사용자 인증 정보 만들기" > "OAuth 클라이언트 ID"
   - 애플리케이션 유형: "웹 애플리케이션"
   - 승인된 리디렉션 URI:
     - `http://localhost:3000/api/auth/google/callback` (로컬)
     - `https://your-app-name.vercel.app/api/auth/google/callback` (Vercel)

6. **Client ID와 Secret 복사**
   - 생성된 클라이언트 ID와 보안 비밀번호 복사

7. **Refresh Token 생성**
   - `GOOGLE_DRIVE_SETUP.md` 파일의 4단계 참고
   - 또는 Google OAuth 2.0 Playground 사용

8. **Vercel에 환경 변수 추가**
   - Vercel 대시보드 > Settings > Environment Variables
   - 개인 계정의 값들 입력

## 옵션 2: Cloudinary 사용 (무료 티어 제공)

### 장점
- ✅ 무료 티어: 25GB 저장, 25GB 대역폭/월
- ✅ 이미지 최적화 자동
- ✅ CDN 제공
- ✅ 회사 계정 불필요

### 단점
- ⚠️ 코드 수정 필요
- ⚠️ 무료 티어 제한 있음

### 설정 방법

1. **Cloudinary 가입**
   - https://cloudinary.com 가입 (무료)

2. **환경 변수 설정**
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

3. **코드 수정 필요**
   - Google Drive 업로드 코드를 Cloudinary로 변경
   - `lib/cloudinary.ts` 파일 생성 필요
   - `app/api/photos/upload/route.ts` 수정 필요

## 옵션 3: AWS S3 사용 (무료 티어 제공)

### 장점
- ✅ 무료 티어: 5GB 저장, 20,000 GET 요청/월
- ✅ 안정적
- ✅ 확장 가능

### 단점
- ⚠️ 코드 수정 필요
- ⚠️ 설정 복잡
- ⚠️ AWS 계정 필요

## 옵션 4: Vercel Blob Storage (유료)

### 장점
- ✅ Vercel과 통합
- ✅ 설정 간단

### 단점
- ⚠️ 유료 (무료 티어 없음)

## 추천: 옵션 1 (개인 Google 계정)

가장 빠르고 간단한 방법은 **개인 Google 계정으로 새로 설정**하는 것입니다.

### 왜 개인 계정이 필요한가?

- Google Drive API는 OAuth 2.0 인증 필요
- OAuth 인증을 위해 Client ID와 Secret 필요
- 회사 계정 정보를 사용할 수 없으므로 개인 계정 필요

### 개인 계정 사용 시 주의사항

- ✅ 개인 계정의 Google Drive에 저장됨
- ✅ 개인 계정의 저장 공간 사용
- ✅ 회사 계정과 분리됨

### 설정 시간

- 약 30분 소요
- `GOOGLE_DRIVE_SETUP.md` 파일 참고

## 다음 단계

1. **개인 Google 계정으로 설정** (권장)
   - `GOOGLE_DRIVE_SETUP.md` 파일 따라하기
   - 개인 계정으로 새 프로젝트 생성

2. **또는 Cloudinary로 변경**
   - 코드 수정 필요
   - Cloudinary SDK 설치 필요

어떤 방법을 선택하시겠습니까?

