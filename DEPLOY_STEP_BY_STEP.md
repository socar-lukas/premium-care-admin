# 🚀 단계별 배포 가이드 (Vercel + Supabase)

## 준비사항 체크리스트

- [ ] GitHub 계정
- [ ] Vercel 계정 (GitHub로 가입)
- [ ] Supabase 계정 (GitHub로 가입)
- [ ] Google Cloud Console 설정 완료 (이미 되어 있음)

---

## 1단계: GitHub에 코드 업로드

### 1-1. Git 초기화 (아직 안 했다면)

```bash
cd "/Users/lukas/Desktop/Premium Care Admin"
git init
git add .
git commit -m "Initial commit: Premium Care Admin"
```

### 1-2. GitHub 저장소 생성

1. https://github.com/new 접속
2. Repository name: `premium-care-admin` (또는 원하는 이름)
3. Public 또는 Private 선택
4. "Create repository" 클릭

### 1-3. 코드 업로드

```bash
# YOUR_USERNAME을 본인 GitHub 사용자명으로 변경
git remote add origin https://github.com/YOUR_USERNAME/premium-care-admin.git
git branch -M main
git push -u origin main
```

**완료 체크:**
- [ ] GitHub에서 코드 확인 가능

---

## 2단계: Supabase 데이터베이스 생성

### 2-1. Supabase 계정 생성

1. https://supabase.com 접속
2. "Start your project" 클릭
3. GitHub로 로그인

### 2-2. 프로젝트 생성

1. "New Project" 클릭
2. **Organization**: 새로 생성 또는 기존 선택
3. **Project Name**: `premium-care-admin`
4. **Database Password**: 강력한 비밀번호 설정 (기억해두세요!)
5. **Region**: `Northeast Asia (Seoul)` 또는 가장 가까운 곳
6. **Pricing Plan**: Free 선택
7. "Create new project" 클릭 (약 2분 소요)

### 2-3. 데이터베이스 연결 정보 복사

1. 프로젝트 생성 후 왼쪽 메뉴에서 **"Settings"** 클릭
2. **"Database"** 클릭
3. **"Connection string"** 섹션에서 **"URI"** 복사
   - 형식: `postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`
   - `[YOUR-PASSWORD]` 부분을 본인이 설정한 비밀번호로 변경

**예시:**
```
postgresql://postgres.abcdefghijklmnop:[내비밀번호]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```

**완료 체크:**
- [ ] Supabase 프로젝트 생성 완료
- [ ] 연결 문자열 복사 완료

---

## 3단계: Prisma 스키마를 PostgreSQL로 변경

### 3-1. 스키마 파일 확인

현재 `prisma/schema.prisma`는 SQLite용입니다.
PostgreSQL용 스키마로 변경해야 합니다.

### 3-2. 스키마 변경

`prisma/schema.prisma` 파일을 열고:

```prisma
datasource db {
  provider = "postgresql"  // "sqlite"에서 변경
  url      = env("DATABASE_URL")
}
```

또는 `prisma/schema.postgresql.prisma` 파일을 `schema.prisma`로 복사

**완료 체크:**
- [ ] 스키마 파일이 PostgreSQL로 변경됨

---

## 4단계: Vercel에 배포

### 4-1. Vercel 계정 생성

1. https://vercel.com 접속
2. "Sign Up" 클릭
3. GitHub로 로그인

### 4-2. 프로젝트 배포

1. "Add New Project" 클릭
2. 방금 만든 GitHub 저장소 선택
3. "Import" 클릭

### 4-3. 프로젝트 설정

**Build Settings:**
- Framework Preset: Next.js (자동 감지)
- Root Directory: `./` (기본값)
- Build Command: `npm run build` (자동)
- Output Directory: `.next` (자동)

### 4-4. 환경 변수 설정

"Environment Variables" 섹션에서 다음 추가:

