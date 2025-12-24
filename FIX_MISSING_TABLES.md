# 테이블 없음 오류 해결 가이드

## 오류 원인

`The table 'public.Vehicle' does not exist in the current database.`

**의미:** 데이터베이스 연결은 성공했지만, 테이블이 생성되지 않았습니다.

**원인:** 데이터베이스 마이그레이션을 실행하지 않았습니다.

## 해결 방법: 데이터베이스 마이그레이션 실행

### 방법 1: 로컬에서 마이그레이션 (권장)

#### 1단계: .env 파일에 DATABASE_URL 추가

터미널에서 실행:

```bash
cd "/Users/lukas/Desktop/Premium Care Admin"

# .env 파일에 Supabase 연결 문자열 추가
# (이미 있다면 수정)
echo 'DATABASE_URL="postgresql://postgres.[프로젝트-참조]:[비밀번호]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres"' > .env
```

또는 직접 `.env` 파일을 편집:
- `.env` 파일 열기
- `DATABASE_URL` 추가/수정

#### 2단계: Prisma 클라이언트 생성

```bash
npm run db:generate
```

#### 3단계: 데이터베이스 마이그레이션 실행

```bash
npm run db:push
```

이 명령어가 Supabase에 테이블을 생성합니다.

#### 4단계: 확인

성공 메시지가 나오면:
- `✔ Generated Prisma Client`
- `✔ Database synchronized`

#### 5단계: Supabase에서 확인

1. Supabase 대시보드 접속
2. 왼쪽 메뉴에서 **"Table Editor"** 클릭
3. 다음 테이블들이 생성되었는지 확인:
   - `Vehicle`
   - `Inspection`
   - `InspectionArea`
   - `InspectionPhoto`

---

### 방법 2: Supabase SQL Editor에서 직접 생성

#### 1단계: Supabase SQL Editor 열기

1. Supabase 대시보드 접속
2. 왼쪽 메뉴에서 **"SQL Editor"** 클릭
3. **"New query"** 클릭

#### 2단계: SQL 스크립트 실행

다음 SQL을 복사해서 실행:

```sql
-- Vehicle 테이블
CREATE TABLE IF NOT EXISTS "Vehicle" (
    "id" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "model" TEXT,
    "manufacturer" TEXT,
    "year" INTEGER,
    "contact" TEXT,
    "vehicleType" TEXT,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Vehicle_vehicleNumber_key" ON "Vehicle"("vehicleNumber");
CREATE INDEX IF NOT EXISTS "Vehicle_vehicleNumber_idx" ON "Vehicle"("vehicleNumber");
CREATE INDEX IF NOT EXISTS "Vehicle_ownerName_idx" ON "Vehicle"("ownerName");

-- Inspection 테이블
CREATE TABLE IF NOT EXISTS "Inspection" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "inspectionDate" TIMESTAMP(3) NOT NULL,
    "inspectionType" TEXT NOT NULL,
    "overallStatus" TEXT NOT NULL,
    "inspector" TEXT,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Inspection_vehicleId_idx" ON "Inspection"("vehicleId");
CREATE INDEX IF NOT EXISTS "Inspection_inspectionDate_idx" ON "Inspection"("inspectionDate");

-- InspectionArea 테이블
CREATE TABLE IF NOT EXISTS "InspectionArea" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "areaCategory" TEXT NOT NULL,
    "areaName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InspectionArea_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "InspectionArea_inspectionId_idx" ON "InspectionArea"("inspectionId");

-- InspectionPhoto 테이블
CREATE TABLE IF NOT EXISTS "InspectionPhoto" (
    "id" TEXT NOT NULL,
    "inspectionAreaId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "googleDriveFileId" TEXT,
    "googleDriveUrl" TEXT,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "description" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InspectionPhoto_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "InspectionPhoto_inspectionAreaId_idx" ON "InspectionPhoto"("inspectionAreaId");

-- Foreign Keys
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InspectionArea" ADD CONSTRAINT "InspectionArea_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InspectionPhoto" ADD CONSTRAINT "InspectionPhoto_inspectionAreaId_fkey" FOREIGN KEY ("inspectionAreaId") REFERENCES "InspectionArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

#### 3단계: SQL 실행

1. SQL을 복사해서 SQL Editor에 붙여넣기
2. **"Run"** 버튼 클릭
3. 성공 메시지 확인

---

## 추천 방법

**방법 1 (Prisma db push)을 권장합니다:**
- ✅ 자동으로 모든 테이블 생성
- ✅ 인덱스와 외래키 자동 생성
- ✅ Prisma 스키마와 동기화

## 단계별 실행

### 1. .env 파일 확인/수정

```bash
cd "/Users/lukas/Desktop/Premium Care Admin"
cat .env
```

`DATABASE_URL`이 Supabase 연결 문자열로 설정되어 있는지 확인

### 2. 마이그레이션 실행

```bash
# Prisma 클라이언트 생성
npm run db:generate

# 데이터베이스에 테이블 생성
npm run db:push
```

### 3. 확인

- 성공 메시지 확인
- Supabase Table Editor에서 테이블 확인
- Vercel 앱에서 차량 등록 테스트

## 완료 후

테이블이 생성되면:
1. Vercel 앱 새로고침
2. 차량 등록 테스트
3. 정상 작동 확인

## 요약

**문제:** 테이블이 없음
**해결:** `npm run db:push` 실행
**확인:** Supabase Table Editor에서 테이블 확인

테이블 생성 후 다시 시도해보세요!

