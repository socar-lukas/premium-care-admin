# 데이터베이스 인증 오류 해결 가이드

## 현재 오류

`Authentication failed against database server at aws-1-ap-south-1.pooler.supabase.com, the provided database credentials for postgres are not valid.`

**문제:** 비밀번호가 잘못되었거나 연결 문자열 형식이 잘못되었습니다.

## 해결 방법

### 방법 1: Supabase 비밀번호 재설정 (권장)

#### 1단계: Supabase에서 비밀번호 재설정

1. Supabase 대시보드 접속
2. **Settings** > **Database** 클릭
3. **"Reset database password"** 버튼 클릭
4. 새 비밀번호 설정 (기억하기 쉬운 것으로)
5. 비밀번호 저장

#### 2단계: 새로운 연결 문자열 생성

1. 같은 페이지에서 **Connection string** 섹션으로 스크롤
2. **Transaction mode** 탭 선택
3. **URI** 복사
4. **새로 설정한 비밀번호로 교체**

**예시:**
```
postgresql://postgres.kjcbdzrmoszwzsgqnmld:새비밀번호123@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```

#### 3단계: Vercel 환경 변수 업데이트

1. Vercel 대시보드 > Settings > Environment Variables
2. `DATABASE_URL` 찾기
3. **Edit** 클릭
4. **전체 내용 삭제**
5. 새로 생성한 연결 문자열 붙여넣기
6. **Save** 클릭

#### 4단계: 재배포

1. **Deployments** 탭
2. 최신 배포 옆 **"..."** 메뉴
3. **"Redeploy"** 선택

---

### 방법 2: 연결 문자열 수동 확인

#### 연결 문자열 형식 확인

올바른 형식:
```
postgresql://postgres.[프로젝트-참조]:[비밀번호]@aws-0-[리전].pooler.supabase.com:6543/postgres
```

**각 부분 확인:**
1. `postgres.[프로젝트-참조]` - 프로젝트 참조 ID 확인
2. `[비밀번호]` - 실제 비밀번호 (특수문자 주의)
3. `aws-0-[리전]` - 리전 확인 (예: `ap-northeast-2`)
4. `pooler.supabase.com` - 반드시 포함되어야 함
5. `6543` - 포트 번호

#### 비밀번호 특수문자 처리

비밀번호에 특수문자가 있으면 URL 인코딩 필요:

| 문자 | 인코딩 |
|------|--------|
| `@` | `%40` |
| `#` | `%23` |
| `$` | `%24` |
| `%` | `%25` |
| `&` | `%26` |
| `+` | `%2B` |
| `=` | `%3D` |

**예시:**
- 비밀번호: `MyPass@123`
- 인코딩: `MyPass%40123`

---

### 방법 3: 로컬에서 테스트

연결 문자열이 올바른지 로컬에서 먼저 테스트:

```bash
cd "/Users/lukas/Desktop/Premium Care Admin"

# .env 파일에 연결 문자열 추가
echo 'DATABASE_URL="postgresql://postgres.[프로젝트-참조]:[비밀번호]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres"' > .env

# Prisma 클라이언트 생성
npm run db:generate

# 데이터베이스 연결 테스트
npm run db:push
```

성공하면 Vercel에도 동일한 연결 문자열 사용하세요.

---

## 빠른 해결 체크리스트

- [ ] Supabase에서 비밀번호 재설정
- [ ] Transaction mode URI 복사
- [ ] 비밀번호 부분을 새 비밀번호로 교체
- [ ] 특수문자가 있으면 URL 인코딩
- [ ] Vercel 환경 변수에 전체 URL 붙여넣기
- [ ] 재배포 완료

---

## 대안: Neon으로 전환 (더 안정적)

Supabase가 계속 문제가 되면 **Neon**으로 전환하는 것을 고려하세요:

### Neon 장점:
- ✅ 3GB 무료 (Supabase보다 6배)
- ✅ 더 안정적인 연결
- ✅ 설정이 간단함

### Neon 설정:
1. https://neon.tech 접속
2. 프로젝트 생성
3. 연결 문자열 복사
4. Vercel 환경 변수에 추가
5. 재배포

---

## 문제 해결 단계

### 1. Supabase 비밀번호 재설정
- 가장 확실한 방법
- 새 비밀번호로 연결 문자열 생성

### 2. 연결 문자열 형식 재확인
- `pooler.supabase.com` 포함 확인
- 포트 `6543` 확인
- `postgres.[프로젝트-참조]` 형식 확인

### 3. Vercel 환경 변수 완전히 교체
- 기존 내용 삭제
- 새로 붙여넣기
- 재배포

### 4. 여전히 안 되면 Neon으로 전환
- 더 안정적이고 설정이 간단함

