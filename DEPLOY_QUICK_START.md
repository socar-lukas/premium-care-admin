# 🚀 빠른 배포 가이드 (5분 안에!)

## 가장 간단한 방법: Vercel + Supabase

### 1단계: GitHub에 코드 업로드 (2분)

```bash
# 터미널에서 실행
cd "/Users/lukas/Desktop/Premium Care Admin"

# Git 초기화 (처음만)
git init
git add .
git commit -m "Initial commit"

# GitHub에서 새 저장소 생성 후
# https://github.com/new 에서 "premium-care-admin" 저장소 생성
# 그 다음 아래 명령어 실행 (YOUR_USERNAME을 본인 GitHub 사용자명으로 변경)
git remote add origin https://github.com/YOUR_USERNAME/premium-care-admin.git
git branch -M main
git push -u origin main
```

### 2단계: Supabase 데이터베이스 설정 (2분)

1. https://supabase.com 접속 → "Start your project" 클릭
2. GitHub로 로그인
3. "New Project" 클릭
4. 프로젝트 이름: `premium-care-admin`
5. 데이터베이스 비밀번호 설정 (기억해두세요!)
6. 지역 선택: `Northeast Asia (Seoul)` 또는 가장 가까운 곳
7. "Create new project" 클릭 (약 2분 소요)

**데이터베이스 연결 정보 복사:**
1. 프로젝트 생성 후 왼쪽 메뉴에서 "Settings" 클릭
2. "Database" 클릭
3. "Connection string" 섹션에서 "URI" 복사
   - 형식: `postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`
   - 비밀번호 부분을 본인이 설정한 비밀번호로 변경

### 3단계: Vercel에 배포 (1분)

1. https://vercel.com 접속 → "Sign Up" 클릭
2. GitHub로 로그인
3. "Add New Project" 클릭
4. 방금 만든 GitHub 저장소 선택
5. "Import" 클릭

**환경 변수 설정:**
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
- 배포 후 Vercel에서 받은 URL 확인

6. "Deploy" 클릭
7. 배포 완료 대기 (약 2-3분)

### 4단계: 데이터베이스 마이그레이션 (1분)

배포 완료 후:

1. Vercel 대시보드에서 배포된 사이트 URL 확인 (예: `https://premium-care-admin.vercel.app`)
2. 터미널에서 실행:

```bash
# .env 파일에 Supabase DATABASE_URL 추가
echo 'DATABASE_URL="postgresql://postgres.xxxxx:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres"' >> .env

# 데이터베이스 마이그레이션
npm run db:push
```

또는 Vercel 대시보드에서:
1. "Deployments" 탭 클릭
2. 최신 배포 옆 "..." 메뉴 클릭
3. "Redeploy" 선택
4. 환경 변수 확인 후 재배포

### 5단계: Google OAuth 설정 업데이트

1. https://console.cloud.google.com 접속
2. 기존 프로젝트 선택
3. "API 및 서비스" > "사용자 인증 정보" 클릭
4. OAuth 클라이언트 ID 편집
5. "승인된 리디렉션 URI"에 추가:
   ```
   https://your-app-name.vercel.app/api/auth/google/callback
   ```
6. 저장

### 6단계: Vercel 환경 변수 업데이트

1. Vercel 대시보드 > Settings > Environment Variables
2. `GOOGLE_REDIRECT_URI`를 실제 배포된 URL로 업데이트
3. "Redeploy" 클릭

## ✅ 완료!

이제 `https://your-app-name.vercel.app`에서 접속 가능합니다!

## 📱 접속 테스트

1. 배포된 URL로 접속
2. 차량 등록 테스트
3. 점검 기록 추가 테스트
4. 사진 업로드 테스트

## ⚠️ 주의사항

### Vercel 환경에서 파일 저장

Vercel은 서버리스 환경이므로 로컬 파일 저장이 제한적입니다. 

**해결 방법:**
1. Google Drive만 사용 (권장) - 이미 구현되어 있음
2. 또는 Cloudflare R2 사용 (추가 설정 필요)

현재 코드는 Google Drive에 저장되므로 문제없이 작동합니다!

## 🆘 문제 해결

### 배포 실패 시
- Vercel 대시보드 > Deployments > 로그 확인
- 환경 변수 누락 확인

### 데이터베이스 연결 실패 시
- Supabase 대시보드에서 연결 문자열 확인
- 비밀번호 정확히 입력했는지 확인

### 사진 업로드 실패 시
- Google Drive API 설정 확인
- Google OAuth 리디렉션 URI 확인

## 📞 다음 단계

배포 완료 후:
- ✅ URL을 팀원들과 공유
- ✅ 모바일에서 접속 테스트
- ✅ 정기적인 백업 설정 (Supabase 자동 백업)

**축하합니다! 이제 24시간 무료로 접근 가능합니다! 🎉**

