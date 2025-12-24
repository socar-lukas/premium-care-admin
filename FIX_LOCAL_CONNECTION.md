# 로컬 데이터베이스 연결 오류 해결

## 오류 원인

`Can't reach database server at aws-0-ap-northeast-2.pooler.supabase.com:6543`

로컬에서 Supabase에 연결할 수 없습니다.

## 해결 방법

### 방법 1: .env 파일 확인 및 수정

#### 1단계: .env 파일 확인

터미널에서:
```bash
cd "/Users/lukas/Desktop/Premium Care Admin"
cat .env
```

`DATABASE_URL`이 있는지 확인하고, 형식이 올바른지 확인하세요.

#### 2단계: 올바른 연결 문자열 형식

Supabase에서 복사한 연결 문자열이 다음과 같은 형식이어야 합니다:

```
postgresql://postgres.[프로젝트-참조]:[비밀번호]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```

**중요:**
- `postgres.[프로젝트-참조]` 형식 (점 포함)
- `pooler.supabase.com` 사용
- 포트 `6543`
- 비밀번호에 `[` `]` 없이 직접 입력

#### 3단계: .env 파일 수정

`.env` 파일을 열고 `DATABASE_URL`을 확인/수정:

```bash
# .env 파일 편집
nano .env
# 또는
open -a TextEdit .env
```

`.env` 파일 내용 예시:
```
DATABASE_URL="postgresql://postgres.kjcbdzrmoszwzsgqnmld:비밀번호123@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres"
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
```

---

### 방법 2: Supabase 프로젝트 상태 확인

1. Supabase 대시보드 접속
2. 프로젝트가 **Active** 상태인지 확인
3. 프로젝트가 일시 중지되지 않았는지 확인

---

### 방법 3: 연결 문자열 다시 확인

#### Supabase에서 다시 확인:

1. Supabase 대시보드 > Settings > Database
2. **Connection string** 섹션
3. **Transaction mode** 탭 선택
4. **URI** 복사
5. 비밀번호 부분을 실제 비밀번호로 교체

**올바른 형식 예시:**
```
postgresql://postgres.kjcbdzrmoszwzsgqnmld:내비밀번호123@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```

---

### 방법 4: 네트워크 연결 테스트

터미널에서 연결 테스트:

```bash
# PostgreSQL 클라이언트로 연결 테스트 (설치되어 있다면)
psql "postgresql://postgres.[프로젝트-참조]:[비밀번호]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres"
```

또는 간단한 Node.js 스크립트로 테스트:

```bash
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => console.log('Connected!')).catch(e => console.error(e));"
```

---

## 빠른 해결 체크리스트

- [ ] `.env` 파일에 `DATABASE_URL`이 있는지 확인
- [ ] 연결 문자열에 `pooler.supabase.com` 포함 확인
- [ ] 포트가 `6543`인지 확인
- [ ] `postgres.[프로젝트-참조]` 형식인지 확인
- [ ] 비밀번호에 `[` `]` 없이 직접 입력했는지 확인
- [ ] Supabase 프로젝트가 Active 상태인지 확인

---

## 대안: Supabase SQL Editor 사용

로컬 연결이 계속 안 되면 Supabase SQL Editor에서 직접 테이블 생성:

1. Supabase 대시보드 > SQL Editor
2. 새 쿼리 생성
3. Prisma 스키마를 SQL로 변환하여 실행

또는 Prisma Studio 사용:

```bash
npm run db:studio
```

브라우저에서 열리면 Supabase 연결 문자열을 입력하여 사용할 수 있습니다.

---

## 요약

**문제:** 로컬에서 Supabase 연결 실패
**해결:** 
1. `.env` 파일의 `DATABASE_URL` 확인
2. 연결 문자열 형식 확인 (`pooler.supabase.com`, 포트 `6543`)
3. 비밀번호 올바르게 입력
4. Supabase 프로젝트 상태 확인

`.env` 파일을 확인하고 올바른 연결 문자열로 수정한 후 다시 시도해보세요!

