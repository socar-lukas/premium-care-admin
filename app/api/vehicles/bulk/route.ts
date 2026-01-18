import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

function verifyAdminPin(request: NextRequest): boolean {
  const pin = request.headers.get('x-admin-pin');
  return pin === process.env.ADMIN_PIN;
}

interface CSVRow {
  car_num?: string;
  car_name?: string;
  car_model?: string;
  maker?: string;
  engine?: string;
  model_year?: string | number;
  fuel?: string;
}

interface BulkUploadResult {
  success: number;
  updated: number;
  failed: number;
  errors: Array<{ row: number; vehicleNumber: string; error: string }>;
}

// POST /api/vehicles/bulk - 차량 일괄 등록
export async function POST(request: NextRequest) {
  if (!verifyAdminPin(request)) {
    return NextResponse.json(
      { error: '관리자 권한이 필요합니다.' },
      { status: 403 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: '파일이 필요합니다.' },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'CSV 또는 Excel 파일만 업로드 가능합니다.' },
        { status: 400 }
      );
    }

    // 파일 데이터 읽기
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    // 첫 번째 시트 가져오기
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // JSON으로 변환
    const rows: CSVRow[] = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: '파일에 데이터가 없습니다.' },
        { status: 400 }
      );
    }

    // 첫 번째 행의 컬럼 확인
    const firstRow = rows[0];
    const columns = Object.keys(firstRow);
    console.log(`[POST /api/vehicles/bulk] ===================`);
    console.log(`[POST /api/vehicles/bulk] Columns found: ${columns.join(', ')}`);
    console.log(`[POST /api/vehicles/bulk] First row data:`, JSON.stringify(firstRow, null, 2));
    console.log(`[POST /api/vehicles/bulk] model_year value:`, firstRow.model_year, `(type: ${typeof firstRow.model_year})`);
    console.log(`[POST /api/vehicles/bulk] Processing ${rows.length} rows`);
    console.log(`[POST /api/vehicles/bulk] ===================`);

    // 필수 컬럼 확인
    if (!columns.includes('car_num')) {
      return NextResponse.json(
        {
          error: '필수 컬럼이 없습니다: car_num',
          hint: `파일에서 발견된 컬럼: ${columns.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const result: BulkUploadResult = {
      success: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };

    // 각 행 처리
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // 헤더 행 + 1-based index

      try {
        // 차량번호 확인
        const vehicleNumber = row.car_num?.toString().trim();
        if (!vehicleNumber) {
          result.failed++;
          result.errors.push({
            row: rowNum,
            vehicleNumber: '(없음)',
            error: '차량번호(car_num)가 비어있습니다.',
          });
          continue;
        }

        // 데이터 매핑
        // - 차량번호 = car_num
        // - 제조사 = maker
        // - 모델명 = car_name
        // - 차량 유형 = car_model
        // - 엔진 = engine
        // - 연식 = model_year
        // - 연료 = fuel
        // 연식 파싱 (26MY, 2026, 26 등 다양한 형식 지원)
        let parsedYear: number | null = null;
        if (row.model_year) {
          const yearStr = row.model_year.toString().trim();
          // "26MY" -> "26", "2026" -> "2026" 등에서 숫자만 추출
          const yearMatch = yearStr.match(/^(\d{2,4})/);
          if (yearMatch) {
            let yearNum = parseInt(yearMatch[1]);
            // 2자리 연도인 경우 2000년대로 변환 (예: 26 -> 2026)
            if (yearNum < 100) {
              yearNum = 2000 + yearNum;
            }
            // 유효한 연도 범위 체크
            if (yearNum >= 1900 && yearNum <= 2100) {
              parsedYear = yearNum;
            }
          }
        }

        const vehicleData = {
          vehicleNumber,
          ownerName: row.car_name?.toString().trim() || vehicleNumber, // 소유자명이 없으면 차량번호로 대체
          model: row.car_name?.toString().trim() || null,
          manufacturer: row.maker?.toString().trim() || null,
          vehicleType: row.car_model?.toString().trim() || null,
          year: parsedYear,
          engine: row.engine?.toString().trim() || null,
          fuel: row.fuel?.toString().trim() || null,
        };

        // 기존 차량 확인
        const existing = await prisma.vehicle.findUnique({
          where: { vehicleNumber },
        });

        if (existing) {
          // 업데이트
          await prisma.vehicle.update({
            where: { vehicleNumber },
            data: {
              model: vehicleData.model,
              manufacturer: vehicleData.manufacturer,
              vehicleType: vehicleData.vehicleType,
              year: vehicleData.year,
              engine: vehicleData.engine,
              fuel: vehicleData.fuel,
            },
          });
          result.updated++;
          console.log(`[Bulk] Updated vehicle: ${vehicleNumber}`);
        } else {
          // 새로 생성
          await prisma.vehicle.create({
            data: vehicleData,
          });
          result.success++;
          console.log(`[Bulk] Created vehicle: ${vehicleNumber}`);
        }
      } catch (error) {
        result.failed++;
        let errorMessage = '알 수 없는 오류';

        if (error instanceof Error) {
          errorMessage = error.message;

          // Prisma 오류 처리
          if ('code' in error) {
            const prismaError = error as { code: string };
            if (prismaError.code === 'P2002') {
              errorMessage = '중복된 차량번호입니다.';
            } else if (prismaError.code === 'P2022') {
              errorMessage = '데이터베이스 스키마가 업데이트되지 않았습니다. npm run db:push를 실행하세요.';
            }
          }
        }

        result.errors.push({
          row: rowNum,
          vehicleNumber: row.car_num?.toString() || '(없음)',
          error: errorMessage,
        });
        console.error(`[Bulk] Error at row ${rowNum}:`, error);
      }
    }

    console.log(`[POST /api/vehicles/bulk] Result: ${result.success} created, ${result.updated} updated, ${result.failed} failed`);

    return NextResponse.json({
      message: '일괄 등록이 완료되었습니다.',
      result,
    });
  } catch (error) {
    console.error('Error in bulk upload:', error);

    let errorMessage = '알 수 없는 오류';
    let hint = '';

    if (error instanceof Error) {
      errorMessage = error.message;

      // Prisma 오류 처리
      if ('code' in error) {
        const prismaError = error as { code: string };
        if (prismaError.code === 'P2022') {
          errorMessage = '데이터베이스 스키마가 맞지 않습니다.';
          hint = 'npm run db:push 명령어를 실행하여 데이터베이스를 업데이트하세요.';
        } else if (prismaError.code === 'P1001' || prismaError.code === 'P1017') {
          errorMessage = '데이터베이스 연결 오류입니다.';
          hint = '데이터베이스 연결 설정을 확인하세요.';
        }
      }
    }

    return NextResponse.json(
      {
        error: `일괄 등록 실패: ${errorMessage}`,
        hint: hint || undefined,
      },
      { status: 500 }
    );
  }
}
