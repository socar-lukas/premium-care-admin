# 무료 배포 가이드

## 🚀 무료로 24시간 접근 가능하게 배포하기

### 추천 방법: Vercel + Supabase (완전 무료)

## 1단계: Vercel에 배포 (프론트엔드 + 백엔드)

### 준비사항
1. GitHub 계정 생성 (없는 경우)
2. Vercel 계정 생성 (GitHub로 로그인)

### 배포 단계

#### 1. GitHub에 코드 업로드

```bash
# Git 초기화 (아직 안 했다면)
git init
git add .
git commit -m "Initial commit"

# GitHub에 새 저장소 생성 후
git remote add origin https://github.com/사용자명/저장소명.git
git branch -M main
git push -u origin main
```

#### 2. Vercel에 배포

1. [Vercel](https://vercel.com) 접속
2. "Add New Project" 클릭
3. GitHub 저장소 선택
4. 프로젝트 설정:
   - **Framework Preset**: Next.js (자동 감지)
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `npm run build` (자동)
   - **Output Directory**: `.next` (자동)

5. **Environment Variables** 추가:
   ```
   DATABASE_URL=postgresql://... (Supabase에서 받을 URL)
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_REDIRECT_URI=https://your-app.vercel.app/api/auth/google/callback
   GOOGLE_REFRESH_TOKEN=...
   GOOGLE_DRIVE_FOLDER_ID=...
   GOOGLE_DRIVE_TOP_FOLDER_NAME=PremiumCare
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

6. "Deploy" 클릭
7. 배포 완료 후 URL 받기 (예: `https://your-app.vercel.app`)

## 2단계: Supabase 설정 (데이터베이스)

### 왜 Supabase?
- PostgreSQL 무료 제공 (500MB)
- 자동 백업
- 웹 대시보드 제공
- Vercel과 완벽 호환

### 설정 단계

1. [Supabase](https://supabase.com) 접속 및 회원가입
2. "New Project" 생성
3. 프로젝트 설정:
   - **Name**: premium-care-admin
   - **Database Password**: 강력한 비밀번호 설정
   - **Region**: 가장 가까운 지역 선택

4. 프로젝트 생성 후:
   - Settings > Database > Connection string 복사
   - 형식: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

5. Vercel 환경 변수에 `DATABASE_URL` 업데이트

### 데이터베이스 마이그레이션

Supabase는 PostgreSQL이므로 SQLite에서 마이그레이션 필요:

```bash
# 1. Prisma 스키마 확인 (이미 PostgreSQL 호환)
# prisma/schema.prisma 파일의 datasource 확인

# 2. Supabase 연결 문자열로 업데이트
# .env 파일에 DATABASE_URL 설정

# 3. 마이그레이션 실행
npm run db:push
```

## 3단계: 파일 저장소 설정

Vercel은 서버리스이므로 로컬 파일 저장이 제한적입니다. 다음 옵션 중 선택:

### 옵션 1: Google Drive만 사용 (가장 간단)
- 이미 구현되어 있음
- Google Drive에만 저장
- 로컬 저장 비활성화

### 옵션 2: Cloudflare R2 (무료, 추천)
- 10GB 무료 저장
- S3 호환 API
- 빠른 CDN

#### Cloudflare R2 설정:
1. [Cloudflare](https://cloudflare.com) 계정 생성
2. R2 > Create bucket
3. API Token 생성
4. 환경 변수 추가:
   ```
   R2_ACCOUNT_ID=...
   R2_ACCESS_KEY_ID=...
   R2_SECRET_ACCESS_KEY=...
   R2_BUCKET_NAME=premium-care-uploads
   R2_PUBLIC_URL=https://your-bucket.r2.dev
   ```

### 옵션 3: Vercel Blob Storage (베타)
- Vercel 통합
- 간단한 설정

## 4단계: 코드 수정 (필요시)

### Google Drive만 사용하도록 수정

`lib/file-upload.ts` 수정:

```typescript
// Vercel 환경에서는 로컬 저장 스킵
export async function saveUploadedFile(
  file: File,
  vehicleNumber: string,
  inspectionDate: string
): Promise<{ fileName: string; filePath: string; fileSize: number; mimeType: string }> {
  // Vercel 환경 체크
  if (process.env.VERCEL) {
    // Google Drive만 사용
    return {
      fileName: file.name,
      filePath: '', // 로컬 경로 없음
      fileSize: file.size,
      mimeType: file.type,
    };
  }
  
  // 기존 로컬 저장 로직...
}
```

## 5단계: 환경 변수 업데이트

Vercel 대시보드에서 환경 변수 설정:

```
# Database (Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# Google Drive
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://your-app.vercel.app/api/auth/google/callback
GOOGLE_REFRESH_TOKEN=your-refresh-token
GOOGLE_DRIVE_FOLDER_ID= (선택사항)
GOOGLE_DRIVE_TOP_FOLDER_NAME=PremiumCare

# App
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## 6단계: Google OAuth 리디렉션 URI 업데이트

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. OAuth 클라이언트 설정
3. 승인된 리디렉션 URI에 추가:
   ```
   https://your-app.vercel.app/api/auth/google/callback
   ```

## 배포 후 확인사항

### ✅ 체크리스트

- [ ] Vercel 배포 완료
- [ ] Supabase 데이터베이스 연결 확인
- [ ] 환경 변수 모두 설정
- [ ] Google OAuth 리디렉션 URI 업데이트
- [ ] 데이터베이스 마이그레이션 완료
- [ ] 차량 등록 테스트
- [ ] 사진 업로드 테스트
- [ ] Google Drive 동기화 확인

## 무료 플랜 제한사항

### Vercel
- ✅ 무제한 배포
- ✅ 자동 HTTPS
- ✅ 글로벌 CDN
- ⚠️ 함수 실행 시간 제한 (10초)
- ⚠️ 대역폭 제한 (100GB/월)

### Supabase
- ✅ 500MB 데이터베이스
- ✅ 2GB 파일 저장
- ✅ 자동 백업
- ⚠️ API 요청 제한 (50,000/월)

### Google Drive
- ✅ 15GB 무료 저장
- ⚠️ API 할당량 제한

## 대안: 다른 무료 호스팅 옵션

### 1. Railway (추천 대안)
- **장점**: PostgreSQL 무료, 파일 저장 가능
- **단점**: 월 $5 크레딧 (거의 무료)
- **URL**: https://railway.app

### 2. Render
- **장점**: 완전 무료 플랜
- **단점**: 슬리핑 모드 (비활성 시 잠자기)
- **URL**: https://render.com

### 3. Fly.io
- **장점**: 글로벌 배포
- **단점**: 설정 복잡
- **URL**: https://fly.io

## 문제 해결

### 배포 후 오류 발생 시

1. **환경 변수 확인**
   - Vercel 대시보드 > Settings > Environment Variables

2. **빌드 로그 확인**
   - Vercel 대시보드 > Deployments > 로그 확인

3. **데이터베이스 연결 확인**
   - Supabase 대시보드에서 연결 테스트

4. **Google Drive 권한 확인**
   - Google Cloud Console에서 API 활성화 확인

## 다음 단계

배포 완료 후:
1. 사용자들에게 URL 공유
2. 모바일에서 접속 테스트
3. 정기적인 백업 설정
4. 모니터링 설정 (선택사항)

## 비용 요약

**완전 무료 구성:**
- Vercel: 무료
- Supabase: 무료
- Google Drive: 무료 (15GB)
- **총 비용: $0/월**

**권장 구성 (더 많은 기능):**
- Vercel: 무료
- Supabase Pro: $25/월 (선택사항)
- Google Workspace: $6/월 (100GB, 선택사항)
- **총 비용: $0-31/월**

## 도움이 필요하신가요?

배포 중 문제가 발생하면:
1. Vercel 문서: https://vercel.com/docs
2. Supabase 문서: https://supabase.com/docs
3. 프로젝트 이슈 트래커에 문의

