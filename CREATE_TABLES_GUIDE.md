# Supabase SQL Editor에서 테이블 생성하기

## 문제

로컬에서 `npm run db:push`가 실패하는 경우, Supabase SQL Editor에서 직접 테이블을 생성할 수 있습니다.

## 해결 방법: SQL Editor 사용

### 1단계: SQL 파일 준비

프로젝트에 `create_tables.sql` 파일이 생성되었습니다.

### 2단계: Supabase SQL Editor 열기

1. Supabase 대시보드 접속
2. 왼쪽 메뉴에서 **"SQL Editor"** 클릭
3. **"New query"** 버튼 클릭

### 3단계: SQL 실행

1. `create_tables.sql` 파일 열기
2. 전체 내용 복사
3. Supabase SQL Editor에 붙여넣기
4. **"Run"** 버튼 클릭 (또는 `Command + Enter`)

### 4단계: 확인

1. 왼쪽 메뉴에서 **"Table Editor"** 클릭
2. 다음 테이블들이 생성되었는지 확인:
   - ✅ `Vehicle`
   - ✅ `Inspection`
   - ✅ `InspectionArea`
   - ✅ `InspectionPhoto`

### 5단계: Vercel 앱 테스트

1. 배포된 Vercel 앱 접속
2. 차량 등록 테스트
3. 정상 작동 확인

## 완료!

이제 테이블이 생성되었으므로 Vercel 앱이 정상 작동할 것입니다!

## 참고

- SQL 파일 위치: `create_tables.sql`
- 이 방법은 로컬 연결 문제와 관계없이 작동합니다
- 테이블이 이미 있으면 `IF NOT EXISTS`로 인해 오류 없이 건너뜁니다

