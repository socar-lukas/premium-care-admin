# Supabase 연결 문자열 정확한 가이드

## 현재 문제

오류: `Can't reach database server at db.xxx.supabase.co:6543`

이것은 **Direct Connection URL** 형식입니다. Vercel에서는 작동하지 않습니다!

## 올바른 연결 문자열 찾기

### Supabase에서 정확히 찾는 방법

1. **Supabase 대시보드 접속**
2. **Settings** (왼쪽 사이드바) 클릭
3. **Database** 클릭
4. **Connection string** 섹션으로 스크롤
5. **중요**: 두 가지 탭이 있습니다:
   - **Session mode** (또는 Direct connection)
   - **Transaction mode** (또는 Connection pooling) ⭐ **이것을 선택!**

6. **Transaction mode** 탭 선택
7. **URI** 복사

### 올바른 연결 문자열 형식

**Connection Pooling (Vercel용):**
```
postgresql://postgres.[프로젝트-참조]:[비밀번호]@aws-0-[리전].pooler.supabase.com:6543/postgres
```

**예시:**
```
postgresql://postgres.kjcbdzrmoszwzsgqnmld:비밀번호123@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```

**특징:**
- ✅ `postgres.[프로젝트-참조]` 형식 (점 포함)
- ✅ `aws-0-[리전].pooler.supabase.com` 사용
- ✅ 포트: `6543`
- ✅ `pooler` 키워드 포함

### 잘못된 형식 (현재 사용 중인 것)

```
postgresql://postgres:[비밀번호]@db.[프로젝트-참조].supabase.co:6543/postgres
```

**문제점:**
- ❌ `postgres:` 형식 (점 없음)
- ❌ `db.xxx.supabase.co` 사용
- ❌ `pooler` 키워드 없음

## 단계별 해결

### 1단계: Supabase에서 올바른 URL 확인

1. Supabase 대시보드 > Settings > Database
2. Connection string 섹션에서
3. **"Transaction"** 또는 **"Connection pooling"** 탭 클릭
4. **URI** 복사
5. 비밀번호 부분(`[YOUR-PASSWORD]`)을 실제 비밀번호로 교체

### 2단계: 연결 문자열 검증

복사한 연결 문자열에 다음이 포함되어야 합니다:
- ✅ `pooler.supabase.com`
- ✅ `postgres.[프로젝트-참조]` (점 포함)
- ✅ 포트 `6543`
- ✅ `aws-0-`로 시작하는 호스트

### 3단계: Vercel 환경 변수 설정

1. Vercel 대시보드 > Settings > Environment Variables
2. `DATABASE_URL` 찾기
3. **Edit** 클릭
4. **전체 연결 문자열을 삭제하고 새로 입력**
5. Supabase에서 복사한 **Transaction mode URI** 붙여넣기
6. 비밀번호 확인
7. **Save** 클릭

### 4단계: 재배포

1. **Deployments** 탭
2. 최신 배포 옆 **"..."** 메뉴
3. **"Redeploy"** 선택
4. 재배포 완료 대기

## 추가 확인사항

### Supabase 프로젝트 상태 확인

1. Supabase 대시보드 접속
2. 프로젝트가 **Active** 상태인지 확인
3. 프로젝트가 일시 중지되지 않았는지 확인

### 네트워크 확인

- Vercel과 Supabase 간 네트워크 연결 문제일 수 있습니다
- Supabase 프로젝트의 리전이 올바른지 확인

## 빠른 체크리스트

- [ ] Supabase > Settings > Database 접속
- [ ] **Transaction mode** 탭 선택
- [ ] URI 복사 (포트 6543 확인)
- [ ] `pooler.supabase.com` 포함 확인
- [ ] `postgres.[프로젝트-참조]` 형식 확인
- [ ] Vercel 환경 변수에 전체 URL 붙여넣기
- [ ] 비밀번호 올바르게 입력
- [ ] 재배포 완료

## 문제가 계속되면

### 대안 1: Supabase 프로젝트 재생성

1. 새 Supabase 프로젝트 생성
2. 올바른 연결 문자열 복사
3. Vercel 환경 변수 업데이트

### 대안 2: 다른 데이터베이스 사용

- **Neon** (3GB 무료, 더 안정적)
- **Railway** (자동 설정)

## 요약

**핵심:**
1. ✅ **Transaction mode** URI 사용 필수
2. ✅ `pooler.supabase.com` 포함 확인
3. ✅ 포트 `6543` 확인
4. ✅ `postgres.[프로젝트-참조]` 형식 확인
5. ✅ 전체 URL을 새로 입력 (기존 것 수정하지 말고)

**다시 한 번 확인:**
- Supabase > Settings > Database
- **Transaction mode** 탭 선택
- URI 복사
- Vercel에 붙여넣기
- 재배포

