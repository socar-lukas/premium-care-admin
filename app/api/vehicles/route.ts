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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { vehicleNumber: { contains: search, mode: 'insensitive' as const } },
            { ownerName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          vehicleNumber: true,
          ownerName: true,
          model: true,
          manufacturer: true,
          inspections: {
            take: 1,
            orderBy: { inspectionDate: 'desc' },
            select: { inspectionDate: true },
          },
        },
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