```
DATABASE_URL=postgresql://postgres.xxxxx:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
GOOGLE_CLIENT_ID=기존에_사용하던_값
GOOGLE_CLIENT_SECRET=기존에_사용하던_값
GOOGLE_REDIRECT_URI=https://your-app-name.vercel.app/api/auth/google/callback
GOOGLE_REFRESH_TOKEN=기존에_사용하던_값
GOOGLE_DRIVE_TOP_FOLDER_NAME=PremiumCare
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
```

**중요:**
- `GOOGLE_REDIRECT_URI`는 배포 후 받은 URL로 변경 필요
- `DATABASE_URL`은 Supabase에서 복사한 값 사용

### 4-5. 배포 시작

1. "Deploy" 클릭
2. 배포 완료 대기 (약 2-3분)
3. 배포 완료 후 URL 확인 (예: `https://premium-care-admin.vercel.app`)

**완료 체크:**
- [ ] Vercel 배포 완료
- [ ] 배포된 URL 확인

---

## 5단계: 환경 변수 업데이트

### 5-1. Google OAuth 리디렉션 URI 업데이트

1. https://console.cloud.google.com 접속
2. 기존 프로젝트 선택
3. "API 및 서비스" > "사용자 인증 정보" 클릭
4. OAuth 클라이언트 ID 편집
5. "승인된 리디렉션 URI"에 추가:
   ```
   https://your-app-name.vercel.app/api/auth/google/callback
   ```
6. 저장

### 5-2. Vercel 환경 변수 업데이트

1. Vercel 대시보드 > Settings > Environment Variables
2. `GOOGLE_REDIRECT_URI`를 실제 배포된 URL로 업데이트
3. `NEXT_PUBLIC_APP_URL`도 업데이트
4. "Redeploy" 클릭

**완료 체크:**
- [ ] Google OAuth 리디렉션 URI 업데이트 완료
- [ ] Vercel 환경 변수 업데이트 완료

---

## 6단계: 데이터베이스 마이그레이션

### 6-1. 로컬에서 마이그레이션 (권장)

```bash
# .env 파일에 Supabase DATABASE_URL 추가
echo 'DATABASE_URL="postgresql://postgres.xxxxx:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres"' >> .env

# Prisma 클라이언트 재생성
npm run db:generate

# 데이터베이스 마이그레이션
npm run db:push
```

### 6-2. 또는 Vercel에서 마이그레이션

Vercel은 서버리스 환경이므로 로컬에서 마이그레이션하는 것이 더 안전합니다.

**완료 체크:**
- [ ] 데이터베이스 마이그레이션 완료
- [ ] Supabase 대시보드에서 테이블 확인

---

## 7단계: 테스트

### 7-1. 기본 테스트

1. 배포된 URL 접속
2. 대시보드 확인
3. 차량 등록 테스트
4. 점검 기록 추가 테스트
5. 사진 업로드 테스트

### 7-2. Google Drive 확인

1. Google Drive 접속
2. `PremiumCare` 폴더 확인
3. 차량번호 폴더 확인
4. 업로드된 사진 확인

**완료 체크:**
- [ ] 모든 기능 정상 작동
- [ ] Google Drive 동기화 확인

---

## 문제 해결

### 배포 실패 시

1. Vercel 대시보드 > Deployments > 로그 확인
2. 환경 변수 누락 확인
3. Prisma 스키마가 PostgreSQL인지 확인

### 데이터베이스 연결 실패 시

1. Supabase 대시보드에서 연결 문자열 확인
2. 비밀번호 정확히 입력했는지 확인
3. Vercel 환경 변수에 `DATABASE_URL` 확인

### 사진 업로드 실패 시

1. Google Drive API 설정 확인
2. Google OAuth 리디렉션 URI 확인
3. Vercel 환경 변수 확인

---

## 완료! 🎉

이제 `https://your-app-name.vercel.app`에서 24시간 접근 가능합니다!

## 다음 단계

- [ ] URL을 팀원들과 공유
- [ ] 모바일에서 접속 테스트
- [ ] 정기적인 백업 설정 (Supabase 자동 백업)

