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

    // 데이터 준비 (모든 행을 미리 파싱)
    const vehicleDataList: Array<{
      rowNum: number;
      vehicleNumber: string;
      data: {
        vehicleNumber: string;
        ownerName: string;
        model: string | null;
        manufacturer: string | null;
        vehicleType: string | null;
        year: number | null;
        engine: string | null;
        fuel: string | null;
      };
    }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

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

      // 연식 파싱
      let parsedYear: number | null = null;
      if (row.model_year) {
        const yearStr = row.model_year.toString().trim();
        const yearMatch = yearStr.match(/^(\d{2,4})/);
        if (yearMatch) {
          let yearNum = parseInt(yearMatch[1]);
          if (yearNum < 100) yearNum = 2000 + yearNum;
          if (yearNum >= 1900 && yearNum <= 2100) parsedYear = yearNum;
        }
      }

      vehicleDataList.push({
        rowNum,
        vehicleNumber,
        data: {
          vehicleNumber,
          ownerName: row.car_name?.toString().trim() || vehicleNumber,
          model: row.car_name?.toString().trim() || null,
          manufacturer: row.maker?.toString().trim() || null,
          vehicleType: row.car_model?.toString().trim() || null,
          year: parsedYear,
          engine: row.engine?.toString().trim() || null,
          fuel: row.fuel?.toString().trim() || null,
        },
      });
    }

    // 배치 처리 (5개씩)
    const BATCH_SIZE = 5;
    for (let i = 0; i < vehicleDataList.length; i += BATCH_SIZE) {
      const batch = vehicleDataList.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async ({ rowNum, vehicleNumber, data }) => {
          try {
            // upsert 사용 (존재하면 업데이트, 없으면 생성)
            const existing = await prisma.vehicle.findUnique({
              where: { vehicleNumber },
              select: { id: true },
            });

            if (existing) {
              await prisma.vehicle.update({
                where: { vehicleNumber },
                data: {
                  model: data.model,
                  manufacturer: data.manufacturer,
                  vehicleType: data.vehicleType,
                  year: data.year,
                  engine: data.engine,
                  fuel: data.fuel,
                },
              });
              result.updated++;
            } else {
              await prisma.vehicle.create({ data });
              result.success++;
            }
          } catch (error) {
            result.failed++;
            let errorMessage = '알 수 없는 오류';

            if (error instanceof Error) {
              errorMessage = error.message;
              if ('code' in error) {
                const prismaError = error as { code: string };
                if (prismaError.code === 'P2002') errorMessage = '중복된 차량번호입니다.';
                else if (prismaError.code === 'P2022') errorMessage = '스키마 오류';
              }
            }

            result.errors.push({
              row: rowNum,
              vehicleNumber,
              error: errorMessage,
            });
          }
        })
      );
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
