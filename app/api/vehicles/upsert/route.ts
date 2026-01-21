import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function verifyAdminPin(request: NextRequest): boolean {
  const pin = request.headers.get('x-admin-pin');
  return pin === process.env.ADMIN_PIN;
}

interface VehicleData {
  vehicleNumber: string;
  ownerName: string;
  model?: string | null;
  manufacturer?: string | null;
  vehicleType?: string | null;
  year?: number | null;
  engine?: string | null;
  fuel?: string | null;
}

// POST /api/vehicles/upsert - 단일 차량 등록/업데이트
export async function POST(request: NextRequest) {
  if (!verifyAdminPin(request)) {
    return NextResponse.json(
      { error: '관리자 권한이 필요합니다.' },
      { status: 403 }
    );
  }

  try {
    const body: VehicleData = await request.json();

    if (!body.vehicleNumber || !body.vehicleNumber.trim()) {
      return NextResponse.json(
        { error: '차량번호가 필요합니다.' },
        { status: 400 }
      );
    }

    const vehicleNumber = body.vehicleNumber.trim();

    // 기존 차량 확인
    const existing = await prisma.vehicle.findUnique({
      where: { vehicleNumber },
      select: { id: true },
    });

    if (existing) {
      // 업데이트
      await prisma.vehicle.update({
        where: { vehicleNumber },
        data: {
          model: body.model || undefined,
          manufacturer: body.manufacturer || undefined,
          vehicleType: body.vehicleType || undefined,
          year: body.year || undefined,
          engine: body.engine || undefined,
          fuel: body.fuel || undefined,
        },
      });

      return NextResponse.json({
        success: true,
        updated: true,
        vehicleNumber,
      });
    } else {
      // 새로 생성
      await prisma.vehicle.create({
        data: {
          vehicleNumber,
          ownerName: body.ownerName || vehicleNumber,
          model: body.model || null,
          manufacturer: body.manufacturer || null,
          vehicleType: body.vehicleType || null,
          year: body.year || null,
          engine: body.engine || null,
          fuel: body.fuel || null,
        },
      });

      return NextResponse.json({
        success: true,
        updated: false,
        vehicleNumber,
      });
    }
  } catch (error) {
    console.error('Error upserting vehicle:', error);

    let errorMessage = '차량 등록 실패';
    if (error instanceof Error) {
      errorMessage = error.message;

      if ('code' in error) {
        const prismaError = error as { code: string };
        if (prismaError.code === 'P2002') {
          errorMessage = '중복된 차량번호입니다.';
        }
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
