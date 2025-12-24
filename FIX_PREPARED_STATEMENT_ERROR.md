# Prepared Statement 오류 해결 가이드

## 오류 내용

```
Error: prepared statement "s1" already exists
PostgresError { code: "42P05", message: "prepared statement \"s1\" already exists" }
```

## 원인

이 오류는 Supabase Connection Pooler(PgBouncer)와 Prisma를 함께 사용할 때 발생합니다. Connection Pooler는 prepared statements를 지원하지 않기 때문입니다.

## 해결 방법

### 방법 1: DATABASE_URL에 pgbouncer 파라미터 추가 (권장)

Vercel 환경 변수에서 `DATABASE_URL`을 수정하세요:

**기존:**
```
postgres://postgres:password@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```

**수정 후:**
```
postgres://postgres:password@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=10
```

### 방법 2: 코드에서 자동 추가 (이미 적용됨)

`lib/prisma.ts` 파일이 자동으로 `pgbouncer=true` 파라미터를 추가하도록 수정되었습니다.

하지만 Vercel 환경 변수에 이미 `?`가 포함되어 있으면 자동 추가가 안 될 수 있으므로, 수동으로 확인하세요.

## 단계별 해결

### 1단계: Vercel 환경 변수 확인

1. Vercel 대시보드 접속
2. 프로젝트 선택 (`premium-care-admin`)
3. **Settings** > **Environment Variables** 클릭
4. `DATABASE_URL` 찾기

### 2단계: DATABASE_URL 수정

현재 값이 다음과 같다면:
```
postgres://postgres:password@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```

다음과 같이 수정:
```
postgres://postgres:password@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=10
```

**중요:**
- `?pgbouncer=true` 추가 (Connection Pooler 사용 알림)
- `&connect_timeout=10` 추가 (연결 타임아웃 설정)
- 비밀번호는 그대로 유지

### 3단계: 재배포

1. **Save** 클릭
2. **Deployments** 탭으로 이동
3. 최신 배포의 **"..."** 메뉴 클릭
4. **"Redeploy"** 선택
5. 재배포 완료 대기

## 확인 방법

재배포 후:
1. 차량 등록 시도
2. 오류가 발생하지 않는지 확인
3. Vercel 로그에서 오류 확인

## 추가 참고사항

### pgbouncer=true 파라미터의 역할

- Prisma에게 Connection Pooler를 사용하고 있다고 알림
- Prepared statements를 비활성화
- Connection Pooler와 호환되도록 쿼리 실행 방식 변경

### connect_timeout 파라미터의 역할

- 연결 타임아웃 설정 (10초)
- 서버리스 환경에서 연결 실패 시 빠른 재시도

## 문제가 계속되면

### 대안 1: Direct Connection URL 사용 (비권장)

Connection Pooler 대신 Direct Connection을 사용할 수 있지만, 서버리스 환경에서는 연결 제한 문제가 발생할 수 있습니다.

```
postgres://postgres:password@db.xxx.supabase.co:5432/postgres
```

### 대안 2: Prisma 설정 조정

`lib/prisma.ts`에서 connection_limit 설정:

```typescript
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
  // connection_limit: 1, // 필요시 추가
});
```

## 참고

- Prisma 공식 문서: https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
- Supabase Connection Pooling: https://supabase.com/docs/guides/database/connecting-to-postgres

