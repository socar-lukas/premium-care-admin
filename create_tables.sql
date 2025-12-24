-- Supabase SQL Editor에서 실행할 SQL 스크립트
-- 이 파일의 내용을 Supabase SQL Editor에 복사해서 실행하세요

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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
ALTER TABLE "Inspection" DROP CONSTRAINT IF EXISTS "Inspection_vehicleId_fkey";
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InspectionArea" DROP CONSTRAINT IF EXISTS "InspectionArea_inspectionId_fkey";
ALTER TABLE "InspectionArea" ADD CONSTRAINT "InspectionArea_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InspectionPhoto" DROP CONSTRAINT IF EXISTS "InspectionPhoto_inspectionAreaId_fkey";
ALTER TABLE "InspectionPhoto" ADD CONSTRAINT "InspectionPhoto_inspectionAreaId_fkey" FOREIGN KEY ("inspectionAreaId") REFERENCES "InspectionArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- updatedAt 자동 업데이트 트리거 함수 (선택사항)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Vehicle 테이블 트리거
DROP TRIGGER IF EXISTS update_vehicle_updated_at ON "Vehicle";
CREATE TRIGGER update_vehicle_updated_at BEFORE UPDATE ON "Vehicle"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inspection 테이블 트리거
DROP TRIGGER IF EXISTS update_inspection_updated_at ON "Inspection";
CREATE TRIGGER update_inspection_updated_at BEFORE UPDATE ON "Inspection"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- InspectionArea 테이블 트리거
DROP TRIGGER IF EXISTS update_inspection_area_updated_at ON "InspectionArea";
CREATE TRIGGER update_inspection_area_updated_at BEFORE UPDATE ON "InspectionArea"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

