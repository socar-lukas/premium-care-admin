import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

function verifyAdminPin(request: NextRequest): boolean {
  const pin = request.headers.get('x-admin-pin');
  return pin === process.env.ADMIN_PIN;
}

const vehicleSchema = z.object({
  vehicleNumber: z.string().min(1),
  ownerName: z.string().min(1),
  model: z.string().optional(),
  manufacturer: z.string().optional(),
  vehicleType: z.string().optional(),
  engine: z.string().optional(),
  year: z.number().int().optional(),
  fuel: z.string().optional(),
  contact: z.string().optional(),
  memo: z.string().optional(),
});

// GET /api/vehicles - 차량 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const vehicleNumbers = searchParams.get('vehicleNumbers'); // 차량번호 목록으로 필터링
    const priorityCarNums = searchParams.get('priorityCarNums'); // 우선 정렬할 차량번호 목록
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // where 조건 구성
    let where: Record<string, unknown> = {};

    if (vehicleNumbers) {
      // 차량번호 목록으로 필터링 (쉼표로 구분)
      const numbers = vehicleNumbers.split(',').map(n => n.trim()).filter(n => n);
      if (numbers.length > 0) {
        where = { vehicleNumber: { in: numbers } };
      }
    } else if (search) {
      // 검색어로 필터링 (차량번호, 소유자명, 모델명 부분 일치)
      where = {
        OR: [
          { vehicleNumber: { contains: search, mode: 'insensitive' as const } },
          { ownerName: { contains: search, mode: 'insensitive' as const } },
          { model: { contains: search, mode: 'insensitive' as const } },
        ],
      };
    }

    const selectFields = {
      id: true,
      vehicleNumber: true,
      ownerName: true,
      model: true,
      manufacturer: true,
      inspections: {
        take: 1,
        orderBy: { inspectionDate: 'desc' as const },
        select: { inspectionDate: true },
      },
    };

    // 우선 정렬할 차량번호가 있는 경우: 두 번의 쿼리로 처리
    if (priorityCarNums && !search && !vehicleNumbers) {
      const priorityNums = priorityCarNums.split(',').map(n => n.trim()).filter(n => n);
      const prioritySet = new Set(priorityNums);

      // 1. 우선 차량 먼저 조회 (점검필요 차량)
      const priorityVehicles = priorityNums.length > 0 ? await prisma.vehicle.findMany({
        where: { vehicleNumber: { in: priorityNums } },
        select: selectFields,
      }) : [];

      // 2. 나머지 차량 조회 (페이지네이션 적용)
      const remainingWhere = priorityNums.length > 0
        ? { vehicleNumber: { notIn: priorityNums } }
        : {};

      const remainingCount = await prisma.vehicle.count({ where: remainingWhere });
      const totalWithPriority = priorityVehicles.length + remainingCount;

      // 우선 차량 수를 고려한 페이지네이션
      let resultVehicles: typeof priorityVehicles = [];
      const priorityCount = priorityVehicles.length;

      if (page === 1) {
        // 첫 페이지: 우선 차량 + 나머지 차량 (limit까지)
        const remainingLimit = Math.max(0, limit - priorityCount);
        const remainingVehicles = remainingLimit > 0 ? await prisma.vehicle.findMany({
          where: remainingWhere,
          take: remainingLimit,
          orderBy: { vehicleNumber: 'asc' },
          select: selectFields,
        }) : [];

        // 우선 차량을 차량번호 오름차순 정렬
        priorityVehicles.sort((a, b) => a.vehicleNumber.localeCompare(b.vehicleNumber, 'ko'));
        resultVehicles = [...priorityVehicles, ...remainingVehicles];
      } else {
        // 2페이지 이후: 우선 차량 이후부터 계산
        const adjustedSkip = Math.max(0, skip - priorityCount);
        const remainingVehicles = await prisma.vehicle.findMany({
          where: remainingWhere,
          skip: adjustedSkip,
          take: limit,
          orderBy: { vehicleNumber: 'asc' },
          select: selectFields,
        });
        resultVehicles = remainingVehicles;
      }

      const response = NextResponse.json({
        vehicles: resultVehicles,
        pagination: {
          page,
          limit,
          total: totalWithPriority,
          totalPages: Math.ceil(totalWithPriority / limit),
        },
      });

      response.headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
      return response;
    }

    // 기본 조회 (우선 정렬 없이)
    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { vehicleNumber: 'asc' },
        select: selectFields,
      }),
      prisma.vehicle.count({ where }),
    ]);

    console.log(`[GET /api/vehicles] Found ${vehicles.length} vehicles, total: ${total}`);

    const response = NextResponse.json({
      vehicles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

    // 캐시 헤더 추가 (10초 캐시, 백그라운드 리프레시)
    response.headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');

    return response;
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.stack : String(error);
    console.error('Error details:', errorDetails);

    return NextResponse.json(
      {
        error: 'Failed to fetch vehicles',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
      },
      { status: 500 }
    );
  }
}

// POST /api/vehicles - 차량 등록 (관리자 전용)
export async function POST(request: NextRequest) {
  if (!verifyAdminPin(request)) {
    return NextResponse.json(
      { error: '관리자 권한이 필요합니다.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const data = vehicleSchema.parse(body);

    // 차량번호 중복 확인
    const existing = await prisma.vehicle.findUnique({
      where: { vehicleNumber: data.vehicleNumber },
    });

    if (existing) {
      return NextResponse.json(
        { error: '차량번호가 이미 등록되어 있습니다.' },
        { status: 400 }
      );
    }

    const vehicle = await prisma.vehicle.create({
      data,
    });

    console.log(`[POST /api/vehicles] Created vehicle: ${vehicle.id} - ${vehicle.vehicleNumber}`);

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다.', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating vehicle:', error);
    
    // Prisma 오류 처리
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; message?: string };
      
      if (prismaError.code === 'P2002') {
        return NextResponse.json(
          { error: '차량번호가 이미 등록되어 있습니다.' },
          { status: 400 }
        );
      }
      
      // 데이터베이스 연결 오류
      if (prismaError.code === 'P1001' || prismaError.code === 'P1017') {
        return NextResponse.json(
          { 
            error: '데이터베이스 연결 오류입니다. 데이터베이스를 초기화해주세요.',
            hint: '터미널에서 "npm run db:push" 명령어를 실행하세요.'
          },
          { status: 500 }
        );
      }
    }
    
    // 일반 오류
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json(
      { 
        error: `차량 등록 실패: ${errorMessage}`,
        hint: '서버 콘솔을 확인하거나 데이터베이스가 초기화되었는지 확인하세요.'
      },
      { status: 500 }
    );
  }
}


