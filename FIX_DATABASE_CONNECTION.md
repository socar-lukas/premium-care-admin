# 데이터베이스 연결 오류 해결 가이드

## 오류 원인

`Can't reach database server at db.kjcbdzrmoszwzsgqnmld.supabase.co:5432`

이 오류는 Vercel(서버리스 환경)에서 Supabase에 연결할 때 발생합니다.

## 문제: Direct Connection vs Connection Pooling

Supabase는 두 가지 연결 방식이 있습니다:

### 1. Direct Connection (포트 5432)
- 로컬 개발용
- 서버리스 환경에서는 연결 제한 문제 발생 가능

### 2. Connection Pooling (포트 6543) ⭐
- 서버리스 환경(Vercel)에 적합
- 연결 제한 없음
- **Vercel에서는 이것을 사용해야 합니다!**

## 해결 방법

### 1단계: Supabase에서 올바른 연결 문자열 확인

1. Supabase 대시보드 접속
2. **Settings** > **Database** 클릭
3. **Connection string** 섹션 찾기
4. **Session mode** 또는 **Transaction mode** 선택
5. **URI** 탭에서 연결 문자열 복사

**올바른 형식 (Connection Pooling):**
```
postgresql://postgres.[프로젝트-참조]:[비밀번호]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```

**잘못된 형식 (Direct Connection):**
```
postgresql://postgres:[비밀번호]@db.[프로젝트-참조].supabase.co:5432/postgres
```

### 2단계: Vercel 환경 변수 수정

1. Vercel 대시보드 접속
2. `premium-care-admin` 프로젝트 선택
3. **Settings** > **Environment Variables** 클릭
4. `DATABASE_URL` 찾기
5. **Edit** 클릭
6. **올바른 연결 문자열로 교체:**
   - 포트가 **6543**인지 확인
   - `pooler.supabase.com`을 사용하는지 확인
   - 비밀번호가 올바르게 입력되었는지 확인

**예시:**
```
postgresql://postgres.kjcbdzrmoszwzsgqnmld:내비밀번호123@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```

### 3단계: 재배포

1. **Deployments** 탭으로 이동
2. 최신 배포 옆 **"..."** 메뉴 클릭
3. **"Redeploy"** 선택
4. 재배포 완료 대기

## 연결 문자열 형식 확인

### ✅ 올바른 형식 (Vercel용)

```
postgresql://postgres.[프로젝트-참조]:[비밀번호]@aws-0-[리전].pooler.supabase.com:6543/postgres
```

**특징:**
- `postgres.[프로젝트-참조]` 형식
- `pooler.supabase.com` 사용
- 포트: **6543**
- 리전: `ap-northeast-2` (서울) 또는 다른 리전

### ❌ 잘못된 형식

```
postgresql://postgres:[비밀번호]@db.[프로젝트-참조].supabase.co:5432/postgres
```

**문제점:**
- `postgres:` 형식 (점 없음)
- `db.[프로젝트].supabase.co` 사용
- 포트: **5432** (Direct Connection)

## Supabase에서 확인하는 방법

### 방법 1: Connection Pooling 탭 사용

1. Supabase 대시보드 > Settings > Database
2. **Connection string** 섹션에서
3. **"Connection pooling"** 또는 **"Transaction"** 탭 선택
4. **URI** 복사

### 방법 2: 직접 확인

연결 문자열에 다음이 포함되어야 합니다:
- `pooler.supabase.com`
- 포트 `6543`
- `postgres.[프로젝트-참조]` 형식

## 추가 확인사항

### 1. Supabase 프로젝트 상태 확인

1. Supabase 대시보드 접속
2. 프로젝트가 **Active** 상태인지 확인
3. 프로젝트가 일시 중지되지 않았는지 확인

### 2. 비밀번호 확인

- 비밀번호에 특수문자가 있으면 URL 인코딩 필요할 수 있음
- 예: `@` → `%40`, `#` → `%23`

### 3. 리전 확인

- 연결 문자열의 리전이 프로젝트 리전과 일치하는지 확인
- 예: `aws-0-ap-northeast-2` (서울)

## 테스트 방법

로컬에서 테스트:

```bash
cd "/Users/lukas/Desktop/Premium Care Admin"

# .env 파일에 연결 문자열 추가
echo 'DATABASE_URL="postgresql://postgres.[프로젝트-참조]:[비밀번호]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres"' >> .env

# 연결 테스트
npm run db:push
```

성공하면 Vercel에도 동일한 연결 문자열을 사용하세요.

## 요약

**핵심:**
1. ✅ Connection Pooling 사용 (포트 6543)
2. ✅ `pooler.supabase.com` 사용
3. ✅ `postgres.[프로젝트-참조]` 형식
4. ✅ 비밀번호 올바르게 입력
5. ✅ 재배포 필수

**다시 확인:**
- Supabase > Settings > Database > Connection string > **Transaction** 탭
- URI 복사 (포트 6543인지 확인)
- Vercel 환경 변수에 붙여넣기
- 재배포

