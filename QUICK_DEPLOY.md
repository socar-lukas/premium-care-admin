# 🚀 빠른 배포 가이드 (지금 바로 시작!)

## 준비 완료!

Prisma 스키마를 PostgreSQL로 변경했습니다. 이제 다음 단계를 진행하세요.

---

## 단계 1: GitHub에 코드 업로드 (2분)

### 터미널에서 실행:

```bash
cd "/Users/lukas/Desktop/Premium Care Admin"

# Git 초기화
git init
git add .
git commit -m "Initial commit: Premium Care Admin"

# GitHub에서 새 저장소 생성 후 (https://github.com/new)
# 아래 명령어 실행 (YOUR_USERNAME을 본인 GitHub 사용자명으로 변경)
git remote add origin https://github.com/YOUR_USERNAME/premium-care-admin.git
git branch -M main
git push -u origin main
```

**완료 체크:**
- [ ] GitHub에서 코드 확인 가능

---

## 단계 2: Supabase 데이터베이스 생성 (3분)

### 2-1. Supabase 접속 및 프로젝트 생성

1. https://supabase.com 접속
2. "Start your project" 클릭
3. GitHub로 로그인
4. "New Project" 클릭
5. 설정:
   - **Name**: `premium-care-admin`
   - **Database Password**: 강력한 비밀번호 설정 (기억해두세요!)
   - **Region**: `Northeast Asia (Seoul)`
   - **Plan**: Free
6. "Create new project" 클릭

### 2-2. 연결 문자열 복사

1. 프로젝트 생성 후 왼쪽 메뉴 > **Settings** > **Database**
2. **Connection string** 섹션에서 **URI** 복사
3. 비밀번호 부분(`[YOUR-PASSWORD]`)을 본인이 설정한 비밀번호로 변경

**예시:**
```
postgresql://postgres.abcdefghijklmnop:내비밀번호123@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```

**완료 체크:**
- [ ] Supabase 프로젝트 생성 완료
- [ ] 연결 문자열 복사 완료 (다음 단계에서 사용)

---

## 단계 3: Vercel에 배포 (3분)

### 3-1. Vercel 접속 및 배포

1. https://vercel.com 접속
2. "Sign Up" 클릭 → GitHub로 로그인
3. "Add New Project" 클릭
4. 방금 만든 GitHub 저장소 선택
5. "Import" 클릭

### 3-2. 환경 변수 설정

**"Environment Variables" 섹션에서 다음 추가:**

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
- `DATABASE_URL`은 Supabase에서 복사한 값 사용
- `GOOGLE_REDIRECT_URI`는 배포 후 받은 URL로 변경 필요
- `NEXT_PUBLIC_APP_URL`도 배포 후 받은 URL로 변경 필요

### 3-3. 배포 시작

1. "Deploy" 클릭
2. 배포 완료 대기 (약 2-3분)
3. 배포 완료 후 URL 확인 (예: `https://premium-care-admin-xxxxx.vercel.app`)

**완료 체크:**
- [ ] Vercel 배포 완료
- [ ] 배포된 URL 확인 (다음 단계에서 사용)

---

## 단계 4: 환경 변수 업데이트 (2분)

### 4-1. Google OAuth 리디렉션 URI 업데이트

1. https://console.cloud.google.com 접속
2. 기존 프로젝트 선택
3. "API 및 서비스" > "사용자 인증 정보" 클릭
4. OAuth 클라이언트 ID 편집
5. "승인된 리디렉션 URI"에 추가:
   ```
   https://your-app-name.vercel.app/api/auth/google/callback
   ```
   (실제 배포된 URL로 변경)
6. 저장

### 4-2. Vercel 환경 변수 업데이트

1. Vercel 대시보드 > Settings > Environment Variables
2. `GOOGLE_REDIRECT_URI`를 실제 배포된 URL로 업데이트
3. `NEXT_PUBLIC_APP_URL`도 실제 배포된 URL로 업데이트
4. "Redeploy" 클릭

**완료 체크:**
- [ ] Google OAuth 리디렉션 URI 업데이트 완료
- [ ] Vercel 환경 변수 업데이트 완료
- [ ] 재배포 완료

---

## 단계 5: 데이터베이스 마이그레이션 (1분)

### 터미널에서 실행:

```bash
cd "/Users/lukas/Desktop/Premium Care Admin"

# .env 파일에 Supabase DATABASE_URL 추가
# (또는 직접 .env 파일 편집)
echo 'DATABASE_URL="postgresql://postgres.xxxxx:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres"' >> .env

# Prisma 클라이언트 재생성
npm run db:generate

# 데이터베이스 마이그레이션
npm run db:push
```

**완료 체크:**
- [ ] 데이터베이스 마이그레이션 완료
- [ ] Supabase 대시보드에서 테이블 확인 가능

---

## 단계 6: 테스트! 🎉

### 6-1. 배포된 사이트 접속

1. 배포된 URL 접속 (예: `https://premium-care-admin-xxxxx.vercel.app`)
2. 대시보드 확인
3. 차량 등록 테스트
4. 점검 기록 추가 테스트
5. 사진 업로드 테스트

### 6-2. Google Drive 확인

1. Google Drive 접속
2. `PremiumCare` 폴더 확인
3. 차량번호 폴더 확인
4. 업로드된 사진 확인

**완료 체크:**
- [ ] 모든 기능 정상 작동
- [ ] Google Drive 동기화 확인

---

## ✅ 완료!

이제 **24시간 무료로 접근 가능**합니다! 🎉

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

---

## 📞 다음 단계

- [ ] URL을 팀원들과 공유
- [ ] 모바일에서 접속 테스트
- [ ] 정기적인 백업 설정 (Supabase 자동 백업)

**자세한 내용은 `DEPLOY_STEP_BY_STEP.md` 파일을 참고하세요!**

