# 환경 변수 설정 가이드

## 필수 환경 변수

### 1. Cloudinary 설정 (사진 저장용)

Vercel 대시보드 > Settings > Environment Variables에 다음 변수들을 추가하세요:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**값 찾는 방법:**
1. https://cloudinary.com 접속 및 로그인
2. 대시보드에서 확인:
   - **Cloud name**: 상단에 표시됨 (예: `dabc123`)
   - **API Key**: 상단에 표시됨 (예: `123456789012345`)
   - **API Secret**: "Reveal" 버튼 클릭하여 확인 (예: `abcdefghijklmnopqrstuvwxyz`)

**예시:**
```
CLOUDINARY_CLOUD_NAME=dabc123
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz
```

### 2. 데이터베이스 설정 (Supabase)

```
DATABASE_URL=postgres://postgres:[YOUR-PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```

**값 찾는 방법:**
1. Supabase 대시보드 접속
2. 프로젝트 선택
3. Settings > Database
4. Connection Pooling 섹션에서 "Transaction" 모드 URI 복사
5. `[YOUR-PASSWORD]` 부분을 실제 비밀번호로 교체 (대괄호 제거)

**예시:**
```
DATABASE_URL=postgres://postgres:mypassword123@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```

## 선택적 환경 변수

### 3. 앱 URL (선택사항)

```
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
```

**값 찾는 방법:**
- Vercel 배포 후 자동으로 생성되는 URL 사용
- 예: `https://premium-care-admin.vercel.app`

## Vercel 환경 변수 설정 방법

### 1단계: Vercel 대시보드 접속
1. https://vercel.com 접속 및 로그인
2. 프로젝트 선택 (`premium-care-admin`)

### 2단계: 환경 변수 추가
1. 상단 메뉴에서 **"Settings"** 클릭
2. 왼쪽 사이드바에서 **"Environment Variables"** 클릭
3. **"Add New"** 클릭

### 3단계: 각 변수 입력
각 변수마다:
- **Key**: 변수 이름 입력 (예: `CLOUDINARY_CLOUD_NAME`)
- **Value**: 값 입력 (예: `dabc123`)
- **Environment**: 다음 모두 선택
  - ✅ Production
  - ✅ Preview
  - ✅ Development
- **"Save"** 클릭

### 4단계: 재배포
1. 모든 변수 추가 완료 후
2. 상단 메뉴에서 **"Deployments"** 클릭
3. 최신 배포의 **"..."** 메뉴 클릭
4. **"Redeploy"** 클릭

## 로컬 개발 환경 설정 (선택사항)

로컬에서 개발하려면 프로젝트 루트에 `.env` 파일을 생성하고 다음 내용 추가:

```env
# Cloudinary 설정
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# 데이터베이스 설정 (Supabase Connection Pooling URL)
DATABASE_URL=postgres://postgres:[YOUR-PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres

# 앱 URL (선택사항)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**주의:** `.env` 파일은 Git에 커밋하지 마세요 (이미 `.gitignore`에 포함됨)

## 환경 변수 체크리스트

### Vercel에 설정해야 할 변수:
- [ ] `CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`
- [ ] `DATABASE_URL`
- [ ] `NEXT_PUBLIC_APP_URL` (선택사항)

### 각 변수 설정 시 확인:
- [ ] Key 이름 정확히 입력
- [ ] Value 값 정확히 입력 (공백 없음)
- [ ] Production, Preview, Development 모두 선택
- [ ] Save 클릭
- [ ] 재배포 완료

## 더 이상 필요 없는 환경 변수

다음 Google Drive 관련 변수는 **더 이상 필요 없습니다** (제거해도 됨):
- ~~`GOOGLE_CLIENT_ID`~~
- ~~`GOOGLE_CLIENT_SECRET`~~
- ~~`GOOGLE_REFRESH_TOKEN`~~
- ~~`GOOGLE_REDIRECT_URI`~~
- ~~`GOOGLE_DRIVE_FOLDER_ID`~~
- ~~`GOOGLE_DRIVE_TOP_FOLDER_NAME`~~

## 문제 해결

### 환경 변수가 적용되지 않는 경우
1. 변수 이름 확인 (대소문자 정확히)
2. 재배포 확인
3. Vercel 로그에서 오류 확인

### Cloudinary 업로드 실패 시
1. `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` 모두 설정되었는지 확인
2. 값이 정확한지 확인 (공백 없음)
3. Cloudinary 대시보드에서 API 키가 활성화되어 있는지 확인

### 데이터베이스 연결 실패 시
1. `DATABASE_URL`이 Connection Pooling URL인지 확인 (포트 6543)
2. 비밀번호가 올바른지 확인 (대괄호 제거)
3. Supabase에서 데이터베이스가 활성화되어 있는지 확인

