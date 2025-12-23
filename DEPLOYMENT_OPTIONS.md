# 배포 옵션 비교 (Supabase 대안)

## Supabase 없이 배포하는 방법

### 옵션 1: Railway (가장 추천) ⭐

**장점:**
- ✅ PostgreSQL 무료 제공 (500MB)
- ✅ SQLite도 사용 가능
- ✅ 파일 저장소 제공
- ✅ Vercel보다 설정 간단
- ✅ 한 곳에서 모든 것 관리

**비용:** 무료 (월 $5 크레딧, 거의 무료)

**설정 방법:**
1. https://railway.app 접속
2. GitHub로 로그인
3. "New Project" > "Deploy from GitHub repo"
4. 저장소 선택
5. PostgreSQL 추가 (Add PostgreSQL)
6. 환경 변수 자동 설정됨
7. 배포 완료!

**환경 변수:**
- `DATABASE_URL` 자동 설정됨
- 나머지는 Vercel과 동일

---

### 옵션 2: Render (완전 무료)

**장점:**
- ✅ PostgreSQL 무료 제공
- ✅ 완전 무료 플랜
- ✅ 간단한 설정

**단점:**
- ⚠️ 슬리핑 모드 (15분 비활성 시 잠자기)
- ⚠️ 첫 로딩이 느릴 수 있음

**설정 방법:**
1. https://render.com 접속
2. GitHub로 로그인
3. "New" > "Web Service"
4. 저장소 선택
5. 설정:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
6. "New" > "PostgreSQL" 추가
7. 환경 변수에 `DATABASE_URL` 연결
8. 배포 완료!

---

### 옵션 3: Fly.io (SQLite 사용 가능)

**장점:**
- ✅ SQLite 직접 사용 가능 (코드 수정 최소)
- ✅ 파일 저장소 제공
- ✅ 글로벌 배포

**단점:**
- ⚠️ 설정이 조금 복잡
- ⚠️ CLI 도구 필요

**설정 방법:**
1. https://fly.io 접속
2. 계정 생성
3. Fly CLI 설치: `curl -L https://fly.io/install.sh | sh`
4. 로그인: `fly auth login`
5. 앱 생성: `fly launch`
6. 배포: `fly deploy`

**SQLite 사용 시:**
- `fly volumes create data` (영구 저장소)
- 환경 변수에 볼륨 경로 설정

---

### 옵션 4: Neon (PostgreSQL 전용)

**장점:**
- ✅ PostgreSQL 무료 제공
- ✅ 빠른 성능
- ✅ 자동 스케일링

**비용:** 무료 (3GB)

**설정 방법:**
1. https://neon.tech 접속
2. 계정 생성
3. 프로젝트 생성
4. 연결 문자열 복사
5. Vercel 환경 변수에 추가

---

### 옵션 5: PlanetScale (MySQL)

**장점:**
- ✅ MySQL 무료 제공
- ✅ 빠른 성능
- ✅ 브랜칭 기능

**단점:**
- ⚠️ Prisma 스키마를 MySQL용으로 수정 필요

---

## 추천 순위

### 1순위: Railway ⭐⭐⭐
- 가장 간단하고 빠름
- 모든 기능 한 곳에서 관리
- 무료 크레딧 충분

### 2순위: Render ⭐⭐
- 완전 무료
- 설정 간단
- 슬리핑 모드만 주의

### 3순위: Vercel + Neon ⭐⭐
- Vercel 호스팅 + Neon 데이터베이스
- 빠른 성능
- 두 서비스 관리 필요

### 4순위: Fly.io ⭐
- SQLite 직접 사용 가능
- 설정 복잡
- 고급 사용자용

## 가장 간단한 방법: Railway

### Railway로 배포하기 (3분)

```bash
# 1. Railway 접속
# https://railway.app

# 2. GitHub로 로그인

# 3. "New Project" 클릭

# 4. "Deploy from GitHub repo" 선택

# 5. 저장소 선택

# 6. "Add PostgreSQL" 클릭 (자동으로 DATABASE_URL 설정됨)

# 7. 환경 변수 추가:
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...
# GOOGLE_REDIRECT_URI=https://your-app.up.railway.app/api/auth/google/callback
# GOOGLE_REFRESH_TOKEN=...
# GOOGLE_DRIVE_TOP_FOLDER_NAME=PremiumCare
# NEXT_PUBLIC_APP_URL=https://your-app.up.railway.app

# 8. 배포 완료!
```

**Railway 장점:**
- ✅ PostgreSQL 자동 설정
- ✅ 환경 변수 자동 연결
- ✅ HTTPS 자동 적용
- ✅ 도메인 자동 생성
- ✅ 로그 확인 쉬움
- ✅ 한 곳에서 모든 것 관리

## 코드 수정 필요 여부

### Railway, Render, Neon 사용 시
- **변경 필요:** Prisma 스키마를 PostgreSQL로 변경
- `prisma/schema.prisma`에서 `provider = "postgresql"`로 변경
- 또는 `schema.postgresql.prisma` 파일 사용

### Fly.io 사용 시
- **변경 불필요:** SQLite 그대로 사용 가능
- 볼륨만 추가하면 됨

## 결론

**Supabase는 필수가 아닙니다!**

가장 추천하는 방법:
1. **Railway** - 가장 간단하고 빠름
2. **Render** - 완전 무료
3. **Vercel + Neon** - 빠른 성능

원하는 옵션을 선택하시면 해당 방법의 상세 가이드를 제공하겠습니다!

