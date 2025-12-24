# Vercel 환경 변수 확인 방법

## Vercel 대시보드에서 환경 변수 확인

### 1단계: Vercel 대시보드 접속

1. https://vercel.com 접속
2. 로그인 (GitHub 계정으로)

### 2단계: 프로젝트 선택

1. 대시보드에서 `premium-care-admin` 프로젝트 클릭
2. 프로젝트 페이지로 이동

### 3단계: 환경 변수 확인

1. 상단 메뉴에서 **"Settings"** 클릭
2. 왼쪽 사이드바에서 **"Environment Variables"** 클릭
3. 환경 변수 목록 확인

### 4단계: Google 관련 환경 변수 확인

다음 변수들이 있는지 확인:

- ✅ `GOOGLE_CLIENT_ID`
- ✅ `GOOGLE_CLIENT_SECRET`
- ✅ `GOOGLE_REFRESH_TOKEN`
- ✅ `GOOGLE_REDIRECT_URI`
- ✅ `GOOGLE_DRIVE_TOP_FOLDER_NAME`
- ✅ `DATABASE_URL`
- ✅ `NEXT_PUBLIC_APP_URL`

### 5단계: 값 확인

각 환경 변수의 **"Value"** 열을 확인:
- 값이 설정되어 있는지 확인
- 값이 비어있지 않은지 확인
- 값이 올바른지 확인

**주의:** 보안상의 이유로 값이 `••••••`로 표시될 수 있습니다. 이는 정상입니다.

## 환경 변수가 없거나 잘못된 경우

### 수정 방법:

1. 환경 변수 행에서 **"Edit"** 버튼 클릭
2. 값 입력/수정
3. **"Save"** 클릭
4. **"Redeploy"** 클릭 (재배포 필요)

## Google 설정 값 찾는 방법

### GOOGLE_CLIENT_ID와 GOOGLE_CLIENT_SECRET

1. https://console.cloud.google.com 접속
2. 프로젝트 선택
3. **"API 및 서비스"** > **"사용자 인증 정보"** 클릭
4. OAuth 클라이언트 ID 찾기
5. 클라이언트 ID와 클라이언트 보안 비밀번호 복사

### GOOGLE_REFRESH_TOKEN

이미 설정되어 있다면:
- `.env` 파일에서 확인 (로컬)
- 또는 Google OAuth 2.0 Playground에서 다시 생성

### GOOGLE_REDIRECT_URI

배포된 Vercel URL을 사용:
```
https://your-app-name.vercel.app/api/auth/google/callback
```

## 빠른 체크리스트

- [ ] Vercel 대시보드 접속
- [ ] 프로젝트 선택
- [ ] Settings > Environment Variables 클릭
- [ ] Google 관련 환경 변수 확인
- [ ] 값이 설정되어 있는지 확인
- [ ] 필요시 수정 후 재배포

## 스크린샷 가이드

1. **Vercel 대시보드**
   - 프로젝트 목록에서 `premium-care-admin` 클릭

2. **Settings 탭**
   - 상단 메뉴에서 "Settings" 클릭

3. **Environment Variables**
   - 왼쪽 사이드바에서 "Environment Variables" 클릭
   - 환경 변수 목록 확인

4. **값 확인**
   - 각 변수의 Value 열 확인
   - Edit 버튼으로 수정 가능

## 문제 해결

### 환경 변수가 보이지 않는 경우
- 프로젝트를 올바르게 선택했는지 확인
- Settings 탭에 있는지 확인

### 값이 비어있는 경우
- Edit 클릭하여 값 입력
- Save 후 Redeploy

### 값이 잘못된 경우
- Edit 클릭하여 수정
- Save 후 Redeploy

