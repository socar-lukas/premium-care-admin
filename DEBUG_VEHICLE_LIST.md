# 차량 목록이 표시되지 않는 문제 디버깅 가이드

## 확인 사항

### 1. 브라우저 콘솔 확인

1. 브라우저 개발자 도구 열기 (F12 또는 Cmd+Option+I)
2. **Console** 탭 확인
3. 다음 메시지가 있는지 확인:
   - `Fetched vehicles:` - API 응답 확인
   - `[GET /api/vehicles] Found X vehicles` - 서버 로그
   - 에러 메시지

### 2. Network 탭 확인

1. 개발자 도구 > **Network** 탭
2. 차량 목록 페이지 새로고침
3. `/api/vehicles` 요청 찾기
4. 클릭하여 확인:
   - **Status**: 200인지 확인
   - **Response**: 응답 본문 확인
   - `vehicles` 배열이 있는지 확인
   - `pagination.total` 값 확인

### 3. Vercel 로그 확인

1. Vercel 대시보드 접속
2. 프로젝트 선택
3. **Deployments** 탭
4. 최신 배포 클릭
5. **Functions** 탭에서 `/api/vehicles` 로그 확인
6. 다음 메시지 확인:
   - `[GET /api/vehicles] Found X vehicles, total: Y`
   - 에러 메시지

### 4. Supabase에서 직접 확인

1. Supabase 대시보드 접속
2. **Table Editor** 열기
3. `Vehicle` 테이블 확인
4. 데이터가 있는지 확인

**주의**: 테이블 이름이 `Vehicle` (대문자)인지 `vehicle` (소문자)인지 확인

## 가능한 원인

### 1. 테이블 이름 대소문자 문제

PostgreSQL은 대소문자를 구분합니다. Prisma는 기본적으로 소문자로 변환하지만, Supabase에서 직접 테이블을 만들면 대문자로 생성될 수 있습니다.

**해결 방법:**
- Supabase에서 테이블 이름 확인
- Prisma 스키마와 일치하는지 확인
- 필요시 테이블 이름 변경 또는 Prisma 스키마 수정

### 2. 데이터가 실제로 저장되지 않음

차량 등록이 성공했다고 나와도 실제로는 저장되지 않았을 수 있습니다.

**확인 방법:**
- Supabase Table Editor에서 직접 확인
- Vercel 로그에서 `[POST /api/vehicles] Created vehicle` 메시지 확인

### 3. API 응답 형식 문제

프론트엔드에서 응답을 제대로 파싱하지 못할 수 있습니다.

**확인 방법:**
- Network 탭에서 응답 본문 확인
- 브라우저 콘솔에서 `Fetched vehicles:` 로그 확인

### 4. 캐싱 문제

브라우저나 Vercel이 이전 응답을 캐싱하고 있을 수 있습니다.

**해결 방법:**
- 브라우저 하드 리프레시 (Cmd+Shift+R 또는 Ctrl+Shift+R)
- Vercel 재배포

## 디버깅 단계

### Step 1: 브라우저 콘솔 확인
```javascript
// 브라우저 콘솔에서 직접 API 호출 테스트
fetch('/api/vehicles?limit=10')
  .then(res => res.json())
  .then(data => console.log('API Response:', data))
  .catch(err => console.error('Error:', err));
```

### Step 2: Vercel 로그 확인
- Vercel 대시보드에서 Functions 로그 확인
- 에러 메시지 확인

### Step 3: Supabase 직접 확인
- Table Editor에서 데이터 확인
- SQL Editor에서 직접 쿼리:
```sql
SELECT * FROM "Vehicle" LIMIT 10;
```

### Step 4: Prisma 스키마 확인
- `prisma/schema.prisma` 파일 확인
- 테이블 이름이 `Vehicle` (대문자)인지 확인
- 필요시 `@@map("Vehicle")` 추가

## 빠른 해결 방법

### 방법 1: 테이블 이름 확인 및 수정

Supabase SQL Editor에서:
```sql
-- 테이블 이름 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 소문자로 테이블 이름 변경 (필요시)
ALTER TABLE "Vehicle" RENAME TO "vehicle";
```

### 방법 2: Prisma 스키마에 매핑 추가

`prisma/schema.prisma`에서:
```prisma
model Vehicle {
  // ... 필드들 ...
  
  @@map("Vehicle")  // 대문자 테이블 이름 매핑
}
```

그 후:
```bash
npm run db:generate
npm run db:push
```

### 방법 3: 완전 재배포

1. 코드 수정사항 커밋 및 푸시
2. Vercel 재배포
3. 브라우저 캐시 삭제
4. 다시 테스트

## 다음 단계

위 단계를 따라 확인한 후, 다음 정보를 알려주세요:
1. 브라우저 콘솔의 에러 메시지
2. Network 탭의 API 응답
3. Vercel 로그의 에러 메시지
4. Supabase Table Editor에서 보이는 데이터

이 정보를 바탕으로 정확한 원인을 파악할 수 있습니다.

